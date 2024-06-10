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

  useEffect(() => {
    const debugStepThroughRatios = async () => {
      while (true) {
        for (const ratio of aspectRatios) {
          setAspectRatio(ratio);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    };

    debugStepThroughRatios();
  }, []);

  return (
    <div className="tlui-style-panel__wrapper w-[350px] flex flex-col gap-y-3 py-2 px-3">
      <div className="flex flex-col items-center gap-y-2">
        <div className="text-white">Image Size</div>
        <div className="h-[100px] flex w-full gap-x-2">
          <div className="relative h-[100px] w-[100px] shrink-0 flex items-center justify-center">
            <div
              style={{ width: `${width}px`, height: `${height}px` }}
              className="rounded-[var(--radius-2)] border border-white flex items-center justify-center z-10"
            >
              {aspectRatio}
            </div>
            {showInverse && (
              <div
                className="absolute border border-dashed border-white/50 rounded-[var(--radius-2)]"
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
