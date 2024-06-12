import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

if (!process.env.R2_ACCESS_KEY_ID) {
  throw new Error('Missing R2_ACCESS_KEY_ID');
}
if (!process.env.R2_SECRET_ACCESS_KEY) {
  throw new Error('Missing R2_SECRET_ACCESS_KEY');
}
if (!process.env.NEXT_PUBLIC_R2_BUCKET_NAME) {
  throw new Error('Missing NEXT_PUBLIC_R2_BUCKET_NAME');
}
if (!process.env.NEXT_PUBLIC_R2_ACCOUNT_ID) {
  throw new Error('Missing NEXT_PUBLIC_R2_ACCOUNT_ID');
}

if (!process.env.DISCORD_API_BASE) {
  throw new Error('Missing Discord API base URL');
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

  // Upload
  const { filename } = await req.json();

  const objectKey = `${user.id}/${Date.now()}_${filename}`;
  const command = new PutObjectCommand({
    Bucket: process.env.NEXT_PUBLIC_R2_BUCKET_NAME!,
    Key: objectKey,
  });

  const signedUrl = await getSignedUrl(s3, command, { expiresIn: 10 });

  return NextResponse.json({ url: signedUrl });
}
