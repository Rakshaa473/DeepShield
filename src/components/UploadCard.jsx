import Link from "next/link";

export default function UploadCard({ title, description, href }) {
  return (
    <Link href={href}>
      <div className="bg-slate-800 rounded-xl p-6 hover:bg-slate-700 transition cursor-pointer shadow-lg">

        <h2 className="text-xl font-bold text-cyan-400">
          {title}
        </h2>

        <p className="text-slate-300 mt-2">
          {description}
        </p>

      </div>
    </Link>
  );
}