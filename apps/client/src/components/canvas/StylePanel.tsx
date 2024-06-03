import { useEditor, useRelevantStyles, DefaultStylePanel, DefaultStylePanelContent } from 'tldraw';

export function StylePanel() {
  const editor = useEditor();
  const styles = useRelevantStyles();

  if (!styles || editor.getCurrentToolId() === 'select') return null;

  return (
    <DefaultStylePanel>
      <DefaultStylePanelContent styles={styles} />
    </DefaultStylePanel>
  );
}
