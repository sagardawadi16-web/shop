import 'dotenv/config';

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = '1432647277587075134';
const API_BASE = 'https://discord.com/api/v10';

async function main() {
  const headers = {
    Authorization: `Bot ${TOKEN}`,
    'Content-Type': 'application/json',
  };

  console.log('⚡ Loosening filters: Removing strict swear blocks, allowing casual speech...');

  // 1. Fetch current AutoMod rules
  const rules = await fetch(`${API_BASE}/guilds/${GUILD_ID}/auto-moderation/rules`, { headers }).then((r) =>
    r.json()
  );

  // 2. Delete strict swear filter rules
  const rulesToDelete = [
    '⛔ Strict Profanity Hard-Block',
    '🛡️ Dawosti Anti-Profanity & Slur Filter',
  ];

  for (const r of rules) {
    if (rulesToDelete.includes(r.name)) {
      console.log(`  - Deleting strict rule: "${r.name}" (${r.id})`);
      await fetch(`${API_BASE}/guilds/${GUILD_ID}/auto-moderation/rules/${r.id}`, {
        method: 'DELETE',
        headers,
      });
    }
  }

  // Find alert channel for extreme triggers
  const channels = await fetch(`${API_BASE}/guilds/${GUILD_ID}/channels`, { headers }).then((r) => r.json());
  const alertChannel = channels.find((c) => c.name === 'evolution-feed');

  // 3. Create a Loose Extreme-Only Filter (e.g. Hitler, Nazi, extreme hate symbols)
  console.log('\n  + Creating Loose Extreme-Only Filter (Hitler, Nazism, Hate Symbols)...');
  const extremeRule = await fetch(`${API_BASE}/guilds/${GUILD_ID}/auto-moderation/rules`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: '⚠️ Extreme Hate & Extremism Filter',
      event_type: 1, // MESSAGE_SEND
      trigger_type: 1, // KEYWORD
      trigger_metadata: {
        keyword_filter: [
          '*hitler*',
          '*nazi*',
          '*swastika*',
          '*holocaust*',
          '*white supremacy*',
          '*kkk*',
        ],
      },
      actions: [
        {
          type: 1, // BLOCK_MESSAGE
          metadata: {
            custom_message: 'Your message was blocked: Extremist and hate speech are strictly prohibited.',
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

  console.log('✅ Created Extreme Filter:', extremeRule.name || extremeRule);

  // 4. Print remaining active rules
  const updatedRules = await fetch(`${API_BASE}/guilds/${GUILD_ID}/auto-moderation/rules`, { headers }).then((r) =>
    r.json()
  );
  console.log('\n🛡️ Current Active AutoMod Rules:');
  for (const r of updatedRules) {
    console.log(`  • "${r.name}" (Enabled: ${r.enabled})`);
  }
}

main().catch(console.error);
