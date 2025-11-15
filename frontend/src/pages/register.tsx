import { FormEvent, useState } from "react";
import Head from "next/head";
import Link from "next/link";

import { register, type RegisterPayload } from "@/lib/api";

const initialValues: RegisterPayload = {
  tenant_name: "",
  tenant_slug: "",
  tenant_country: "",
  email: "",
  password: "",
  full_name: "",
};

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterPayload>(initialValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleChange<K extends keyof RegisterPayload>(key: K, value: RegisterPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const payload: RegisterPayload = {
        ...form,
        tenant_country: form.tenant_country || undefined,
        full_name: form.full_name || undefined,
      };

      await register(payload);
      setSuccess(true);
    } catch (err) {
      setError("Échec de l'inscription. Vérifiez les informations fournies.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Inscription – SEKA</title>
      </Head>
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <section className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Créer un cabinet SEKA</h1>
          <p className="mt-2 text-sm text-slate-600">
            Créez un tenant (cabinet) et un utilisateur administrateur.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="tenant_name" className="block text-sm font-medium text-slate-700">
                  Nom du cabinet
                </label>
                <input
                  id="tenant_name"
                  required
                  value={form.tenant_name}
                  onChange={(e) => handleChange("tenant_name", e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label htmlFor="tenant_slug" className="block text-sm font-medium text-slate-700">
                  Identifiant (slug)
                </label>
                <input
                  id="tenant_slug"
                  required
                  value={form.tenant_slug}
                  onChange={(e) => handleChange("tenant_slug", e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="tenant_country" className="block text-sm font-medium text-slate-700">
                  Pays (optionnel)
                </label>
                <input
                  id="tenant_country"
                  value={form.tenant_country}
                  onChange={(e) => handleChange("tenant_country", e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-slate-700">
                  Nom complet (optionnel)
                </label>
                <input
                  id="full_name"
                  value={form.full_name}
                  onChange={(e) => handleChange("full_name", e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
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
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && (
              <p className="text-sm text-emerald-600">
                Cabinet créé avec succès. Vous pouvez maintenant vous connecter.
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Création en cours..." : "Créer le cabinet"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-600">
            Vous avez déjà un compte ?{" "}
            <Link href="/login" className="font-medium text-slate-900 hover:underline">
              Se connecter
            </Link>
          </p>
        </section>
      </main>
    </>
  );
}
