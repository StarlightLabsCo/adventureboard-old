import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

if (
  !process.env.R2_ACCESS_KEY_ID ||
  !process.env.R2_SECRET_ACCESS_KEY ||
  !process.env.NEXT_PUBLIC_R2_BUCKET_NAME ||
  !process.env.NEXT_PUBLIC_R2_ACCOUNT_ID ||
  !process.env.STABILITY_API_KEY
) {
  throw new Error('Missing required environment variables');
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.NEXT_PUBLIC_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export const maxDuration = 60; // 1 minute

export async function POST(req: NextRequest) {
  // Auth
  const accessToken = req.headers.get('Authorization')?.split(' ')[1];
  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userResponse = await fetch(`${process.env.DISCORD_API_BASE}/users/@me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!userResponse.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await userResponse.json();

  // Generate image
  const { prompt, aspect_ratio, model } = await req.json();
  console.log(`Generating image in ${aspect_ratio} aspect ratio with prompt: ${prompt}`);

  let stabilityResponse;
  if (model === 'fast') {
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('aspect_ratio', aspect_ratio);
    formData.append('output_format', 'png');
    formData.append('model', 'sd3-large-turbo');

    stabilityResponse = await fetch('https://api.stability.ai/v2beta/stable-image/generate/sd3', {
      method: 'POST',
      headers: {
        Accept: 'image/*',
        Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
      },
      body: formData,
    });
  } else if (model === 'ultra') {
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('aspect_ratio', aspect_ratio);
    formData.append('output_format', 'png');

    stabilityResponse = await fetch('https://api.stability.ai/v2beta/stable-image/generate/ultra', {
      method: 'POST',
      headers: {
        Accept: 'image/*',
        Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
      },
      body: formData,
    });
  } else {
    return NextResponse.json({ error: 'Invalid model' }, { status: 400 });
  }

  if (!stabilityResponse.ok) {
    console.error(stabilityResponse);
    const data = await stabilityResponse.json();
    console.error(data);
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
  }

  // Upload to Cloudflare S3
  const imageBuffer = await stabilityResponse.arrayBuffer();
  const shortPrompt = prompt.split(' ').slice(0, 3).join('_');
  const filename = `${user.id}/${Date.now()}_${shortPrompt}.png`;

  const objectKey = `images/${filename}`;
  const uploadCommand = new PutObjectCommand({
    Bucket: process.env.NEXT_PUBLIC_R2_BUCKET_NAME,
    Key: objectKey,
    Body: Buffer.from(imageBuffer),
    ContentType: 'image/webp',
  });

  await s3.send(uploadCommand);

  const url = `https://${process.env.NEXT_PUBLIC_R2_BUCKET_NAME}.${process.env.NEXT_PUBLIC_R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${objectKey}`;

  return NextResponse.json({ url });
}
