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
