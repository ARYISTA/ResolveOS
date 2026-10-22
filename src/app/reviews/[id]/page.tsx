export default function ReviewDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div style={{ maxWidth: 760 }}>
      <h1>Review — case {params.id}</h1>
      <p style={{ color: "var(--text-muted)", marginTop: 8 }}>
        Customer message, transaction, AI recommendation, citations, enforcement
        result, risk factors. Actions: Approve, Reject, Approve with modified
        amount.
      </p>
    </div>
  );
}
