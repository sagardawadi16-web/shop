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

// ─── Database & State Helper ────────────────────────────────────────────────
function loadDB() {
  try {
    if (fs.existsSync(DB_PATH)) {
      return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    }
  } catch (e) {
    console.error('DB Read error:', e);
  }
  return { users: {}, submissions: {}, approvedDesigns: {}, payoutRequests: {}, currentBrief: {} };
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

// ─── Guild Resource Cache ───────────────────────────────────────────────────
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
    console.log('✅ Guild Cache Synchronized:', {
      roles: Object.keys(roleMap),
      channels: Object.keys(channelMap).length,
    });
  } catch (err) {
    console.warn('Cache refresh warning:', err.message);
  }
}

function chMention(name) {
  const id = channelMap[name];
  return id ? `<#${id}>` : `#${name}`;
}

async function ensureAtelierRole(userId) {
  if (!userId) return;
  const atelierId = roleMap['🪡 Atelier'];
  if (!atelierId) return;
  try {
    await api(`/guilds/${GUILD_ID}/members/${userId}/roles/${atelierId}`, { method: 'PUT' });
  } catch {}
}

// ─── Reputation & Evolutionary Promotion Engine ─────────────────────────────
async function awardPoints(userId, points, reason) {
  const db = loadDB();
  if (!db.users[userId]) {
    db.users[userId] = { points: 0, submissions: 0, critiques: 0, tier: '🪡 Atelier' };
  }

  const user = db.users[userId];
  user.points = (user.points || 0) + points;

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
    console.log(`🎉 PROMOTION: User ${userId} ascended to ${newTier}!`);

    const feedId = channelMap['evolution-log'] || channelMap['evolution-feed'];
    if (feedId) {
      await api(`/channels/${feedId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          embeds: [
            {
              title: `⚡ EVOLUTION ASCENSION: ${newTier}`,
              description: `A fashion architect has proven their aesthetic rigor and craft, ascending to **${newTier}**!`,
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
                      ? 'Verified Designer status. Original garments qualify for physical sample tailoring and drops on `dawosti.com`.'
                      : 'Recognized Stylist & Curator. Critiques carry elevated weight in design appraisals.',
                  inline: true,
                },
              ],
              footer: { text: 'Dawosti Guild Engine • Proof-of-Taste' },
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

// ─── Weekly Challenge Pool (Simple, Inspiring Wording) ───────────────────────
const CURATED_BRIEFS = [
  {
    id: 'CHALLENGE-01',
    title: 'Himalayan Streetwear Hoodie or Jacket',
    theme: 'Design a modern streetwear hoodie or jacket combining traditional Palpali Dhaka patterns with comfortable black oversized styling.',
    bounty: 'NPR 5,000 Cash + Your design manufactured & sold on dawosti.com',
  },
  {
    id: 'CHALLENGE-02',
    title: 'Raw Nepali Nettle (Allo) Minimalist Coat',
    theme: 'Create a clean, minimalist coat or cloak using natural Himalayan nettle (Allo) fabric and silk, inspired by mountain monks and Kathmandu winters.',
    bounty: 'NPR 5,000 Cash + Featured in official Dawosti lookbook',
  },
  {
    id: 'CHALLENGE-03',
    title: 'Newari Crimson & Black Cargo Set',
    theme: 'Turn classic Newari Haku Patasi black-and-red border patterns into modern tailored cargo pants or cropped utility blazers.',
    bounty: 'NPR 5,000 Cash + 10% cash royalties on all sales',
  },
  {
    id: 'CHALLENGE-04',
    title: 'Modern Banarasi Silk Bomber Jacket',
    theme: 'Reinvent traditional wedding silk brocade into a luxury daily bomber jacket with gold details.',
    bounty: 'NPR 5,000 Cash + Sample tailored in Kathmandu atelier',
  },
];

function checkAndRotateBrief() {
  const db = loadDB();
  const current = db.currentBrief;
  const now = Date.now();

  const isExpired = !current || !current.expiresAt || new Date(current.expiresAt).getTime() < now;
  if (isExpired) {
    const nextIdx = Math.floor(Math.random() * CURATED_BRIEFS.length);
    const chosen = CURATED_BRIEFS[nextIdx];
    const expiresAt = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString();

    db.currentBrief = {
      ...chosen,
      startedAt: new Date(now).toISOString(),
      expiresAt,
    };
    saveDB(db);
    console.log(`⚡ [CHALLENGE ENGINE] New Weekly Brief activated: "${chosen.title}"`);
    return db.currentBrief;
  }
  return current;
}

// ─── Gateway Connection & Event Listener ────────────────────────────────────
let ws;
let heartbeatInterval;
let sequence = null;

async function startGateway() {
  await refreshCache();
  checkAndRotateBrief();

  console.log('\n🌐 Connecting to Discord Gateway v10 (Guild Business Daemon)...');
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

        case 1:
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
      console.error('Error handling event message:', e);
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

// ─── Dispatch Event Processor ───────────────────────────────────────────────
async function handleDispatch(eventType, data) {
  const actorId = data.member?.user?.id || data.user?.id || data.author?.id;
  if (actorId && !data.author?.bot) {
    ensureAtelierRole(actorId).catch(() => {});
  }

  // 1. Slash Command Interactions
  if (eventType === 'INTERACTION_CREATE' && data.type === 2) {
    const cmdName = data.data.name;
    const userId = data.member?.user?.id || data.user?.id;
    const userName = data.member?.user?.username || data.user?.username || 'Creator';

    console.log(`[SLASH] /${cmdName} executed by ${userName} (${userId})`);

    // ─── /rank ───────────────────────────────────────────────────────────────
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
                title: `⭐ Your Profile: ${userName}`,
                color: user.tier === '🏛️ Couturier' ? 0x8a1c2e : 0xe5a93c,
                fields: [
                  { name: 'Current Level', value: `**${user.tier}**`, inline: true },
                  { name: 'Points', value: `**${user.points} pts**`, inline: true },
                  { name: 'Next Level', value: `${user.points}/${nextThreshold} pts`, inline: true },
                  { name: 'Designs Shared', value: `${user.submissions || 0}`, inline: true },
                  { name: 'Helpful Reviews', value: `${user.critiques || 0}`, inline: true },
                  {
                    name: 'How to Level Up',
                    value: `• Post designs in ${chMention('design-submissions')} or use \`/submit-design\`\n• Share your fits in ${chMention('fit-checks-wdywt')}\n• Give helpful advice in ${chMention('peer-critique')}`,
                  },
                ],
                footer: { text: 'Dawosti Fashion Guild • Kathmandu' },
              },
            ],
          },
        }),
      });
      return;
    }

    // ─── /brief & /challenge ─────────────────────────────────────────────────
    if (cmdName === 'brief' || cmdName === 'challenge') {
      const brief = checkAndRotateBrief();
      await api(`/interactions/${data.id}/${data.token}/callback`, {
        method: 'POST',
        body: JSON.stringify({
          type: 4,
          data: {
            embeds: [
              {
                title: `⚡ THIS WEEK'S DESIGN CHALLENGE: ${brief.title}`,
                description: brief.theme,
                color: 0x1b7f5e,
                fields: [
                  { name: 'Challenge ID', value: `\`${brief.id}\``, inline: true },
                  { name: 'Cash Prize', value: `💰 **${brief.bounty || 'NPR 5,000'}**`, inline: true },
                  { name: 'How to Submit', value: 'Type `/submit-design`', inline: true },
                  { name: 'Channel', value: chMention('design-submissions'), inline: true },
                  {
                    name: 'How Winners are Chosen',
                    value: 'Designs getting 3+ 👑 votes get manufactured and sold on `dawosti.com` with a **10% cash royalty**!',
                  },
                ],
                footer: { text: 'Dawosti Weekly Challenge' },
              },
            ],
          },
        }),
      });
      return;
    }

    // ─── /link-wallet ────────────────────────────────────────────────────────
    if (cmdName === 'link-wallet') {
      const walletType = data.data.options?.find((o) => o.name === 'wallet_type')?.value;
      const walletNumber = data.data.options?.find((o) => o.name === 'wallet_number')?.value?.trim();
      const customCode = data.data.options?.find((o) => o.name === 'custom_code')?.value?.trim().toUpperCase();

      const cleanPhone = (walletNumber || '').replace(/[^0-9]/g, '');
      if (cleanPhone.length < 10) {
        await api(`/interactions/${data.id}/${data.token}/callback`, {
          method: 'POST',
          body: JSON.stringify({
            type: 4,
            data: {
              content: '❌ Invalid phone number. Please enter your 10-digit mobile number registered with eSewa or Khalti (e.g. `9801234567`).',
              flags: 64,
            },
          }),
        });
        return;
      }

      const db = loadDB();
      if (!db.users[userId]) {
        db.users[userId] = { points: 0, submissions: 0, critiques: 0, tier: '🪡 Atelier' };
      }

      const generatedCode =
        customCode && customCode.length >= 3
          ? customCode.replace(/[^A-Z0-9_-]/g, '')
          : `DAW-${userName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'CREATOR'}-${cleanPhone.slice(-4)}`;

      db.users[userId].wallet = {
        type: walletType,
        number: cleanPhone,
        linkedAt: new Date().toISOString(),
      };
      db.users[userId].affiliateCode = generatedCode;
      db.users[userId].royaltiesEarned = db.users[userId].royaltiesEarned || 0;
      db.users[userId].royaltiesWithdrawn = db.users[userId].royaltiesWithdrawn || 0;
      db.users[userId].ordersAttributed = db.users[userId].ordersAttributed || 0;
      saveDB(db);

      await api(`/interactions/${data.id}/${data.token}/callback`, {
        method: 'POST',
        body: JSON.stringify({
          type: 4,
          data: {
            embeds: [
              {
                title: '💳 Wallet Connected Successfully!',
                description: `Hi <@${userId}>! Your **${walletType.toUpperCase()}** account is now connected. You can earn **10% cash** on every sale!`,
                color: walletType === 'esewa' ? 0x60bb46 : 0x5c2d91,
                fields: [
                  { name: 'Your Promo Code', value: `\`${generatedCode}\``, inline: true },
                  { name: 'Connected Wallet', value: `${walletType.toUpperCase()}: \`${cleanPhone.slice(0, 3)}****${cleanPhone.slice(-3)}\``, inline: true },
                  { name: 'Discount for Friends', value: 'NPR 300 OFF', inline: true },
                  { name: 'Your Commission', value: '**10% Cash** on each order', inline: true },
                  { name: 'Store Link to Share', value: `https://dawosti.com?ref=${generatedCode}` },
                  {
                    name: '📲 Ready-to-Copy Share Message',
                    value: `\`Get NPR 300 off designer Nepali fashion at dawosti.com using code: ${generatedCode} ✨\``,
                  },
                ],
                footer: { text: 'Dawosti Cash Rewards • eSewa & Khalti' },
                timestamp: new Date().toISOString(),
              },
            ],
          },
        }),
      });

      const feedId = channelMap['evolution-log'] || channelMap['evolution-feed'];
      if (feedId) {
        await api(`/channels/${feedId}/messages`, {
          method: 'POST',
          body: JSON.stringify({
            embeds: [
              {
                title: '⚡ NEW CREATOR JOINED REWARDS',
                description: `<@${userId}> activated promo code \`${generatedCode}\` with **${walletType.toUpperCase()}** payouts!`,
                color: 0x1b7f5e,
                footer: { text: '10% Cash Commission' },
              },
            ],
          }),
        });
      }
      return;
    }

    // ─── /payout ─────────────────────────────────────────────────────────────
    if (cmdName === 'payout') {
      const db = loadDB();
      const user = db.users[userId] || { points: 0, tier: '🪡 Atelier' };
      const wallet = user.wallet;

      if (!wallet) {
        await api(`/interactions/${data.id}/${data.token}/callback`, {
          method: 'POST',
          body: JSON.stringify({
            type: 4,
            data: {
              content: '⚠️ You haven’t connected your wallet yet. Type `/link-wallet` with your eSewa or Khalti number to start earning!',
              flags: 64,
            },
          }),
        });
        return;
      }

      const earned = user.royaltiesEarned || 0;
      const withdrawn = user.royaltiesWithdrawn || 0;
      const withdrawable = Math.max(0, earned - withdrawn);
      const threshold = 10000;
      const pct = Math.min(100, Math.round((withdrawable / threshold) * 100));

      await api(`/interactions/${data.id}/${data.token}/callback`, {
        method: 'POST',
        body: JSON.stringify({
          type: 4,
          data: {
            embeds: [
              {
                title: `💰 Your Earnings & Cashout: ${userName}`,
                color: 0x1b7f5e,
                fields: [
                  { name: 'Your Code', value: `\`${user.affiliateCode || 'N/A'}\``, inline: true },
                  { name: 'Connected Wallet', value: `${wallet.type.toUpperCase()}: \`${wallet.number.slice(0, 3)}****${wallet.number.slice(-3)}\``, inline: true },
                  { name: 'Total Earned', value: `NPR ${earned.toLocaleString()}`, inline: true },
                  { name: 'Ready to Withdraw', value: `**NPR ${withdrawable.toLocaleString()}**`, inline: true },
                  { name: 'Cashout Goal', value: `NPR 10,000 (${pct}% completed)`, inline: true },
                  { name: 'Orders Through Code', value: `${user.ordersAttributed || 0}`, inline: true },
                  {
                    name: 'How to Cash Out',
                    value:
                      withdrawable >= threshold
                        ? '🎉 **Goal reached!** Type `/request-payout` to withdraw your money now.'
                        : `Earn NPR ${(threshold - withdrawable).toLocaleString()} more with code \`${user.affiliateCode}\` to reach the NPR 10,000 cashout goal.`,
                  },
                ],
                footer: { text: 'Dawosti Cash Rewards • eSewa & Khalti' },
              },
            ],
          },
        }),
      });
      return;
    }

    // ─── /request-payout ─────────────────────────────────────────────────────
    if (cmdName === 'request-payout') {
      const db = loadDB();
      const user = db.users[userId] || { points: 0, tier: '🪡 Atelier' };
      const wallet = user.wallet;

      if (!wallet) {
        await api(`/interactions/${data.id}/${data.token}/callback`, {
          method: 'POST',
          body: JSON.stringify({
            type: 4,
            data: {
              content: '⚠️ Please link your eSewa or Khalti wallet first using `/link-wallet`.',
              flags: 64,
            },
          }),
        });
        return;
      }

      const earned = user.royaltiesEarned || 0;
      const withdrawn = user.royaltiesWithdrawn || 0;
      const withdrawable = Math.max(0, earned - withdrawn);

      if (withdrawable <= 0) {
        await api(`/interactions/${data.id}/${data.token}/callback`, {
          method: 'POST',
          body: JSON.stringify({
            type: 4,
            data: {
              content: `ℹ️ Your current withdrawable balance is **NPR 0**. Share your link \`https://dawosti.com?ref=${user.affiliateCode}\` to earn 10% on every order!`,
              flags: 64,
            },
          }),
        });
        return;
      }

      const requestId = `PAY-${Date.now().toString().slice(-6)}`;
      if (!db.payoutRequests) db.payoutRequests = [];
      db.payoutRequests.push({
        id: requestId,
        userId,
        userName,
        wallet,
        amount: withdrawable,
        requestedAt: new Date().toISOString(),
        status: 'pending',
      });
      saveDB(db);

      await api(`/interactions/${data.id}/${data.token}/callback`, {
        method: 'POST',
        body: JSON.stringify({
          type: 4,
          data: {
            embeds: [
              {
                title: '💸 Cashout Request Submitted!',
                description: `Your payout request \`${requestId}\` for **NPR ${withdrawable.toLocaleString()}** has been received.`,
                color: 0x1b7f5e,
                fields: [
                  { name: 'Disbursement Method', value: `${wallet.type.toUpperCase()} (${wallet.number})`, inline: true },
                  { name: 'Transfer Time', value: 'Sent to your wallet within 24 hours', inline: true },
                ],
                footer: { text: 'Dawosti Treasury Desk' },
              },
            ],
          },
        }),
      });

      const feedId = channelMap['evolution-log'] || channelMap['evolution-feed'];
      if (feedId) {
        await api(`/channels/${feedId}/messages`, {
          method: 'POST',
          body: JSON.stringify({
            embeds: [
              {
                title: '💸 CASHOUT REQUESTED',
                description: `<@${userId}> requested an eSewa/Khalti payout of **NPR ${withdrawable.toLocaleString()}** (Ref: \`${requestId}\`).`,
                color: 0xe5a93c,
                footer: { text: 'Pending review & transfer' },
              },
            ],
          }),
        });
      }
      return;
    }

    // ─── /submit-design ──────────────────────────────────────────────────────
    if (cmdName === 'submit-design') {
      const title = data.data.options?.find((o) => o.name === 'title')?.value;
      const materials = data.data.options?.find((o) => o.name === 'materials')?.value;
      const description = data.data.options?.find((o) => o.name === 'description')?.value;
      const imageUrl = data.data.options?.find((o) => o.name === 'image_url')?.value;

      const submissionsChId = channelMap['design-submissions'];
      if (!submissionsChId) {
        await api(`/interactions/${data.id}/${data.token}/callback`, {
          method: 'POST',
          body: JSON.stringify({
            type: 4,
            data: { content: '❌ #design-submissions channel could not be found.', flags: 64 },
          }),
        });
        return;
      }

      const embed = {
        title: `🎨 NEW DESIGN CONCEPT: ${title}`,
        description,
        color: 0x8a1c2e,
        fields: [
          { name: 'Designer', value: `<@${userId}>`, inline: true },
          { name: 'Fabrics & Textiles', value: materials, inline: true },
          { name: 'Vote on this Design', value: 'React: ⭐ Nice Style | 🧵 Great Craft | 🔥 Fire | 👑 Produce this Piece!' },
        ],
        footer: { text: 'Dawosti Atelier • Kathmandu' },
        timestamp: new Date().toISOString(),
      };
      if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
        embed.image = { url: imageUrl };
      }

      const postedMsg = await api(`/channels/${submissionsChId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ embeds: [embed] }),
      });

      const emojis = ['%E2%AD%90', '%F0%9F%A7%B5', '%F0%9F%94%A5', '%F0%9F%91%91'];
      for (const emoji of emojis) {
        try {
          await api(`/channels/${submissionsChId}/messages/${postedMsg.id}/reactions/${emoji}/@me`, { method: 'PUT' });
          await new Promise((r) => setTimeout(r, 200));
        } catch {}
      }

      try {
        await api(`/channels/${submissionsChId}/messages/${postedMsg.id}/threads`, {
          method: 'POST',
          body: JSON.stringify({
            name: `Feedback: ${title}`,
            auto_archive_duration: 1440,
          }),
        });
      } catch {}

      await awardPoints(userId, 10, `Original design submission: ${title}`);

      await api(`/interactions/${data.id}/${data.token}/callback`, {
        method: 'POST',
        body: JSON.stringify({
          type: 4,
          data: {
            content: `🎉 Your design **"${title}"** was posted to ${chMention('design-submissions')}! A discussion thread is now open for feedback.`,
            flags: 64,
          },
        }),
      });
      return;
    }

    // ─── /manifesto ──────────────────────────────────────────────────────────
    if (cmdName === 'manifesto') {
      await api(`/interactions/${data.id}/${data.token}/callback`, {
        method: 'POST',
        body: JSON.stringify({
          type: 4,
          data: {
            embeds: [
              {
                title: 'DAWOSTI — Authentic Nepali Fashion, Made Modern',
                description:
                  'We take Nepal’s rich heritage — Palpali Dhaka, raw Himalayan silk, and traditional cuts — and bring them to life in modern streetwear.\n\n' +
                  '✨ **No Gatekeeping**: Anyone can design, share ideas, and earn cash.\n' +
                  '✨ **Real Cash Earnings**: Get 10% commission on orders with your promo code via eSewa or Khalti.\n' +
                  '✨ **Honest Quality**: Pure fabrics, fair wages, modern design.',
                color: 0x8a1c2e,
                fields: [
                  { name: 'Guild Rules', value: chMention('manifesto-and-rules') },
                  { name: 'Official Website & Shop', value: 'https://dawosti.com' },
                ],
                footer: { text: 'Dawosti • Kathmandu, Nepal' },
              },
            ],
          },
        }),
      });
      return;
    }

    // ─── /leaderboard ────────────────────────────────────────────────────────
    if (cmdName === 'leaderboard') {
      const db = loadDB();
      const entries = Object.entries(db.users)
        .sort((a, b) => (b[1].points || 0) - (a[1].points || 0))
        .slice(0, 10);

      const list =
        entries.length > 0
          ? entries.map(([id, u], i) => `${i + 1}. <@${id}> — **${u.tier}** (${u.points} pts)`).join('\n')
          : `No rankings yet. Post a design in ${chMention('design-submissions')} to be the first!`;

      await api(`/interactions/${data.id}/${data.token}/callback`, {
        method: 'POST',
        body: JSON.stringify({
          type: 4,
          data: {
            embeds: [
              {
                title: '🏆 TOP DESIGNERS & CREATORS LEADERBOARD',
                description: list,
                color: 0xe5a93c,
                footer: { text: 'Earn points by sharing designs and giving helpful feedback' },
              },
            ],
          },
        }),
      });
      return;
    }

    // ─── /showcase & /catalog ────────────────────────────────────────────────
    if (cmdName === 'showcase' || cmdName === 'catalog') {
      await api(`/interactions/${data.id}/${data.token}/callback`, {
        method: 'POST',
        body: JSON.stringify({
          type: 4,
          data: {
            embeds: [
              {
                title: '🛍️ FEATURED DAWOSTI CLOTHING',
                description:
                  'Handcrafted pieces made in Kathmandu, delivered across Nepal and worldwide:\n\n' +
                  '• **Crimson Heritage Silk Kurtha** — NPR 5,400\n' +
                  '• **Ivory Handloom Cotton Kurtha** — NPR 3,200\n' +
                  '• **Royal Banarasi Silk Saree** — NPR 12,500\n' +
                  '• **Antique Temple Gold Jhumka** — NPR 1,900',
                color: 0x8a1c2e,
                fields: [
                  { name: 'Visit Online Store', value: 'https://dawosti.com', inline: true },
                  { name: 'Creator Code Portal', value: 'https://referral.dawosti.com', inline: true },
                  { name: 'WhatsApp Orders', value: '+977 9708251494', inline: true },
                ],
                footer: { text: 'Kathmandu, Nepal • Cash on Delivery Available' },
              },
            ],
          },
        }),
      });
      return;
    }

    // ─── /help ───────────────────────────────────────────────────────────────
    if (cmdName === 'help') {
      await api(`/interactions/${data.id}/${data.token}/callback`, {
        method: 'POST',
        body: JSON.stringify({
          type: 4,
          data: {
            embeds: [
              {
                title: '🤖 DAWOSTI BOT COMMANDS',
                description:
                  'Welcome to the Dawosti Fashion Guild! Here are the commands you can use:\n\n' +
                  '🎨 **Designs & Contests**\n' +
                  '`/challenge` — View this week’s design contest & NPR 5,000 cash prize\n' +
                  '`/submit-design` — Upload your fashion design or sketch\n\n' +
                  '💰 **Earn Cash**\n' +
                  '`/link-wallet` — Connect eSewa/Khalti to earn 10% cash on orders\n' +
                  '`/payout` — Check how much money you have earned\n' +
                  '`/request-payout` — Withdraw your cash to your wallet\n\n' +
                  '⭐ **Your Status & Levels**\n' +
                  '`/rank` — Check your points, level, and next milestone\n' +
                  '`/leaderboard` — View the top designers in our community\n' +
                  '`/manifesto` — Learn about Dawosti’s story\n\n' +
                  '🛍️ **Shop & Perks**\n' +
                  '`/catalog` — See featured clothes and prices\n' +
                  '`/verify` — Enter your order number to get VIP member perks',
                color: 0x1b7f5e,
                fields: [
                  {
                    name: '👑 Community Roles',
                    value:
                      '• **👑 Vanguard**: Lead tastemakers who review & approve designs\n' +
                      '• **🏛️ Couturier**: Verified designers whose clothes get made (100+ pts)\n' +
                      '• **✂️ Artisan**: Active stylists and feedback providers (25+ pts)\n' +
                      '• **🪡 Atelier**: Welcoming starting level for all members',
                  },
                ],
                footer: { text: 'Dawosti Guild • Kathmandu' },
              },
            ],
          },
        }),
      });
      return;
    }

    // ─── /verify ─────────────────────────────────────────────────────────────
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
              content: `⚠️ Order **${orderNumber}** is already registered. If you need help, message us on WhatsApp (+977 9708251494).`,
              flags: 64,
            },
          }),
        });
        return;
      }

      const isValid = orderNumber && (orderNumber.startsWith('DW-') || orderNumber.startsWith('DAW-') || orderNumber.length >= 5);
      if (!isValid) {
        await api(`/interactions/${data.id}/${data.token}/callback`, {
          method: 'POST',
          body: JSON.stringify({
            type: 4,
            data: {
              content: `❌ Invalid order number. Dawosti order numbers start with \`DAW-\` or \`DW-\`. Check your receipt or SMS.`,
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
      db.users[userId].points = (db.users[userId].points || 0) + 50;
      db.users[userId].isPatron = true;
      saveDB(db);

      const patronRoleId = roleMap['🛍️ Verified Patron'];
      if (patronRoleId) {
        try {
          await api(`/guilds/${GUILD_ID}/members/${userId}/roles/${patronRoleId}`, { method: 'PUT' });
        } catch {}
      }

      await api(`/interactions/${data.id}/${data.token}/callback`, {
        method: 'POST',
        body: JSON.stringify({
          type: 4,
          data: {
            embeds: [
              {
                title: '🛍️ VIP Patron Status Unlocked!',
                description: `Welcome to the Dawosti VIP Club, <@${userId}>! Your order **${orderNumber}** has been confirmed.`,
                color: 0xc49746,
                fields: [
                  { name: 'Bonus Points', value: '+50 Points Added', inline: true },
                  { name: 'Online Store', value: 'https://dawosti.com', inline: true },
                  {
                    name: 'Your VIP Perks',
                    value: '• Early access to limited new collections\n• Free custom sizing assistance\n• Direct support on WhatsApp',
                  },
                ],
                footer: { text: 'Dawosti VIP Club • Kathmandu' },
              },
            ],
          },
        }),
      });
      return;
    }
  }

  // 2. Message Submissions in #design-submissions & Critiques
  if (eventType === 'MESSAGE_CREATE') {
    if (data.author?.bot) return;

    if (data.channel_id === channelMap['design-submissions']) {
      const db = loadDB();
      if (!db.users[data.author.id]) {
        db.users[data.author.id] = { points: 0, submissions: 0, critiques: 0, tier: '🪡 Atelier' };
      }
      db.users[data.author.id].submissions = (db.users[data.author.id].submissions || 0) + 1;
      saveDB(db);

      await awardPoints(data.author.id, 5, 'Original design drop submission');

      const emojis = ['%E2%AD%90', '%F0%9F%A7%B5', '%F0%9F%94%A5', '%F0%9F%91%91'];
      for (const emoji of emojis) {
        try {
          await api(`/channels/${data.channel_id}/messages/${data.id}/reactions/${emoji}/@me`, { method: 'PUT' });
          await new Promise((r) => setTimeout(r, 200));
        } catch {}
      }

      try {
        await api(`/channels/${data.channel_id}/messages/${data.id}/threads`, {
          method: 'POST',
          body: JSON.stringify({
            name: `Review: ${data.author.username}'s Concept`,
            auto_archive_duration: 1440,
          }),
        });
      } catch {}
    }

    if (data.channel_id === channelMap['peer-critique']) {
      if (data.content && data.content.length > 40) {
        const db = loadDB();
        if (!db.users[data.author.id]) {
          db.users[data.author.id] = { points: 0, submissions: 0, critiques: 0, tier: '🪡 Atelier' };
        }
        db.users[data.author.id].critiques = (db.users[data.author.id].critiques || 0) + 1;
        saveDB(db);
        await awardPoints(data.author.id, 2, 'Constructive peer critique');
      }
    }
  }

  // 3. Reaction Endorsement Tracking & Consensus Greenlighting
  if (eventType === 'MESSAGE_REACTION_ADD') {
    if (data.user_id === CLIENT_ID) return;

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

            // Check for Vanguard Consensus (3+ 👑 reactions)
            if (emojiName === '👑') {
              const crownReaction = (msg.reactions || []).find((r) => r.emoji.name === '👑');
              if (crownReaction && crownReaction.count >= 3) {
                const db = loadDB();
                if (!db.approvedDesigns) db.approvedDesigns = {};
                if (!db.approvedDesigns[data.message_id]) {
                  db.approvedDesigns[data.message_id] = {
                    authorId: msg.author.id,
                    approvedAt: new Date().toISOString(),
                  };
                  saveDB(db);

                  await awardPoints(msg.author.id, 50, 'Design reached Vanguard Consensus');

                  const couturierRole = roleMap['🏛️ Couturier'];
                  if (couturierRole) {
                    await api(`/guilds/${GUILD_ID}/members/${msg.author.id}/roles/${couturierRole}`, { method: 'PUT' });
                  }

                  const announceCh = channelMap['announcements-drops'] || channelMap['announcements-and-drops'];
                  if (announceCh) {
                    await api(`/channels/${announceCh}/messages`, {
                      method: 'POST',
                      body: JSON.stringify({
                        embeds: [
                          {
                            title: '🏛️ PRODUCTION DROP GREENLIT: VANGUARD CONSENSUS REACHED',
                            description: `A community fashion concept by <@${msg.author.id}> has received **3+ Vanguard endorsements** and is officially approved for pattern drafting and sample manufacturing!`,
                            color: 0x8a1c2e,
                            fields: [
                              { name: 'Designer Status', value: 'Elevated to **🏛️ Couturier**', inline: true },
                              { name: 'Commercial Rights', value: '**10% Lifetime Royalty** on all boutique sales', inline: true },
                              { name: 'Production Pipeline', value: 'Sent to Kathmandu Atelier desk for sample line-sheet on `dawosti.com`' },
                            ],
                            footer: { text: 'Dawosti Meritocracy • Proof-of-Craft' },
                            timestamp: new Date().toISOString(),
                          },
                        ],
                      }),
                    });
                  }
                }
              }
            }
          }
        } catch (e) {
          console.warn('Reaction processing warning:', e.message);
        }
      }
    }

    if (data.channel_id === channelMap['peer-critique']) {
      if (['💡', '🎯', '⭐'].includes(data.emoji.name)) {
        try {
          const msg = await api(`/channels/${data.channel_id}/messages/${data.message_id}`);
          if (msg && msg.author && msg.author.id !== data.user_id) {
            await awardPoints(msg.author.id, 2, 'Insightful critique endorsement');
          }
        } catch {}
      }
    }
  }
}

// ─── Start Gateway Daemon ───────────────────────────────────────────────────
startGateway().catch(console.error);
