import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { useDiscordStore } from '@/lib/discord';
import { AssetRecordType, MediaHelpers, TLAsset, TLAssetId, createShapeId, getHashForString, throttle, useEditor } from 'tldraw';

export function ImageGenPanel() {
  const editor = useEditor();

  const aspectRatios: string[] = ['9:21', '9:16', '2:3', '4:5', '1:1', '5:4', '3:2', '16:9', '21:9'];
  const centerIndex: number = 4;
  const [aspectRatioIndex, setAspectRatioIndex] = useState<number>(4);
  const [prompt, setPrompt] = useState<string>('');

  const calculateDimensions = (ratio: string) => {
    const [widthRatio, heightRatio] = ratio.split(':').map(Number);
    const isWidthDominant = widthRatio > heightRatio;
    const width = isWidthDominant ? 100 : (100 * widthRatio) / heightRatio;
    const height = isWidthDominant ? (100 * heightRatio) / widthRatio : 100;
    return { width, height };
  };

  const getInverseRatioIndex = (index: number): number => {
    const ratio = aspectRatios[index];
    const [widthRatio, heightRatio] = ratio.split(':');
    const inverseRatio = `${heightRatio}:${widthRatio}`;
    return aspectRatios.indexOf(inverseRatio);
  };

  const currentAspectRatio = aspectRatios[aspectRatioIndex];
  const { width, height } = calculateDimensions(currentAspectRatio);
  const inverseRatioIndex = getInverseRatioIndex(aspectRatioIndex);
  const showInverse = currentAspectRatio !== '1:1';

  const isPortrait = (() => {
    const [widthRatio, heightRatio] = currentAspectRatio.split(':').map(Number);
    return heightRatio > widthRatio;
  })();

  const isSquare = currentAspectRatio === '1:1';
  const isLandscape = (() => {
    const [widthRatio, heightRatio] = currentAspectRatio.split(':').map(Number);
    return widthRatio > heightRatio;
  })();

  const generateImage = throttle(async () => {
    if (!prompt) {
      return;
    }

    const accessToken = useDiscordStore.getState().auth?.access_token;
    if (!accessToken) {
      throw new Error('Unauthorized');
    }

    // // Create placeholder object
    // const shapeId = createShapeId();
    // editor.createShapes([
    //   {
    //     id: shapeId,
    //     type: 'image',
    //     x: 0,
    //     y: 0,
    //     props: {
    //       w: 100,
    //       h: 100,
    //     },
    //   },
    // ]);

    // Send Request

    const response = await fetch('/api/generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ prompt, aspect_ratio: aspectRatios[aspectRatioIndex] }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate image');
    }

    const data = await response.json();
    const { url } = data;

    const assetUrl = url.replace(
      new RegExp(
        `^https://${process.env.NEXT_PUBLIC_R2_BUCKET_NAME}\\.${process.env.NEXT_PUBLIC_R2_ACCOUNT_ID}\\.r2\\.cloudflarestorage\\.com`,
      ),
      '/r2-get',
    );

    // Create a TLAsset object
    const assetId: TLAssetId = AssetRecordType.createId(getHashForString(url));
    const assetName = assetUrl.split('/').pop();

    const blob = await fetch(assetUrl).then((res) => res.blob());
    const size = await MediaHelpers.getImageSize(blob);

    console.log(`Size: ${size.w}px x ${size.h}px`);

    const asset = AssetRecordType.create({
      id: assetId,
      type: 'image',
      typeName: 'asset',
      props: {
        name: assetName,
        src: assetUrl,
        w: size.w,
        h: size.h,
        mimeType: 'image/webp',
        isAnimated: false,
      },
    });

    editor.store.put([asset]);

    // Create and position the image shape at the center of the camera
    const { currentPagePoint } = editor.inputs;

    const imageShape = {
      id: createShapeId(),
      type: 'image',
      x: currentPagePoint.x,
      y: currentPagePoint.y,
      props: {
        w: size.w,
        h: size.h,
        playing: true,
        assetId,
      },
    };

    editor.createShapes([imageShape]);
  }, 1000);

  return (
    <div className="tlui-style-panel__wrapper w-[400px] flex flex-col gap-y-3 py-2 px-3">
      <div className="flex flex-col items-center gap-y-2">
        <div className="text-white">Image Size</div>
        <div className="h-[100px] w-full flex gap-x-4">
          <div className="relative h-[100px] w-[100px] shrink-0 flex items-center justify-center">
            <div
              style={{ width: `${width}px`, height: `${height}px` }}
              className="rounded-[var(--radius-2)] border border-white flex items-center justify-center transition-all z-10"
            >
              {currentAspectRatio}
            </div>
            {showInverse && (
              <div
                className="absolute border border-dashed border-white/50 hover:border-white transition-all rounded-[var(--radius-2)] cursor-pointer"
                style={{
                  width: `${height}px`,
                  height: `${width}px`,
                  top: `calc(50% - ${width / 2}px)`,
                  left: `calc(50% - ${height / 2}px)`,
                }}
                onClick={() => setAspectRatioIndex(inverseRatioIndex)}
              />
            )}
          </div>
          <div className="flex flex-col h-full justify-center w-full gap-y-4">
            <div className="w-full bg-slate-500 flex items-center justify-evenly rounded-full">
              <div
                className={`w-1/3 ${isPortrait ? 'bg-red-300 text-red-500  hover:bg-red-400' : 'text-white hover:bg-slate-400'} rounded-l-full flex items-center justify-center text-xs cursor-pointer`}
                onClick={() => setAspectRatioIndex(1)}
              >
                Portrait
              </div>
              <div
                className={`w-1/3 ${isSquare ? 'bg-red-300 text-red-500 hover:bg-red-400' : 'text-white hover:bg-slate-400'} flex items-center justify-center text-xs cursor-pointer`}
                onClick={() => setAspectRatioIndex(4)}
              >
                Square
              </div>
              <div
                className={`w-1/3 ${isLandscape ? 'bg-red-300 text-red-500  hover:bg-red-400' : 'text-white hover:bg-slate-400'} rounded-r-full flex items-center justify-center text-xs cursor-pointer`}
                onClick={() => setAspectRatioIndex(7)}
              >
                Landscape
              </div>
            </div>
            <div className="w-full h-[0.5px] bg-white/10 rounded-full" />
            <Slider
              value={[centerIndex, aspectRatioIndex]}
              min={0}
              max={aspectRatios.length - 1}
              step={1}
              center={centerIndex}
              onValueChange={(value) => {
                if (value[0] !== centerIndex) {
                  setAspectRatioIndex(value[0]);
                } else if (value[1] !== centerIndex) {
                  setAspectRatioIndex(value[1]);
                } else {
                  setAspectRatioIndex(centerIndex);
                }
              }}
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-y-2">
        <div className="text-white">Prompt</div>
        <textarea
          className="w-full h-[100px] border border-white rounded-[var(--radius-2)] p-2 bg-[var(--color-panel)] text-white"
          placeholder="Describe the image you want to generate"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>
      <div className="flex items-center justify-center">
        <div
          className={`bg-blue-500 text-white rounded-[var(--radius-2)] px-4 py-2 ${prompt ? 'hover:bg-blue-400 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
          onClick={prompt ? generateImage : undefined}
        >
          Generate
        </div>
      </div>
    </div>
  );
}
