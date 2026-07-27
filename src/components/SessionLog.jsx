import { MODES } from '../usePomodoro.js'

export default function SessionLog({ log, onClear }) {
  // full pomodoros only for the count; partial focus minutes still add up
  const fullPomos = log.sessions.filter(s => s.mode === 'pomodoro' && !s.partial)
  const focusMin = log.sessions
    .filter(s => s.mode === 'pomodoro')
    .reduce((a, s) => a + s.minutes, 0)

  return (
    <section className="log" aria-label="Today's sessions">
      <div className="log-head">
        <span className="log-title">today</span>
        <span className="log-sum">
          {fullPomos.length} {fullPomos.length === 1 ? 'pomodoro' : 'pomodoros'} · {focusMin} min
        </span>
        {log.sessions.length > 0 && (
          <button className="log-clear" onClick={onClear} title="Clear today's log">clear</button>
        )}
      </div>
      {log.sessions.length === 0 ? (
        <p className="log-empty">no sessions yet — press start</p>
      ) : (
        <ul className="log-list">
          {[...log.sessions].reverse().map((s, i) => (
            <li key={i} className={`log-row ${s.mode !== 'pomodoro' ? 'is-break' : ''} ${s.partial ? 'is-partial' : ''}`}>
              <span className="log-at">{s.at}</span>
              <span className="log-mode">
                {MODES[s.mode].label}
                {s.partial && <span className="log-partial">partial</span>}
              </span>
              <span className="log-min">{s.minutes >= 1 ? `${s.minutes} min` : '<1 min'}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
