import { FormEvent, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { Mail, Lock, AlertCircle } from "lucide-react";

import { getApiErrorMessage, getCurrentUser, login } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Form, FormGroup } from "@/components/ui/Form";
import { Container } from "@/components/layout/Container";

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
      setError(
        apiMessage ?? "Échec de la connexion. Vérifiez vos identifiants."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Connexion – SEKA</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              <div className="w-10 h-10 rounded-lg bg-primary-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <h1 className="text-2xl font-bold text-neutral-900">SEKA</h1>
            </Link>
            <p className="mt-3 text-neutral-600">
              Gestion d'entreprise simplifiée
            </p>
          </div>

          {/* Login Card */}
          <Card variant="elevated" className="shadow-xl">
            <div className="space-y-6">
              {/* Titre */}
              <div>
                <h2 className="text-2xl font-bold text-neutral-900">
                  Connexion
                </h2>
                <p className="mt-1 text-sm text-neutral-600">
                  Connectez-vous à votre compte SEKA
                </p>
              </div>

              {/* Message d'erreur */}
              {error && (
                <div className="flex items-start gap-3 p-4 bg-status-danger/10 border border-status-danger/20 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-status-danger flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-status-danger">{error}</p>
                </div>
              )}

              {/* Formulaire */}
              <Form onSubmit={handleSubmit} className="space-y-4">
                <FormGroup label="Adresse e-mail" required>
                  <Input
                    type="email"
                    icon={<Mail className="h-4 w-4" />}
                    placeholder="exemple@entreprise.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </FormGroup>

                <FormGroup label="Mot de passe" required>
                  <Input
                    type="password"
                    icon={<Lock className="h-4 w-4" />}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                </FormGroup>

                {/* Forgot Password */}
                <div className="text-right">
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  fullWidth
                  loading={loading}
                  className="mt-6"
                >
                  {loading ? "Connexion en cours..." : "Se connecter"}
                </Button>
              </Form>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-neutral-500">ou</span>
                </div>
              </div>

              {/* Sign Up Link */}
              <p className="text-center text-sm text-neutral-600">
                Pas encore de compte ?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                >
                  Créer un compte
                </Link>
              </p>
            </div>
          </Card>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-neutral-500">
            En vous connectant, vous acceptez nos{" "}
            <Link href="/terms" className="underline hover:no-underline">
              conditions d'utilisation
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
