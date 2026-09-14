"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Image as ImageIcon,
  Video,
  Mic,
  FileText,
  History,
  User,
  LogOut,
} from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-950 text-white min-h-screen p-6">
      <h1 className="text-3xl font-bold text-cyan-400 mb-10">
        DeepShield
      </h1>

      <nav className="space-y-5">

        <Link href="/dashboard" className="flex items-center gap-3 hover:text-cyan-400">
          <LayoutDashboard size={20}/>
          Dashboard
        </Link>

        <Link href="/upload/image" className="flex items-center gap-3 hover:text-cyan-400">
          <ImageIcon size={20}/>
          Image Detection
        </Link>

        <Link href="/upload/document" className="flex items-center gap-3 hover:text-cyan-400">
          <FileText size={20}/>
          Document Detection
        </Link>

        <Link href="/upload/video" className="flex items-center gap-3 hover:text-cyan-400">
          <Video size={20}/>
          Video Detection
        </Link>

        <Link href="/upload/audio" className="flex items-center gap-3 hover:text-cyan-400">
          <Mic size={20}/>
          Audio Detection
        </Link>

        <Link href="/upload/text" className="flex items-center gap-3 hover:text-cyan-400">
          <FileText size={20}/>
          Text Detection
        </Link>

        <Link href="/history" className="flex items-center gap-3 hover:text-cyan-400">
          <History size={20}/>
          History
        </Link>

        <Link href="/profile" className="flex items-center gap-3 hover:text-cyan-400">
          <User size={20}/>
          Profile
        </Link>

        <button className="flex items-center gap-3 text-red-400 hover:text-red-500 mt-10">
          <LogOut size={20}/>
          Logout
        </button>

      </nav>
    </aside>
  );
}