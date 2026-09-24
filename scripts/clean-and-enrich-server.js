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
  const maxRetries = 5;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...headers, ...options.headers },
    });
    if (res.status === 204) return null;
    const data = await res.json();
    if (res.status === 429) {
      const waitTime = (data.retry_after || 5) * 1000 + 1000;
      console.log(`  Rate limited. Waiting ${waitTime / 1000}s...`);
      await new Promise((r) => setTimeout(r, waitTime));
      continue;
    }
    if (!res.ok) {
      throw new Error(`Discord API Error [${res.status}] ${path}: ${JSON.stringify(data)}`);
    }
    return data;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log('⚡ Dawosti Guild Server Optimization & Deep Enrichment...');

  // 1. Delete Leftover Old Channels
  console.log('\n🗑️ Removing obsolete legacy channels...');
  const obsoleteChannelIds = [
    '1432647279000551456', // 📄》rules
    '1432647279000551457', // 🔍》announcements
  ];

  for (const chId of obsoleteChannelIds) {
    try {
      await api(`/channels/${chId}`, { method: 'DELETE' });
      console.log(`  ✓ Deleted obsolete channel: ${chId}`);
      await sleep(600);
    } catch (e) {
      console.log(`  - Channel ${chId} already removed or inaccessible: ${e.message}`);
    }
  }

  // 2. Remove obsolete legacy roles
  console.log('\n🧹 Cleaning legacy classroom and subscription roles...');
  const roles = await api(`/guilds/${GUILD_ID}/roles`);
  const obsoleteRoleNames = [
    'Basic subscription',
    'Intermediate subscription',
    'Advance subscription',
    '==========Students==========',
    '==========Staff==========',
    'Teacher',
    'Punishment (muted)',
  ];

  for (const r of roles) {
    if (obsoleteRoleNames.includes(r.name) && !r.managed) {
      try {
        console.log(`  - Deleting legacy role: "${r.name}" (${r.id})`);
        await api(`/guilds/${GUILD_ID}/roles/${r.id}`, { method: 'DELETE' });
        await sleep(600);
      } catch (e) {
        console.log(`    (Could not delete role ${r.name}: ${e.message})`);
      }
    }
  }

  // 3. Cache channels
  const channels = await api(`/guilds/${GUILD_ID}/channels`);
  const channelMap = {};
  for (const c of channels) channelMap[c.name] = c.id;

  // 4. Populate announcements-and-drops
  const dropsChannelId = channelMap['announcements-and-drops'];
  if (dropsChannelId) {
    const existing = await api(`/channels/${dropsChannelId}/messages?limit=5`);
    if (existing.length === 0) {
      console.log('\n📢 Publishing Inaugural Drop Announcement in #announcements-and-drops...');
      await api(`/channels/${dropsChannelId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          embeds: [
            {
              title: '🔥 OFFICIAL DROP: DAWOSTI HAUTE COUTURE & AUTONOMOUS GUILD',
              description:
                'Welcome to the official drops channel of **DAWOSTI (दावोस्ती)** — Kathmandu’s benchmark for bespoke fashion, traditional textile innovation, and avant-garde streetwear.\n\n' +
                'This server is not a promotional billboard; it is an **autonomous design guild** where talent is verified by community critique and original garment drops.',
              color: 0x8a1c2e,
              fields: [
                {
                  name: '🌐 Official Boutique & Catalog',
                  value: '[dawosti.com](https://dawosti.com) — Handcrafted luxury silhouettes with nationwide delivery.',
                  inline: false,
                },
                {
                  name: '💎 How Designs Get Produced',
                  value:
                    '1. Submit original sketches or physical garments in <#' + channelMap['design-submissions'] + '>.\n' +
                    '2. Earn peer critique endorsements to ascend to **🏛️ Couturier**.\n' +
                    '3. Top-rated seasonal concepts are selected by the Vanguard Council for official production and sale on `dawosti.com`.',
                  inline: false,
                },
                {
                  name: '🛍️ Verified Patron Suite',
                  value:
                    'Already own a Dawosti piece? Use `/verify <order_number>` in <#' + channelMap['guild-commands'] + '> to unlock the private VIP drops lounge.',
                  inline: false,
                },
              ],
              footer: { text: 'Dawosti • Kathmandu, Nepal • Established 2026' },
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });
      console.log('  ✓ Published official launch drop!');
      await sleep(1000);
    } else {
      console.log('\n📢 #announcements-and-drops already has announcements.');
    }
  }

  // 5. Populate guild-hall-of-fame
  const hofChannelId = channelMap['guild-hall-of-fame'];
  if (hofChannelId) {
    const existing = await api(`/channels/${hofChannelId}/messages?limit=5`);
    if (existing.length === 0) {
      console.log('\n🏆 Publishing Guild Hall of Fame Manifesto...');
      await api(`/channels/${hofChannelId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          embeds: [
            {
              title: '🏛️ THE DAWOSTI GUILD HALL OF FAME',
              description:
                'The permanent chronicle honoring creators, pattern-makers, stylists, and tastemakers who advance Nepali fashion aesthetics through **Proof-of-Craft**.\n\n' +
                'Status in Dawosti cannot be purchased or grinded via chat spam. It is earned solely through peer signal on design excellence.',
              color: 0xe5a93c,
              fields: [
                {
                  name: '👑 Vanguard Council',
                  value:
                    'Council arbiters who oversee showcase selections for `dawosti.com`. Conferred by sustained leadership and verifiable mastery.',
                  inline: false,
                },
                {
                  name: '🏛️ Verified Couturiers',
                  value:
                    'Designers with authenticated collections, technical sketches, or garments approved by peer review.',
                  inline: false,
                },
                {
                  name: '✂️ Recognized Artisans',
                  value:
                    'Active contributors providing high-signal construction critiques, textile insights, and moodboard curation.',
                  inline: false,
                },
                {
                  name: '📊 Live Guild Leaderboard',
                  value: 'Type `/leaderboard` in <#' + channelMap['guild-commands'] + '> to inspect current community standings.',
                  inline: false,
                },
              ],
              footer: { text: 'Autonomous Meritocracy Protocol • Dawosti Guild' },
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });
      console.log('  ✓ Published Hall of Fame manifesto!');
      await sleep(1000);
    } else {
      console.log('\n🏆 #guild-hall-of-fame already initialized.');
    }
  }

  console.log('\n✨ Server Optimization Complete!');
}

main().catch(console.error);
