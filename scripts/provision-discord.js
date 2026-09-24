import 'dotenv/config';

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const API_BASE = 'https://discord.com/api/v10';

if (!TOKEN) {
  console.error('Error: DISCORD_BOT_TOKEN is not set in .env');
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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log('🔮 Connecting to Discord API as Dawosti Autonomous Core...');
  const me = await api('/users/@me');
  console.log(`✅ Authenticated as: ${me.username}#${me.discriminator} (ID: ${me.id})`);

  const guilds = await api('/users/@me/guilds');
  if (guilds.length === 0) {
    console.log('\n⚠️  The bot is not yet inside any Discord server.');
    console.log('👉 Click this invite link to add the bot to your Dawosti server:');
    console.log(`https://discord.com/oauth2/authorize?client_id=${me.id}&permissions=8&scope=bot%20applications.commands\n`);
    return;
  }

  const guild = guilds[0];
  console.log(`\n⚡ Connected to Guild: "${guild.name}" (ID: ${guild.id})`);

  // 1. Manage Roles
  console.log('\n🎨 Provisioning Evolutionary Roles...');
  const existingRoles = await api(`/guilds/${guild.id}/roles`);
  const targetRoles = [
    { name: '👑 Vanguard', color: 0xe5a93c, hoist: true, mentionable: true },
    { name: '🏛️ Couturier', color: 0x8a1c2e, hoist: true, mentionable: true },
    { name: '✂️ Artisan', color: 0x1b7f5e, hoist: true, mentionable: true },
    { name: '🪡 Atelier', color: 0xd4c5b9, hoist: true, mentionable: false },
  ];

  const roleMap = {};
  for (const roleDef of targetRoles) {
    const existing = existingRoles.find((r) => r.name === roleDef.name);
    if (existing) {
      console.log(`  ✓ Role "${roleDef.name}" already exists.`);
      roleMap[roleDef.name] = existing.id;
    } else {
      console.log(`  + Creating role "${roleDef.name}"...`);
      const created = await api(`/guilds/${guild.id}/roles`, {
        method: 'POST',
        body: JSON.stringify(roleDef),
      });
      roleMap[roleDef.name] = created.id;
      await sleep(500);
    }
  }

  // 2. Manage Categories and Channels
  console.log('\n🏛️ Provisioning Server Architecture (Categories & Channels)...');
  const existingChannels = await api(`/guilds/${guild.id}/channels`);

  const structure = [
    {
      name: '📜 ── DAWOSTI ARCHIVE ──',
      type: 4, // GUILD_CATEGORY
      channels: [
        { name: 'manifesto-and-rules', type: 0, topic: 'The foundational philosophy, standards, and evolutionary rules of Dawosti.' },
        { name: 'announcements-drops', type: 0, topic: 'Official drops, editorial showcases, and Dawosti alerts.' },
        { name: 'guild-roster', type: 0, topic: 'Live honor roll of verified Couturiers, Artisans, and Vanguards.' },
      ],
    },
    {
      name: '🏛️ ── ATELIER (CRAFT & CRITIQUE) ──',
      type: 4,
      channels: [
        { name: 'design-submissions', type: 0, topic: 'Submit sketches, garments, 3D renders & lookbooks for peer appraisal.' },
        { name: 'peer-critique', type: 0, topic: 'Constructive technical feedback on silhouettes, textures, stitching, and concept.' },
        { name: 'heritage-and-textile', type: 0, topic: 'Nepali Dhaka, Himalayan hemp, sustainable dyes, Newari tailoring techniques.' },
      ],
    },
    {
      name: '👁️ ── THE SALON (AESTHETICS) ──',
      type: 4,
      channels: [
        { name: 'streetwear-avant-garde', type: 0, topic: 'Kathmandu street culture, modern cuts, youth subcultures.' },
        { name: 'runway-editorial', type: 0, topic: 'Dissecting haute couture, Milan/Paris/Tokyo collections, and global visual language.' },
        { name: 'curated-moodboards', type: 0, topic: 'Visual palettes, texture inspiration, photography, and lighting references.' },
      ],
    },
    {
      name: '⚡ ── AUTONOMOUS CORE ──',
      type: 4,
      channels: [
        { name: 'bot-commands', type: 0, topic: 'Check taste score, submit portfolio, and view active design briefs.' },
        { name: 'evolution-log', type: 0, topic: 'Autonomous audit log of member promotions and community design highlights.' },
      ],
    },
  ];

  let manifestoChannelId = null;

  for (const cat of structure) {
    let catChannel = existingChannels.find((c) => c.name === cat.name && c.type === 4);
    if (!catChannel) {
      console.log(`  + Creating category: "${cat.name}"`);
      catChannel = await api(`/guilds/${guild.id}/channels`, {
        method: 'POST',
        body: JSON.stringify({ name: cat.name, type: 4 }),
      });
      await sleep(600);
    } else {
      console.log(`  ✓ Category "${cat.name}" already exists.`);
    }

    for (const ch of cat.channels) {
      let channel = existingChannels.find((c) => c.name === ch.name && c.parent_id === catChannel.id);
      if (!channel) {
        console.log(`    + Creating channel: #${ch.name}`);
        channel = await api(`/guilds/${guild.id}/channels`, {
          method: 'POST',
          body: JSON.stringify({
            name: ch.name,
            type: ch.type,
            parent_id: catChannel.id,
            topic: ch.topic,
          }),
        });
        await sleep(600);
      } else {
        console.log(`    ✓ Channel #${ch.name} already exists.`);
      }

      if (ch.name === 'manifesto-and-rules') {
        manifestoChannelId = channel.id;
      }
    }
  }

  // 3. Post Dawosti Manifesto if not already posted
  if (manifestoChannelId) {
    const messages = await api(`/channels/${manifestoChannelId}/messages?limit=5`);
    if (messages.length === 0) {
      console.log('\n📜 Publishing Manifesto to #manifesto-and-rules...');
      await api(`/channels/${manifestoChannelId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          embeds: [
            {
              title: 'DAWOSTI (दावोस्ती) — THE AUTONOMOUS FASHION GUILD',
              description:
                'Welcome to Dawosti. We are not just a label; we are an institution for high fashion, craftsmanship, and creative sovereignty in Nepal.\n\n' +
                'Inspired by Apple’s obsessive design standards and Google’s meritocratic developer communities, Dawosti exists to elevate those who create, refine, and champion real aesthetic power.',
              color: 0x8a1c2e, // Velvet Burgundy
              fields: [
                {
                  name: '🧬 1. The Evolutionary Philosophy',
                  value:
                    'Hierarchy here is not awarded by favoritism, nor by spamming text. Your role evolves naturally through **Proof-of-Taste** (substantive critique, curation) and **Proof-of-Craft** (sketches, garments, physical collections).',
                },
                {
                  name: '👑 2. The Guild Hierarchy',
                  value:
                    '• **👑 Vanguard**: Revered arbiters of taste & council.\n' +
                    '• **🏛️ Couturier**: Verified designers, pattern-makers & physical garment creators.\n' +
                    '• **✂️ Artisan**: Insightful stylists, runway analysts & textile specialists.\n' +
                    '• **🪡 Atelier**: Aspiring creators, fashion enthusiasts & observers.',
                },
                {
                  name: '🇳🇵 3. The Nepalese Aesthetic Renaissance',
                  value:
                    'We bridge timeless Himalayan heritage (handwoven Dhaka, nettle, Newari tailoring, unrefined silks) with futuristic streetwear and international tailoring.',
                },
                {
                  name: '🌐 4. Direct Bridge to dawosti.com',
                  value:
                    'Standout creations submitted in `#design-submissions` that earn high council ratings are considered for real-world production, editorial spotlights, and direct placement on the Dawosti showcase.',
                },
              ],
              footer: {
                text: 'Dawosti Autonomous Core • Elevating Nepali Fashion to the World',
              },
            },
          ],
        }),
      });
      console.log('✅ Manifesto published successfully.');
    } else {
      console.log('\n✓ Manifesto channel already has messages.');
    }
  }

  console.log('\n🎉 Dawosti Discord Guild provisioned successfully!');
}

main().catch((err) => {
  console.error('\n❌ Error during setup:', err.message);
  process.exit(1);
});
