export default function SecurityLabPage() {
  return (
    <div style={{ maxWidth: 1200 }}>
      <h1>Security lab</h1>
      <p style={{ color: "var(--text-muted)", marginTop: 8 }}>
        Attack preset cards: prompt injection, amount escalation, unauthorized
        refund, validation bypass, duplicate refund, policy manipulation. Launch
        and observe which layer blocks the attack.
      </p>
    </div>
  );
}
