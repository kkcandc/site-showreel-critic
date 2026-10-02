import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, copyFileSync } from 'node:fs';
import { chromium } from 'playwright';

const quick = process.argv.includes('--quick');
const FPS = 30;
const DURATION = quick ? 2 : 20;
const FRAMES = FPS * DURATION;
const WIDTH = 1080;
const HEIGHT = 1350;
const PORT = 4173;
const BASE = `http://127.0.0.1:${PORT}`;

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} exited ${code}`));
    });
  });
}

async function waitForServer() {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(BASE);
      if (response.ok) return;
    } catch {
      // preview is still booting
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error('vite preview did not start');
}

async function main() {
  await run('npx', ['tsx', 'scripts/render-audio.ts']);
  await run('npm', ['run', 'build']);

  const preview = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
    stdio: 'inherit',
  });
  const stopPreview = () => {
    if (!preview.killed) preview.kill('SIGTERM');
  };

  try {
    await waitForServer();
    const frameDir = 'out/frames';
    rmSync(frameDir, { recursive: true, force: true });
    mkdirSync(frameDir, { recursive: true });
    mkdirSync('public', { recursive: true });

    const browser = await chromium.launch({
      executablePath: process.env.CHROME_PATH || '/usr/local/bin/google-chrome',
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'],
    });
    const page = await browser.newPage({
      viewport: { width: WIDTH, height: HEIGHT },
      deviceScaleFactor: 1,
    });
    await page.goto(`${BASE}/?stage=1`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => typeof window.seek === 'function');

    for (let frame = 0; frame < FRAMES; frame += 1) {
      const t = frame / FPS;
      await page.evaluate((time) => window.seek(time), t);
      const name = String(frame).padStart(4, '0');
      await page.screenshot({ path: `${frameDir}/${name}.png`, type: 'png' });
      if (frame % 30 === 0) console.log(`frame ${frame}/${FRAMES}`);
    }
    await browser.close();

    if (!quick) {
      mkdirSync('out/beats', { recursive: true });
      for (let beat = 0; beat < 40; beat += 1) {
        copyFileSync(`${frameDir}/${String(beat * 15).padStart(4, '0')}.png`, `out/beats/${String(beat).padStart(2, '0')}.png`);
      }
      await run('ffmpeg', [
        '-y',
        '-framerate',
        '30',
        '-i',
        `${frameDir}/%04d.png`,
        '-i',
        'public/score.wav',
        '-c:v',
        'libx264',
        '-pix_fmt',
        'yuv420p',
        '-crf',
        '16',
        '-preset',
        'medium',
        '-c:a',
        'aac',
        '-b:a',
        '192k',
        '-ar',
        '48000',
        '-shortest',
        '-movflags',
        '+faststart',
        'public/arcade-lab-reel.mp4',
      ]);
      await run('ffmpeg', [
        '-y',
        '-i',
        'out/beats/%02d.png',
        '-vf',
        'scale=216:270,tile=8x5',
        '-frames:v',
        '1',
        '-update',
        '1',
        'public/contact-sheet.png',
      ]);
      copyFileSync(`${frameDir}/0030.png`, 'public/poster.png');
      await run('ffprobe', [
        '-v',
        'error',
        '-show_entries',
        'format=duration',
        '-show_entries',
        'stream=codec_name,width,height,pix_fmt',
        '-of',
        'default=nw=1',
        'public/arcade-lab-reel.mp4',
      ]);
    } else {
      console.log(`quick capture wrote ${FRAMES} frames to ${frameDir}`);
    }
  } finally {
    stopPreview();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
