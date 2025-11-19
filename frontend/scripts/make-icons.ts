import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import pngToIco from 'png-to-ico';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC = path.join(__dirname, '..', 'src', 'assets', 'logo_blue.png');
const OUT_DIR = path.join(__dirname, '..', 'build');

if (!fs.existsSync(SRC)) {
  console.error('Source PNG fehlt:', SRC);
  process.exit(1);
}
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const icoSizes = [16, 24, 32, 48, 64, 128, 256, 512];
const linuxSize = 1024;

async function createIcons() {
  try {
    const pngPaths: string[] = [];
    for (const size of icoSizes) {
      const filePath = path.join(OUT_DIR, `icon_${size}x${size}.png`);
      await sharp(SRC).resize(size, size).toFile(filePath);
      pngPaths.push(filePath);
    }

    const icoBuffer = await pngToIco(pngPaths);
    fs.writeFileSync(path.join(OUT_DIR, 'icon.ico'), icoBuffer);
    console.log('Wrote', path.join(OUT_DIR, 'icon.ico'));

    await sharp(SRC).resize(linuxSize, linuxSize).toFile(path.join(OUT_DIR, 'icon.png'));
    console.log('Wrote', path.join(OUT_DIR, 'icon.png'));

    const iconsetDir = path.join(OUT_DIR, 'icon.iconset');
    if (!fs.existsSync(iconsetDir)) fs.mkdirSync(iconsetDir);

    const macSizes: [number, string][] = [
      [16, 'icon_16x16.png'],
      [32, 'icon_16x16@2x.png'],
      [32, 'icon_32x32.png'],
      [64, 'icon_32x32@2x.png'],
      [128, 'icon_128x128.png'],
      [256, 'icon_128x128@2x.png'],
      [256, 'icon_256x256.png'],
      [512, 'icon_256x256@2x.png'],
      [512, 'icon_512x512.png'],
      [1024, 'icon_512x512@2x.png']
    ];

    for (const [size, fileName] of macSizes) {
      const outFile = path.join(iconsetDir, fileName);
      await sharp(SRC).resize(size, size).toFile(outFile);
    }

    try {
      execSync('which iconutil', { stdio: 'ignore' });
      const icnsOut = path.join(OUT_DIR, 'icon.icns');
      execSync(`iconutil -c icns "${iconsetDir}" -o "${icnsOut}"`, { stdio: 'inherit' });
      console.log('Wrote', icnsOut);
    } catch {
      console.warn('iconutil nicht verfügbar — .icns wurde nicht erzeugt (nur auf macOS verfügbar).');
      console.warn('Manuelle Erzeugung auf Mac oder CI nötig.');
    }

    console.log('Icon-Erzeugung abgeschlossen.');
  } catch (error) {
    console.error('Fehler beim Erzeugen der Icons:', error);
    process.exit(1);
  }
}

createIcons();
