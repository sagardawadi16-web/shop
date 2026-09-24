import fs from 'node:fs';

async function check() {
  const configPath = 'C:\\Users\\LENOVO\\AppData\\Roaming\\xdg.config\\.wrangler\\config\\default.toml';
  const content = fs.readFileSync(configPath, 'utf8');
  const token = content.match(/oauth_token\s*=\s*"([^"]+)"/)[1];
  const zoneId = '57dcc222780c8f58bcb97c93e4688054';

  const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  console.log('DNS full:', data);

  // Check worker details for dashain-shopping
  const workerRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/569866bd4f9f60dd06e64ae273361fa5/workers/scripts/dashain-shopping/subdomain`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Worker subdomain status:', await workerRes.json());

  // Check worker domains
  const domainRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/569866bd4f9f60dd06e64ae273361fa5/workers/domains`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Worker custom domains:', await domainRes.json());
}

check().catch(console.error);
