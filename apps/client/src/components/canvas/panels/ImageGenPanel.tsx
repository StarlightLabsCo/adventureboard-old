import { useState } from 'react';

export function ImageGenPanel() {
  const aspectRatios: string[] = ['9/21', '9/16', '2/3', '4/5', '1/1', '5/4', '3/2', '16/9', '21/9'];
  const [aspectRatio, setAspectRatio] = useState<string>(aspectRatios[4]);

  return (
    <div className="tlui-style-panel__wrapper w-[350px] flex flex-col gap-y-3 py-2 px-3">
      <div className="flex flex-col items-center gap-y-2">
        <div className="text-white">Image Size</div>
        <div className="h-[100px] flex">
          <div className="h-[100px] w-[100px] rounded-[var(--radius-1)] border border-white flex items-center justify-center">
            {aspectRatio}
          </div>
          <div className="flex flex-col">
            <div></div>
            <div className="w-full"></div>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-y-2">
        <div className="text-white">Prompt</div>
        <textarea
          className="w-full h-[100px] border border-white rounded-[var(--radius-2)] p-2 bg-[var(--color-panel)] text-white"
          placeholder="Describe the image you want to generate"
        />
      </div>
      <div className="flex items-center justify-center">
        <div className="bg-blue-500 text-white rounded-[var(--radius-2)] px-4 py-2 hover:bg-blue-400 cursor-pointer">Generate</div>
      </div>
    </div>
  );
}
