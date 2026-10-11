// Builds the web app and packs it into ../data for the ESP32's LittleFS partition.
// Usage: npm run build:planter   then in PlatformIO: "Upload Filesystem Image".
//
// - Runs `expo export --platform web` into dist/
// - Copies the result to ../data/, gzipping text assets (js, css, html, ttf) because
//   ESPAsyncWebServer serves `<file>.gz` transparently with Content-Encoding: gzip
// - Prints the total so you can check it fits the littlefs partition (see
//   ../partitions_8MB_app_fs.csv, about 4.9 MB)
import { execSync } from 'node:child_process';
import { createReadStream, createWriteStream, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { createGzip } from 'node:zlib';

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(appDir, 'dist');
const data = resolve(appDir, '..', 'data');
const GZIP = new Set(['.js', '.css', '.html', '.json', '.svg', '.ttf']);
const SKIP = new Set(['_sitemap.html']); // dev-only route listing

console.log('> expo export --platform web');
execSync('npx expo export --platform web --output-dir dist', { cwd: appDir, stdio: 'inherit', env: { ...process.env, CI: '1' } });

rmSync(data, { recursive: true, force: true });
mkdirSync(data, { recursive: true });

let files = 0;
let bytes = 0;
async function copyTree(src) {
  for (const name of readdirSync(src)) {
    const from = join(src, name);
    const rel = relative(dist, from);
    if (statSync(from).isDirectory()) {
      await copyTree(from);
      continue;
    }
    if (SKIP.has(name)) continue;
    const gz = GZIP.has(extname(name));
    const to = join(data, rel + (gz ? '.gz' : ''));
    mkdirSync(dirname(to), { recursive: true });
    if (gz) await pipeline(createReadStream(from), createGzip({ level: 9 }), createWriteStream(to));
    else await pipeline(createReadStream(from), createWriteStream(to));
    files += 1;
    bytes += statSync(to).size;
  }
}
await copyTree(dist);

console.log(`\nPacked ${files} files, ${(bytes / 1024).toFixed(0)} KB into ${data}`);
if (!existsSync(join(data, 'index.html.gz'))) {
  console.error('index.html.gz is missing; the planter would fall back to the basic dashboard.');
  process.exit(1);
}
if (bytes > 4.5 * 1024 * 1024) {
  console.error('Too big for the littlefs partition (about 4.9 MB). Trim assets or enlarge the partition.');
  process.exit(1);
}
console.log('Next: PlatformIO > Upload Filesystem Image, then open http://192.168.4.1');
