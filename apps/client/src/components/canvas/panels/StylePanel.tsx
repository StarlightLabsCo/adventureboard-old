import { track, useEditor, useRelevantStyles, DefaultStylePanel, DefaultStylePanelContent } from 'tldraw';

export const StylePanel = track(() => {
  const editor = useEditor();
  const styles = useRelevantStyles();

  if (editor.getCurrentToolId() === 'imageGen') {
    return <div className="tlui-style-panel__wrapper w-[350px] h-[300px] flex flex-col">Image Gen</div>;
  }

  if (!styles || (editor.getCurrentToolId() === 'select' && editor.getSelectedShapes().length == 0))
    return <div className="w-[164px] pointer-events-none" />;

  return (
    <DefaultStylePanel>
      <DefaultStylePanelContent styles={styles} />
    </DefaultStylePanel>
  );
});
