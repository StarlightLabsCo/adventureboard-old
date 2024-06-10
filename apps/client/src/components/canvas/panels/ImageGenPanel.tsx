export function ImageGenPanel() {
  return (
    <div className="tlui-style-panel__wrapper w-[350px] h-[300px] flex flex-col gap-y-3 py-2 px-3">
      <div className="flex flex-col items-center gap-y-3">
        <div className="text-white">Image Size</div>
      </div>
      <div className="flex flex-col items-center gap-y-3">
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
