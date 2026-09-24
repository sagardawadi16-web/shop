import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';
import { encodePNG } from './png-encoder.js';

const WIDTH = 512;
const HEIGHT = 512;
const CX = WIDTH / 2;
const CY = HEIGHT / 2;

// RGBA buffer initialized to 0 (100% transparent)
const buffer = Buffer.alloc(WIDTH * HEIGHT * 4);

function setPixel(x, y, r, g, b, a) {
  if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return;
  const idx = (y * WIDTH + x) * 4;
  const bgA = buffer[idx + 3] / 255;
  const srcA = a / 255;
  const outA = srcA + bgA * (1 - srcA);

  if (outA > 0) {
    buffer[idx] = Math.round((r * srcA + buffer[idx] * bgA * (1 - srcA)) / outA);
    buffer[idx + 1] = Math.round((g * srcA + buffer[idx + 1] * bgA * (1 - srcA)) / outA);
    buffer[idx + 2] = Math.round((b * srcA + buffer[idx + 2] * bgA * (1 - srcA)) / outA);
    buffer[idx + 3] = Math.round(outA * 255);
  }
}

// Draw anti-aliased circle
function drawCircle(cx, cy, radius, strokeWidth, r, g, b, alpha = 255) {
  const minX = Math.floor(cx - radius - strokeWidth - 1);
  const maxX = Math.ceil(cx + radius + strokeWidth + 1);
  const minY = Math.floor(cy - radius - strokeWidth - 1);
  const maxY = Math.ceil(cy + radius + strokeWidth + 1);
  const halfStroke = strokeWidth / 2;

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const d = Math.hypot(x - cx, y - cy);
      const distFromRing = Math.abs(d - radius);
      if (distFromRing < halfStroke + 1) {
        let edgeAlpha = 1;
        if (distFromRing > halfStroke - 1) {
          edgeAlpha = Math.max(0, Math.min(1, halfStroke + 1 - distFromRing));
        }
        setPixel(x, y, r, g, b, Math.round(alpha * edgeAlpha));
      }
    }
  }
}

// Draw filled rotated diamond (mandala facet)
function drawDiamond(cx, cy, w, h, r, g, b, alpha = 255) {
  for (let y = Math.floor(cy - h); y <= Math.ceil(cy + h); y++) {
    for (let x = Math.floor(cx - w); x <= Math.ceil(cx + w); x++) {
      const dx = Math.abs(x - cx) / w;
      const dy = Math.abs(y - cy) / h;
      if (dx + dy <= 1) {
        setPixel(x, y, r, g, b, alpha);
      }
    }
  }
}

// Render the luxury emblem
console.log('✨ Rendering haute-couture centered Dawosti emblem (transparent background)...');

// 1. Concentric gold filigree rings (Radius 195 and 185)
drawCircle(CX, CY, 195, 3.5, 212, 175, 55, 255); // Rich Gold #D4AF37
drawCircle(CX, CY, 185, 1.8, 243, 229, 171, 240); // Champagne Gold #F3E5AB
drawCircle(CX, CY, 175, 1.0, 212, 175, 55, 180);

// 2. Eight-pointed radial lotus diamond accents around the perimeter
for (let i = 0; i < 8; i++) {
  const angle = (i * Math.PI) / 4;
  const px = CX + Math.cos(angle) * 185;
  const py = CY + Math.sin(angle) * 185;
  drawDiamond(px, py, 5, 5, 212, 175, 55, 255);
}

// 3. Central Deep Velvet Burgundy circular disc with soft gold rim
const coreRadius = 145;
for (let y = CY - coreRadius; y <= CY + coreRadius; y++) {
  for (let x = CX - coreRadius; x <= CX + coreRadius; x++) {
    const d = Math.hypot(x - CX, y - CY);
    if (d <= coreRadius) {
      const grad = d / coreRadius;
      // Burgundy gradient (#8A1C2E to #5E101E)
      const r = Math.round(138 * (1 - grad * 0.3));
      const g = Math.round(28 * (1 - grad * 0.3));
      const b = Math.round(46 * (1 - grad * 0.3));
      let a = 255;
      if (d > coreRadius - 1.5) {
        a = Math.round(255 * (coreRadius - d + 0.5));
      }
      setPixel(x, y, r, g, b, a);
    }
  }
}
drawCircle(CX, CY, coreRadius, 2.5, 212, 175, 55, 255); // Inner gold rim

// 4. Render the majestic Royal Monogram 'D'
// Vertical stem of the 'D'
const stemX = CX - 48;
const stemTop = CY - 80;
const stemBottom = CY + 80;
const stemWidth = 24;

for (let y = stemTop; y <= stemBottom; y++) {
  for (let x = stemX; x <= stemX + stemWidth; x++) {
    // Gold gradient with highlights
    const gradX = (x - stemX) / stemWidth;
    const r = Math.round(212 + gradX * 31);
    const g = Math.round(175 + gradX * 45);
    const b = Math.round(55 + gradX * 80);
    setPixel(x, y, r, g, b, 255);
  }
}

// Serifs at top and bottom of stem
drawDiamond(stemX + 12, stemTop, 22, 6, 245, 215, 127, 255);
drawDiamond(stemX + 12, stemBottom, 22, 6, 245, 215, 127, 255);

// Curved bowl of the 'D'
const bowlCenterX = CX - 30;
const bowlRadiusY = 78;
const bowlRadiusX = 85;
const bowlThick = 24;

for (let y = CY - bowlRadiusY - 2; y <= CY + bowlRadiusY + 2; y++) {
  for (let x = bowlCenterX; x <= bowlCenterX + bowlRadiusX + bowlThick + 2; x++) {
    const dy = (y - CY) / bowlRadiusY;
    const dx = (x - bowlCenterX) / bowlRadiusX;
    const distOuter = dx * dx + dy * dy;

    const innerRadX = bowlRadiusX - bowlThick;
    const innerRadY = bowlRadiusY - bowlThick;
    const dxi = (x - bowlCenterX) / innerRadX;
    const dyi = (y - CY) / innerRadY;
    const distInner = dxi * dxi + dyi * dyi;

    if (distOuter <= 1 && distInner >= 1 && x >= stemX + stemWidth / 2) {
      const grad = (x - bowlCenterX) / (bowlRadiusX + bowlThick);
      const r = Math.round(212 + grad * 31);
      const g = Math.round(175 + grad * 40);
      const b = Math.round(55 + grad * 70);
      setPixel(x, y, r, g, b, 255);
    }
  }
}

// Crown fleur / apex diamond at the top
drawDiamond(CX, CY - coreRadius - 16, 12, 14, 212, 175, 55, 255);
drawDiamond(CX, CY - coreRadius - 16, 7, 9, 255, 245, 200, 255);

// Base pedestal diamond
drawDiamond(CX, CY + coreRadius + 16, 10, 10, 212, 175, 55, 255);

// Save PNG
const pngBuffer = encodePNG(WIDTH, HEIGHT, buffer);
const logoPath = path.resolve('public', 'logo.png');
const faviconPath = path.resolve('public', 'favicon.png');

fs.writeFileSync(logoPath, pngBuffer);
fs.writeFileSync(faviconPath, pngBuffer);
console.log(`✅ Saved 512x512 transparent centered logo to: ${logoPath} (${pngBuffer.length} bytes)`);

// 5. Generate high-fidelity SVG as well for crisp website scaling
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F5D77F"/>
      <stop offset="50%" stop-color="#D4AF37"/>
      <stop offset="100%" stop-color="#AA771C"/>
    </linearGradient>
    <radialGradient id="burgundyGrad" cx="40%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#8A1C2E"/>
      <stop offset="100%" stop-color="#4E0C17"/>
    </radialGradient>
    <filter id="subtleGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Outer Filigree Gold Rings -->
  <circle cx="256" cy="256" r="195" fill="none" stroke="url(#goldGrad)" stroke-width="3.5" />
  <circle cx="256" cy="256" r="185" fill="none" stroke="#F3E5AB" stroke-width="1.5" stroke-dasharray="8 6" opacity="0.8" />
  <circle cx="256" cy="256" r="175" fill="none" stroke="url(#goldGrad)" stroke-width="1" opacity="0.6" />

  <!-- Core Velvet Disc -->
  <circle cx="256" cy="256" r="145" fill="url(#burgundyGrad)" stroke="url(#goldGrad)" stroke-width="3" filter="url(#subtleGlow)" />

  <!-- Regal Monogram D -->
  <g fill="url(#goldGrad)" filter="url(#subtleGlow)">
    <!-- Stem -->
    <rect x="208" y="176" width="24" height="160" rx="2"/>
    <!-- Top & Bottom Serifs -->
    <polygon points="196,176 244,176 236,184 204,184"/>
    <polygon points="196,336 244,336 236,328 204,328"/>
    <!-- Bowl -->
    <path d="M 226,182 C 285,182 328,212 328,256 C 328,300 285,330 226,330 L 226,306 C 265,306 300,285 300,256 C 300,227 265,206 226,206 Z" />
  </g>

  <!-- Crest Apex Diamond -->
  <polygon points="256,92 268,110 256,126 244,110" fill="url(#goldGrad)"/>
  <polygon points="256,98 264,110 256,120 248,110" fill="#FFF8F0"/>

  <!-- Base Accent Diamond -->
  <polygon points="256,386 266,400 256,412 246,400" fill="url(#goldGrad)"/>
</svg>`;

fs.writeFileSync(path.resolve('public', 'logo.svg'), svgContent, 'utf8');
console.log('✅ Saved public/logo.svg vector asset');

// 6. Push to Discord Server Icon & Bot Avatar
async function updateDiscord() {
  const token = process.env.DISCORD_BOT_TOKEN;
  const guildId = '1432647277587075134';
  if (!token) return;

  const base64Icon = 'data:image/png;base64,' + pngBuffer.toString('base64');

  console.log('\n🌐 Updating Discord Server Icon with centered transparent logo...');
  try {
    const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ icon: base64Icon }),
    });
    const data = await res.json();
    console.log('✅ Discord Guild Icon updated! Hash:', data.icon);
  } catch (e) {
    console.warn('Failed to update guild icon:', e.message);
  }

  console.log('🤖 Updating Discord Bot Avatar with centered transparent logo...');
  try {
    const res = await fetch('https://discord.com/api/v10/users/@me', {
      method: 'PATCH',
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ avatar: base64Icon }),
    });
    const data = await res.json();
    console.log('✅ Discord Bot Avatar updated! Hash:', data.avatar);
  } catch (e) {
    console.warn('Failed to update bot avatar:', e.message);
  }
}

updateDiscord().catch(console.error);
