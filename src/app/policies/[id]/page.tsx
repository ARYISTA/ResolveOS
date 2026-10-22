export default function PolicyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div style={{ maxWidth: 1200 }}>
      <h1>Policy {params.id}</h1>
      <p style={{ color: "var(--text-muted)", marginTop: 8 }}>
        PDF viewer on the left, extracted chunks panel on the right. Click a
        chunk to scroll the PDF to its page.
      </p>
    </div>
  );
}
