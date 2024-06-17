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

  // Parse request body
  const { image_data, up, right, down, left } = await req.json();
  if (!image_data) {
    return NextResponse.json({ error: 'No image data' }, { status: 400 });
  }

  if (!up && !right && !down && !left) {
    return NextResponse.json({ error: 'No direction' }, { status: 400 });
  }

  // Prepare request to Stability API for outpainting
  const formData = new FormData();
  formData.append('image', image_data);
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
    return NextResponse.json({ error: 'Failed to outpaint image', details: errorData }, { status: 500 });
  }

  // Upload modified image to Cloudflare S3
  const imageBuffer = await stabilityResponse.arrayBuffer();
  const filename = `outpaint_${Date.now()}.png`;
  const objectKey = `outpainted_images/${filename}`;
  const uploadCommand = new PutObjectCommand({
    Bucket: process.env.NEXT_PUBLIC_R2_BUCKET_NAME,
    Key: objectKey,
    Body: Buffer.from(imageBuffer),
    ContentType: 'image/png',
  });

  await s3.send(uploadCommand);

  const url = `https://${process.env.NEXT_PUBLIC_R2_BUCKET_NAME}.${process.env.NEXT_PUBLIC_R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${objectKey}`;

  return NextResponse.json({ url });
}
