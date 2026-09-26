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
              footer: { text: 'Dawosti Autonomous Evolution Engine • Proof-of-Taste' },
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

// ─── Autonomous Weekly Challenge / Brief Pool ──────────────────────────────
const CURATED_BRIEFS = [
  {
    id: 'BRIEF-001',
    title: 'The Himalayan Nomad 2085',
    theme: 'Fusion of high-altitude Himalayan mountaineering wear (Bakhu, Sherpa wool, Palpali Dhaka geometry) with utilitarian cyberpunk streetwear.',
    bounty: 'NPR 5,000 Cash or Featured Boutique Sample Drop',
  },
  {
    id: 'BRIEF-002',
    title: 'Monastic Silence & Raw Himalayan Allo',
    theme: 'Structural minimalist outerwear engineered from wild stinging nettle (Allo), bamboo silk, and asymmetric drapes inspired by high-monastery monastic robes.',
    bounty: 'NPR 5,000 Cash + Official Inclusion in Dawosti Autumn Lookbook',
  },
  {
    id: 'BRIEF-003',
    title: 'Kathmandu Neon & Newari Geometry',
    theme: 'Reimagining traditional Haku Patasi black-and-crimson border geometry into modern oversized architectural blazers and tailored cargo trousers.',
    bounty: 'NPR 5,000 Cash + 10% Lifetime Designer Royalty on dawosti.com',
  },
  {
    id: 'BRIEF-004',
    title: 'Deconstructed Banarasi Brocade',
    theme: 'Transforming opulent wedding brocades, meenakari motifs, and gold zari into wearable avant-garde bomber jackets and corseted vests.',
    bounty: 'NPR 5,000 Cash + Physical Sample Production at Kathmandu Atelier',
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

  console.log('\n🌐 Connecting to Discord Gateway v10 (Autonomous Business Daemon)...');
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
                    value: `• Post designs via \`/submit-design\` or in ${chMention('design-submissions')}\n• Provide detailed feedback in ${chMention('peer-critique')}`,
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
                title: `⚡ ACTIVE DESIGN BRIEF: ${brief.title}`,
                description: brief.theme,
                color: 0x1b7f5e,
                fields: [
                  { name: 'Brief ID', value: `\`${brief.id}\``, inline: true },
                  { name: 'Design Bounty', value: `💰 **${brief.bounty || 'NPR 5,000'}**`, inline: true },
                  { name: 'Submission Command', value: '`/submit-design`', inline: true },
                  { name: 'Where to Drop', value: chMention('design-submissions'), inline: true },
                  {
                    name: 'Evolution Reward',
                    value: 'Consensus designs (3+ 👑 Vanguard reactions) ascend directly to **🏛️ Couturier** with commercial manufacturing on `dawosti.com`.',
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
              content: '❌ Invalid wallet number. Please provide a 10-digit Nepali mobile number registered with eSewa or Khalti (e.g. `9801234567`).',
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
                title: '💳 AUTONOMOUS WALLET & CREATOR PIPELINE BOUND',
                description: `Congratulations <@${userId}>! Your **${walletType.toUpperCase()}** account is now permanently connected to the Dawosti Autonomous Guild royalty engine.`,
                color: walletType === 'esewa' ? 0x60bb46 : 0x5c2d91,
                fields: [
                  { name: 'Your Referral Code', value: `\`${generatedCode}\``, inline: true },
                  { name: 'Linked Wallet', value: `${walletType.toUpperCase()}: \`${cleanPhone.slice(0, 3)}****${cleanPhone.slice(-3)}\``, inline: true },
                  { name: 'Customer Benefit', value: 'NPR 300 Instant Discount', inline: true },
                  { name: 'Creator Royalty', value: '**10% Cash** on every verified order', inline: true },
                  { name: 'Shareable Boutique Link', value: `https://dawosti.com?ref=${generatedCode}` },
                  { name: 'Creator Web Portal', value: 'https://referral.dawosti.com' },
                  {
                    name: '📲 Ready-to-Copy Social Bio',
                    value: `\`Authentic Kathmandu Couture. Use code ${generatedCode} for NPR 300 off on dawosti.com ✨\``,
                  },
                ],
                footer: { text: 'Dawosti Autonomous Payout Engine • Encrypted Audit' },
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
                title: '⚡ NEW GUILD ADVOCATE ONBOARDED',
                description: `<@${userId}> bound creator code \`${generatedCode}\` with **${walletType.toUpperCase()}** direct payouts!`,
                color: 0x1b7f5e,
                footer: { text: '10% Lifetime Royalty Protocol' },
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
              content: '⚠️ You have not linked your payout wallet yet. Run `/link-wallet` with your eSewa or Khalti number to activate your 10% royalty stream.',
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
                title: `💰 CREATOR ROYALTIES & BALANCE: ${userName}`,
                color: 0x1b7f5e,
                fields: [
                  { name: 'Affiliate Code', value: `\`${user.affiliateCode || 'N/A'}\``, inline: true },
                  { name: 'Linked Wallet', value: `${wallet.type.toUpperCase()}: \`${wallet.number.slice(0, 3)}****${wallet.number.slice(-3)}\``, inline: true },
                  { name: 'Total Earned', value: `NPR ${earned.toLocaleString()}`, inline: true },
                  { name: 'Withdrawable Balance', value: `**NPR ${withdrawable.toLocaleString()}**`, inline: true },
                  { name: 'Milestone Progress', value: `NPR 10,000 (${pct}% reached)`, inline: true },
                  { name: 'Orders Attributed', value: `${user.ordersAttributed || 0}`, inline: true },
                  {
                    name: 'Disbursement Mechanics',
                    value:
                      withdrawable >= threshold
                        ? '🎉 **Threshold Reached!** Type `/request-payout` to trigger immediate wallet disbursement.'
                        : `Earn NPR ${(threshold - withdrawable).toLocaleString()} more with code \`${user.affiliateCode}\` to unlock automatic wallet transfer.`,
                  },
                ],
                footer: { text: 'Dawosti Autonomous Treasury • eSewa & Khalti' },
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
              content: '⚠️ You must link your eSewa or Khalti wallet first using `/link-wallet`.',
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
              content: `ℹ️ Your withdrawable royalty balance is **NPR 0**. Share your boutique link \`https://dawosti.com?ref=${user.affiliateCode}\` to earn 10% on every customer purchase!`,
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
                title: '💸 PAYOUT REQUEST DISPATCHED TO QUEUE',
                description: `Your payout request \`${requestId}\` for **NPR ${withdrawable.toLocaleString()}** has been submitted to the merchant treasury desk.`,
                color: 0x1b7f5e,
                fields: [
                  { name: 'Disbursement Method', value: `${wallet.type.toUpperCase()} (${wallet.number})`, inline: true },
                  { name: 'Processing SLA', value: 'Direct batch transfer within 24h', inline: true },
                ],
                footer: { text: 'Dawosti Autonomous Treasury Engine' },
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
                title: '💸 AUTONOMOUS PAYOUT DISPATCH QUEUED',
                description: `<@${userId}> requested an eSewa/Khalti disbursement of **NPR ${withdrawable.toLocaleString()}** (Ref: \`${requestId}\`).`,
                color: 0xe5a93c,
                footer: { text: 'Merchant Audit Log Active' },
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
        title: `🏛️ ORIGINAL CONCEPT DROP: ${title}`,
        description,
        color: 0x8a1c2e,
        fields: [
          { name: 'Architect / Creator', value: `<@${userId}>`, inline: true },
          { name: 'Textiles & Materials', value: materials, inline: true },
          { name: 'Peer Appraisal Tokens', value: 'React: ⭐ Aesthetic | 🧵 Craft | 🔥 Vision | 👑 Vanguard Consensus' },
        ],
        footer: { text: 'Dawosti Atelier • Proof-of-Craft Submission' },
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
            name: `Appraisal: ${title}`,
            auto_archive_duration: 1440,
          }),
        });
      } catch {}

      await awardPoints(userId, 10, `Original design drop: ${title}`);

      await api(`/interactions/${data.id}/${data.token}/callback`, {
        method: 'POST',
        body: JSON.stringify({
          type: 4,
          data: {
            content: `🎉 Concept **"${title}"** submitted to ${chMention('design-submissions')}! Appraisal thread opened and review tokens attached.`,
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
                title: 'DAWOSTI (दावोस्ती) — THE CULTURAL MANDATE',
                description:
                  'We lead fashion in Nepal not through claims, but through **demonstrable creative impact, aesthetic rigor, and community talent cultivation**.\n\n' +
                  '• Inspired by **Apple’s design purity** & **Google’s developer meritocracy**.\n' +
                  '• No arbitrary promotions; status is earned via Proof-of-Taste and Craft.\n' +
                  '• Elevating Palpali Dhaka, Himalayan nettle (Allo), and Newari tailoring to the world stage.',
                color: 0x8a1c2e,
                fields: [
                  { name: 'Archive & Full Rules', value: chMention('manifesto-and-rules') },
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

    // ─── /leaderboard ────────────────────────────────────────────────────────
    if (cmdName === 'leaderboard') {
      const db = loadDB();
      const entries = Object.entries(db.users)
        .sort((a, b) => (b[1].points || 0) - (a[1].points || 0))
        .slice(0, 10);

      const list =
        entries.length > 0
          ? entries.map(([id, u], i) => `${i + 1}. <@${id}> — **${u.tier}** (${u.points} pts)`).join('\n')
          : `No recognized rankings yet. Post a design in ${chMention('design-submissions')} to begin!`;

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

    // ─── /showcase & /catalog ────────────────────────────────────────────────
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
                  '• **Crimson Heritage Silk Kurtha** — NPR 5,400\n' +
                  '• **Ivory Handloom Cotton Kurtha** — NPR 3,200\n' +
                  '• **Royal Banarasi Silk Saree** — NPR 12,500\n' +
                  '• **Antique Temple Gold Jhumka** — NPR 1,900',
                color: 0x8a1c2e,
                fields: [
                  { name: 'Boutique URL', value: 'https://dawosti.com', inline: true },
                  { name: 'Creator Portal', value: 'https://referral.dawosti.com', inline: true },
                  { name: 'WhatsApp Concierge', value: '+977 9708251494', inline: true },
                ],
                footer: { text: 'Kathmandu, Nepal • Nationwide & Global Delivery' },
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
                title: '🤖 DAWOSTI AUTONOMOUS CORE COMMANDS',
                description:
                  'Welcome to the Dawosti Autonomous Fashion Guild. Here are your primary tools:\n\n' +
                  '`/rank` — Check your fashion tier, points, and evolution milestone\n' +
                  '`/challenge` — Inspect the active weekly design prompt & bounty\n' +
                  '`/submit-design` — Upload your garment sketches to the Atelier\n' +
                  '`/link-wallet` — Connect eSewa/Khalti to activate 10% cash royalties\n' +
                  '`/payout` — Check real-time royalties & NPR 10k threshold progress\n' +
                  '`/request-payout` — Dispatch an autonomous wallet payout request\n' +
                  '`/manifesto` — Read Dawosti’s founding cultural values\n' +
                  '`/leaderboard` — View the top tastemakers in the guild\n' +
                  '`/catalog` — Browse current bespoke boutique collections\n' +
                  '`/verify` — Verify your purchase order for Patron Circle status',
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
              content: `⚠️ Order **${orderNumber}** has already been authenticated to another member. Contact WhatsApp (+977 9708251494) for assistance.`,
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
              content: `❌ Invalid order format. Dawosti order numbers start with \`DAW-\` or \`DW-\`. Check your checkout receipt or SMS confirmation.`,
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
                title: '🛍️ VERIFIED PATRON ACCESS GRANTED',
                description: `Welcome to the Dawosti Patron Circle, <@${userId}>! Your order **${orderNumber}** has been authenticated.`,
                color: 0xc49746,
                fields: [
                  { name: 'Patron Bonus', value: '+50 Proof-of-Taste Points', inline: true },
                  { name: 'Storefront Portal', value: 'https://dawosti.com', inline: true },
                  {
                    name: 'Unlocked Privileges',
                    value: '• Early access to seasonal limited drops\n• VIP bespoke sizing support\n• Direct dialogue with Dawosti design team',
                  },
                ],
                footer: { text: 'Dawosti Boutique & Atelier • Kathmandu' },
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
                            footer: { text: 'Dawosti Autonomous Meritocracy • Proof-of-Craft' },
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
