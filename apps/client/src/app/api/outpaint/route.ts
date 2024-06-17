import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Ensure all required environment variables are set
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

export async function POST(req: NextRequest) {
  // Authentication
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

  // Parse request body
  const { image, up, right, down, left } = await req.json();
  console.log(`Image? ${image.length}`);
  console.log(`up: ${up}, right: ${right}, down: ${down}, left: ${left}`);

  if (!image) {
    return NextResponse.json({ error: 'No image data' }, { status: 400 });
  }

  if (!up && !right && !down && !left) {
    return NextResponse.json({ error: 'No direction' }, { status: 400 });
  }

  // Prepare request to Stability API for outpainting
  const formData = new FormData();
  const imageBuffer = Buffer.from(image, 'base64');
  formData.append('image', new Blob([imageBuffer], { type: 'image/webp' }));
  if (up) formData.append('up', up);
  if (right) formData.append('right', right);
  if (down) formData.append('down', down);
  if (left) formData.append('left', left);

  const stabilityResponse = await fetch('https://api.stability.ai/v2beta/stable-image/edit/outpaint', {
    method: 'POST',
    headers: {
      Accept: 'image/*',
      Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
    },
    body: formData,
  });

  if (!stabilityResponse.ok) {
    const errorData = await stabilityResponse.json();
    console.error(errorData);
    return NextResponse.json({ error: 'Failed to outpaint image', details: errorData }, { status: 500 });
  }

  // Upload modified image to Cloudflare S3
  const resultImageBuffer = await stabilityResponse.arrayBuffer();
  const filename = `${user.id}/${Date.now()}_outpaint.png`;
  const objectKey = `images/${filename}`;
  const uploadCommand = new PutObjectCommand({
    Bucket: process.env.NEXT_PUBLIC_R2_BUCKET_NAME,
    Key: objectKey,
    Body: Buffer.from(resultImageBuffer),
    ContentType: 'image/png',
  });

  await s3.send(uploadCommand);

  const url = `https://${process.env.NEXT_PUBLIC_R2_BUCKET_NAME}.${process.env.NEXT_PUBLIC_R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${objectKey}`;

  return NextResponse.json({ url });
}
