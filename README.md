# Arcade Lab — showreel + critic

A fictional studio site and a 20-second motion-graphics reel. Every frame is a pure function of time. A contact sheet, one still per beat, is scored until every mark is an 8 or better. Then Playwright and ffmpeg export the master.

Inspired by [Eugen Voyager’s showreel prompt](https://x.com/byEugenVoyager/status/2104956225846714589). Arcade Lab is not a real studio. Nothing here calls a paid generation API.

## What you get

- A Vite site in the studio’s own type and palette: Oxanium for display, Sora for UI, phosphor / coral / gold on cabinet black.
- A Remotion composition (`ArcadeLabReel`, 1080×1350, 30 fps, 600 frames) you can scrub in the browser. Same component the exporter paints.
- A critic bay. It starts from a deliberately weak edit (small type, muddy contrast, late cuts, a late URL, sticker clutter) and rewrites the three worst scores until hook, phone readability, motion, variety, brand, and sound sync all clear 8.
- A soundtrack synthesized in `src/audio/synth.ts`: 120 BPM, kicks on the grid, aimed at −14 LUFS.
- `npm run export` — headless Chrome via Playwright, then ffmpeg (H.264, yuv420p, CRF 16) plus a 40-frame contact sheet.

## Scripts

```bash
npm install
npm run dev          # site at http://127.0.0.1:5173
npm run critic       # print the score trace; fails if the lock is under 8
npm run audio        # write public/score.wav and print measured LUFS
npm run build        # static site into dist/
npm run export       # full 20s master → public/arcade-lab-reel.mp4
npm run export -- --quick   # 2 seconds of frames, no encode
```

The stage page used by the exporter is `/?stage=1`. It exposes `window.seek(t)`.

## Critic

Scores are measurements, not a vision model:

| Mark | What it reads |
| --- | --- |
| Hook | Opening punch and wordmark scale |
| Phone readability | Headline pixels, contrast, clutter |
| Motion | How far type and the car actually travel |
| Variety | Whether six scenes stay distinct or get buried |
| Brand | Phosphor mix, and whether `arcadelab.gg` holds 2s+ |
| Sound sync | Scene-cut offset against the 500ms kick |

The art-directed lock is the pass that clears every mark. The exported film uses that lock.

## Deploy

Static Vite build. `public/arcade-lab-reel.mp4`, `public/score.wav`, `public/poster.png`, and `public/contact-sheet.png` are generated locally and shipped with the site so the preview does not need Chrome. Vercel config is `vercel.json`.
