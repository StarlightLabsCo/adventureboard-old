import discordSdk from '.';
import type { AsyncReturnType } from 'type-fest';
export type Auth = AsyncReturnType<typeof discordSdk.commands.authenticate>;

if (!process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID) {
  throw new Error('NEXT_PUBLIC_DISCORD_CLIENT_ID is not set');
}

export async function authenticate() {
  const { code } = await discordSdk.commands.authorize({
    client_id: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!,
    response_type: 'code',
    state: '',
    prompt: 'none',
    // More info on scopes here: https://discord.com/developers/docs/topics/oauth2#shared-resources-oauth2-scopes
    scope: [
      // "applications.builds.upload",
      // "applications.builds.read",
      // "applications.store.update",
      // "applications.entitlements",
      // "bot",
      'identify',
      // "connections",
      // "email",
      // "gdm.join",
      'guilds',
      // "guilds.join",
      // "guilds.members.read",
      // "messages.read",
      // "relationships.read",
      'rpc.activities.write',
      // "rpc.notifications.read",
      // "rpc.voice.write",
      'rpc.voice.read',
      // "webhook.incoming",
    ],
  });

  const response = await fetch('/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code,
    }),
  });

  const { access_token } = await response.json();

  const auth = await discordSdk.commands.authenticate({
    access_token,
  });

  if (auth == null) {
    throw new Error('Discord SDK authenticate command failed');
  }

  return auth as Auth;
}
