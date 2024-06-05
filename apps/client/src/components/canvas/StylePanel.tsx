import { track, useEditor, useRelevantStyles, DefaultStylePanel, DefaultStylePanelContent } from 'tldraw';

export const StylePanel = track(() => {
  const editor = useEditor();
  const styles = useRelevantStyles();

  if (!styles || (editor.getCurrentToolId() === 'select' && editor.getSelectedShapes().length == 0))
    return <div className="w-[164px] pointer-events-none" />;

  return (
    <DefaultStylePanel>
      <DefaultStylePanelContent styles={styles} />
    </DefaultStylePanel>
  );
});
