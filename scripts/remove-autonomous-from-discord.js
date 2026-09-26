/**
 * Remove any mention of "autonomous" from live Discord server
 * (Server name, description, category names, channel names, topics, bot nickname)
 */

import 'dotenv/config';

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const API_BASE = 'https://discord.com/api/v10';

if (!TOKEN) {
  console.error('Missing DISCORD_BOT_TOKEN');
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function api(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bot ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (res.status === 429) {
    const data = await res.json();
    const waitTime = (data.retry_after || 1) * 1000 + 500;
    console.log(`  ⏳ Discord Rate Limited. Waiting ${(waitTime / 1000).toFixed(1)}s before retry...`);
    await sleep(waitTime);
    return api(path, options);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord API Error [${res.status}] ${path}: ${text}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

async function run() {
  console.log('🔄 Checking Discord Guilds...');
  const guilds = await api('/users/@me/guilds');
  if (!guilds || guilds.length === 0) {
    console.log('No guilds found.');
    return;
  }

  for (const guild of guilds) {
    console.log(`\nProcessing Guild: "${guild.name}" (ID: ${guild.id})`);

    // 1. Rename guild if it contains Autonomous
    let newGuildName = guild.name.replace(/autonomous\s*/gi, '').replace(/\|\s*\|/g, '|').trim();
    if (newGuildName.endsWith('|')) newGuildName = newGuildName.slice(0, -1).trim();
    if (guild.name !== newGuildName) {
      console.log(`  ✏️ Renaming Guild: "${guild.name}" -> "${newGuildName}"`);
      await api(`/guilds/${guild.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: newGuildName,
          description: 'The premier ecosystem for Nepalese high fashion, avant-garde design, and creative meritocracy.',
        }),
      });
      console.log('  ✅ Guild renamed successfully.');
      await sleep(1000);
    } else {
      console.log('  ✓ Guild name is already clean.');
    }

    // 2. Update Bot Nickname in Guild
    try {
      console.log('  ✏️ Setting Bot Nickname to "Dawosti Guild Core"...');
      await api(`/guilds/${guild.id}/members/@me`, {
        method: 'PATCH',
        body: JSON.stringify({ nick: 'Dawosti Guild Core' }),
      });
      console.log('  ✅ Bot nickname updated.');
    } catch (err) {
      console.log('  (Notice setting nickname:', err.message, ')');
    }

    // 3. Inspect and update Channels & Categories
    const channels = await api(`/guilds/${guild.id}/channels`);
    for (const ch of channels) {
      const nameHasAutonomous = /autonomous/i.test(ch.name);
      const topicHasAutonomous = ch.topic && /autonomous/i.test(ch.topic);

      if (nameHasAutonomous || topicHasAutonomous) {
        let cleanName = ch.name;
        if (ch.type === 4) {
          // Category
          cleanName = ch.name.replace(/autonomous/gi, 'GUILD');
        } else {
          // Text/voice/forum
          cleanName = ch.name.replace(/autonomous/gi, 'design');
        }

        let cleanTopic = ch.topic || '';
        if (topicHasAutonomous) {
          cleanTopic = cleanTopic.replace(/autonomous/gi, 'guild');
        }

        console.log(`  ✏️ Updating Channel ${ch.id}: "${ch.name}" -> "${cleanName}"`);
        await api(`/channels/${ch.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: cleanName,
            topic: cleanTopic || undefined,
          }),
        });
        console.log(`  ✅ Channel #${cleanName} updated.`);
        await sleep(1000);
      }
    }
  }

  // 4. Try updating bot username if possible
  try {
    const me = await api('/users/@me');
    if (/autonomous/i.test(me.username)) {
      console.log(`\n🤖 Updating bot username from "${me.username}" to "Dawosti Guild Core"...`);
      await api('/users/@me', {
        method: 'PATCH',
        body: JSON.stringify({ username: 'Dawosti Guild Core' }),
      });
      console.log('✅ Bot username updated successfully.');
    }
  } catch (err) {
    console.log('  (Notice updating bot global username:', err.message, ')');
  }

  console.log('\n🎉 Finished removing all mentions of "autonomous" from Discord!');
}

run().catch(console.error);
