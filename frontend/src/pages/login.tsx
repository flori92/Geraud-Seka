import { FormEvent, useState } from "react";
import Head from "next/head";

import { getCurrentUser, login, type User } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setUser(null);
    setLoading(true);

    try {
      const tokens = await login(email, password);
      if (typeof window !== "undefined") {
        localStorage.setItem("seka_access_token", tokens.access_token);
        localStorage.setItem("seka_refresh_token", tokens.refresh_token);
      }

      const me = await getCurrentUser(tokens.access_token);
      setUser(me);
    } catch (err) {
      setError("Échec de la connexion. Vérifiez vos identifiants.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Connexion – SEKA</title>
      </Head>
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Connexion</h1>
          <p className="mt-2 text-sm text-slate-600">
            Connectez-vous avec votre compte SEKA.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Connexion en cours..." : "Se connecter"}
            </button>
          </form>

          {user && (
            <div className="mt-6 rounded-md bg-slate-50 p-4 text-sm text-slate-800">
              <p className="font-medium">Connecté en tant que :</p>
              <p className="mt-1">{user.email}</p>
              {user.full_name && <p className="mt-1">{user.full_name}</p>}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
