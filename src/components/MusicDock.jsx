/**
 * MusicDock — corner radio with four stations and a proper volume slider.
 *
 * Uses the YouTube IFrame Player API so we control volume from our own
 * UI (default 40%, persisted) instead of YouTube's fiddly hover flyout,
 * which is nearly unusable at this player size.
 */
import { useEffect, useRef, useState } from 'react'

const STATIONS = {
  chill: { label: 'Club Penguin', id: 'SuJlexISEzk' },
  summer: { label: 'Summer mix', id: 'XVFUtEh9zrY' },
  mix3: { label: 'Jazz mix', id: 'MYPVQccHhAQ' },
  mix4: { label: 'Persona 5', id: 'ZXni9_91ORs' },
}

const DEFAULT_VOLUME = 30

/* load the IFrame API exactly once, shared across mounts */
let apiPromise = null
function loadYouTubeAPI() {
  if (apiPromise) return apiPromise
  apiPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) { resolve(window.YT); return }
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => { if (prev) prev(); resolve(window.YT) }
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
  })
  return apiPromise
}

export default function MusicDock() {
  const [open, setOpen] = useState(() => localStorage.getItem('pomodoro.music.open') === '1')
  // once music has started, the player stays alive even with the panel
  // closed — closing used to destroy the iframe and kill the music,
  // which forced the panel to stay open on top of the timer
  const [started, setStarted] = useState(false)
  const [station, setStation] = useState(() => {
    const s = localStorage.getItem('pomodoro.music.station')
    return STATIONS[s] ? s : 'chill'
  })
  const [volume, setVolume] = useState(() => {
    // NB: read the raw string first — Number(null) is 0, which previously
    // made a missing key initialise the slider at 0 instead of the default
    const raw = localStorage.getItem('pomodoro.music.volume')
    if (raw === null) return DEFAULT_VOLUME
    const v = Number(raw)
    return Number.isFinite(v) && v >= 0 && v <= 100 ? v : DEFAULT_VOLUME
  })

  const playerRef = useRef(null)
  const hostRef = useRef(null)

  useEffect(() => { localStorage.setItem('pomodoro.music.open', open ? '1' : '0') }, [open])
  useEffect(() => { localStorage.setItem('pomodoro.music.station', station) }, [station])
  useEffect(() => { localStorage.setItem('pomodoro.music.volume', String(volume)) }, [volume])
  useEffect(() => { if (open) setStarted(true) }, [open])

  // build (or rebuild) the player once started / on station change;
  // closing the panel no longer tears it down
  useEffect(() => {
    if (!started) return
    let cancelled = false

    loadYouTubeAPI().then((YT) => {
      if (cancelled || !hostRef.current) return
      const s = STATIONS[station]
      playerRef.current = new YT.Player(hostRef.current, {
        width: 300,
        height: 169,
        videoId: s.id,
        playerVars: {
          autoplay: 1,
          // loop single videos; the live stream just plays
          ...(s.live ? {} : { loop: 1, playlist: s.id }),
        },
        events: {
          onReady: (e) => {
            const raw = localStorage.getItem('pomodoro.music.volume')
            e.target.setVolume(raw === null ? DEFAULT_VOLUME : Number(raw))
            // if the browser blocks unmuted autoplay, the user just
            // presses play — volume is already set by then
            try { e.target.playVideo() } catch { /* noop */ }
          },
        },
      })
    })

    return () => {
      cancelled = true
      if (playerRef.current) {
        try { playerRef.current.destroy() } catch { /* already gone */ }
        playerRef.current = null
      }
    }
  }, [started, station])

  const changeVolume = (v) => {
    setVolume(v)
    const p = playerRef.current
    if (p && typeof p.setVolume === 'function') p.setVolume(v)
  }

  return (
    <div className="music-dock">
      {(started || open) && (
        <div className={`music-panel ${open ? '' : 'is-hidden'}`}>
          <div className="music-tabs">
            {Object.entries(STATIONS).map(([key, s]) => (
              <button
                key={key}
                className={`music-tab ${station === key ? 'is-active' : ''}`}
                onClick={() => setStation(key)}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* the API replaces the inner div with an iframe; keyed so a
              station switch tears down and rebuilds cleanly */}
          <div className="music-frame" key={station}>
            <div ref={hostRef} />
          </div>

          <div className="volume-row">
            <svg className="volume-icon" width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            </svg>
            <input
              className="volume-slider"
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => changeVolume(Number(e.target.value))}
              aria-label="Music volume"
            />
            <span className="volume-val">{volume}</span>
          </div>
        </div>
      )}

      <button
        className={`music-btn ${open ? 'is-open' : ''}`}
        onClick={() => setOpen(v => !v)}
        title={open ? 'Close music' : 'Open music'}
        aria-expanded={open}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      </button>
    </div>
  )
}
