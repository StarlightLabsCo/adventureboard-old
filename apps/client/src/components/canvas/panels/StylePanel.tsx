import { track, useEditor, useRelevantStyles, DefaultStylePanel, DefaultStylePanelContent } from 'tldraw';
import { ImageGenPanel } from './ImageGenPanel';

export const StylePanel = track(() => {
  const editor = useEditor();
  const styles = useRelevantStyles();

  if (editor.getCurrentToolId() === 'imageGen') {
    return <ImageGenPanel />;
  }

  if (!styles || (editor.getCurrentToolId() === 'select' && editor.getSelectedShapes().length == 0))
    return <div className="w-[164px] pointer-events-none" />;

  return (
    <DefaultStylePanel>
      <DefaultStylePanelContent styles={styles} />
    </DefaultStylePanel>
  );
});
