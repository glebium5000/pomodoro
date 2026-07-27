# 🍅 pomodoro — glebium.me

A quiet pomodoro timer over painted garden backgrounds, for
**pomodoro.glebium.me**.

## Run locally

```bash
npm install
npm run dev
```

## Deploy at pomodoro.glebium.me

1. `npm run build`
2. Serve `dist/` at the subdomain root (add a DNS record for
   `pomodoro` pointing at your host, then upload `dist/`).
   No base-path config needed — subdomains serve from `/`.

## Features

- **Modes:** pomodoro / short break / long break, long break offered
  after every 4th pomodoro (configurable 2–8)
- **Filling ring** — the circle fills as the session progresses
- **Cycle tomatoes** — 🍅 fill up as you complete pomodoros
- **Session log** — every completed session recorded with time of day;
  daily totals; persists in localStorage, resets each day
- **Backgrounds** — the house for focus, the forest path for breaks
  (gentle crossfade)
- **Fullscreen** (F), Space = start/pause, R = reset, Esc = close panels
- **Chime** on session end (Web Audio, toggleable), mute button
- Deadline-based timing (accurate in background tabs), tab-title countdown,
  reduced-motion support

## Structure

```
src/
  App.jsx                       — scene, card, dial, icons
  usePomodoro.js                — timer logic + session log
  components/SettingsPanel.jsx
  components/SessionLog.jsx
  styles/global.css
public/backgrounds/             — focus.webp, break.webp
```

## Music

A corner music dock (bottom-right) with two stations:
- **lofi radio** — Lofi Girl live stream
- **summer mix** — upbeat summery track on loop

YouTube embeds play free for all visitors (no Premium needed; non-Premium
viewers may see an ad first). Browsers require one click to start audio.
The iframe only loads when the dock is opened, and the chosen station is
remembered. Note: YouTube's auto-generated "RD" radio playlists can't run
inside embeds, so the summer station loops its video instead.
