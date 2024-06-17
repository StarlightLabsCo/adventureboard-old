import { TLImageShape, TLImageShapeProps, createShapeId, useEditor, useValue } from 'tldraw';
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

  console.log(selectedShape);

  const outpaintImage = (direction: 'up' | 'right' | 'down' | 'left') => {
    // Auth
    const accessToken = useDiscordStore.getState().auth?.access_token;
    if (!accessToken) {
      throw new Error('Unauthorized');
    }
    const selectedShapeIds = editor.getSelectedShapes();
    for (const shapeId of selectedShapeIds) {
      editor.deselect(shapeId);
    }
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

    // Send request
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
