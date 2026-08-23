import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const archivo = await readFile(
  new URL("../node_modules/@fontsource-variable/archivo/files/archivo-latin-wght-normal.woff2", import.meta.url),
);
const embeddedFont = archivo.toString("base64");

const artwork = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <style>
      @font-face {
        font-family: "Archivo Social";
        src: url("data:font/woff2;base64,${embeddedFont}") format("woff2");
        font-style: normal;
        font-weight: 100 900;
      }
    </style>
    <rect width="1200" height="630" fill="#0a090c" />
    <g transform="translate(258 208) scale(1.35)">
      <path
        d="M134 127 C110 129 79 121 57 102 C36 84 29 55 43 34 C56 15 87 12 108 24 C129 36 139 61 132 84 C126 105 101 113 81 102 C62 92 53 71 61 55 C68 41 85 40 99 48 C112 57 116 74 109 86 C103 97 89 98 79 90 C70 83 68 71 74 63"
        fill="none"
        stroke="#38a3a5"
        stroke-width="8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </g>
    <text
      x="510"
      y="377"
      fill="#f0edee"
      font-family="Archivo Social"
      font-size="150"
      font-weight="650"
      letter-spacing="-6"
    >nomi</text>
  </svg>
`;

await sharp(Buffer.from(artwork))
  .png({ compressionLevel: 9 })
  .toFile(fileURLToPath(new URL("../public/social-card.png", import.meta.url)));

console.log("Generated public/social-card.png (1200x630).");
