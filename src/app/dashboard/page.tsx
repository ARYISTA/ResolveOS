export default function DashboardPage() {
  return (
    <div style={{ maxWidth: 1200 }}>
      <h1>Dashboard</h1>
      <p style={{ color: "var(--text-muted)", marginTop: 8 }}>
        Overview: total cases, auto-resolved, escalated, rejected, total
        refunded, and average resolution time.
      </p>
    </div>
  );
}
