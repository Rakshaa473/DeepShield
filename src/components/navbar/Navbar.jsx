import Link from "next/link";


export default function Navbar() {
  return (
    <nav className="w-full flex justify-between items-center px-10 py-5 bg-transparent text-white">

      <h1 className="text-3xl font-bold text-cyan-400">
        DeepShield
      </h1>

      <div className="flex gap-8 text-lg">
        <a href="#">Home</a>
        <a href="#">About</a>
        <a href="#">Features</a>
        <a href="#">Contact</a>
      </div>

      
       <Link href="/login">
        <button className="bg-cyan-500 hover:bg-cyan-600 px-6 py-2 rounded-lg">
         Login
        </button>
       </Link>

    </nav>
  );
}