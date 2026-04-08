/**
 * Converts brand SVG wordmarks from <text> to outlined <path> using the same
 * Google Fonts TTFs as production. Run: node scripts/outline-logo-svgs.cjs
 *
 * Fonts are cached under scripts/.font-cache/ (gitignored).
 */
const fs = require("fs");
const https = require("https");
const path = require("path");
const opentype = require("opentype.js");

const FONTS = {
  syne800:
    "https://fonts.gstatic.com/s/syne/v24/8vIS7w4qzmVxsWxjBZRjr0FKM_24vj6k.ttf",
  dmSans400:
    "https://fonts.gstatic.com/s/dmsans/v17/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAopxhTg.ttf",
};

const CACHE_DIR = path.join(__dirname, ".font-cache");

function download(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) {
      resolve();
      return;
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const file = fs.createWriteStream(dest);
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`GET ${url} -> ${res.statusCode}`));
          return;
        }
        res.pipe(file);
        file.on("finish", () => {
          file.close(resolve);
        });
      })
      .on("error", reject);
  });
}

function mergeBBox(a, b) {
  if (!a) return b;
  if (!b) return a;
  return {
    x1: Math.min(a.x1, b.x1),
    y1: Math.min(a.y1, b.y1),
    x2: Math.max(a.x2, b.x2),
    y2: Math.max(a.y2, b.y2),
  };
}

function outlineString(font, text, startX, baselineY, fontSize, letterSpacing) {
  const scale = fontSize / font.unitsPerEm;
  const chunks = [];
  let x = startX;
  for (let i = 0; i < text.length; i++) {
    const glyph = font.charToGlyph(text[i]);
    const gPath = glyph.getPath(x, baselineY, fontSize);
    chunks.push(gPath.toPathData(4));
    if (i < text.length - 1) {
      const nextGlyph = font.charToGlyph(text[i + 1]);
      const kern = font.getKerningValue(glyph, nextGlyph) * scale;
      x += glyph.advanceWidth * scale + kern + letterSpacing;
    }
  }
  return chunks.join(" ");
}

function stringBBox(font, text, startX, baselineY, fontSize, letterSpacing) {
  const scale = fontSize / font.unitsPerEm;
  let x = startX;
  let bb = null;
  for (let i = 0; i < text.length; i++) {
    const glyph = font.charToGlyph(text[i]);
    const gPath = glyph.getPath(x, baselineY, fontSize);
    const b = gPath.getBoundingBox();
    bb = mergeBBox(bb, b);
    if (i < text.length - 1) {
      const nextGlyph = font.charToGlyph(text[i + 1]);
      const kern = font.getKerningValue(glyph, nextGlyph) * scale;
      x += glyph.advanceWidth * scale + kern + letterSpacing;
    }
  }
  return bb;
}

function outlineSegmented(font, text, startX, baselineY, fontSize, letterSpacing, fillAtIndex) {
  const scale = fontSize / font.unitsPerEm;
  const byFill = new Map();
  let x = startX;
  for (let i = 0; i < text.length; i++) {
    const glyph = font.charToGlyph(text[i]);
    const d = glyph.getPath(x, baselineY, fontSize).toPathData(4);
    const fill = fillAtIndex(i);
    if (!byFill.has(fill)) byFill.set(fill, []);
    byFill.get(fill).push(d);
    if (i < text.length - 1) {
      const nextGlyph = font.charToGlyph(text[i + 1]);
      const kern = font.getKerningValue(glyph, nextGlyph) * scale;
      x += glyph.advanceWidth * scale + kern + letterSpacing;
    }
  }
  return byFill;
}

/** Bounding box of segmented outlines (same geometry as outlineSegmented). */
function segmentedBBox(font, text, startX, baselineY, fontSize, letterSpacing) {
  const scale = fontSize / font.unitsPerEm;
  let x = startX;
  let bb = null;
  for (let i = 0; i < text.length; i++) {
    const glyph = font.charToGlyph(text[i]);
    const gPath = glyph.getPath(x, baselineY, fontSize);
    const b = gPath.getBoundingBox();
    bb = mergeBBox(bb, b);
    if (i < text.length - 1) {
      const nextGlyph = font.charToGlyph(text[i + 1]);
      const kern = font.getKerningValue(glyph, nextGlyph) * scale;
      x += glyph.advanceWidth * scale + kern + letterSpacing;
    }
  }
  return bb;
}

function padBBox(bb, pad) {
  return {
    x1: bb.x1 - pad,
    y1: bb.y1 - pad,
    x2: bb.x2 + pad,
    y2: bb.y2 + pad,
  };
}

async function main() {
  await download(FONTS.syne800, path.join(CACHE_DIR, "Syne-800.ttf"));
  await download(FONTS.dmSans400, path.join(CACHE_DIR, "DMSans-400.ttf"));

  const syne = await opentype.load(path.join(CACHE_DIR, "Syne-800.ttf"));
  const dm = await opentype.load(path.join(CACHE_DIR, "DMSans-400.ttf"));

  const imagesDir = path.join(__dirname, "..", "public", "images");
  const pad = 2;

  const iconPrimaryBb = { x1: 6, y1: 6, x2: 46, y2: 46 };
  const wmPrimary1 = stringBBox(syne, "ZERO ENTRY", 58, 21, 17, -0.3);
  const wmPrimary2 = stringBBox(dm, "AI", 58, 40, 13, 0.22 * 13);
  let pBb = mergeBBox(iconPrimaryBb, mergeBBox(wmPrimary1, wmPrimary2));
  pBb = padBBox(pBb, pad);
  const pW = Math.ceil(pBb.x2 - pBb.x1);
  const pH = Math.ceil(pBb.y2 - pBb.y1);

  const primaryLight = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${pW}" height="${pH}" viewBox="${pBb.x1} ${pBb.y1} ${pW} ${pH}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Icon: Zero with arrow through it -->
  <circle cx="26" cy="26" r="20" stroke="#5B4FE8" stroke-width="2.5" fill="none"/>
  <line x1="10" y1="26" x2="42" y2="26" stroke="#5B4FE8" stroke-width="2.5" stroke-linecap="round"/>
  <polyline points="36,20 42,26 36,32" fill="none" stroke="#5B4FE8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="26" cy="26" r="3" fill="#5B4FE8"/>
  <!-- Wordmark (outlined) -->
  <path fill="#111111" d="${outlineString(syne, "ZERO ENTRY", 58, 21, 17, -0.3)}"/>
  <path fill="#5B4FE8" d="${outlineString(dm, "AI", 58, 40, 13, 0.22 * 13)}"/>
</svg>
`;

  const primaryDark = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${pW}" height="${pH}" viewBox="${pBb.x1} ${pBb.y1} ${pW} ${pH}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Icon: Zero with arrow through it -->
  <circle cx="26" cy="26" r="20" stroke="#7C6FFF" stroke-width="2.5" fill="none"/>
  <line x1="10" y1="26" x2="42" y2="26" stroke="#7C6FFF" stroke-width="2.5" stroke-linecap="round"/>
  <polyline points="36,20 42,26 36,32" fill="none" stroke="#7C6FFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="26" cy="26" r="3" fill="#A89DFF"/>
  <!-- Wordmark (outlined) -->
  <path fill="#ffffff" d="${outlineString(syne, "ZERO ENTRY", 58, 21, 17, -0.3)}"/>
  <path fill="#7C6FFF" d="${outlineString(dm, "AI", 58, 40, 13, 0.22 * 13)}"/>
</svg>
`;

  const compactText = "ZeroEntryAI";
  const segLight = outlineSegmented(syne, compactText, 44, 26, 18, -0.5, (i) =>
    i < 9 ? "#5B4FE8" : "#111111"
  );
  const iconCompactBb = { x1: 6, y1: 6, x2: 34, y2: 34 };
  const wmCompact = segmentedBBox(syne, compactText, 44, 26, 18, -0.5);
  let cBb = mergeBBox(iconCompactBb, wmCompact);
  cBb = padBBox(cBb, pad);
  const cW = Math.ceil(cBb.x2 - cBb.x1);
  const cH = Math.ceil(cBb.y2 - cBb.y1);

  const compactLight = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${cW}" height="${cH}" viewBox="${cBb.x1} ${cBb.y1} ${cW} ${cH}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Compact icon -->
  <circle cx="20" cy="20" r="14" stroke="#5B4FE8" stroke-width="2" fill="none"/>
  <line x1="8" y1="20" x2="32" y2="20" stroke="#5B4FE8" stroke-width="2" stroke-linecap="round"/>
  <polyline points="26,14 32,20 26,26" fill="none" stroke="#5B4FE8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="20" cy="20" r="2.5" fill="#5B4FE8"/>
  <!-- Wordmark (outlined) -->
  <path fill="#5B4FE8" d="${segLight.get("#5B4FE8").join(" ")}"/>
  <path fill="#111111" d="${segLight.get("#111111").join(" ")}"/>
</svg>
`;

  const segDark = outlineSegmented(syne, compactText, 44, 26, 18, -0.5, (i) =>
    i < 9 ? "url(#wordGrad)" : "#ffffff"
  );
  const compactDark = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${cW}" height="${cH}" viewBox="${cBb.x1} ${cBb.y1} ${cW} ${cH}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="wordGrad" x1="0" y1="0" x2="200" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#7C6FFF"/>
      <stop offset="60%" stop-color="#A89DFF"/>
    </linearGradient>
  </defs>
  <!-- Compact icon -->
  <circle cx="20" cy="20" r="14" stroke="#7C6FFF" stroke-width="2" fill="none"/>
  <line x1="8" y1="20" x2="32" y2="20" stroke="#7C6FFF" stroke-width="2" stroke-linecap="round"/>
  <polyline points="26,14 32,20 26,26" fill="none" stroke="#7C6FFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="20" cy="20" r="2.5" fill="#A89DFF"/>
  <!-- Wordmark (outlined) -->
  <path fill="url(#wordGrad)" d="${segDark.get("url(#wordGrad)").join(" ")}"/>
  <path fill="#ffffff" d="${segDark.get("#ffffff").join(" ")}"/>
</svg>
`;

  fs.writeFileSync(path.join(imagesDir, "logo-primary-light.svg"), primaryLight.trim() + "\n");
  fs.writeFileSync(path.join(imagesDir, "logo-primary-dark.svg"), primaryDark.trim() + "\n");
  fs.writeFileSync(path.join(imagesDir, "logo-compact-light.svg"), compactLight.trim() + "\n");
  fs.writeFileSync(path.join(imagesDir, "logo-compact-dark.svg"), compactDark.trim() + "\n");

  console.log(`Primary logo: ${pW}×${pH} (viewBox ${pBb.x1} ${pBb.y1} ${pW} ${pH})`);
  console.log(`Compact logo: ${cW}×${cH} (viewBox ${cBb.x1} ${cBb.y1} ${cW} ${cH})`);
  console.log("Wrote outlined logos to public/images/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
