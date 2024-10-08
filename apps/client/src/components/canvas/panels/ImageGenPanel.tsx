import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { useDiscordStore } from '@/lib/discord';
import {
  AssetRecordType,
  MediaHelpers,
  TLAssetId,
  createShapeId,
  getHashForString,
  throttle,
  useEditor,
  track,
  getUserPreferences,
} from 'tldraw';

export const ImageGenPanel = track(() => {
  const editor = useEditor();

  const aspectRatios = [
    { ratio: '9:21', size: { width: 640, height: 1536 } },
    { ratio: '9:16', size: { width: 768, height: 1344 } },
    { ratio: '2:3', size: { width: 832, height: 1216 } },
    { ratio: '4:5', size: { width: 896, height: 1088 } },
    { ratio: '1:1', size: { width: 1024, height: 1024 } },
    { ratio: '5:4', size: { width: 1088, height: 896 } },
    { ratio: '3:2', size: { width: 1216, height: 832 } },
    { ratio: '16:9', size: { width: 1344, height: 768 } },
    { ratio: '21:9', size: { width: 1536, height: 640 } },
  ];

  const centerIndex: number = 4;
  const [aspectRatioIndex, setAspectRatioIndex] = useState<number>(4);
  const [prompt, setPrompt] = useState<string>('');
  const [model, setModel] = useState<'fast' | 'ultra'>('fast');

  const calculateDimensions = (ratio: string) => {
    const [widthRatio, heightRatio] = ratio.split(':').map(Number);
    const isWidthDominant = widthRatio > heightRatio;
    const width = isWidthDominant ? 100 : (100 * widthRatio) / heightRatio;
    const height = isWidthDominant ? (100 * heightRatio) / widthRatio : 100;
    return { width, height };
  };

  const getInverseRatioIndex = (index: number): number => {
    const ratio = aspectRatios[index].ratio;
    const [widthRatio, heightRatio] = ratio.split(':');
    const inverseRatio = `${heightRatio}:${widthRatio}`;
    return aspectRatios.findIndex((ar) => ar.ratio === inverseRatio);
  };

  const currentAspectRatio = aspectRatios[aspectRatioIndex].ratio;
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

    const selectedShapeIds = editor.getSelectedShapes();
    for (const shapeId of selectedShapeIds) {
      editor.deselect(shapeId);
    }

    // Create placeholder rectangle object
    const placeholderShapeId = createShapeId();
    const initialWidth = aspectRatios[aspectRatioIndex].size.width / 2;
    const initialHeight = aspectRatios[aspectRatioIndex].size.height / 2;
    const initialX = editor.getViewportPageBounds().x + editor.getViewportPageBounds().w / 2 - initialWidth / 2;
    const initialY = editor.getViewportPageBounds().y + editor.getViewportPageBounds().h / 2 - initialHeight / 2;

    const placeholderRectangleShape = {
      id: placeholderShapeId,
      type: 'geo',
      x: initialX,
      y: initialY,
      opacity: 0.5,
      props: {
        geo: 'rectangle',
        w: initialWidth,
        h: initialHeight,
        fill: 'solid',
        color: 'blue',
        labelColor: 'blue',
      },
    };

    editor.createShapes([placeholderRectangleShape]);
    editor.setCurrentTool('select');

    let animationFrameId: number;
    const duration = 1000;
    const start = performance.now();

    const animate = (time: number) => {
      const elapsed = time - start;
      const progress = (elapsed / duration) % 1;
      const easeInOut = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
      const scale = 1 + 0.01 * Math.sin(easeInOut * Math.PI);

      const scaledWidth = initialWidth * scale;
      const scaledHeight = initialHeight * scale;

      editor.updateShapes([
        {
          ...placeholderRectangleShape,
          x: initialX + initialWidth / 2 - scaledWidth / 2,
          y: initialY + initialHeight / 2 - scaledHeight / 2,
          props: {
            ...placeholderRectangleShape.props,
            w: scaledWidth,
            h: scaledHeight,
          },
        },
      ]);

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    const response = await fetch('/api/generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ prompt, aspect_ratio: aspectRatios[aspectRatioIndex].ratio, model }),
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

    const assetId: TLAssetId = AssetRecordType.createId(getHashForString(url));
    const assetName = assetUrl.split('/').pop();

    const blob = await fetch(assetUrl).then((res) => res.blob());
    const size = await MediaHelpers.getImageSize(blob);

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

    editor.deleteShapes([placeholderShapeId]);

    const imageShapeId = createShapeId();
    editor.createShapes([
      {
        id: imageShapeId,
        type: 'image',
        x: initialX,
        y: initialY,
        props: {
          w: initialWidth,
          h: initialHeight,
          assetId,
        },
        meta: {
          prompt,
          aspectRatio: aspectRatios[aspectRatioIndex],
        },
      },
    ]);

    cancelAnimationFrame(animationFrameId);

    editor.select(imageShapeId);
  }, 1000);

  return (
    <div className="tlui-style-panel__wrapper w-[400px] flex flex-col gap-y-5 py-2 px-3">
      <div className="flex flex-col items-center gap-y-2">
        <div className="text-[var(--color-text-0)]">Image Size</div>
        <div className="h-[100px] w-full flex gap-x-4">
          <div className="relative h-[100px] w-[100px] shrink-0 flex items-center justify-center">
            <div
              style={{ width: `${width}px`, height: `${height}px` }}
              className="rounded-[var(--radius-2)] border border-[var(--color-text-0)] flex items-center justify-center transition-all z-10"
            >
              {currentAspectRatio}
            </div>
            {showInverse && (
              <div
                className="absolute border border-dashed border-[var(--color-grid)] hover:border-[var(--color-text-0)] transition-all rounded-[var(--radius-2)] cursor-pointer"
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
            <div className="w-full bg-[var(--color-grid)] flex items-center justify-evenly rounded-full">
              <div
                className={`w-1/3 ${isPortrait ? 'bg-[var(--color-primary)]' : ' hover:bg-[var(--color-text-3)]'} text-white rounded-l-full flex items-center justify-center text-xs cursor-pointer`}
                onClick={() => setAspectRatioIndex(1)}
              >
                Portrait
              </div>
              <div
                className={`w-1/3 ${isSquare ? 'bg-[var(--color-primary)]' : ' hover:bg-[var(--color-text-3)]'} text-white flex items-center justify-center text-xs cursor-pointer`}
                onClick={() => setAspectRatioIndex(4)}
              >
                Square
              </div>
              <div
                className={`w-1/3 ${isLandscape ? 'bg-[var(--color-primary)]' : ' hover:bg-[var(--color-text-3)]'} text-white rounded-r-full flex items-center justify-center text-xs cursor-pointer`}
                onClick={() => setAspectRatioIndex(7)}
              >
                Landscape
              </div>
            </div>
            <div className="w-full h-[0.5px] bg-[var(--color-grid)] rounded-full" />
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
        <div className="text-[var(--color-text-0)]">Prompt</div>
        <textarea
          className="w-full h-[100px] border border-[var(--color-grid)] rounded-[var(--radius-2)] p-2 bg-[var(--color-panel)] text-[var(--color-text-0)]"
          placeholder="Describe the image you want to generate"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>
      <div className="flex flex-col items-center gap-y-2">
        <div className="text-[var(--color-text-0)]">Model</div>
        <div className="w-full flex justify-between">
          <div className="text-[var(--color-text-0)]">Mode</div>
          <div className="h-full w-1/3 bg-[var(--color-grid)] flex items-center justify-evenly rounded-full">
            <div
              className={`h-full w-1/2 ${model === 'fast' ? 'bg-[var(--color-primary)]' : 'hover:bg-[var(--color-text-3)]'} text-white rounded-l-full flex items-center justify-center text-xs cursor-pointer`}
              onClick={() => setModel('fast')}
            >
              Fast
            </div>
            <div
              className={`h-full w-1/2 ${model === 'ultra' ? 'bg-[var(--color-primary)]' : 'hover:bg-[var(--color-text-3)]'} text-white rounded-r-full flex items-center justify-center text-xs cursor-pointer`}
              onClick={() => setModel('ultra')}
            >
              Ultra
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center">
        <div
          className={`bg-[var(--color-primary)] text-white rounded-[var(--radius-2)] px-4 py-2 ${prompt ? 'hover:bg-blue-400 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
          onClick={prompt ? generateImage : undefined}
        >
          Generate
        </div>
      </div>
    </div>
  );
});
