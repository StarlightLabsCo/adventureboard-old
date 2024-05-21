import type { RESTPostOAuth2AccessTokenResult } from 'discord-api-types/v10';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  if (!process.env.DISCORD_CLIENT_ID) {
    console.error('DISCORD_CLIENT_ID is required');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }

  if (!process.env.DISCORD_CLIENT_SECRET) {
    console.error('DISCORD_CLIENT_SECRET is required');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }

  const { code } = (await req.json()) as { code: string };

  if (!code) {
    return new NextResponse('Code is required', { status: 400 });
  }

  const response = await fetch(`${process.env.DISCORD_API_BASE}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
    }),
  });

  if (!response.ok) {
    console.error(await response.text());
    return new NextResponse('Failed to exchange code for access token', { status: 400 });
  }

  const { access_token } = (await response.json()) as RESTPostOAuth2AccessTokenResult;

  return new NextResponse(JSON.stringify({ access_token }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
