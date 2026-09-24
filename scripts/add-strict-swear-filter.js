import 'dotenv/config';

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = '1432647277587075134';
const API_BASE = 'https://discord.com/api/v10';

async function main() {
  const headers = {
    Authorization: `Bot ${TOKEN}`,
    'Content-Type': 'application/json',
  };

  const channels = await fetch(`${API_BASE}/guilds/${GUILD_ID}/channels`, { headers }).then((r) => r.json());
  const alertChannel = channels.find((c) => c.name === 'evolution-feed');

  console.log('⚡ Adding Strict Keyword Swear Filter (Hard Block)...');

  const rule = await fetch(`${API_BASE}/guilds/${GUILD_ID}/auto-moderation/rules`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: '⛔ Strict Profanity Hard-Block',
      event_type: 1, // MESSAGE_SEND
      trigger_type: 1, // KEYWORD
      trigger_metadata: {
        keyword_filter: [
          '*fuck*',
          '*shit*',
          '*bitch*',
          '*asshole*',
          '*cunt*',
          '*dick*',
          '*bastard*',
          '*slut*',
          '*whore*',
          '*nigger*',
          '*nigga*',
          '*faggot*',
          '*retard*',
          '*stfu*',
          '*randi*',
          '*muji*',
          '*lado*',
          '*machikne*',
        ],
      },
      actions: [
        {
          type: 1, // BLOCK_MESSAGE
          metadata: {
            custom_message: 'Your message was blocked: Profanity and vulgar language are strictly prohibited in the Dawosti Guild.',
          },
        },
        ...(alertChannel
          ? [
              {
                type: 2,
                metadata: { channel_id: alertChannel.id },
              },
            ]
          : []),
      ],
      enabled: true,
      exempt_roles: [],
      exempt_channels: [],
    }),
  }).then((r) => r.json());

  console.log('Result:', rule);
}

main().catch(console.error);
