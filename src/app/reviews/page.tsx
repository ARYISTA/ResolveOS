export default function ReviewsPage() {
  return (
    <div style={{ maxWidth: 1200 }}>
      <h1>Human review queue</h1>
      <p style={{ color: "var(--text-muted)", marginTop: 8 }}>
        Escalated cases awaiting reviewer decision. Each row shows case id,
        customer, amount, risk level, reason for escalation, and SLA timer.
      </p>
    </div>
  );
}
