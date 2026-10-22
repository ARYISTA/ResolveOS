export default function SettingsPage() {
  return (
    <div style={{ maxWidth: 760 }}>
      <h1>Settings</h1>
      <p style={{ color: "var(--text-muted)", marginTop: 8 }}>
        Mock / Live toggle, API base URL, WebSocket URL, connection test. Model
        configuration (read-only in live mode). Demo controls: reset data,
        latency speed, force escalation.
      </p>
    </div>
  );
}
