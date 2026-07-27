export default function SettingsPanel({ settings, onChange, onClose }) {
  const num = (key, min, max) => (e) => {
    const v = Math.max(min, Math.min(max, Number(e.target.value) || min))
    onChange({ [key]: v })
  }

  return (
    <div className="scrim" onClick={onClose} role="presentation">
      <div
        className="settings"
        role="dialog"
        aria-modal="true"
        aria-label="Timer settings"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="settings-head">
          <h2>settings</h2>
          <button className="settings-close" onClick={onClose} aria-label="Close settings">×</button>
        </div>

        <div className="settings-grid">
          <label className="set-field">
            <span>pomodoro</span>
            <span className="set-input"><input type="number" min="1" max="120" value={settings.pomodoroMin} onChange={num('pomodoroMin', 1, 120)} /> min</span>
          </label>
          <label className="set-field">
            <span>short break</span>
            <span className="set-input"><input type="number" min="1" max="60" value={settings.shortMin} onChange={num('shortMin', 1, 60)} /> min</span>
          </label>
          <label className="set-field">
            <span>long break</span>
            <span className="set-input"><input type="number" min="1" max="90" value={settings.longMin} onChange={num('longMin', 1, 90)} /> min</span>
          </label>
          <label className="set-field">
            <span>long break every</span>
            <span className="set-input"><input type="number" min="2" max="8" value={settings.longEvery} onChange={num('longEvery', 2, 8)} /> pomodoros</span>
          </label>
        </div>

        <div className="settings-toggles">
          <label className="set-toggle">
            <input type="checkbox" checked={settings.autoContinue} onChange={(e) => onChange({ autoContinue: e.target.checked })} />
            <span>auto-start next session</span>
          </label>
          <label className="set-toggle">
            <input type="checkbox" checked={settings.sound} onChange={(e) => onChange({ sound: e.target.checked })} />
            <span>chime when a session ends</span>
          </label>
        </div>

        <p className="settings-note">duration changes apply to the next session</p>
      </div>
    </div>
  )
}
