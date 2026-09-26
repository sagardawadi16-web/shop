import 'dotenv/config';

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CHANNEL_ID = '1553339817864077344'; // announcements-drops

async function main() {
  const embed = {
    title: '📢 CEO NOTE: Radical Simplicity & Creator-First Fashion',
    description: 'A personal message from Dawosti leadership to all our designers, stylists, and guild members.',
    color: 0x8a1c2e,
    fields: [
      {
        name: '✨ 1. Keeping Things Simple',
        value: 'Fashion should inspire, not confuse. We have redesigned all bot commands and guild guidelines to use clear, simple language so anyone can jump in right away.',
      },
      {
        name: '💰 2. Real Cash Rewards (eSewa & Khalti)',
        value: 'Use `/link-wallet` to connect your mobile wallet. Give your friends **NPR 300 OFF** with your promo code, and earn **10% cash** on every sale straight to your phone.',
      },
      {
        name: '🎨 3. Weekly Design Contests & NPR 5,000 Prize',
        value: 'Type `/challenge` to check the weekly prompt. Upload your sketch with `/submit-design`. When community members vote for your piece, we tailor it in Kathmandu, launch it on `dawosti.com`, and pay you **NPR 5,000 cash** plus lifetime royalties.',
      },
      {
        name: '📸 4. Daily Outfits & Community Vibes',
        value: 'Drop your daily fits and street style in <#1553289583972581406> to earn points and level up to Artisan and Couturier.',
      },
    ],
    footer: { text: 'Dawosti • Kathmandu, Nepal • dawosti.com' },
    timestamp: new Date().toISOString(),
  };

  const res = await fetch(`https://discord.com/api/v10/channels/${CHANNEL_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ embeds: [embed] }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Failed to post message: ${JSON.stringify(data)}`);
  }
  console.log('✅ CEO Announcement successfully posted to Discord:', data.id);
}

main().catch(console.error);
