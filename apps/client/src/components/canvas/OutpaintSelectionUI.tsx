import { createShapeId, useEditor, useValue } from 'tldraw';
import { OutpaintInDirectionButton } from './OutpaintInDirectionButton';
import { track } from 'tldraw';
import { useDiscordStore } from '@/lib/discord';

export const OutpaintSelectionUI = track(() => {
  const editor = useEditor();

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
      <OutpaintInDirectionButton
        onClick={() => {
          outpaintImage('up');
        }}
        className="h-4 w-4"
        y={-24}
        x={info.width / 2 - 8}
        rotation={0}
      />
      <OutpaintInDirectionButton
        onClick={() => {
          outpaintImage('right');
        }}
        className="h-4 w-4"
        y={info.height / 2 - 8}
        x={info.width + 8}
        rotation={Math.PI / 2}
      />
      <OutpaintInDirectionButton
        onClick={() => {
          outpaintImage('down');
        }}
        className="h-4 w-4"
        y={info.height + 8}
        x={info.width / 2 - 8}
        rotation={Math.PI}
      />
      <OutpaintInDirectionButton
        onClick={() => {
          outpaintImage('left');
        }}
        className="h-4 w-4"
        y={info.height / 2 - 8}
        x={0 - 24}
        rotation={-Math.PI / 2}
      />
    </div>
  );
});
