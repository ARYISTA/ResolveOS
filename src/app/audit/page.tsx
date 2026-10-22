export default function AuditPage() {
  return (
    <div style={{ maxWidth: 1200 }}>
      <h1>Audit log</h1>
      <p style={{ color: "var(--text-muted)", marginTop: 8 }}>
        Filterable event table: timestamp, tenant, case id, actor, actor type,
        action, old state, new state, trace id. Export to CSV.
      </p>
    </div>
  );
}
