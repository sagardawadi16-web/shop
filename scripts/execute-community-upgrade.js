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
  console.log('⚡ Starting Community Execution & Channel Modernization...');

  // 1. Fetch current channels and categories
  const channels = await api(`/guilds/${GUILD_ID}/channels`);
  const channelMap = {};
  for (const c of channels) channelMap[c.name] = c;

  console.log(`Current channels count: ${channels.length}`);

  // 2. Remove obsolete channels if still present
  const obsoleteIds = ['1432647279000551456', '1432647279000551457'];
  for (const id of obsoleteIds) {
    const found = channels.find((c) => c.id === id);
    if (found) {
      try {
        console.log(`Deleting obsolete channel: ${found.name} (${id})`);
        await api(`/channels/${id}`, { method: 'DELETE' });
        await sleep(600);
      } catch (e) {
        console.log(`  Could not delete ${id}:`, e.message);
      }
    }
  }

  // 3. Find Category IDs
  const archiveCat = channels.find((c) => c.type === 4 && c.name.includes('DAWOSTI ARCHIVE'));
  const atelierCat = channels.find((c) => c.type === 4 && c.name.includes('ATELIER'));
  const salonCat = channels.find((c) => c.type === 4 && c.name.includes('THE SALON'));

  console.log('Category IDs:', {
    archive: archiveCat?.id,
    atelier: atelierCat?.id,
    salon: salonCat?.id,
  });

  // 4. Create #fit-checks-wdywt (The #1 engagement channel in fashion communities)
  let fitChecksCh = channels.find((c) => c.name === 'fit-checks-wdywt');
  if (!fitChecksCh) {
    console.log('\n📸 Creating #fit-checks-wdywt in THE SALON...');
    fitChecksCh = await api(`/guilds/${GUILD_ID}/channels`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'fit-checks-wdywt',
        type: 0, // GUILD_TEXT
        parent_id: salonCat?.id,
        topic: 'Daily outfit checks (WDYWT), thrift finds, street style around Kathmandu, and silhouette breakdowns. Earn +2 Proof-of-Taste points per fit!',
      }),
    });
    console.log(`  ✓ Created #fit-checks-wdywt (${fitChecksCh.id})`);
    await sleep(800);

    // Seed inaugural welcome embed
    await api(`/channels/${fitChecksCh.id}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        embeds: [
          {
            title: '🔥 FIT CHECKS & WDYWT (WHAT DID YOU WEAR TODAY)',
            description:
              'Welcome to Kathmandu’s daily runway. Whether you are stepping out in Patan, walking through Thamel, or lounging in vintage raw denim, drop your silhouette here.\n\n' +
              '**How to Participate:**\n' +
              '• 📸 Post a photo of your fit / shoes / accessories\n' +
              '• 🏷️ Optional: List the pieces / fabrics / thrift sources\n' +
              '• ⭐ React with `⭐`, `🧵`, or `🔥` to endorse fellow tastemakers\n\n' +
              '**Rewards:**\n' +
              '• Every quality fit check earns **+2 Proof-of-Taste points** towards Artisan tier!\n' +
              '• Top-rated fit every Friday gets featured on Dawosti’s official editorial channels.',
            color: 0xe5a93c,
            footer: { text: 'Dawosti Fashion Guild • Street & Runway Division' },
          },
        ],
      }),
    });
    console.log('  ✓ Seeded inaugural prompt in #fit-checks-wdywt');
    await sleep(800);
  } else {
    console.log('✓ #fit-checks-wdywt already exists.');
  }

  // 5. Create #introductions-and-vibe
  let introCh = channels.find((c) => c.name === 'introductions-and-vibe');
  if (!introCh) {
    console.log('\n👋 Creating #introductions-and-vibe in ARCHIVE...');
    introCh = await api(`/guilds/${GUILD_ID}/channels`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'introductions-and-vibe',
        type: 0,
        parent_id: archiveCat?.id,
        topic: 'Introduce yourself! Share your aesthetic influences, favorite fabrics/designers, and Instagram/portfolio links.',
      }),
    });
    console.log(`  ✓ Created #introductions-and-vibe (${introCh.id})`);
    await sleep(800);

    // Seed intro template
    await api(`/channels/${introCh.id}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        embeds: [
          {
            title: '✨ WELCOME TO THE DAWOSTI GUILD — INTRODUCTIONS',
            description:
              'We are cultivating Nepal’s foremost fashion and design collective. Break the ice and let us know your aesthetic vision!\n\n' +
              '**Introduction Template:**\n' +
              '• **Call me:** (Your name or alias)\n' +
              '• **Location:** (Kathmandu, Pokhara, Abroad, etc.)\n' +
              '• **Style Vibe / Aesthetic:** (e.g. Avant-Garde Minimalist, Monastic Cyberpunk, Vintage Dhaka, Workwear)\n' +
              '• **Role:** (Designer / Stylist / Pattern-maker / Shopper / Enthusiast)\n' +
              '• **Social / Portfolio:** (Instagram, Behance, or TikTok handle)\n\n' +
              'Posting your introduction gives you entry recognition as an **🪡 Atelier** member!',
            color: 0x1b7f5e,
            footer: { text: 'Dawosti Fashion Guild • Initiates Welcome' },
          },
        ],
      }),
    });
    console.log('  ✓ Seeded intro guide in #introductions-and-vibe');
    await sleep(800);
  } else {
    console.log('✓ #introductions-and-vibe already exists.');
  }

  // 6. Attempt Forum Channel Creation for #design-concepts (or test support)
  let forumCh = channels.find((c) => c.name === 'design-concepts' || c.name === 'design-showcase');
  if (!forumCh) {
    console.log('\n📌 Attempting to create Forum Channel #design-concepts...');
    try {
      forumCh = await api(`/guilds/${GUILD_ID}/channels`, {
        method: 'POST',
        body: JSON.stringify({
          name: 'design-concepts',
          type: 15, // GUILD_FORUM
          parent_id: atelierCat?.id,
          topic: 'Submit original sketches, silhouettes, 3D renders, and lookbooks. Voted designs enter physical sampling for dawosti.com drops.',
          available_tags: [
            { name: 'Palpali Dhaka', moderated: false, emoji_name: '🧵' },
            { name: 'Avant-Garde Streetwear', moderated: false, emoji_name: '🔥' },
            { name: 'Himalayan Nettle / Allo', moderated: false, emoji_name: '🌿' },
            { name: 'Monastic / Cyberpunk', moderated: false, emoji_name: '⚡' },
            { name: 'In Review / Sampling', moderated: true, emoji_name: '👑' },
          ],
        }),
      });
      console.log(`  ✓ Successfully created Forum Channel #design-concepts (${forumCh.id})!`);
      await sleep(800);
    } catch (err) {
      console.warn('  (Forum creation notice: Guild may need additional permission or fallback to text channel:', err.message);
    }
  } else {
    console.log('✓ Forum or showcase channel already exists.');
  }

  // 7. Post an Official Community Upgrade Bulletin in announcements-and-drops
  const dropsCh = channels.find((c) => c.name === 'announcements-and-drops');
  if (dropsCh) {
    console.log('\n📢 Publishing Community Evolution Bulletin in #announcements-and-drops...');
    await api(`/channels/${dropsCh.id}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        embeds: [
          {
            title: '🚀 GUILD EVOLUTION: SPRING/FESTIVE ARCHITECTURE UPGRADE',
            description:
              'The Dawosti Fashion Guild is expanding its infrastructure to bridge community creativity directly with **dawosti.com** manufacturing.\n\n' +
              '### What’s New:\n' +
              '• 📸 **New Hub: <#' + (fitChecksCh?.id || 'fit-checks-wdywt') + '>** — Share your daily fits and street style around Kathmandu. Low barrier, immediate peer feedback (+2 pts).\n' +
              '• 👋 **New Hub: <#' + (introCh?.id || 'introductions-and-vibe') + '>** — Introduce your aesthetic vibe and connect with fellow creators.\n' +
              '• ⚡ **Upcoming Brief 002: "Himalayan Monastic x Cyberpunk"** — Top community submission receives sample production and a 10% commercial royalty on `dawosti.com`.\n' +
              '• 🛍️ **Patron Suite** — Own a piece from Dawosti? Type `/verify <order_number>` in <#' + (channels.find(c=>c.name==='guild-commands')?.id || 'guild-commands') + '> to claim VIP early-access drops.',
            color: 0x8a1c2e,
            footer: { text: 'Dawosti • Kathmandu, Nepal • Meritocracy' },
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });
    console.log('  ✓ Published Guild Evolution Bulletin!');
  }

  console.log('\n✨ Execution Complete: Discord Guild modernized successfully!');
}

main().catch(console.error);
