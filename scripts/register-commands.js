import 'dotenv/config';

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = '1432647277587075134';

const commands = [
  {
    name: 'rank',
    description: 'Check your tier, points, and next level',
  },
  {
    name: 'challenge',
    description: 'View this week’s design challenge & NPR 5,000 cash prize',
  },
  {
    name: 'submit-design',
    description: 'Submit your fashion sketch or design idea',
    options: [
      {
        name: 'title',
        description: 'Name of your design',
        type: 3,
        required: true,
      },
      {
        name: 'materials',
        description: 'Fabrics used (e.g. Dhaka, Silk, Cotton, Hemp)',
        type: 3,
        required: true,
      },
      {
        name: 'description',
        description: 'Tell us about your design and style',
        type: 3,
        required: true,
      },
      {
        name: 'image_url',
        description: 'Link to your photo, sketch, or moodboard',
        type: 3,
        required: false,
      },
    ],
  },
  {
    name: 'link-wallet',
    description: 'Connect eSewa or Khalti to earn 10% cash on every sale',
    options: [
      {
        name: 'wallet_type',
        description: 'Choose your wallet (eSewa or Khalti)',
        type: 3, // STRING
        required: true,
        choices: [
          { name: 'eSewa', value: 'esewa' },
          { name: 'Khalti', value: 'khalti' },
        ],
      },
      {
        name: 'wallet_number',
        description: 'Your 10-digit mobile number (e.g., 9801234567)',
        type: 3, // STRING
        required: true,
      },
      {
        name: 'custom_code',
        description: 'Optional promo code you want (e.g., SAGAR, ANUSHA)',
        type: 3, // STRING
        required: false,
      },
    ],
  },
  {
    name: 'payout',
    description: 'Check your earned cash and balance',
  },
  {
    name: 'request-payout',
    description: 'Withdraw your earned cash to eSewa or Khalti',
  },
  {
    name: 'catalog',
    description: 'See featured Dawosti clothing & pricing',
  },
  {
    name: 'showcase',
    description: 'Browse official drops and shop on dawosti.com',
  },
  {
    name: 'leaderboard',
    description: 'Top designers and tastemakers leaderboard',
  },
  {
    name: 'manifesto',
    description: 'About Dawosti and how our community works',
  },
  {
    name: 'help',
    description: 'List of all bot commands and how to level up',
  },
  {
    name: 'verify',
    description: 'Enter your order number to unlock VIP member perks',
    options: [
      {
        name: 'order_number',
        description: 'Your Dawosti order number (e.g., DW-2026-XXXX)',
        type: 3, // STRING
        required: true,
      },
    ],
  },
];

async function main() {
  console.log('⚡ Registering Guild Slash Commands for Dawosti Guild...');
  const res = await fetch(`https://discord.com/api/v10/applications/${CLIENT_ID}/guilds/${GUILD_ID}/commands`, {
    method: 'PUT',
    headers: {
      Authorization: `Bot ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Failed to register commands: ${JSON.stringify(data)}`);
  }
  console.log(`✅ Successfully registered ${data.length} slash commands:`, data.map(c => '/' + c.name));
}

main().catch(console.error);
