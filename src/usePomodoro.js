/**
 * usePomodoro — timer brain for pomodoro.glebium.me
 * - Deadline-based (Date.now()) so it stays accurate in throttled tabs.
 * - Cycle: pomodoro → short break, long break after every Nth pomodoro.
 * - Records every completed session to a date-keyed log in localStorage.
 * - Soft two-note chime via Web Audio (toggleable).
 */
import { useCallback, useEffect, useRef, useState } from 'react'

const SETTINGS_KEY = 'pomodoro.settings.v1'
const LOG_KEY = 'pomodoro.log.v1'

export const MODES = {
  pomodoro: { label: 'pomodoro' },
  short: { label: 'short break' },
  long: { label: 'long break' },
}

const DEFAULT_SETTINGS = {
  pomodoroMin: 25,
  shortMin: 5,
  longMin: 15,
  longEvery: 4,
  autoContinue: false,
  sound: true,
}

const todayKey = () => new Date().toISOString().split('T')[0]

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return { ...fallback, ...JSON.parse(raw) }
  } catch { /* corrupted — use fallback */ }
  return { ...fallback }
}

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const note = (freq, t0, dur) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, ctx.currentTime + t0)
      gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + t0 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t0 + dur)
      osc.connect(gain).connect(ctx.destination)
      osc.start(ctx.currentTime + t0)
      osc.stop(ctx.currentTime + t0 + dur + 0.05)
    }
    note(830, 0, 0.9)
    note(1108, 0.18, 1.1)
    setTimeout(() => ctx.close(), 2000)
  } catch { /* audio blocked */ }
}

export function usePomodoro() {
  const [settings, setSettings] = useState(() => loadJSON(SETTINGS_KEY, DEFAULT_SETTINGS))

  // log: { date: 'YYYY-MM-DD', sessions: [{ at, mode, minutes }] }
  const [log, setLog] = useState(() => {
    const l = loadJSON(LOG_KEY, { date: todayKey(), sessions: [] })
    return l.date === todayKey() ? l : { date: todayKey(), sessions: [] }
  })

  const [mode, setMode] = useState('pomodoro')
  const [cycleCount, setCycleCount] = useState(0) // completed pomodoros in current cycle
  const [running, setRunning] = useState(false)

  const durationSec = useCallback((m, s = settings) => {
    const mins = m === 'pomodoro' ? s.pomodoroMin : m === 'short' ? s.shortMin : s.longMin
    return Math.max(1, Math.round(mins * 60))
  }, [settings])

  const [remaining, setRemaining] = useState(() => durationSec('pomodoro'))
  const deadlineRef = useRef(null)
  const tickRef = useRef(null)

  useEffect(() => { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) }, [settings])
  useEffect(() => { localStorage.setItem(LOG_KEY, JSON.stringify(log)) }, [log])

  const clearTick = () => { if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null } }

  const recordSession = useCallback((m) => {
    const minutes = m === 'pomodoro' ? settings.pomodoroMin : m === 'short' ? settings.shortMin : settings.longMin
    setLog(prev => {
      const base = prev.date === todayKey() ? prev : { date: todayKey(), sessions: [] }
      const at = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      return { ...base, sessions: [...base.sessions, { at, mode: m, minutes }] }
    })
  }, [settings])

  // partial credit when skipping mid-session (guarded by a 10s minimum
  // so accidental double-clicks don't spam the log)
  const recordPartial = useCallback((m, elapsedSec) => {
    setLog(prev => {
      const base = prev.date === todayKey() ? prev : { date: todayKey(), sessions: [] }
      const at = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      return {
        ...base,
        sessions: [...base.sessions, {
          at, mode: m,
          minutes: Math.round(elapsedSec / 60),
          partial: true,
        }],
      }
    })
  }, [])

  const advance = useCallback((natural) => {
    clearTick()
    setRunning(false)

    // skip with ≥10s on the clock → log partial credit (no tomato)
    if (!natural) {
      const elapsedSec = durationSec(mode) - remaining
      if (elapsedSec >= 10) recordPartial(mode, elapsedSec)
    }

    let nextMode
    let nextCycle = cycleCount

    if (mode === 'pomodoro') {
      if (natural) {
        recordSession('pomodoro')
        if (settings.sound) playChime()
        nextCycle = cycleCount + 1
        setCycleCount(nextCycle)
      }
      nextMode = (natural && nextCycle % settings.longEvery === 0) ? 'long'
        : (!natural && (cycleCount + 1) % settings.longEvery === 0) ? 'long'
        : 'short'
    } else {
      if (natural) {
        recordSession(mode)
        if (settings.sound) playChime()
      }
      if (mode === 'long') setCycleCount(0)
      nextMode = 'pomodoro'
    }

    setMode(nextMode)
    const nextDur = durationSec(nextMode)
    setRemaining(nextDur)

    if (natural && settings.autoContinue) {
      deadlineRef.current = Date.now() + nextDur * 1000
      setRunning(true)
    } else {
      deadlineRef.current = null
    }
  }, [mode, cycleCount, settings, durationSec, recordSession, recordPartial, remaining])

  const advanceRef = useRef(advance)
  useEffect(() => { advanceRef.current = advance }, [advance])

  useEffect(() => {
    if (!running) { clearTick(); return }
    if (!deadlineRef.current) deadlineRef.current = Date.now() + remaining * 1000
    tickRef.current = setInterval(() => {
      const left = Math.round((deadlineRef.current - Date.now()) / 1000)
      if (left <= 0) {
        setRemaining(0)
        advanceRef.current(true)
      } else {
        setRemaining(left)
      }
    }, 250)
    return clearTick
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  const start = useCallback(() => {
    deadlineRef.current = Date.now() + remaining * 1000
    setRunning(true)
  }, [remaining])

  const pause = useCallback(() => {
    clearTick()
    deadlineRef.current = null
    setRunning(false)
  }, [])

  const reset = useCallback(() => {
    clearTick()
    deadlineRef.current = null
    setRunning(false)
    setRemaining(durationSec(mode))
  }, [mode, durationSec])

  const skip = useCallback(() => advance(false), [advance])

  const switchMode = useCallback((m) => {
    clearTick()
    deadlineRef.current = null
    setRunning(false)
    setMode(m)
    setRemaining(durationSec(m))
  }, [durationSec])

  const updateSettings = useCallback((patch) => {
    setSettings(prev => {
      const next = { ...prev, ...patch }
      if (!running) setRemaining(durationSec(mode, next))
      return next
    })
  }, [running, mode, durationSec])

  const clearLog = useCallback(() => setLog({ date: todayKey(), sessions: [] }), [])

  return {
    mode, cycleCount, running, remaining, total: durationSec(mode),
    settings, log,
    start, pause, reset, skip, switchMode, updateSettings, clearLog,
  }
}
