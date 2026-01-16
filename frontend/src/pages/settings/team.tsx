import { useState, useEffect } from "react";
import Head from "next/head";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { Mail, Plus, Shield, User, Users, Trash2, RefreshCw, Clock, CheckCircle, XCircle } from "lucide-react";
import { api } from "@/lib/api";

type MemberRole = "admin" | "manager" | "accountant" | "viewer";

type TeamMember = {
  id: string;
  full_name: string;
  email: string;
  role: MemberRole;
  status: "active" | "invited";
  created_at?: string;
};

type Invitation = {
  id: string;
  email: string;
  role: MemberRole;
  invited_by_name: string;
  status: "pending" | "expired";
  created_at: string;
  expires_at: string;
};

const roleLabels: Record<MemberRole, string> = {
  admin: "Administrateur",
  manager: "Gestion",
  accountant: "Comptabilité",
  viewer: "Lecture",
};

export default function TeamSettingsPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("viewer");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      const [membersRes, invitationsRes] = await Promise.all([
        api.get("/api/v1/team/members"),
        api.get("/api/v1/team/invitations")
      ]);
      setMembers(membersRes.data);
      setInvitations(invitationsRes.data);
    } catch (err: any) {
      console.error("Erreur chargement équipe:", err);
      setError("Impossible de charger les données de l'équipe");
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async () => {
    if (!inviteEmail) return;
    
    try {
      setSending(true);
      setError("");
      setSuccess("");
      
      await api.post("/api/v1/team/invite", {
        email: inviteEmail,
        role: inviteRole
      });
      
      setSuccess(`Invitation envoyée à ${inviteEmail} !`);
      setInviteEmail("");
      await loadTeamData();
      
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors de l'envoi de l'invitation");
    } finally {
      setSending(false);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      await api.post(`/api/v1/team/invitations/${invitationId}/resend`);
      setSuccess("Invitation renvoyée !");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors du renvoi");
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm("Annuler cette invitation ?")) return;
    
    try {
      await api.delete(`/api/v1/team/invitations/${invitationId}`);
      await loadTeamData();
      setSuccess("Invitation annulée");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors de l'annulation");
    }
  };

  const handleUpdateRole = async (userId: string, newRole: MemberRole) => {
    try {
      await api.put(`/api/v1/team/members/${userId}/role`, { role: newRole });
      await loadTeamData();
      setSuccess("Rôle mis à jour !");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors de la mise à jour");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Retirer ce membre de l'équipe ?")) return;
    
    try {
      await api.delete(`/api/v1/team/members/${userId}`);
      await loadTeamData();
      setSuccess("Membre retiré");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors de la suppression");
    }
  };

  return (
    <>
      <Head>
        <title>Gestion de l&apos;équipe - SEKA</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100">
                  <Users className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Gestion de l&apos;équipe</h1>
                  <p className="text-sm text-gray-600 mt-0.5">Ajoutez des utilisateurs et gérez leurs accès</p>
                </div>
              </div>
              <span className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">BETA</span>
            </div>
          </div>

          <div className="px-6 py-6 space-y-6 max-w-4xl">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span>{success}</span>
              </div>
            )}

            {/* Invite Member */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-1">Inviter un membre</h2>
              <p className="text-sm text-gray-600 mb-4">Envoyez une invitation par email avec Resend.</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <input 
                    type="email"
                    value={inviteEmail} 
                    onChange={(e) => setInviteEmail(e.target.value)} 
                    placeholder="email@exemple.com"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" 
                  />
                </div>
                <select 
                  value={inviteRole} 
                  onChange={(e) => setInviteRole(e.target.value as MemberRole)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                >
                  <option value="viewer">{roleLabels.viewer}</option>
                  <option value="accountant">{roleLabels.accountant}</option>
                  <option value="manager">{roleLabels.manager}</option>
                  <option value="admin">{roleLabels.admin}</option>
                </select>
              </div>

              <div className="pt-4">
                <button 
                  onClick={handleSendInvitation} 
                  disabled={!inviteEmail || sending}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#172e4d] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Envoyer une invitation
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Pending Invitations */}
            {invitations.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-900 mb-1">Invitations en attente</h2>
                <p className="text-sm text-gray-600 mb-4">{invitations.length} invitation(s) en attente de réponse.</p>

                <div className="divide-y divide-gray-100">
                  {invitations.map((inv) => (
                    <div key={inv.id} className="py-4 flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                          <Clock className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-gray-900">{inv.email}</div>
                          <div className="text-xs text-gray-600 mt-0.5">
                            Invité par {inv.invited_by_name} • {roleLabels[inv.role]}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {inv.status === "expired" ? (
                              <span className="text-red-600">Expirée</span>
                            ) : (
                              <span>Expire le {new Date(inv.expires_at).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleResendInvitation(inv.id)}
                          className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                          title="Renvoyer l'invitation"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleCancelInvitation(inv.id)}
                          className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                          title="Annuler l'invitation"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Members List */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-1">Membres actifs</h2>
              <p className="text-sm text-gray-600 mb-4">
                {loading ? "Chargement..." : `${members.length} membre(s) dans votre équipe.`}
              </p>

              {loading ? (
                <div className="py-8 text-center text-gray-500">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Chargement...
                </div>
              ) : members.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>Aucun membre pour le moment</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {members.map((m) => (
                    <div key={m.id} className="py-4 flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-gray-900">{m.full_name}</div>
                          <div className="text-sm text-gray-600 flex items-center gap-2 mt-0.5">
                            <Mail className="h-4 w-4" /> {m.email}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                            <Shield className="h-3.5 w-3.5" /> 
                            <select
                              value={m.role}
                              onChange={(e) => handleUpdateRole(m.id, e.target.value as MemberRole)}
                              className="text-xs border border-gray-200 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#1e3a5f]"
                            >
                              <option value="viewer">{roleLabels.viewer}</option>
                              <option value="accountant">{roleLabels.accountant}</option>
                              <option value="manager">{roleLabels.manager}</option>
                              <option value="admin">{roleLabels.admin}</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(m.id)}
                        className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                        title="Retirer ce membre"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
