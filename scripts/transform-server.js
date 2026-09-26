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
      console.log(`  ⏳ Discord Rate Limited. Auto-waiting ${(waitTime / 1000).toFixed(1)}s before retry...`);
      await sleep(waitTime);
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
  console.log('⚡ Starting Complete Transformation for Dawosti Fashion Guild...');

  // 1. Rename and Brand the Server
  console.log('\n🏷️ Updating Guild Details...');
  try {
    await api(`/guilds/${GUILD_ID}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: 'DAWOSTI | Fashion Guild',
        description: 'The premier ecosystem for Nepalese high fashion, avant-garde design, and creative meritocracy.',
      }),
    });
    console.log('✅ Server renamed to "DAWOSTI | Fashion Guild"');
  } catch (err) {
    console.warn('⚠️ Could not update guild settings (may require specific ownership permissions):', err.message);
  }

  // 2. Provision Roles
  console.log('\n👑 Provisioning Evolutionary Role Hierarchy...');
  const currentRoles = await api(`/guilds/${GUILD_ID}/roles`);

  // Desired roles
  const desiredRoles = [
    { name: '👑 Vanguard', color: 0xe5a93c, hoist: true, mentionable: true },
    { name: '🏛️ Couturier', color: 0x8a1c2e, hoist: true, mentionable: true },
    { name: '✂️ Artisan', color: 0x1b7f5e, hoist: true, mentionable: true },
    { name: '🪡 Atelier', color: 0xd4c5b9, hoist: true, mentionable: true },
  ];

  const roleMap = {};
  for (const roleDef of desiredRoles) {
    let existing = currentRoles.find((r) => r.name === roleDef.name);
    if (!existing) {
      console.log(`  + Creating role: ${roleDef.name}`);
      existing = await api(`/guilds/${GUILD_ID}/roles`, {
        method: 'POST',
        body: JSON.stringify(roleDef),
      });
      await sleep(600);
    } else {
      console.log(`  ✓ Role already present: ${roleDef.name}`);
    }
    roleMap[roleDef.name] = existing.id;
  }

  // Clean obsolete subscription/school roles
  const obsoleteRoleNames = [
    'Basic subscription',
    'Intermediate subscription',
    'Advance subscription',
    '==========Students==========',
    '==========Staff==========',
    'Teacher',
    'Punishment (muted)',
  ];
  for (const r of currentRoles) {
    if (obsoleteRoleNames.includes(r.name) && !r.managed) {
      try {
        console.log(`  - Removing obsolete role: ${r.name}`);
        await api(`/guilds/${GUILD_ID}/roles/${r.id}`, { method: 'DELETE' });
        await sleep(500);
      } catch (e) {
        console.log(`    (Skipped role ${r.name}: ${e.message})`);
      }
    }
  }

  // 3. Rebuild Channels & Categories
  console.log('\n🏛️ Rebuilding Channel Architecture...');
  const currentChannels = await api(`/guilds/${GUILD_ID}/channels`);

  // Target Architecture
  const targetLayout = [
    {
      name: '📜 ── DAWOSTI ARCHIVE ──',
      type: 4,
      channels: [
        { name: 'manifesto-and-philosophy', type: 0, topic: 'The foundational ethos, evolutionary rules, and design standard of Dawosti.' },
        { name: 'announcements-and-drops', type: 0, topic: 'Official Dawosti collection drops, events, and website showcases.' },
        { name: 'guild-hall-of-fame', type: 0, topic: 'Honoring top Nepalese creators, vanguard tastemakers, and highlighted work.' },
      ],
    },
    {
      name: '🏛️ ── ATELIER (CRAFT & CRITIQUE) ──',
      type: 4,
      channels: [
        { name: 'design-submissions', type: 0, topic: 'Submit sketches, garments, digital 3D fashion, and lookbooks for peer appraisal.' },
        { name: 'peer-critique', type: 0, topic: 'Deep technical critique on silhouette, stitch, drape, proportion, and story.' },
        { name: 'heritage-and-textile', type: 0, topic: 'Nepali Dhaka, Himalayan nettle (Allo), Newari traditional tailoring, ethical sourcing.' },
        { name: 'fabrication-and-sourcing', type: 0, topic: 'Pattern drafting, local Kathmandu sample makers, trims, and manufacturing.' },
      ],
    },
    {
      name: '👁️ ── THE SALON (AESTHETICS & CULTURE) ──',
      type: 4,
      channels: [
        { name: 'streetwear-and-avant-garde', type: 0, topic: 'Kathmandu street culture, cyber-ethnic aesthetic, youth subcultures.' },
        { name: 'runway-and-editorial', type: 0, topic: 'Dissecting haute couture, runway shows, and global fashion movements.' },
        { name: 'curated-moodboards', type: 0, topic: 'Color palettes, moodboards, editorial photography, and lighting references.' },
        { name: 'general-salon', type: 0, topic: 'Open dialogue, style inquiries, and cultural exchange.' },
      ],
    },
    {
      name: '⚡ ── GUILD CORE ──',
      type: 4,
      channels: [
        { name: 'design-briefs', type: 0, topic: 'Weekly design prompts and community design challenges.' },
        { name: 'evolution-feed', type: 0, topic: 'Guild logs of member promotions, prestige milestones, and spotlight drops.' },
        { name: 'guild-commands', type: 0, topic: 'Bot commands: check taste rank, submit portfolio, explore briefs.' },
      ],
    },
    {
      name: '👑 ── VANGUARD COUNCIL ──',
      type: 4,
      channels: [
        {
          name: 'council-deliberation',
          type: 0,
          topic: 'High council chamber for curators deciding on dawosti.com showcase selection.',
          permission_overwrites: [
            { id: GUILD_ID, type: 0, deny: '1024' }, // Deny ViewChannel for @everyone
            { id: roleMap['👑 Vanguard'], type: 0, allow: '3072' }, // Allow View & Send for Vanguard
          ],
        },
      ],
    },
  ];

  // List of old channel names to wipe out cleanly
  const obsoleteChannelPatterns = [
    'classroom',
    'Schooling',
    'task-information',
    'share-projectpics',
    'self-introductions',
    'online-class-on-schedule',
    'Live Class',
    'Hallway',
    'Staff Only',
    'teacher-room',
    'teacher-lounge',
    'staff-room',
    'staff-lounge',
    '🤖Bots🤖',
    'botname-channel',
    'botname-voice',
    'welcome-mates',
    'rules',
    'announcements',
    'schedule',
    'upgrading-subscription',
    'INFORMATION',
  ];

  console.log('\n🧹 Clearing obsolete classroom and bot-template channels...');
  for (const ch of currentChannels) {
    const isTarget = targetLayout.some(
      (cat) => cat.name === ch.name || cat.channels.some((c) => c.name === ch.name)
    );
    if (isTarget) continue;

    const isObsolete = obsoleteChannelPatterns.some(
      (pat) => ch.name.toLowerCase().includes(pat.toLowerCase())
    );
    if (isObsolete) {
      try {
        console.log(`  - Deleting legacy channel: ${ch.name}`);
        await api(`/channels/${ch.id}`, { method: 'DELETE' });
        await sleep(800);
      } catch (e) {
        console.warn(`    Failed to delete ${ch.name}: ${e.message}`);
      }
    }
  }

  // Provision new category and channel layout
  const createdChannelMap = {};
  for (const cat of targetLayout) {
    console.log(`\n📂 Setting up Category: ${cat.name}`);
    let catChannel = (await api(`/guilds/${GUILD_ID}/channels`)).find(
      (c) => c.name === cat.name && c.type === 4
    );

    if (!catChannel) {
      catChannel = await api(`/guilds/${GUILD_ID}/channels`, {
        method: 'POST',
        body: JSON.stringify({ name: cat.name, type: 4 }),
      });
      await sleep(1500);
    }

    for (const ch of cat.channels) {
      const allCurrent = await api(`/guilds/${GUILD_ID}/channels`);
      let channel = allCurrent.find((c) => c.name === ch.name && c.parent_id === catChannel.id);
      if (!channel) {
        console.log(`  + Creating channel: #${ch.name}`);
        const body = {
          name: ch.name,
          type: ch.type,
          parent_id: catChannel.id,
          topic: ch.topic,
        };
        if (ch.permission_overwrites) {
          body.permission_overwrites = ch.permission_overwrites;
        }
        channel = await api(`/guilds/${GUILD_ID}/channels`, {
          method: 'POST',
          body: JSON.stringify(body),
        });
        await sleep(1500);
      } else {
        console.log(`  ✓ Channel #${ch.name} already exists.`);
      }
      createdChannelMap[ch.name] = channel.id;
    }
  }

  // 4. Publish Architectural Embeds
  console.log('\n📜 Publishing System Manifesto and Documentation...');

  // A. Manifesto in #manifesto-and-philosophy
  if (createdChannelMap['manifesto-and-philosophy']) {
    const cid = createdChannelMap['manifesto-and-philosophy'];
    const existing = await api(`/channels/${cid}/messages?limit=1`);
    if (existing.length === 0) {
      await api(`/channels/${cid}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          embeds: [
            {
              title: 'DAWOSTI (दावोस्ती) — THE FASHION GUILD',
              description:
                '**Fashion is not marketing; it is cultural architecture.**\n\n' +
                'Dawosti was founded on an uncompromising principle: Nepal holds some of the deepest textile traditions and most visionary young aesthetic minds in South Asia, yet the industry has been suffocated by dropshipping, derivative Western copies, and fast-fashion mediocrity.\n\n' +
                'We operate on the ethos of **developer meritocracy** (where builders rise by their verifiable work) and **design purity** (where taste and craftsmanship are non-negotiable). Here, status is earned through Proof-of-Taste and Proof-of-Craft.',
              color: 0x8a1c2e, // Velvet Burgundy
              fields: [
                {
                  name: '👑 THE NATURAL EVOLUTION HIERARCHY',
                  value:
                    '• **👑 Vanguard (Council of Taste)**: The arbiters of direction. Mentors and lead designers who decide which pieces get produced and featured on `dawosti.com`.\n' +
                    '• **🏛️ Couturier (Verified Creators)**: Designers, pattern drafters, and 3D garment artists with verified collections.\n' +
                    '• **✂️ Artisan (Stylists & Curators)**: Consistent providers of master-level critique, moodboards, and garment deconstructions.\n' +
                    '• **🪡 Atelier (Initiates)**: Every new member enters here. Observe, critique, learn, and prepare your portfolio.',
                },
                {
                  name: '🧬 HOW YOU EVOLVE (PROOF-OF-TASTE & CRAFT)',
                  value:
                    '1. **High-Signal Critique**: Giving deep feedback on fit, drape, and concept earns endorsements.\n' +
                    '2. **Design Submissions**: Drop sketches, prototypes, or rendered garments in <#design-submissions>.\n' +
                    '3. **Community Endorsements**: Reactions from higher-tier members carry exponential weight. The bot calculates your taste score in real-time.\n' +
                    '4. **Zero Spam Tolerance**: Chat spam earns 0 points. Value comes solely from constructive contribution.',
                },
                {
                  name: '🇳🇵 THE NEPALESE HERITAGE MANDATE',
                  value:
                    'Palpali Dhaka, Himalayan stinging nettle (Allo), raw silk, and Newari tailoring are not museum pieces. They are the avant-garde materials of tomorrow. Dawosti bridges our heritage with futuristic streetwear and international silhouettes.',
                },
              ],
              footer: {
                text: 'Dawosti Fashion Guild • dawosti.com • Established Kathmandu',
              },
            },
          ],
        }),
      });
      console.log('  ✅ Published Manifesto embed.');
      await sleep(600);
    }
  }

  // B. Submission Protocol in #design-submissions
  if (createdChannelMap['design-submissions']) {
    const cid = createdChannelMap['design-submissions'];
    const existing = await api(`/channels/${cid}/messages?limit=1`);
    if (existing.length === 0) {
      await api(`/channels/${cid}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          embeds: [
            {
              title: '📐 THE CRAFT SUBMISSION PROTOCOL',
              description:
                'This channel is the proving ground. Submissions here are reviewed by the guild engine and evaluated by the Vanguard and Couturier tiers.',
              color: 0xe5a93c, // Gold
              fields: [
                {
                  name: 'What Can Be Submitted',
                  value:
                    '• Original Fashion Sketches & Tech Packs\n' +
                    '• Physical Garments (Photos of fit, stitching, drape, fabric)\n' +
                    '• Digital 3D Fashion (CLO 3D, Marvelous Designer, Blender)\n' +
                    '• Editorial Lookbooks & High-Concept Styling Shoots',
                },
                {
                  name: 'Formatting Your Submission',
                  value:
                    '1. **Title & Concept**: The story or silhouette philosophy.\n' +
                    '2. **Textile / Material Spec**: e.g., Handloomed Dhaka, 400GSM french terry, raw linen.\n' +
                    '3. **Visual Attachments**: Clear, high-res renders or photos.\n' +
                    '4. **Feedback Requested**: Specific points you want peer critique on.',
                },
                {
                  name: 'Automated Scoring & dawosti.com Pipeline',
                  value:
                    'The bot automatically attaches reaction tokens (⭐ Quality, 🧵 Technique, 🔥 Vision, 👑 Vanguard Approval). Designs that reach the threshold are reviewed for official Dawosti production and website drops.',
                },
              ],
            },
          ],
        }),
      });
      console.log('  ✅ Published Submission Protocol embed.');
      await sleep(600);
    }
  }

  // C. Design Brief #001 in #design-briefs
  if (createdChannelMap['design-briefs']) {
    const cid = createdChannelMap['design-briefs'];
    const existing = await api(`/channels/${cid}/messages?limit=1`);
    if (existing.length === 0) {
      await api(`/channels/${cid}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          embeds: [
            {
              title: '⚡ DESIGN BRIEF #001: "THE HIMALAYAN NOMAD 2085"',
              description:
                'The guild engine has generated the inaugural design challenge for the Dawosti community.',
              color: 0x1b7f5e, // Emerald
              fields: [
                {
                  name: 'The Brief',
                  value:
                    'Create a conceptual silhouette fusing traditional high-altitude Himalayan wear (e.g., Bakhu, Sherpa wool linings, Palpali Dhaka geometry) with utilitarian cyberpunk outerwear (modular pockets, weather-sealed taping, magnetic closures).',
                },
                {
                  name: 'Submission Target',
                  value: 'Post your work in <#design-submissions> tagged with `[BRIEF-001]`.',
                },
                {
                  name: 'Evaluation Window',
                  value: 'Open for 14 days. Top-ranked design receives Couturier verification and a direct feature spotlight.',
                },
              ],
            },
          ],
        }),
      });
      console.log('  ✅ Published Design Brief #001 embed.');
      await sleep(600);
    }
  }

  // D. Bot Commands in #guild-commands
  if (createdChannelMap['guild-commands']) {
    const cid = createdChannelMap['guild-commands'];
    const existing = await api(`/channels/${cid}/messages?limit=1`);
    if (existing.length === 0) {
      await api(`/channels/${cid}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          embeds: [
            {
              title: '🤖 DAWOSTI GUILD COMMANDS',
              description: 'Use the following commands to check your standing and interact with the guild engine:',
              color: 0xd4c5b9,
              fields: [
                { name: '!taste or !rank', value: 'Displays your current role, Proof-of-Taste score, and evolution progress.' },
                { name: '!brief', value: 'Fetches the currently active fashion design brief.' },
                { name: '!manifesto', value: 'Re-sends the Dawosti philosophy and guild principles.' },
                { name: '!vanguard', value: 'Displays the active members of the Vanguard Council.' },
              ],
            },
          ],
        }),
      });
      console.log('  ✅ Published Bot Commands embed.');
      await sleep(600);
    }
  }

  // 5. Auto-assign Atelier Role to existing members
  console.log('\n👥 Auto-initiating server members into 🪡 Atelier...');
  try {
    const members = await api(`/guilds/${GUILD_ID}/members?limit=100`);
    const atelierRoleId = roleMap['🪡 Atelier'];
    for (const m of members) {
      if (m.user.bot) continue;
      if (!m.roles.includes(atelierRoleId)) {
        console.log(`  + Assigning Atelier to ${m.user.username}...`);
        await api(`/guilds/${GUILD_ID}/members/${m.user.id}/roles/${atelierRoleId}`, {
          method: 'PUT',
        });
        await sleep(400);
      } else {
        console.log(`  ✓ ${m.user.username} already has Atelier role.`);
      }
    }
  } catch (err) {
    console.warn('⚠️ Member role assignment warning:', err.message);
  }

  console.log('\n✨✨ Server transformation completed successfully! ✨✨');
}

main().catch((err) => {
  console.error('\n❌ Fatal transformation error:', err);
  process.exit(1);
});
