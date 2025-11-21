import { FormEvent, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

import { getCurrentUser, login, type User } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

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
      }

      await getCurrentUser(tokens.access_token);
      router.push("/dashboard");
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
      <main className="flex min-h-screen flex-col items-center justify-center bg-accents-1 p-4 font-sans text-foreground">
        <div className="mb-8 flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-foreground"></div>
          <span className="text-xl font-bold tracking-tight">SEKA</span>
        </div>

        <Card className="w-full max-w-md p-8 shadow-geist">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Bon retour</h1>
            <p className="mt-2 text-sm text-accents-5">
              Entrez vos identifiants pour accéder à votre espace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              type="email"
              label="Email"
              placeholder="nom@exemple.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              id="password"
              type="password"
              label="Mot de passe"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && (
              <div className="rounded-md bg-error-lighter p-3 text-sm text-error-dark">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              loading={loading}
            >
              Se connecter
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-accents-4">
            Vous n'avez pas de compte ? <a href="#" className="text-foreground underline hover:text-accents-6">Contactez le support</a>
          </p>
        </Card>
      </main>
    </>
  );
}
