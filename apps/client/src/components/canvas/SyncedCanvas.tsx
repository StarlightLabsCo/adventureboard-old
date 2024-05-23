'use client';

import dynamic from 'next/dynamic';
const Tldraw = dynamic(async () => (await import('tldraw')).Tldraw, { ssr: false });
import { getAssetUrls } from '@tldraw/assets/selfHosted';
import 'tldraw/tldraw.css';
const assetUrls = getAssetUrls();

export function SyncedCanvas() {
  return (
    <div className="fixed inset-0 w-[100vw] h-[100vh]">
      <Tldraw inferDarkMode assetUrls={assetUrls} />
    </div>
  );
}
