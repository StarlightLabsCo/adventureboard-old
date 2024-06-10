import { track, useEditor, useRelevantStyles, DefaultStylePanel, DefaultStylePanelContent } from 'tldraw';

export const StylePanel = track(() => {
  const editor = useEditor();
  const styles = useRelevantStyles();

  if (editor.getCurrentToolId() === 'imageGen') {
    return (
      <div className="tlui-style-panel__wrapper w-[350px] h-[300px] flex flex-col gap-y-3">
        <div className="flex flex-col items-center gap-y-3">
          <div className="text-white">Image Size</div>
        </div>
        <div className="flex flex-col items-center gap-y-3">
          <div className="text-white">Prompt</div>
          <textarea className="w-[300px] h-[100px] border border-white rounded-md p-2" />
        </div>
        <div className="flex items-center justify-center">
          <div className="bg-blue-500 text-white rounded-md px-4 py-2">Generate</div>
        </div>
      </div>
    );
  }

  if (!styles || (editor.getCurrentToolId() === 'select' && editor.getSelectedShapes().length == 0))
    return <div className="w-[164px] pointer-events-none" />;

  return (
    <DefaultStylePanel>
      <DefaultStylePanelContent styles={styles} />
    </DefaultStylePanel>
  );
});
