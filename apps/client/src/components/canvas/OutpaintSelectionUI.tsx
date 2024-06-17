import { TLImageShapeProps, createShapeId, useEditor, useValue } from 'tldraw';
import { OutpaintInDirectionButton } from './OutpaintInDirectionButton';
import { track } from 'tldraw';
import { useDiscordStore } from '@/lib/discord';
import React, { useState } from 'react';

export const OutpaintSelectionUI = track(() => {
  const editor = useEditor();
  const [previewRect, setPreviewRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

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

  const aspectRatio = selectedShape.meta.aspectRatio as { ratio: string; size: { width: number; height: number } };

  const outpaintImage = (direction: 'up' | 'right' | 'down' | 'left') => {
    const { width, height } = aspectRatio.size;

    // const accessToken = useDiscordStore.getState().auth?.access_token;
    // if (!accessToken) {
    //   throw new Error('Unauthorized');
    // }
    // const selectedShapeIds = editor.getSelectedShapes();
    // for (const shapeId of selectedShapeIds) {
    //   editor.deselect(shapeId);
    // }
    // // Create placeholder rectangle object
    // const placeholderShapeId = createShapeId();
    // const initialWidth = aspectRatio.size.width / 2;
    // const initialHeight = aspectRatio.size.height / 2;
    // const initialX = editor.getViewportPageBounds().x + editor.getViewportPageBounds().w / 2 - initialWidth / 2; // TODO change so it aligns with former image
    // const initialY = editor.getViewportPageBounds().y + editor.getViewportPageBounds().h / 2 - initialHeight / 2; // TODO change so it aligns with former image
    // const placeholderRectangleShape = {
    //   id: placeholderShapeId,
    //   type: 'geo',
    //   x: initialX,
    //   y: initialY,
    //   opacity: 0.5,
    //   props: {
    //     geo: 'rectangle',
    //     w: initialWidth,
    //     h: initialHeight,
    //     fill: 'solid',
    //     color: 'blue',
    //     labelColor: 'blue',
    //   },
    // };
    // editor.createShapes([placeholderRectangleShape]);
  };

  const handleHover = (direction: 'up' | 'right' | 'down' | 'left') => {
    const { w, h } = selectedShape.props as TLImageShapeProps;

    let x = info.x;
    let y = info.y;

    switch (direction) {
      case 'up':
        y -= h;
        break;
      case 'right':
        x += info.width;
        break;
      case 'down':
        y += info.height;
        break;
      case 'left':
        x -= w;
        break;
    }

    setPreviewRect({ x, y, width: w, height: h });
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
            left: `${previewRect.x}px`,
            top: `${previewRect.y}px`,
            width: `${previewRect.width}px`,
            height: `${previewRect.height}px`,
            backgroundColor: 'rgba(0, 0, 255, 0.5)', // Semi-transparent blue
          }}
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
