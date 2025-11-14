import Head from "next/head";

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
        </section>
      </main>
    </>
  );
}
