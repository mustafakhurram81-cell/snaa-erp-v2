"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, Mail, Lock, ArrowRight, Factory, KeyRound } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
    const { signIn, loading: authLoading } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [showReset, setShowReset] = useState(false);
    const [resetEmail, setResetEmail] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            setLoading(false);
            return;
        }

        const { error } = await signIn(email, password);
        if (error) {
            setError(error);
            setLoading(false);
        } else {
            router.push("/");
        }
    };

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetEmail.trim()) { setError("Please enter your email"); return; }
        setLoading(true);
        setError("");

        const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
            redirectTo: `${window.location.origin}/login`,
        });

        if (error) {
            setError(error.message);
        } else {
            setSuccess("Password reset email sent! Check your inbox.");
            setShowReset(false);
            setResetEmail("");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--background)" }}>
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full" style={{ background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)" }} />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)" }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative w-full max-w-md"
            >
                {/* Logo / Brand */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", duration: 0.6, delay: 0.1 }}
                        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25"
                    >
                        <Factory className="w-8 h-8 text-white" />
                    </motion.div>
                    <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Smith Instruments</h1>
                    <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>Enterprise Resource Planning</p>
                </div>

                {/* Card */}
                <div className="rounded-2xl border p-8" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                    {/* Header */}
                    <div className="text-center mb-6">
                        <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
                            {showReset ? "Reset Password" : "Sign in to your account"}
                        </h2>
                        <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                            {showReset ? "Enter your email to receive a reset link" : "Contact your administrator for account access"}
                        </p>
                    </div>

                    {/* Error / Success */}
                    {error && (
                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                            className="mb-4 p-3 rounded-xl text-sm font-medium border"
                            style={{ color: "var(--destructive, #ef4444)", background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)" }}>
                            {error}
                        </motion.div>
                    )}
                    {success && (
                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                            className="mb-4 p-3 rounded-xl text-sm font-medium border"
                            style={{ color: "#10b981", background: "rgba(16,185,129,0.08)", borderColor: "rgba(16,185,129,0.2)" }}>
                            {success}
                        </motion.div>
                    )}

                    {!showReset ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Email */}
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@company.com"
                                        required
                                        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/50"
                                        style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="w-full pl-10 pr-12 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/50"
                                        style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                                        style={{ color: "var(--muted-foreground)" }}>
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Forgot password */}
                            <div className="text-right">
                                <button
                                    type="button"
                                    onClick={() => { setShowReset(true); setError(""); setSuccess(""); setResetEmail(email); }}
                                    className="text-xs font-medium transition-colors hover:underline"
                                    style={{ color: "var(--primary)" }}
                                >
                                    Forgot password?
                                </button>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading || authLoading}
                                className={`w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all shadow-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-blue-500/25 ${loading ? "opacity-70 cursor-not-allowed" : "hover:-translate-y-0.5"}`}
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <LogIn className="w-4 h-4" />
                                        Sign In
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handlePasswordReset} className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                                    <input
                                        type="email"
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                        placeholder="name@company.com"
                                        required
                                        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/50"
                                        style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all shadow-lg bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 shadow-violet-500/25 ${loading ? "opacity-70 cursor-not-allowed" : "hover:-translate-y-0.5"}`}
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <KeyRound className="w-4 h-4" />
                                        Send Reset Link
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => { setShowReset(false); setError(""); }}
                                className="w-full text-center text-xs font-medium transition-colors hover:underline"
                                style={{ color: "var(--muted-foreground)" }}
                            >
                                Back to sign in
                            </button>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-xs mt-6" style={{ color: "var(--muted-foreground)" }}>
                    Smith Instruments © 2026. Surgical Instruments Manufacturing ERP.
                </p>
            </motion.div>
        </div>
    );
}
