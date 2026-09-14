"use client";
import { useState } from "react";
import { sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { endDemoSession, startDemoSession } from "@/services/auth";
export default function Login() {
    const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [showPassword, setShowPassword] = useState(false);
const [rememberMe, setRememberMe] = useState(false);
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");
const router = useRouter();
const handleLogin = async () => {
  if (!email.trim() || !password) {
    setError("Enter your email and password to continue.");
    return;
  }
  setLoading(true);
  setError("");
  try {
    await signInWithEmailAndPassword(auth, email, password);
    endDemoSession();
    if (rememberMe) localStorage.setItem("deepshield-remembered-email", email);
    router.push("/dashboard");
  } catch (error) {
    setError(error.code === "auth/invalid-credential" ? "The email or password is not correct." : error.message);
  } finally {
    setLoading(false);
  }
};
const handleDemoLogin = async () => { await signOut(auth); startDemoSession(); router.push("/dashboard"); };
const handleReset = async () => {
  if (!email.trim()) { setError("Enter your email first, then request a reset link."); return; }
  try { await sendPasswordResetEmail(auth, email); setError("Password reset email sent. Check your inbox."); } catch (resetError) { setError(resetError.message); }
};
  return (
    <main className="auth-page">
      <Link href="/" className="auth-back"><ArrowLeft size={15} /> Back to DeepShield</Link>
      <div className="auth-layout"><section className="auth-story"><span className="auth-mark"><ShieldCheck size={22} /></span><p className="page-kicker">Authenticity lab / secure entry</p><h1>Bring a sharper<br /><em>eye to the feed.</em></h1><p>Sign in to inspect your next file with a workspace designed for careful digital forensics.</p><div className="auth-note"><LockKeyhole size={15} /> Your session is protected by Firebase Authentication.</div></section><section className="auth-card surface"><p className="page-kicker">Welcome back</p><h2>Enter your workspace</h2><label>Email address<input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /></label><label>Password<div className="password-field"><input type={showPassword ? "text" : "password"} placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} /><button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Hide" : "Show"}</button></div></label><div className="auth-options"><label className="checkbox-label"><input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} /> Remember me</label><button type="button" className="text-button" onClick={handleReset}>Forgot password?</button></div>{error && <p className="auth-message">{error}</p>}<button onClick={handleLogin} disabled={loading} className="auth-submit">{loading ? "Opening workspace..." : "Open workspace"} <ArrowRight size={16} /></button><div className="auth-divider"><span>OR</span></div><button type="button" onClick={handleDemoLogin} className="demo-submit">Try Demo <span>Temporary local session · no credentials required</span></button><p className="auth-switch">New to DeepShield? <Link href="/signup">Create an account</Link></p></section></div>
    </main>
  );
}