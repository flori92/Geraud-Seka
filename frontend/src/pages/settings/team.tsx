import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
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
    {
      id: "1",
      full_name: "Administrateur",
      email: "admin@seka.local",
      role: "admin",
      status: "active",
    },
  ]);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("viewer");

  return (
    <DashboardLayout title="Gestion de l’équipe">
      <div className="space-y-6 max-w-4xl">
        <Card>
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-accents-1">
                  <Users className="h-5 w-5 text-accents-6" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-foreground">Gestion de l’équipe</h1>
                  <p className="text-sm text-accents-6 mt-1">
                    Ajoutez des utilisateurs et gérez leurs accès. Cette page est prête à être connectée au backend.
                  </p>
                </div>
              </div>
              <Badge variant="default">BETA</Badge>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Inviter un membre</h2>
                <p className="text-sm text-accents-6">Envoi d’invitation par email (à connecter).</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <Input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="email@exemple.com"
                />
              </div>
              <div>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as MemberRole)}
                  className="w-full px-4 py-2 border border-accents-3 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="admin">{roleLabels.admin}</option>
                  <option value="manager">{roleLabels.manager}</option>
                  <option value="accountant">{roleLabels.accountant}</option>
                  <option value="viewer">{roleLabels.viewer}</option>
                </select>
              </div>
            </div>

            <div className="pt-4">
              <Button
                onClick={() => {
                  alert("Invitation à connecter au backend.");
                }}
                disabled={!inviteEmail}
              >
                <Plus className="mr-2 h-4 w-4" />
                Envoyer une invitation
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Membres</h2>
                <p className="text-sm text-accents-6">Liste des utilisateurs de l’entreprise.</p>
              </div>
            </div>

            <div className="divide-y divide-accents-2">
              {members.map((m) => (
                <div key={m.id} className="py-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-accents-1 flex items-center justify-center">
                      <User className="h-5 w-5 text-accents-6" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">{m.full_name}</div>
                      <div className="text-sm text-accents-6 flex items-center gap-2 mt-0.5">
                        <Mail className="h-4 w-4" />
                        {m.email}
                      </div>
                      <div className="text-xs text-accents-6 mt-1 flex items-center gap-2">
                        <Shield className="h-3.5 w-3.5" />
                        {roleLabels[m.role]}
                        {m.status === "invited" ? (
                          <span className="ml-2">(invité)</span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => alert("Gestion des rôles à connecter au backend.")}
                    >
                      Modifier
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
