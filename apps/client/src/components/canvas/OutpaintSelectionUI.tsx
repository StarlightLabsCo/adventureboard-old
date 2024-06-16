import { useEditor, useValue } from 'tldraw';
import { OutpaintInDirectionButton } from './OutpaintInDirectionButton';
import { track } from 'tldraw';

export const OutpaintSelectionUI = track(() => {
  const editor = useEditor();

  const selectedShapes = editor.getSelectedShapes();
  if (selectedShapes.length !== 1) return null;

  const selectedShape = selectedShapes[0];
  if (selectedShape.type !== 'image' || !selectedShape.meta.prompt) return null;

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

  if (!info) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        transformOrigin: 'top left',
        transform: `translate(${info.x}px, ${info.y}px) rotate(${info.rotation}rad)`,
        pointerEvents: 'all',
      }}
    >
      <OutpaintInDirectionButton y={-40} x={info.width / 2 - 16} rotation={0} />
      <OutpaintInDirectionButton y={info.height / 2 - 16} x={info.width + 8} rotation={Math.PI / 2} />
      <OutpaintInDirectionButton y={info.height + 8} x={info.width / 2 - 16} rotation={Math.PI} />
      <OutpaintInDirectionButton y={info.height / 2 - 16} x={-40} rotation={-Math.PI / 2} />
    </div>
  );
});
