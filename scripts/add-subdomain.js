import fs from 'node:fs';

async function addSubdomain() {
  const configPath = 'C:\\Users\\LENOVO\\AppData\\Roaming\\xdg.config\\.wrangler\\config\\default.toml';
  const content = fs.readFileSync(configPath, 'utf8');
  const token = content.match(/oauth_token\s*=\s*"([^"]+)"/)[1];
  const accountId = '569866bd4f9f60dd06e64ae273361fa5';
  const zoneId = '57dcc222780c8f58bcb97c93e4688054';

  const subdomains = ['referral.dawosti.com', 'creator.dawosti.com'];

  for (const hostname of subdomains) {
    console.log(`Attaching custom domain: ${hostname}...`);
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/domains`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        environment: 'production',
        hostname: hostname,
        service: 'dashain-shopping',
        zone_id: zoneId
      })
    });
    const data = await res.json();
    console.log(`Result for ${hostname}:`, data);
  }
}

addSubdomain().catch(console.error);
