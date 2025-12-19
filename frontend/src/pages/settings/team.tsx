import { useState } from "react";
import Head from "next/head";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { Mail, Plus, Shield, User, Users } from "lucide-react";

type MemberRole = "admin" | "manager" | "accountant" | "viewer";

type TeamMember = {
  id: string;
  full_name: string;
  email: string;
  role: MemberRole;
  status: "active" | "invited";
};

const roleLabels: Record<MemberRole, string> = {
  admin: "Administrateur",
  manager: "Gestion",
  accountant: "Comptabilité",
  viewer: "Lecture",
};

export default function TeamSettingsPage() {
  const [members] = useState<TeamMember[]>([
    { id: "1", full_name: "Administrateur", email: "admin@seka.local", role: "admin", status: "active" },
  ]);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("viewer");

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
            {/* Invite Member */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-1">Inviter un membre</h2>
              <p className="text-sm text-gray-600 mb-4">Envoi d&apos;invitation par email (à connecter).</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@exemple.com"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
                </div>
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as MemberRole)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
                  <option value="admin">{roleLabels.admin}</option>
                  <option value="manager">{roleLabels.manager}</option>
                  <option value="accountant">{roleLabels.accountant}</option>
                  <option value="viewer">{roleLabels.viewer}</option>
                </select>
              </div>

              <div className="pt-4">
                <button onClick={() => alert("Invitation à connecter au backend.")} disabled={!inviteEmail}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#172e4d] disabled:opacity-50 disabled:cursor-not-allowed">
                  <Plus className="h-4 w-4" /> Envoyer une invitation
                </button>
              </div>
            </div>

            {/* Members List */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-1">Membres</h2>
              <p className="text-sm text-gray-600 mb-4">Liste des utilisateurs de l&apos;entreprise.</p>

              <div className="divide-y divide-gray-100">
                {members.map((m) => (
                  <div key={m.id} className="py-4 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{m.full_name}</div>
                        <div className="text-sm text-gray-600 flex items-center gap-2 mt-0.5">
                          <Mail className="h-4 w-4" /> {m.email}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                          <Shield className="h-3.5 w-3.5" /> {roleLabels[m.role]}
                          {m.status === "invited" && <span className="ml-2">(invité)</span>}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => alert("Gestion des rôles à connecter au backend.")}
                      className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                      Modifier
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
