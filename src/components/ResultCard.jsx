export default function ResultCard({
  score,
  risk,
  explanation,
}) {
  return (
    <div className="bg-slate-800 rounded-xl p-6 text-white shadow-lg">

      <h2 className="text-2xl font-bold mb-5">
        Detection Result
      </h2>

      <p>
        <strong>Authenticity:</strong> {score}%
      </p>

      <p className="mt-2">
        <strong>Risk:</strong> {risk}
      </p>

      <p className="mt-4 text-slate-300">
        {explanation}
      </p>

    </div>
  );
}