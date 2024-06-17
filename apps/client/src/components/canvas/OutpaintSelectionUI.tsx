import {
  AssetRecordType,
  MediaHelpers,
  TLAssetId,
  TLImageShape,
  TLImageShapeProps,
  createShapeId,
  getHashForString,
  useEditor,
  useValue,
} from 'tldraw';
import { OutpaintInDirectionButton } from './OutpaintInDirectionButton';
import { track } from 'tldraw';
import { useDiscordStore } from '@/lib/discord';
import React, { useState } from 'react';

export const OutpaintSelectionUI = track(() => {
  const editor = useEditor();
  const [previewRect, setPreviewRect] = useState<{ deltaX: number; deltaY: number; w: number; h: number } | null>(null);

  const info = useValue(
    'selection bounds',
    () => {
      const screenBounds = editor.getViewportScreenBounds();
      const rotation = editor.getSelectionRotation();
      const rotatedScreenBounds = editor.getSelectionRotatedScreenBounds();
      if (!rotatedScreenBounds) return null;
      return {
        x: rotatedScreenBounds.x - screenBounds.x,
        y: rotatedScreenBounds.y - screenBounds.y,
        width: rotatedScreenBounds.width,
        height: rotatedScreenBounds.height,
        rotation: rotation,
      };
    },
    [editor],
  );

  const selectedShapes = editor.getSelectedShapes();
  const selectedShape = selectedShapes[0];

  if (selectedShapes.length !== 1 || selectedShape.type !== 'image' || !selectedShape.meta.prompt) return null;
  if (!info) return null;

  const outpaintImage = async (direction: 'up' | 'right' | 'down' | 'left') => {
    // Auth
    const accessToken = useDiscordStore.getState().auth?.access_token;
    if (!accessToken) {
      throw new Error('Unauthorized');
    }

    const selectedShape = editor.getSelectedShapes()[0] as TLImageShape;

    // Create placeholder rectangle object
    const placeholderShapeId = createShapeId();
    const imageShape = selectedShape as TLImageShape;
    const initialWidth = imageShape.props.w;
    const initialHeight = imageShape.props.h;
    let initialX = selectedShape.x;
    let initialY = selectedShape.y;

    switch (direction) {
      case 'up':
        initialY -= initialHeight;
        break;
      case 'right':
        initialX += initialWidth;
        break;
      case 'down':
        initialY += initialHeight;
        break;
      case 'left':
        initialX -= initialWidth;
        break;
    }

    const placeholderRectangleShape = {
      id: placeholderShapeId,
      type: 'geo',
      x: initialX,
      y: initialY,
      opacity: 0.5,
      props: {
        geo: 'rectangle',
        w: initialWidth,
        h: initialHeight,
        fill: 'solid',
        color: 'blue',
        labelColor: 'blue',
      },
    };
    editor.createShapes([placeholderRectangleShape]);

    let animationFrameId: number;
    const duration = 1000;
    const start = performance.now();

    const animate = (time: number) => {
      const elapsed = time - start;
      const progress = (elapsed / duration) % 1;
      const easeInOut = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
      const scale = 1 + 0.01 * Math.sin(easeInOut * Math.PI);

      const scaledWidth = initialWidth * scale;
      const scaledHeight = initialHeight * scale;

      editor.updateShapes([
        {
          ...placeholderRectangleShape,
          x: initialX + initialWidth / 2 - scaledWidth / 2,
          y: initialY + initialHeight / 2 - scaledHeight / 2,
          props: {
            ...placeholderRectangleShape.props,
            w: scaledWidth,
            h: scaledHeight,
          },
        },
      ]);

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    // Send request
    const assetId = selectedShape.props.assetId;
    if (!assetId) {
      throw new Error('No asset ID');
    }

    const asset = editor.getAsset(assetId);
    if (!asset) {
      throw new Error('No asset');
    }

    const imageUrl = asset.props.src;
    if (!imageUrl) {
      throw new Error('No image URL');
    }

    const image = await fetch(imageUrl);
    if (!image.ok) {
      console.error(image);
      throw new Error('Failed to fetch image');
    }

    const imageBlob = await image.blob();

    const response = await fetch('/api/outpaint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        image: imageBlob, // TODO turn to base64 string
        up: direction === 'up' ? initialHeight : undefined,
        right: direction === 'right' ? initialWidth : undefined,
        down: direction === 'down' ? initialHeight : undefined,
        left: direction === 'left' ? initialWidth : undefined,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate image');
    }

    // Handle response
    const data = await response.json();
    const { url } = data;

    const assetUrl = url.replace(
      new RegExp(
        `^https://${process.env.NEXT_PUBLIC_R2_BUCKET_NAME}\\.${process.env.NEXT_PUBLIC_R2_ACCOUNT_ID}\\.r2\\.cloudflarestorage\\.com`,
      ),
      '/r2-get',
    );

    const newAssetId: TLAssetId = AssetRecordType.createId(getHashForString(url));
    const newAssetName = assetUrl.split('/').pop();

    const blob = await fetch(assetUrl).then((res) => res.blob());
    const size = await MediaHelpers.getImageSize(blob);

    const newAsset = AssetRecordType.create({
      id: newAssetId,
      type: 'image',
      typeName: 'asset',
      props: {
        name: newAssetName,
        src: assetUrl,
        w: size.w,
        h: size.h,
        mimeType: 'image/webp',
        isAnimated: false,
      },
    });

    editor.store.put([newAsset]);
    editor.deleteShapes([placeholderShapeId]);

    const imageShapeId = createShapeId();
    editor.createShapes([
      {
        id: imageShapeId,
        type: 'image',
        x: initialX,
        y: initialY,
        props: {
          w: initialWidth,
          h: initialHeight,
          assetId: newAssetId,
        },
        meta: {
          prompt: selectedShape.meta.prompt,
          aspectRatio: selectedShape.meta.aspectRatio,
        },
      },
    ]);

    cancelAnimationFrame(animationFrameId);

    editor.select(imageShapeId);
  };

  const handleHover = (direction: 'up' | 'right' | 'down' | 'left') => {
    let deltaX = 0;
    let deltaY = 0;
    const { height: h, width: w } = info;

    switch (direction) {
      case 'up':
        deltaY = -h;
        break;
      case 'right':
        deltaX = w;
        break;
      case 'down':
        deltaY = h;
        break;
      case 'left':
        deltaX = -w;
        break;
    }

    setPreviewRect({ deltaX, deltaY, w, h });
  };

  const handleMouseLeave = () => {
    setPreviewRect(null);
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: `${info.y}px`,
        left: `${info.x}px`,
        transformOrigin: 'top left',
        transform: `rotate(${info.rotation}rad)`,
        pointerEvents: 'all',
      }}
    >
      {previewRect && (
        <div
          style={{
            position: 'absolute',
            left: `${previewRect.deltaX}px`,
            top: `${previewRect.deltaY}px`,
            width: `${previewRect.w}px`,
            height: `${previewRect.h}px`,
          }}
          className="bg-[#3182ed/50] border border-[#3182ed]"
        />
      )}
      <OutpaintInDirectionButton
        onMouseEnter={() => handleHover('up')}
        onMouseLeave={handleMouseLeave}
        onClick={() => outpaintImage('up')}
        className="h-4 w-4"
        y={-24}
        x={info.width / 2 - 8}
        rotation={0}
      />
      <OutpaintInDirectionButton
        onMouseEnter={() => handleHover('right')}
        onMouseLeave={handleMouseLeave}
        onClick={() => outpaintImage('right')}
        className="h-4 w-4"
        y={info.height / 2 - 8}
        x={info.width + 8}
        rotation={Math.PI / 2}
      />
      <OutpaintInDirectionButton
        onMouseEnter={() => handleHover('down')}
        onMouseLeave={handleMouseLeave}
        onClick={() => outpaintImage('down')}
        className="h-4 w-4"
        y={info.height + 8}
        x={info.width / 2 - 8}
        rotation={Math.PI}
      />
      <OutpaintInDirectionButton
        onMouseEnter={() => handleHover('left')}
        onMouseLeave={handleMouseLeave}
        onClick={() => outpaintImage('left')}
        className="h-4 w-4"
        y={info.height / 2 - 8}
        x={0 - 24}
        rotation={-Math.PI / 2}
      />
    </div>
  );
});
