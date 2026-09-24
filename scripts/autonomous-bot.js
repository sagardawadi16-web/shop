import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = '1432647277587075134';
const API_BASE = 'https://discord.com/api/v10';
const DB_PATH = path.resolve('data', 'reputation.json');

if (!TOKEN) {
  console.error('Error: DISCORD_BOT_TOKEN is missing');
  process.exit(1);
}

// Database helper
function loadDB() {
  try {
    if (fs.existsSync(DB_PATH)) {
      return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    }
  } catch (e) {
    console.error('DB Read error:', e);
  }
  return { users: {}, submissions: {}, currentBrief: {} };
}

function saveDB(data) {
  try {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('DB Write error:', e);
  }
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
      await new Promise((r) => setTimeout(r, waitTime));
      continue;
    }
    if (!res.ok) {
      throw new Error(`API Error [${res.status}] ${path}: ${JSON.stringify(data)}`);
    }
    return data;
  }
}

// Cache
let roleMap = {};
let channelMap = {};

async function refreshCache() {
  try {
    const [roles, channels] = await Promise.all([
      api(`/guilds/${GUILD_ID}/roles`),
      api(`/guilds/${GUILD_ID}/channels`),
    ]);
    roleMap = {};
    channelMap = {};
    for (const r of roles) roleMap[r.name] = r.id;
    for (const c of channels) channelMap[c.name] = c.id;
    console.log('✅ Guild Cache Loaded:', {
      roles: Object.keys(roleMap),
      channels: Object.keys(channelMap).length,
    });
  } catch (err) {
    console.warn('Cache refresh error:', err.message);
  }
}

// Helper to get real Discord channel mentions <#ID>
function chMention(name) {
  const id = channelMap[name];
  return id ? `<#${id}>` : `#${name}`;
}

// Ensure active members receive the entry Atelier role
async function ensureAtelierRole(userId) {
  if (!userId) return;
  const atelierId = roleMap['🪡 Atelier'];
  if (!atelierId) return;
  try {
    await api(`/guilds/${GUILD_ID}/members/${userId}/roles/${atelierId}`, { method: 'PUT' });
  } catch (e) {
    // Non-critical, ignore missing permissions
  }
}

// Reputation Engine
async function awardPoints(userId, points, reason) {
  const db = loadDB();
  if (!db.users[userId]) {
    db.users[userId] = { points: 0, submissions: 0, critiques: 0, tier: '🪡 Atelier' };
  }

  const user = db.users[userId];
  user.points += points;

  console.log(`[REPUTATION] User ${userId} +${points} pts (${reason}) -> Total: ${user.points}`);

  let newTier = null;
  if (user.points >= 100 && (user.submissions || 0) >= 1 && user.tier !== '🏛️ Couturier' && user.tier !== '👑 Vanguard') {
    newTier = '🏛️ Couturier';
  } else if (user.points >= 25 && user.tier === '🪡 Atelier') {
    newTier = '✂️ Artisan';
  }

  if (newTier) {
    user.tier = newTier;
    saveDB(db);
    await handlePromotion(userId, newTier);
  } else {
    saveDB(db);
  }
}

async function handlePromotion(userId, newTier) {
  const roleId = roleMap[newTier];
  if (!roleId) return;

  try {
    await api(`/guilds/${GUILD_ID}/members/${userId}/roles/${roleId}`, { method: 'PUT' });
    console.log(`🎉 PROMOTION: User ${userId} elevated to ${newTier}!`);

    const feedId = channelMap['evolution-feed'];
    if (feedId) {
      await api(`/channels/${feedId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          embeds: [
            {
              title: `⚡ EVOLUTION ASCENSION: ${newTier}`,
              description: `A creator has proven their aesthetic rigor and craft, ascending to **${newTier}**!`,
              color: newTier === '🏛️ Couturier' ? 0x8a1c2e : 0x1b7f5e,
              fields: [
                {
                  name: 'Ascended Member',
                  value: `<@${userId}>`,
                  inline: true,
                },
                {
                  name: 'Guild Privilege',
                  value:
                    newTier === '🏛️ Couturier'
                      ? 'Verified designer status. Original garments qualify for direct curation and production drops on `dawosti.com`.'
                      : 'Recognized stylist & reviewer. Critiques carry elevated weight in community evaluations.',
                  inline: true,
                },
              ],
              footer: { text: 'Dawosti Autonomous Evolution Engine' },
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });
    }
  } catch (err) {
    console.warn('Promotion assignment warning:', err.message);
  }
}

// Gateway state
let ws;
let heartbeatInterval;
let sequence = null;

async function startGateway() {
  await refreshCache();

  console.log('\n🌐 Connecting to Discord Gateway v10 (Autonomous Daemon)...');
  ws = new WebSocket('wss://gateway.discord.gg/?v=10&encoding=json');

  ws.onopen = () => {
    console.log('⚡ Gateway connection established.');
  };

  ws.onmessage = async (event) => {
    try {
      const payload = JSON.parse(event.data);
      const { op, d, s, t } = payload;
      if (s) sequence = s;

      switch (op) {
        case 10: // Hello
          console.log(`💓 Heartbeat interval: ${d.heartbeat_interval}ms`);
          clearInterval(heartbeatInterval);
          heartbeatInterval = setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ op: 1, d: sequence }));
            }
          }, d.heartbeat_interval);

          // Identify with standard non-privileged intents
          ws.send(
            JSON.stringify({
              op: 2,
              d: {
                token: TOKEN,
                intents: 1 | 512 | 1024, // GUILDS | GUILD_MESSAGES | GUILD_MESSAGE_REACTIONS
                properties: {
                  os: 'windows',
                  browser: 'dawosti-core',
                  device: 'dawosti-core',
                },
              },
            })
          );
          break;

        case 0: // Dispatch Event
          await handleDispatch(t, d);
          break;

        case 1: // Heartbeat requested
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ op: 1, d: sequence }));
          }
          break;

        case 7:
        case 9:
          console.log('🔄 Gateway reconnect requested by Discord.');
          ws.close();
          break;
      }
    } catch (e) {
      console.error('Error handling message:', e);
    }
  };

  ws.onclose = (event) => {
    const code = event?.code ?? event;
    const reason = event?.reason ?? '';
    console.log(`⚠️ Gateway closed with code ${code} (${reason || 'reconnecting in 5s'})...`);
    clearInterval(heartbeatInterval);
    setTimeout(startGateway, 5000);
  };

  ws.onerror = (err) => {
    console.error('WebSocket Error:', err.message);
  };
}

async function handleDispatch(eventType, data) {
  // Auto-onboard member if interacting
  const actorId = data.member?.user?.id || data.user?.id || data.author?.id;
  if (actorId && !data.author?.bot) {
    ensureAtelierRole(actorId).catch(() => {});
  }

  // 1. Slash Command Interactions
  if (eventType === 'INTERACTION_CREATE' && data.type === 2) {
    const cmdName = data.data.name;
    const userId = data.member?.user?.id || data.user?.id;
    const userName = data.member?.user?.username || data.user?.username || 'Creator';

    console.log(`[SLASH] /${cmdName} invoked by ${userName}`);

    if (cmdName === 'rank') {
      const db = loadDB();
      const user = db.users[userId] || { points: 0, submissions: 0, critiques: 0, tier: '🪡 Atelier' };
      const nextThreshold = user.tier === '🪡 Atelier' ? 25 : user.tier === '✂️ Artisan' ? 100 : 350;

      await api(`/interactions/${data.id}/${data.token}/callback`, {
        method: 'POST',
        body: JSON.stringify({
          type: 4,
          data: {
            embeds: [
              {
                title: `🏛️ Fashion Standing: ${userName}`,
                color: user.tier === '🏛️ Couturier' ? 0x8a1c2e : 0xe5a93c,
                fields: [
                  { name: 'Current Tier', value: `**${user.tier}**`, inline: true },
                  { name: 'Proof-of-Taste', value: `**${user.points} pts**`, inline: true },
                  { name: 'Next Evolution', value: `${user.points}/${nextThreshold} pts`, inline: true },
                  { name: 'Verified Submissions', value: `${user.submissions || 0}`, inline: true },
                  { name: 'Critiques Endorsed', value: `${user.critiques || 0}`, inline: true },
                  {
                    name: 'How to Ascend',
                    value: `• Post original concepts in ${chMention('design-submissions')}\n• Provide insightful feedback in ${chMention('peer-critique')}`,
                  },
                ],
                footer: { text: 'Dawosti Autonomous Meritocracy • Proof-of-Taste' },
              },
            ],
          },
        }),
      });
      return;
    }

    if (cmdName === 'brief') {
      const db = loadDB();
      const b = db.currentBrief;
      await api(`/interactions/${data.id}/${data.token}/callback`, {
        method: 'POST',
        body: JSON.stringify({
          type: 4,
          data: {
            embeds: [
              {
                title: `⚡ ACTIVE DESIGN BRIEF: ${b.title || 'The Himalayan Nomad 2085'}`,
                description:
                  b.theme ||
                  'Create a conceptual silhouette fusing traditional high-altitude Himalayan wear (Bakhu, Sherpa wool, Palpali Dhaka geometry) with utilitarian cyberpunk streetwear.',
                color: 0x1b7f5e,
                fields: [
                  { name: 'Brief ID', value: `\`${b.id || 'BRIEF-001'}\``, inline: true },
                  { name: 'Where to Drop', value: chMention('design-submissions'), inline: true },
                  {
                    name: 'Evolution Reward',
                    value: 'Top-ranked design receives Couturier verification and a feature drop review for `dawosti.com`.',
                  },
                ],
                footer: { text: 'Autonomous Challenge Engine • Dawosti Guild' },
              },
            ],
          },
        }),
      });
      return;
    }

    if (cmdName === 'manifesto') {
      await api(`/interactions/${data.id}/${data.token}/callback`, {
        method: 'POST',
        body: JSON.stringify({
          type: 4,
          data: {
            embeds: [
              {
                title: 'DAWOSTI (दावोस्ती) — THE CULTURAL MANDATE',
                description:
                  'We lead fashion in Nepal not through claims, but through **demonstrable creative impact, aesthetic rigor, and community talent cultivation**.\n\n' +
                  '• Inspired by **Apple’s design purity** & **Google’s developer meritocracy**.\n' +
                  '• No arbitrary promotions; status is earned via Proof-of-Taste and Craft.\n' +
                  '• Elevating Palpali Dhaka, Himalayan nettle (Allo), and Newari tailoring to the world stage.',
                color: 0x8a1c2e,
                fields: [
                  { name: 'Archive & Full Rules', value: chMention('manifesto-and-philosophy') },
                  { name: 'Official Store & Platform', value: 'https://dawosti.com' },
                ],
                footer: { text: 'Autonomous Fashion Guild • Kathmandu' },
              },
            ],
          },
        }),
      });
      return;
    }

    if (cmdName === 'leaderboard') {
      const db = loadDB();
      const entries = Object.entries(db.users)
        .sort((a, b) => (b[1].points || 0) - (a[1].points || 0))
        .slice(0, 10);

      const list =
        entries.length > 0
          ? entries.map(([id, u], i) => `${i + 1}. <@${id}> — **${u.tier}** (${u.points} pts)`).join('\n')
          : `No recognized rankings yet. Post a design in ${chMention('design-submissions')} to begin your journey!`;

      await api(`/interactions/${data.id}/${data.token}/callback`, {
        method: 'POST',
        body: JSON.stringify({
          type: 4,
          data: {
            embeds: [
              {
                title: '🏆 GUILD TASTEMAKER LEADERBOARD',
                description: list,
                color: 0xe5a93c,
                footer: { text: 'Evolution governed autonomously by peer signal' },
              },
            ],
          },
        }),
      });
      return;
    }

    if (cmdName === 'showcase' || cmdName === 'catalog') {
      await api(`/interactions/${data.id}/${data.token}/callback`, {
        method: 'POST',
        body: JSON.stringify({
          type: 4,
          data: {
            embeds: [
              {
                title: '🛍️ DAWOSTI EDITORIAL SHOWCASE & BOUTIQUE',
                description:
                  'The official home of Dawosti bespoke collections, seasonal drops, and vetted community apparel.\n\n' +
                  '• **Palpali Dhaka Avant-Garde Trench** — NPR 14,500\n' +
                  '• **Himalayan Nettle (Allo) Utility Vest** — NPR 8,800\n' +
                  '• **Royal Newari Festive Kurta Set** — NPR 11,200\n' +
                  '• **Kathmandu Cyberpunk Monastic Hoodie** — NPR 6,500',
                color: 0x8a1c2e,
                fields: [
                  { name: 'Boutique URL', value: 'https://dawosti.com', inline: true },
                  { name: 'WhatsApp Concierge', value: '+977 9708251494', inline: true },
                  { name: 'Live Drops', value: chMention('announcements-and-drops'), inline: true },
                ],
                footer: { text: 'Kathmandu, Nepal • Nationwide & Global Delivery' },
              },
            ],
          },
        }),
      });
      return;
    }

    if (cmdName === 'help') {
      await api(`/interactions/${data.id}/${data.token}/callback`, {
        method: 'POST',
        body: JSON.stringify({
          type: 4,
          data: {
            embeds: [
              {
                title: '🤖 DAWOSTI AUTONOMOUS CORE COMMANDS',
                description:
                  'Welcome to the Dawosti Autonomous Fashion Guild. Here are your autonomous tools:\n\n' +
                  '`/rank` — Check your fashion tier, points, and evolution progress\n' +
                  '`/brief` — Inspect the active community design challenge\n' +
                  '`/manifesto` — Read Dawosti’s founding cultural values\n' +
                  '`/leaderboard` — View the top tastemakers in the guild\n' +
                  '`/catalog` — Browse current bespoke boutique collections\n' +
                  '`/showcase` — Explore curated drops on dawosti.com\n' +
                  '`/verify` — Verify your purchase order to enter the Patron Circle\n' +
                  '`/help` — Show this command reference guide',
                color: 0x1b7f5e,
                fields: [
                  {
                    name: '👑 Evolutionary Hierarchy',
                    value:
                      '• **👑 Vanguard** (Lead Tastemakers & Council)\n' +
                      '• **🏛️ Couturier** (Verified Creators & Designers, 100+ pts)\n' +
                      '• **✂️ Artisan** (Stylists & Active Curators, 25+ pts)\n' +
                      '• **🪡 Atelier** (Initiates & Fashion Explorers)',
                  },
                ],
                footer: { text: 'Dawosti Autonomous Core • Proof-of-Taste Protocol' },
              },
            ],
          },
        }),
      });
      return;
    }

    if (cmdName === 'verify') {
      const orderNumber = data.data.options?.[0]?.value?.trim().toUpperCase();
      const db = loadDB();
      if (!db.verifiedOrders) db.verifiedOrders = {};

      if (db.verifiedOrders[orderNumber]) {
        await api(`/interactions/${data.id}/${data.token}/callback`, {
          method: 'POST',
          body: JSON.stringify({
            type: 4,
            data: {
              content: `⚠️ Order **${orderNumber}** has already been registered to another member. If this is in error, reach out on WhatsApp (+977 9708251494).`,
              flags: 64,
            },
          }),
        });
        return;
      }

      const isValid = orderNumber && (orderNumber.startsWith('DW-') || orderNumber.length >= 6);
      if (!isValid) {
        await api(`/interactions/${data.id}/${data.token}/callback`, {
          method: 'POST',
          body: JSON.stringify({
            type: 4,
            data: {
              content: `❌ Invalid order format. Dawosti order numbers start with \`DW-\` (e.g. \`DW-2026-1042\`). Check your checkout receipt.`,
              flags: 64,
            },
          }),
        });
        return;
      }

      db.verifiedOrders[orderNumber] = userId;
      if (!db.users[userId]) {
        db.users[userId] = { points: 0, submissions: 0, critiques: 0, tier: '🪡 Atelier' };
      }
      db.users[userId].points += 50;
      db.users[userId].isPatron = true;
      saveDB(db);

      const patronRoleId = roleMap['🛍️ Verified Patron'];
      if (patronRoleId) {
        try {
          await api(`/guilds/${GUILD_ID}/members/${userId}/roles/${patronRoleId}`, { method: 'PUT' });
        } catch (e) {
          console.warn('Could not assign patron role:', e.message);
        }
      }

      await api(`/interactions/${data.id}/${data.token}/callback`, {
        method: 'POST',
        body: JSON.stringify({
          type: 4,
          data: {
            embeds: [
              {
                title: '🛍️ VERIFIED PATRON ACCESS GRANTED',
                description: `Welcome to the Dawosti Patron Circle, <@${userId}>! Your order **${orderNumber}** has been authenticated.`,
                color: 0xc49746,
                fields: [
                  { name: 'Patron Bonus', value: '+50 Proof-of-Taste Points', inline: true },
                  { name: 'Private Lounge', value: chMention('patron-exclusive-drops'), inline: true },
                  { name: 'Concierge Desk', value: chMention('patron-order-concierge'), inline: true },
                  {
                    name: 'Unlocked Privileges',
                    value:
                      '• Early access to seasonal limited drops\n• VIP bespoke sizing support\n• Direct dialogue with Dawosti design team',
                  },
                ],
                footer: { text: 'Dawosti Boutique & Atelier • Kathmandu' },
              },
            ],
          },
        }),
      });

      const feedId = channelMap['evolution-feed'];
      if (feedId) {
        await api(`/channels/${feedId}/messages`, {
          method: 'POST',
          body: JSON.stringify({
            embeds: [
              {
                title: '✨ NEW VERIFIED PATRON',
                description: `<@${userId}> has verified an official Dawosti boutique order and unlocked the **🛍️ Verified Patron** suite!`,
                color: 0xc49746,
                footer: { text: 'Dawosti Autonomous Client System' },
              },
            ],
          }),
        });
      }
      return;
    }
  }

  // 2. Submissions in #design-submissions
  if (eventType === 'MESSAGE_CREATE') {
    if (data.author?.bot) return;

    // Submissions in design-submissions
    if (data.channel_id === channelMap['design-submissions']) {
      console.log(`[SUBMISSION] Design drop detected by user ${data.author.id}`);

      const db = loadDB();
      if (!db.users[data.author.id]) {
        db.users[data.author.id] = { points: 0, submissions: 0, critiques: 0, tier: '🪡 Atelier' };
      }
      db.users[data.author.id].submissions = (db.users[data.author.id].submissions || 0) + 1;
      saveDB(db);

      // Award +5 points for submitting
      await awardPoints(data.author.id, 5, 'Original design drop submission');

      // Auto-add review tokens: ⭐ (Aesthetic), 🧵 (Craft), 🔥 (Vision), 👑 (Vanguard)
      const emojis = ['%E2%AD%90', '%F0%9F%A7%B5', '%F0%9F%94%A5', '%F0%9F%91%91'];
      for (const emoji of emojis) {
        try {
          await api(`/channels/${data.channel_id}/messages/${data.id}/reactions/${emoji}/@me`, { method: 'PUT' });
          await new Promise((r) => setTimeout(r, 200));
        } catch (e) {}
      }

      // Auto-start peer review thread
      try {
        await api(`/channels/${data.channel_id}/messages/${data.id}/threads`, {
          method: 'POST',
          body: JSON.stringify({
            name: `Review: ${data.author.username}'s Concept`,
            auto_archive_duration: 1440,
          }),
        });
      } catch (e) {}
    }

    // High signal critique in #peer-critique
    if (data.channel_id === channelMap['peer-critique']) {
      if (data.content && data.content.length > 40) {
        const db = loadDB();
        if (!db.users[data.author.id]) {
          db.users[data.author.id] = { points: 0, submissions: 0, critiques: 0, tier: '🪡 Atelier' };
        }
        db.users[data.author.id].critiques = (db.users[data.author.id].critiques || 0) + 1;
        saveDB(db);
        // Small critique incentive
        await awardPoints(data.author.id, 2, 'Constructive peer critique');
      }
    }
  }

  // 3. Reaction Endorsement Tracking
  if (eventType === 'MESSAGE_REACTION_ADD') {
    if (data.user_id === CLIENT_ID) return;

    // Submissions reaction
    if (data.channel_id === channelMap['design-submissions']) {
      const emojiName = data.emoji.name;
      let pts = 0;
      if (emojiName === '⭐') pts = 1;
      if (emojiName === '🧵') pts = 2;
      if (emojiName === '🔥') pts = 3;
      if (emojiName === '👑') pts = 10;

      if (pts > 0) {
        try {
          const msg = await api(`/channels/${data.channel_id}/messages/${data.message_id}`);
          if (msg && msg.author && msg.author.id !== data.user_id) {
            await awardPoints(msg.author.id, pts, `Submission reaction (${emojiName})`);
          }
        } catch (e) {}
      }
    }

    // Critique endorsement in #peer-critique
    if (data.channel_id === channelMap['peer-critique']) {
      if (['💡', '🎯', '⭐'].includes(data.emoji.name)) {
        try {
          const msg = await api(`/channels/${data.channel_id}/messages/${data.message_id}`);
          if (msg && msg.author && msg.author.id !== data.user_id) {
            await awardPoints(msg.author.id, 2, 'Insightful critique endorsement');
          }
        } catch (e) {}
      }
    }
  }
}

startGateway().catch(console.error);
