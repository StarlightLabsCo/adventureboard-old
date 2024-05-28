import { NextRequest, NextResponse } from 'next/server';
import { AwsClient } from 'aws4fetch';

if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
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
  if (!filename) {
    return NextResponse.json({ error: 'Missing filename' }, { status: 400 });
  }

  const r2 = new AwsClient({
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  });

  const objectKey = `${user.id}/${Date.now()}_${filename}`;
  const url = new URL(`https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${objectKey}`);
  url.searchParams.set('X-Amz-Expires', '3600');

  const signedUrl = await r2.sign(new Request(url, { method: 'PUT' }), { aws: { signQuery: true } });

  return NextResponse.json({ url: signedUrl.url });
}
