import { StateNode } from 'tldraw';

export class ImageGenTool extends StateNode {
  static override id = 'imageGen';

  override onEnter = () => {
    console.log(`Entering ImageGenTool`);
  };

  override onPointerDown = () => {
    console.log(`Pointer down in ImageGenTool`);
  };
}
