/**
 * process-logo.mjs
 * Removes white background from the uploaded logo image and saves it
 * as logo.png and icon.png in the public/ directory.
 */
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INPUT = path.resolve(
  "C:/Users/HP/.gemini/antigravity/brain/4ead4210-c937-4dc4-8a7e-a9dbc7309dee/.user_uploaded/media_1789554399899.jpg"
);
const PUBLIC = path.resolve(__dirname, "..", "public");

async function run() {
  console.log("📷 Reading uploaded image...");

  // Load image and get raw pixel data
  const image = sharp(INPUT);
  const { width, height, channels } = await image.metadata();
  console.log(`   Size: ${width}x${height}, channels: ${channels}`);

  // Convert to raw RGBA
  const rawBuffer = await image
    .ensureAlpha()
    .raw()
    .toBuffer();

  // Process pixels: make near-white pixels transparent
  const threshold = 240; // pixels with R,G,B all > threshold become transparent
  for (let i = 0; i < rawBuffer.length; i += 4) {
    const r = rawBuffer[i];
    const g = rawBuffer[i + 1];
    const b = rawBuffer[i + 2];
    if (r > threshold && g > threshold && b > threshold) {
      rawBuffer[i + 3] = 0; // set alpha to 0 (transparent)
    }
  }

  // Save as logo.png (full size)
  const logoDest = path.join(PUBLIC, "logo.png");
  await sharp(rawBuffer, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(logoDest);
  console.log(`✅ Saved: ${logoDest}`);

  // Save as icon.png (same image, for favicon)
  const iconDest = path.join(PUBLIC, "icon.png");
  await sharp(rawBuffer, { raw: { width, height, channels: 4 } })
    .resize(192, 192)
    .png()
    .toFile(iconDest);
  console.log(`✅ Saved: ${iconDest}`);

  console.log("\n🎉 Done! Logo and icon updated with transparent background.");
}

run().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
