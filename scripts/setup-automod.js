import 'dotenv/config';

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = '1432647277587075134';
const API_BASE = 'https://discord.com/api/v10';

if (!TOKEN) {
  console.error('Missing DISCORD_BOT_TOKEN');
  process.exit(1);
}

const headers = {
  Authorization: `Bot ${TOKEN}`,
  'Content-Type': 'application/json',
};

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Discord API Error [${res.status}] ${path}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function main() {
  console.log('🛡️ Configuring 24/7 Native Discord AutoMod Shields for Dawosti...');

  // Find channels for alert logging
  const channels = await api(`/guilds/${GUILD_ID}/channels`);
  const alertChannel = channels.find((c) => c.name === 'evolution-feed') || channels.find((c) => c.name === 'council-deliberation');

  // 1. Built-in Profanity, Slurs & Toxic Speech Filter (Runs 24/7 on Discord cloud)
  console.log('\n1️⃣ Deploying Discord Cloud Anti-Profanity & Slurs Shield...');
  try {
    const profanityRule = await api(`/guilds/${GUILD_ID}/auto-moderation/rules`, {
      method: 'POST',
      body: JSON.stringify({
        name: '🛡️ Dawosti Anti-Profanity & Slur Filter',
        event_type: 1, // MESSAGE_SEND
        trigger_type: 4, // DEFAULT_KEYWORD_LIST
        trigger_metadata: {
          presets: [1, 2, 3], // 1 = Profanity, 2 = Sexual Content, 3 = Slurs
        },
        actions: [
          {
            type: 1, // BLOCK_MESSAGE
            metadata: {
              custom_message: 'Your message was blocked: Dawosti Guild maintains strict standards of professional discourse and high-taste conduct.',
            },
          },
          ...(alertChannel
            ? [
                {
                  type: 2, // SEND_ALERT_MESSAGE
                  metadata: { channel_id: alertChannel.id },
                },
              ]
            : []),
        ],
        enabled: true,
        exempt_roles: [],
        exempt_channels: [],
      }),
    });
    console.log(`✅ Profanity & Slurs Filter active (ID: ${profanityRule.id})`);
  } catch (err) {
    console.warn('Profanity rule note:', err.message);
  }

  // 2. Custom Brand Protection Shield (Anti-Disparagement & Anti-Slander for Dawosti)
  console.log('\n2️⃣ Deploying Dawosti Brand Integrity Shield...');
  try {
    const brandProtectionRule = await api(`/guilds/${GUILD_ID}/auto-moderation/rules`, {
      method: 'POST',
      body: JSON.stringify({
        name: '🏛️ Dawosti Brand & Disparagement Shield',
        event_type: 1, // MESSAGE_SEND
        trigger_type: 1, // KEYWORD
        trigger_metadata: {
          keyword_filter: [
            '*dawosti*scam*',
            '*dawosti*fake*',
            '*dawosti*trash*',
            '*dawosti*suck*',
            '*dawosti*fraud*',
            '*dawosti*chor*',
            '*dawosti*khate*',
            '*dawosti*hate*',
            '*dawosti*worst*',
            '*dawosti*copy*',
            '*dawosti*rip*off*',
            '*dawosti*bullshit*',
            '*fuck*dawosti*',
            '*shit*dawosti*',
            '*hate*dawosti*',
          ],
        },
        actions: [
          {
            type: 1, // BLOCK_MESSAGE
            metadata: {
              custom_message: 'Your message was blocked: Slanderous or disparaging remarks against Dawosti and its community members are strictly prohibited under the Guild Manifesto.',
            },
          },
          ...(alertChannel
            ? [
                {
                  type: 2, // SEND_ALERT_MESSAGE
                  metadata: { channel_id: alertChannel.id },
                },
              ]
            : []),
        ],
        enabled: true,
        exempt_roles: [],
        exempt_channels: [],
      }),
    });
    console.log(`✅ Dawosti Brand Shield active (ID: ${brandProtectionRule.id})`);
  } catch (err) {
    console.warn('Brand protection rule note:', err.message);
  }

  // 3. Inspect all active AutoMod rules
  const activeRules = await api(`/guilds/${GUILD_ID}/auto-moderation/rules`);
  console.log('\n🛡️ Active 24/7 Discord Cloud AutoMod Rules (' + activeRules.length + '):');
  for (const r of activeRules) {
    console.log(`  • [${r.enabled ? 'ACTIVE' : 'DISABLED'}] "${r.name}" (Trigger Type: ${r.trigger_type})`);
  }
}

main().catch(console.error);
