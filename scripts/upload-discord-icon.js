import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const token = process.env.DISCORD_BOT_TOKEN;
const guildId = '1432647277587075134';

async function updateGuildIcon() {
  const iconBuffer = fs.readFileSync('public/discord_logo_burgundy.png');
  const base64Icon = `data:image/png;base64,${iconBuffer.toString('base64')}`;

  console.log('Sending PATCH /guilds/' + guildId + ' with new burgundy logo...');
  const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      icon: base64Icon,
    }),
  });

  if (res.ok) {
    const data = await res.json();
    console.log('SUCCESS: Discord server icon updated! New icon hash:', data.icon);
  } else {
    const err = await res.text();
    console.error('FAILED to update Discord server icon:', res.status, err);
  }
}

updateGuildIcon();
