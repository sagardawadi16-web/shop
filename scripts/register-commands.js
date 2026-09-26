import 'dotenv/config';

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = '1432647277587075134';

const commands = [
  {
    name: 'rank',
    description: 'Check your Dawosti fashion tier, Proof-of-Taste score, and evolution milestone',
  },
  {
    name: 'brief',
    description: 'View the active autonomous fashion design brief and submission target',
  },
  {
    name: 'manifesto',
    description: 'Read the Dawosti founding philosophy and cultural mandate',
  },
  {
    name: 'leaderboard',
    description: 'View the leading tastemakers and creators in the Dawosti Guild',
  },
  {
    name: 'showcase',
    description: 'Explore verified community collections and drops on dawosti.com',
  },
  {
    name: 'help',
    description: 'Overview of all Dawosti Guild commands, roles, and proof-of-taste mechanics',
  },
  {
    name: 'catalog',
    description: 'Browse premier Dawosti collections, bespoke silhouettes, and drop links',
  },
  {
    name: 'link-wallet',
    description: 'Link your eSewa or Khalti account to earn 10% cash royalties on community orders',
    options: [
      {
        name: 'wallet_type',
        description: 'Choose payment provider (eSewa or Khalti)',
        type: 3, // STRING
        required: true,
        choices: [
          { name: 'eSewa', value: 'esewa' },
          { name: 'Khalti', value: 'khalti' },
        ],
      },
      {
        name: 'wallet_number',
        description: 'Your 10-digit mobile wallet ID (e.g., 9801234567)',
        type: 3, // STRING
        required: true,
      },
      {
        name: 'custom_code',
        description: 'Optional custom affiliate code (e.g., SAGAR, ANUSHA)',
        type: 3, // STRING
        required: false,
      },
    ],
  },
  {
    name: 'payout',
    description: 'Check your real-time 10% royalty balance and NPR 10,000 disbursement milestone',
  },
  {
    name: 'request-payout',
    description: 'Dispatch an autonomous payout request to your linked eSewa / Khalti wallet',
  },
  {
    name: 'submit-design',
    description: 'Submit an original garment sketch or tech-pack to the Dawosti Atelier',
    options: [
      {
        name: 'title',
        description: 'Title of the garment or collection piece',
        type: 3,
        required: true,
      },
      {
        name: 'materials',
        description: 'Key textiles (e.g., Palpali Dhaka, Himalayan Hemp, Raw Mulberry Silk)',
        type: 3,
        required: true,
      },
      {
        name: 'description',
        description: 'Design concept, silhouette details, and cultural story',
        type: 3,
        required: true,
      },
      {
        name: 'image_url',
        description: 'Direct link to sketch, CAD render, or lookbook image',
        type: 3,
        required: false,
      },
    ],
  },
  {
    name: 'challenge',
    description: 'View the active weekly fashion design brief and the NPR 5,000 bounty criteria',
  },
  {
    name: 'verify',
    description: 'Verify your Dawosti purchase order to unlock exclusive Patron Suite access',
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
