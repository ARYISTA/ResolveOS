export default function CasesPage() {
  return (
    <div style={{ maxWidth: 1200 }}>
      <h1>Cases</h1>
      <p style={{ color: "var(--text-muted)", marginTop: 8 }}>
        All cases for the current tenant. Filter by status, risk, outcome, or
        date range. Click a row to open the live case view.
      </p>
    </div>
  );
}
