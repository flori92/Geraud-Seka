import Head from "next/head";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Head>
        <title>SEKA Platform</title>
      </Head>
      <main className="min-h-screen bg-slate-50 p-8">
        <section className="mx-auto max-w-4xl rounded-lg border border-slate-200 bg-white p-10 shadow-sm">
          <h1 className="text-3xl font-semibold text-slate-900">
            SEKA – Portail en construction
          </h1>
          <p className="mt-4 text-slate-600">
            Le socle Next.js est prêt. Les modules seront activés au fur et à mesure du développement
            (authentification, gestion des dossiers, collecte des pièces, rappels, etc.).
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/login"
              className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Se connecter
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
            >
              Créer un cabinet
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
