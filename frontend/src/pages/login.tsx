import { FormEvent, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";

import { getApiErrorMessage, getCurrentUser, login } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const tokens = await login(email, password);
      if (typeof window !== "undefined") {
        localStorage.setItem("seka_access_token", tokens.access_token);
        localStorage.setItem("seka_refresh_token", tokens.refresh_token);
        sessionStorage.removeItem("seka_invalid_token_handled");
      }

      await getCurrentUser(tokens.access_token);
      router.push("/dashboard");
    } catch (err) {
      const apiMessage = getApiErrorMessage(err);
      setError(apiMessage ?? "Échec de la connexion. Vérifiez vos identifiants.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Connexion – SEKA</title>
      </Head>

      {/* Premium Dark Login Page */}
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-[0.02] blur-3xl"></div>
          <div className="absolute top-0 right-1/4 h-96 w-96 rounded-full bg-white opacity-[0.015] blur-3xl"></div>
          <div className="absolute bottom-0 left-1/4 h-96 w-96 rounded-full bg-white opacity-[0.015] blur-3xl"></div>
        </div>

        <div className="relative w-full max-w-md px-4">
          {/* Logo */}
          <div className="mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2 transition-opacity hover:opacity-80">
              <h1 className="text-2xl font-bold text-white">SEKA</h1>
            </Link>
            <p className="mt-2 text-sm text-gray-500">Connectez-vous à votre compte</p>
          </div>

          {/* Login Card - Premium Glassmorphism */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition-all duration-300 hover:border-white/20">
            {/* Subtle light effect */}
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/5 to-white/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
            <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-white opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-5"></div>

            <div className="relative">
              <h2 className="mb-6 text-center text-2xl font-bold text-white">Connexion</h2>

              {error && (
                <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Input */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm transition-all focus:border-white/30 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
                    placeholder="votre@email.com"
                  />
                </div>

                {/* Password Input */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-2">
                    Mot de passe
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm transition-all focus:border-white/30 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
                    placeholder="••••••••"
                  />
                </div>

                {/* Forgot Password */}
                <div className="text-right">
                  <a href="#" className="text-sm text-gray-400 transition-colors hover:text-white">
                    Mot de passe oublié ?
                  </a>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group/btn relative w-full overflow-hidden rounded-lg bg-white px-4 py-3 text-base font-semibold text-gray-900 shadow-lg transition-all hover:shadow-xl hover:shadow-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white via-gray-100 to-white opacity-0 transition-opacity group-hover/btn:opacity-100"></div>
                  <span className="relative">
                    {loading ? "Connexion..." : "Se connecter"}
                  </span>
                </button>
              </form>

              {/* Divider */}
              <div className="my-6 flex items-center">
                <div className="flex-1 border-t border-white/10"></div>
                <span className="px-4 text-sm text-gray-500">ou</span>
                <div className="flex-1 border-t border-white/10"></div>
              </div>

              {/* Sign Up Link */}
              <div className="text-center">
                <p className="text-sm text-gray-400">
                  Pas encore de compte ?{" "}
                  <Link href="/register" className="font-medium text-white transition-colors hover:text-gray-300">
                    Créer un compte
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Back to Home */}
          <div className="mt-8 text-center">
            <Link href="/" className="text-sm text-gray-500 transition-colors hover:text-gray-400">
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
