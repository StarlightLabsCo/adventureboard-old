import { useState, useEffect } from 'react';

export function ImageGenPanel() {
  const aspectRatios: string[] = ['9:21', '9:16', '2:3', '4:5', '1:1', '5:4', '3:2', '16:9', '21:9'];
  const [aspectRatio, setAspectRatio] = useState<string>(aspectRatios[4]);

  const calculateDimensions = (ratio: string) => {
    const [widthRatio, heightRatio] = ratio.split(':').map(Number);
    const isWidthDominant = widthRatio > heightRatio;
    const width = isWidthDominant ? 100 : (100 * widthRatio) / heightRatio;
    const height = isWidthDominant ? (100 * heightRatio) / widthRatio : 100;
    return { width, height };
  };

  const getInverseRatio = (ratio: string): string => {
    const [widthRatio, heightRatio] = ratio.split(':');
    return `${heightRatio}:${widthRatio}`;
  };

  const { width, height } = calculateDimensions(aspectRatio);

  const inverseRatio = getInverseRatio(aspectRatio);
  const showInverse = aspectRatio !== '1:1';

  // Determine if the aspect ratio is portrait based on the ratio values
  const isPortrait = (() => {
    const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);
    return heightRatio > widthRatio;
  })();

  const isSquare = aspectRatio === '1:1';
  const isLandscape = (() => {
    const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);
    return widthRatio > heightRatio;
  })();

  return (
    <div className="tlui-style-panel__wrapper w-[400px] flex flex-col gap-y-3 py-2 px-3">
      <div className="flex flex-col items-center gap-y-2">
        <div className="text-white">Image Size</div>
        <div className="h-[100px] w-full flex gap-x-4">
          <div className="relative h-[100px] w-[100px] shrink-0 flex items-center justify-center">
            <div
              style={{ width: `${width}px`, height: `${height}px` }}
              className="rounded-[var(--radius-2)] border border-white flex items-center justify-center z-10"
            >
              {aspectRatio}
            </div>
            {showInverse && (
              <div
                className="absolute border border-dashed border-white/50 rounded-[var(--radius-2)] cursor-pointer"
                style={{
                  width: `${height}px`,
                  height: `${width}px`,
                  top: `calc(50% - ${width / 2}px)`,
                  left: `calc(50% - ${height / 2}px)`,
                }}
                onClick={() => setAspectRatio(inverseRatio)}
              />
            )}
          </div>
          <div className="flex flex-col w-full">
            <div className="w-full bg-slate-500 flex items-center justify-evenly rounded-full">
              <div
                className={`w-1/3 ${isPortrait ? 'bg-red-300 text-red-500  hover:bg-red-400' : 'text-white hover:bg-slate-400'} rounded-l-full flex items-center justify-center text-xs cursor-pointer`}
                onClick={() => setAspectRatio('9:16')}
              >
                Portrait
              </div>
              <div
                className={`w-1/3 ${isSquare ? 'bg-red-300 text-red-500 hover:bg-red-400' : 'text-white hover:bg-slate-400'} flex items-center justify-center text-xs cursor-pointer`}
                onClick={() => setAspectRatio('1:1')}
              >
                Square
              </div>
              <div
                className={`w-1/3 ${isLandscape ? 'bg-red-300 text-red-500  hover:bg-red-400' : 'text-white hover:bg-slate-400'} rounded-r-full flex items-center justify-center text-xs cursor-pointer`}
                onClick={() => setAspectRatio('16:9')}
              >
                Landscape
              </div>
            </div>
            <div className=""></div>
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
