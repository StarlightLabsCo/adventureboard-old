import {
  useTools,
  DefaultKeyboardShortcutsDialog,
  DefaultKeyboardShortcutsDialogContent,
  TldrawUiMenuItem,
  TLUiKeyboardShortcutsDialogProps,
} from 'tldraw';

export function DMKeyboardShortcutDialog(props: TLUiKeyboardShortcutsDialogProps) {
  const tools = useTools();
  return (
    <DefaultKeyboardShortcutsDialog {...props}>
      <DefaultKeyboardShortcutsDialogContent />
      <TldrawUiMenuItem {...tools['imageGen']} />
    </DefaultKeyboardShortcutsDialog>
  );
}
