"use client";

import Link from "next/link";
import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const router = useRouter();

  const handleSignup = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("Account Created Successfully!");
      router.push("/dashboard");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <main className="auth-page"><Link href="/" className="auth-back"><ArrowLeft size={15} /> Back to DeepShield</Link><div className="auth-layout"><section className="auth-story"><span className="auth-mark"><ShieldCheck size={22} /></span><p className="page-kicker">Authenticity lab / new workspace</p><h1>Make room for<br /><em>better questions.</em></h1><p>Build a private workspace for reviewing the digital evidence that matters to you.</p></section><section className="auth-card surface"><p className="page-kicker">Create account</p><h2>Start your workspace</h2><label>Email address<input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /></label><label>Password<input type="password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} /></label><button onClick={handleSignup} className="auth-submit">Create workspace <ArrowRight size={16} /></button><p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></p></section></div></main>
  );
}