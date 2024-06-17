import { useEditor, useValue } from 'tldraw';
import { OutpaintInDirectionButton } from './OutpaintInDirectionButton';
import { track } from 'tldraw';

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
      <OutpaintInDirectionButton className="h-4 w-4" y={0} x={info.width / 2} rotation={0} />
      <OutpaintInDirectionButton className="h-4 w-4" y={info.height / 2} x={info.width} rotation={Math.PI / 2} />
      <OutpaintInDirectionButton className="h-4 w-4" y={info.height} x={info.width / 2} rotation={Math.PI} />
      <OutpaintInDirectionButton className="h-4 w-4" y={info.height / 2} x={0} rotation={-Math.PI / 2} />
    </div>
  );
});
