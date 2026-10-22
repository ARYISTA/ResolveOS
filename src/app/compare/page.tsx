export default function ComparePage() {
  return (
    <div style={{ maxWidth: 1200 }}>
      <h1>Architecture comparison</h1>
      <p style={{ color: "var(--text-muted)", marginTop: 8 }}>
        Run one case through five approaches: Manual, Rules-only, Pure LLM,
        RAG-only, Hybrid (proposed). Compare decision, accuracy, latency, and
        cost per approach.
      </p>
    </div>
  );
}
