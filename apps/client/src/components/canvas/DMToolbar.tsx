import {
  SelectToolbarItem,
  HandToolbarItem,
  DrawToolbarItem,
  EraserToolbarItem,
  ArrowToolbarItem,
  TextToolbarItem,
  AssetToolbarItem,
  DefaultToolbar,
} from 'tldraw';

export function DMToolbarContent() {
  return (
    <>
      <SelectToolbarItem />
      <HandToolbarItem />
      <DrawToolbarItem />
      <EraserToolbarItem />
      <ArrowToolbarItem />
      <TextToolbarItem />
      <AssetToolbarItem />
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
