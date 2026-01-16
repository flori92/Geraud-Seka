import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { CheckCircle, AlertCircle, Loader } from "lucide-react";
import { api } from "@/lib/api";

export default function AcceptInvitationPage() {
  const router = useRouter();
  const { token } = router.query;

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError("Token d'invitation manquant");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await api.post("/api/v1/team/accept-invitation", {
        token: token as string,
        full_name: fullName,
        password: password,
      });

      setSuccess(true);
      
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors de l'acceptation de l'invitation");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <Head>
          <title>Invitation acceptée - SEKA</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] to-[#2c5282] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Bienvenue sur SEKA ! 🎉</h1>
            <p className="text-gray-600 mb-6">
              Votre compte a été créé avec succès. Vous allez être redirigé vers la page de connexion...
            </p>
            <div className="flex justify-center">
              <Loader className="h-6 w-6 animate-spin text-[#1e3a5f]" />
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Accepter l&apos;invitation - SEKA</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] to-[#2c5282] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Rejoignez votre équipe
            </h1>
            <p className="text-gray-600">
              Créez votre compte pour commencer à utiliser SEKA
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleAcceptInvitation} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Nom complet
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Jean Dupont"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Au moins 8 caractères</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmer le mot de passe
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !fullName || !password || !confirmPassword}
              className="w-full bg-[#1e3a5f] text-white py-3 rounded-lg font-semibold hover:bg-[#172e4d] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  Création du compte...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Accepter et créer mon compte
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              En créant un compte, vous acceptez nos{" "}
              <a href="/terms" className="text-[#1e3a5f] hover:underline">
                conditions d&apos;utilisation
              </a>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Vous avez déjà un compte ?{" "}
              <a href="/login" className="text-[#1e3a5f] font-semibold hover:underline">
                Se connecter
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
