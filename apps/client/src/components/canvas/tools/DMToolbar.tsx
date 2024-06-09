import {
  SelectToolbarItem,
  HandToolbarItem,
  DrawToolbarItem,
  EraserToolbarItem,
  ArrowToolbarItem,
  TextToolbarItem,
  AssetToolbarItem,
  DefaultToolbar,
  TldrawUiMenuItem,
  useTools,
  useIsToolSelected,
} from 'tldraw';

export function DMToolbarContent() {
  const tools = useTools();
  const isImageGenSelected = useIsToolSelected(tools['imageGen']);

  return (
    <>
      <SelectToolbarItem />
      <HandToolbarItem />
      <DrawToolbarItem />
      <EraserToolbarItem />
      <ArrowToolbarItem />
      <TextToolbarItem />
      <AssetToolbarItem />
      <TldrawUiMenuItem {...tools['imageGen']} isSelected={isImageGenSelected} />
    </>
  );
}

export function DMToolbar() {
  return (
    <div>
      <DefaultToolbar>
        <DMToolbarContent />
      </DefaultToolbar>
    </div>
  );
}
