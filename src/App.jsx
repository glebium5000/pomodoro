/**
 * pomodoro.glebium.me — a quiet timer over painted gardens.
 * Backgrounds: house for pomodoro, forest path for breaks (crossfade).
 * Card layout inspired by pomofox: icon controls up top, filling ring,
 * cycle indicator, mode tabs below.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePomodoro, MODES } from './usePomodoro.js'
import SettingsPanel from './components/SettingsPanel.jsx'
import SessionLog from './components/SessionLog.jsx'
import MusicDock from './components/MusicDock.jsx'

const pad = (n) => String(n).padStart(2, '0')

export default function App() {
  const {
    mode, cycleCount, running, remaining, total,
    settings, log,
    start, pause, reset, skip, switchMode, updateSettings, clearLog,
  } = usePomodoro()

  const [showSettings, setShowSettings] = useState(false)
  const [showLog, setShowLog] = useState(false)
  const [isFull, setIsFull] = useState(false)

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60

  // tab title
  useEffect(() => {
    document.title = running
      ? `${pad(mins)}:${pad(secs)} · ${MODES[mode].label} — pomodoro`
      : 'pomodoro — glebium.me'
  }, [running, mins, secs, mode])

  // fullscreen
  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen()
    else document.documentElement.requestFullscreen().catch(() => {})
  }, [])
  useEffect(() => {
    const onChange = () => setIsFull(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  // keyboard: Space start/pause, R reset, F fullscreen, Esc close panels
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT') return
      if (e.code === 'Space') { e.preventDefault(); running ? pause() : start() }
      if (e.key === 'r' || e.key === 'R') reset()
      if (e.key === 'f' || e.key === 'F') toggleFullscreen()
      if (e.key === 'Escape') { setShowSettings(false); setShowLog(false) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [running, start, pause, reset, toggleFullscreen])

  // ring: FILLS as time elapses (per the brief)
  const R = 112
  const CIRC = 2 * Math.PI * R
  const elapsedFrac = total > 0 ? 1 - remaining / total : 0
  const dash = CIRC * elapsedFrac

  // cycle tomatoes: filled = completed pomodoros in this cycle
  const tomatoes = useMemo(
    () => Array.from({ length: settings.longEvery }, (_, i) => i < cycleCount),
    [settings.longEvery, cycleCount],
  )

  const isBreak = mode !== 'pomodoro'

  return (
    <div className="scene">
      {/* two stacked backgrounds; break image fades in over the house */}
      <div className="bg bg-focus" aria-hidden="true" />
      <div className={`bg bg-break ${isBreak ? 'is-visible' : ''}`} aria-hidden="true" />
      <div className="bg-tint" aria-hidden="true" />

      <main className={`card ${isBreak ? 'card-break' : ''}`}>
        {/* icon controls */}
        <div className="controls-row">
          <button className="icon-btn" onClick={running ? pause : start} title={running ? 'Pause (Space)' : 'Start (Space)'}>
            {running ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button className="icon-btn" onClick={reset} title="Reset (R)"><ResetIcon /></button>
          <button className="icon-btn" onClick={skip} title="Skip to next"><SkipIcon /></button>
          <button
            className={`icon-btn ${!settings.sound ? 'is-off' : ''}`}
            onClick={() => updateSettings({ sound: !settings.sound })}
            title={settings.sound ? 'Sound on' : 'Sound off'}
          >
            {settings.sound ? <SoundIcon /> : <MuteIcon />}
          </button>
          <button className={`icon-btn ${showLog ? 'is-active' : ''}`} onClick={() => { setShowLog(v => !v); setShowSettings(false) }} title="Today's sessions"><ListIcon /></button>
          <button className="icon-btn" onClick={() => { setShowSettings(true); setShowLog(false) }} title="Settings"><GearIcon /></button>
          <button className="icon-btn" onClick={toggleFullscreen} title="Fullscreen (F)">
            {isFull ? <ShrinkIcon /> : <ExpandIcon />}
          </button>
        </div>

        {/* the ring */}
        <div className="dial" aria-live="polite">
          <svg viewBox="0 0 250 250" className="ring" aria-hidden="true">
            <circle cx="125" cy="125" r={R} className="ring-track" />
            <circle
              cx="125" cy="125" r={R}
              className="ring-fill"
              strokeDasharray={`${dash} ${CIRC}`}
              transform="rotate(-90 125 125)"
            />
          </svg>
          <div className="clock">{pad(mins)}:{pad(secs)}</div>
        </div>

        {/* cycle indicator */}
        <div className="cycle-row" title={`${cycleCount} of ${settings.longEvery} pomodoros this cycle`}>
          <span className="cycle-label">cycle:</span>
          {tomatoes.map((filled, i) => (
            <img
              key={i}
              className={`tomato ${filled ? 'is-filled' : ''}`}
              src={filled ? '/icons/tomato.png' : '/icons/tomato-dim.png'}
              alt=""
              width="18"
              height="18"
            />
          ))}
        </div>

        {/* mode tabs */}
        <nav className="mode-row" aria-label="Timer modes">
          {Object.entries(MODES).map(([key, meta]) => (
            <button
              key={key}
              className={`mode-btn ${mode === key ? 'is-active' : ''}`}
              onClick={() => switchMode(key)}
              aria-pressed={mode === key}
            >
              {meta.label}
            </button>
          ))}
        </nav>

        {showLog && <SessionLog log={log} onClear={clearLog} />}
      </main>

      <MusicDock />

      <p className="art-credit">art: Studio Ghibli · The Secret World of Arrietty</p>

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onChange={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

/* ── tiny inline icons (stroke inherits currentColor) ── */
const I = ({ children }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
)
const PlayIcon = () => <I><polygon points="6 3 20 12 6 21 6 3" fill="currentColor" stroke="none" /></I>
const PauseIcon = () => <I><rect x="5" y="4" width="4.5" height="16" rx="1" fill="currentColor" stroke="none" /><rect x="14.5" y="4" width="4.5" height="16" rx="1" fill="currentColor" stroke="none" /></I>
const ResetIcon = () => <I><path d="M3 12a9 9 0 1 0 2.6-6.4" /><polyline points="3 4 3 8 7 8" /></I>
const SkipIcon = () => <I><polygon points="5 4 15 12 5 20 5 4" fill="currentColor" stroke="none" /><rect x="17" y="4" width="3" height="16" rx="1" fill="currentColor" stroke="none" /></I>
const SoundIcon = () => <I><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9 9 0 0 1 0 13" /></I>
const MuteIcon = () => <I><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" /><line x1="15" y1="9" x2="21" y2="15" /><line x1="21" y1="9" x2="15" y2="15" /></I>
const ListIcon = () => <I><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><circle cx="4" cy="6" r="0.5" fill="currentColor" /><circle cx="4" cy="12" r="0.5" fill="currentColor" /><circle cx="4" cy="18" r="0.5" fill="currentColor" /></I>
const GearIcon = () => <I><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></I>
const ExpandIcon = () => <I><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></I>
const ShrinkIcon = () => <I><polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" /><line x1="14" y1="10" x2="21" y2="3" /><line x1="3" y1="21" x2="10" y2="14" /></I>
