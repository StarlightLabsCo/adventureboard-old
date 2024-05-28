import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

if (
  !process.env.R2_ACCESS_KEY_ID ||
  !process.env.R2_SECRET_ACCESS_KEY ||
  !process.env.NEXT_PUBLIC_R2_BUCKET_NAME ||
  !process.env.NEXT_PUBLIC_R2_ACCOUNT_ID
) {
  throw new Error('Missing R2 credentials');
}

if (!process.env.DISCORD_API_BASE) {
  throw new Error('Missing Discord API base URL');
}

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

  // Upload
  const user = await userResponse.json();
  const { filename } = await req.json();

  const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.NEXT_PUBLIC_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  const objectKey = `${user.id}/${Date.now()}_${filename}`;
  const command = new PutObjectCommand({
    Bucket: process.env.NEXT_PUBLIC_R2_BUCKET_NAME!,
    Key: objectKey,
  });

  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

  return NextResponse.json({ url: signedUrl });
}
