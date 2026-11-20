import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const anyIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="40" y1="20" x2="480" y2="500" gradientUnits="userSpaceOnUse">
      <stop stop-color="#E1063A"/>
      <stop offset="0.5" stop-color="#C2187A"/>
      <stop offset="1" stop-color="#5B21E6"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#g)"/>
  <path d="M256 104 L404 236 V412 H108 V236 Z" fill="#FFFFFF"/>
  <path d="M214 412 V286 H298 V412" fill="#5B21E6"/>
</svg>`;

const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop stop-color="#E1063A"/>
      <stop offset="0.55" stop-color="#C2187A"/>
      <stop offset="1" stop-color="#5B21E6"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#g)"/>
  <path d="M256 148 L360 240 V372 H152 V240 Z" fill="#FFFFFF"/>
  <path d="M226 372 V286 H286 V372" fill="#5B21E6"/>
</svg>`;

const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
      <stop stop-color="#E1063A"/>
      <stop offset="1" stop-color="#5B21E6"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="8" fill="url(#g)"/>
  <path d="M16 6 L25 14 V26 H7 V14 Z" fill="#FFFFFF"/>
  <path d="M13 26 V18 H19 V26" fill="#5B21E6"/>
</svg>`;

await mkdir("public/icons", { recursive: true });

async function png(svg, size, file) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(file);
}

await png(anyIcon, 192, "public/icons/icon-192.png");
await png(anyIcon, 512, "public/icons/icon-512.png");
await png(anyIcon, 512, "app/icon.png");
await png(anyIcon, 180, "app/apple-icon.png");
await png(anyIcon, 180, "public/icons/apple-touch-icon.png");
await png(maskable, 512, "public/icons/icon-maskable-512.png");
await png(faviconSvg, 32, "public/favicon-32.png");

const png32 = await sharp(Buffer.from(faviconSvg)).resize(32, 32).png().toBuffer();
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
const entry = Buffer.alloc(16);
entry.writeUInt8(32, 0);
entry.writeUInt8(32, 1);
entry.writeUInt16LE(1, 4);
entry.writeUInt16LE(32, 6);
entry.writeUInt32LE(png32.length, 8);
entry.writeUInt32LE(22, 12);
const ico = Buffer.concat([header, entry, png32]);
await writeFile("app/favicon.ico", ico);
await writeFile("public/favicon.ico", ico);
console.log("icons written");
