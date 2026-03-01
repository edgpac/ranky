/**
 * Generate public/og-image.png (1200×630) using sharp + inline SVG.
 * Run: node scripts/generate-og.mjs
 */

import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const logoB64 = readFileSync(join(root, 'public/hayvista-logo.png')).toString('base64');

const W = 1200;
const H = 630;

// ── Dot grid ──────────────────────────────────────────────────────────────────
const GAP = 42;
let dots = '';
for (let x = GAP; x < W; x += GAP) {
  for (let y = GAP; y < H; y += GAP) {
    dots += `<circle cx="${x}" cy="${y}" r="1.1" fill="white" fill-opacity="0.04"/>`;
  }
}

// ── Feature pills (no emoji — libvips XML parser can't handle them) ───────────
const FEATURES = [
  { text: 'AI Post Generator',   w: 186 },
  { text: 'Review Management',   w: 182 },
  { text: 'Insights + Analytics',w: 190 },
  { text: 'Photo Sync',          w: 140 },
];
const pillGap = 16;
const totalW = FEATURES.reduce((s, f) => s + f.w, 0) + pillGap * (FEATURES.length - 1);
let cx = (W - totalW) / 2;
let pillsSvg = '';
for (const f of FEATURES) {
  const px = cx;
  const pw = f.w;
  pillsSvg += `
    <rect x="${px}" y="488" width="${pw}" height="34" rx="17"
      fill="rgba(79,142,247,0.10)" stroke="rgba(79,142,247,0.28)" stroke-width="1"/>
    <text x="${px + pw / 2}" y="509"
      font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="600"
      fill="#93b4f8" text-anchor="middle">${f.text}</text>`;
  cx += pw + pillGap;
}

// ── Full SVG ──────────────────────────────────────────────────────────────────
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink">

  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#050a18"/>
      <stop offset="100%" stop-color="#0c1630"/>
    </linearGradient>
    <linearGradient id="accentLine" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#4f8ef7"/>
      <stop offset="100%" stop-color="#34d399"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="15%" r="50%">
      <stop offset="0%" stop-color="#4f8ef7" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="#4f8ef7" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <!-- Dot grid -->
  ${dots}

  <!-- Top accent stripe -->
  <rect x="0" y="0" width="${W}" height="3" fill="url(#accentLine)" opacity="0.85"/>

  <!-- Logo -->
  <image
    x="${(W - 104) / 2}" y="68"
    width="104" height="104"
    href="data:image/png;base64,${logoB64}"/>

  <!-- Headline line 1 -->
  <text x="${W / 2}" y="244"
    font-family="Arial Black, Arial, Helvetica, sans-serif"
    font-size="52" font-weight="900" letter-spacing="-1"
    fill="rgba(240,244,255,0.96)" text-anchor="middle">
    Your Google Business Profile,
  </text>

  <!-- Headline line 2 — gradient via rect + clip workaround: just use accent blue -->
  <text x="${W / 2}" y="308"
    font-family="Arial Black, Arial, Helvetica, sans-serif"
    font-size="52" font-weight="900" letter-spacing="-1"
    fill="#4f8ef7" text-anchor="middle">
    on autopilot.
  </text>

  <!-- Subheadline -->
  <text x="${W / 2}" y="368"
    font-family="Arial, Helvetica, sans-serif"
    font-size="21" font-weight="400"
    fill="rgba(200,215,255,0.50)" text-anchor="middle">
    AI-powered posts, reviews and insights for local businesses. $17/month.
  </text>

  <!-- Thin divider -->
  <line x1="${W / 2 - 220}" y1="406" x2="${W / 2 + 220}" y2="406"
    stroke="rgba(255,255,255,0.07)" stroke-width="1"/>

  <!-- Feature pills -->
  ${pillsSvg}

  <!-- Domain -->
  <text x="${W / 2}" y="590"
    font-family="Arial, Helvetica, sans-serif"
    font-size="17" font-weight="600" letter-spacing="0.05em"
    fill="rgba(200,215,255,0.26)" text-anchor="middle">hayvista.com</text>

</svg>`;

// ── Write PNG ─────────────────────────────────────────────────────────────────
mkdirSync(join(root, 'public'), { recursive: true });

await sharp(Buffer.from(svg))
  .png({ compressionLevel: 9 })
  .toFile(join(root, 'public/og-image.png'));

console.log('✅  public/og-image.png generated (1200x630)');
