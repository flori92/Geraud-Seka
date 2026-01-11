/**
 * Page Gestion des Utilisateurs
 * Invitation, rôles (Admin, Comptable, Collaborateur)
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { 
    Users, Plus, Mail, Shield, Trash2, Save, X, AlertCircle, UserPlus
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

interface User {
    id: string;
    email: string;
    full_name?: string;
    role: "admin" | "accountant" | "collaborator";
    is_active: boolean;
    created_at: string;
    last_login?: string;
}

export default function UtilisateursPage() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [inviting, setInviting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    const [inviteData, setInviteData] = useState({
        email: "",
        full_name: "",
        role: "accountant" as User['role']
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        const token = localStorage.getItem("seka_access_token");
        if (!token) {
            router.push("/login");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setUsers(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async () => {
        if (!inviteData.email || !inviteData.full_name) {
            setError("Email et nom obligatoires");
            return;
        }

        setInviting(true);
        setError(null);
        const token = localStorage.getItem("seka_access_token");

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/users/invite`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(inviteData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Erreur lors de l'invitation");
            }

            setMessage({type: 'success', text: `Invitation envoyée à ${inviteData.email} !`});
            setTimeout(() => setMessage(null), 3000);
            await fetchUsers();
            handleCloseModal();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setInviting(false);
        }
    };

    const handleToggleActive = async (userId: string, isActive: boolean) => {
        const token = localStorage.getItem("seka_access_token");
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/users/${userId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ is_active: !isActive })
            });

            if (!response.ok) throw new Error("Erreur lors de la mise à jour");
            await fetchUsers();
        } catch (err) {
            console.error("Toggle error:", err);
            alert("Erreur lors de la mise à jour");
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) return;

        const token = localStorage.getItem("seka_access_token");
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/users/${userId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Erreur lors de la suppression");
            await fetchUsers();
        } catch (err) {
            console.error("Delete error:", err);
            alert("Erreur lors de la suppression");
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setInviteData({
            email: "",
            full_name: "",
            role: "accountant"
        });
        setError(null);
    };

    const getRoleBadge = (role: string) => {
        const badges = {
            admin: "bg-purple-100 text-purple-800",
            accountant: "bg-blue-100 text-blue-800",
            collaborator: "bg-green-100 text-green-800"
        };
        return badges[role as keyof typeof badges] || "bg-gray-100 text-gray-800";
    };

    const getRoleLabel = (role: string) => {
        const labels = {
            admin: "Administrateur",
            accountant: "Comptable",
            collaborator: "Collaborateur"
        };
        return labels[role as keyof typeof labels] || role;
    };

    const stats = {
        total: users.length,
        active: users.filter(u => u.is_active).length,
        admins: users.filter(u => u.role === "admin").length,
        accountants: users.filter(u => u.role === "accountant").length
    };

    return (
        <>
            <Head>
                <title>Gestion des Utilisateurs - SEKA</title>
            </Head>

            <div className="min-h-screen bg-gray-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <Users className="h-6 w-6 text-[#1e3a5f]" />
                                GESTION DES UTILISATEURS
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Invitez et gérez les membres de votre équipe
                            </p>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d] font-medium"
                        >
                            <UserPlus className="h-5 w-5" />
                            Inviter un utilisateur
                        </button>
                    </div>

                    {/* Message */}
                    {message && (
                        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
                            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                            <Mail className="h-5 w-5" />
                            {message.text}
                        </div>
                    )}

                    {/* Stats Cards */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Total</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                </div>
                                <Users className="h-8 w-8 text-gray-400" />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg border border-green-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-green-600">Actifs</p>
                                    <p className="text-2xl font-bold text-green-700">{stats.active}</p>
                                </div>
                                <Shield className="h-8 w-8 text-green-400" />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg border border-purple-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-purple-600">Admins</p>
                                    <p className="text-2xl font-bold text-purple-700">{stats.admins}</p>
                                </div>
                                <Shield className="h-8 w-8 text-purple-400" />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg border border-blue-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-blue-600">Comptables</p>
                                    <p className="text-2xl font-bold text-blue-700">{stats.accountants}</p>
                                </div>
                                <Users className="h-8 w-8 text-blue-400" />
                            </div>
                        </div>
                    </div>

                    {/* Users Table */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f] mx-auto mb-2"></div>
                                Chargement...
                            </div>
                        ) : users.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                <p className="font-medium">Aucun utilisateur</p>
                                <p className="text-sm mt-1">Invitez vos premiers collaborateurs</p>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Utilisateur
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Rôle
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Statut
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Dernière connexion
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{user.full_name || "N/A"}</div>
                                                    <div className="text-sm text-gray-500">{user.email}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                                                    {getRoleLabel(user.role)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <label className="flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={user.is_active}
                                                        onChange={() => handleToggleActive(user.id, user.is_active)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                    <span className="ml-3 text-sm font-medium text-gray-900">
                                                        {user.is_active ? "Actif" : "Inactif"}
                                                    </span>
                                                </label>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {user.last_login ? new Date(user.last_login).toLocaleDateString('fr-FR') : "Jamais"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Invite */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={handleCloseModal} />

                        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
                            <div className="px-6 py-4 border-b bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-medium">Inviter un utilisateur</h3>
                                    <button onClick={handleCloseModal}>
                                        <X className="h-5 w-5 text-gray-400" />
                                    </button>
                                </div>
                            </div>

                            <div className="px-6 py-4 space-y-4">
                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                                        <AlertCircle className="h-4 w-4" />
                                        {error}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        value={inviteData.email}
                                        onChange={(e) => setInviteData({...inviteData, email: e.target.value})}
                                        placeholder="utilisateur@exemple.com"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nom complet *
                                    </label>
                                    <input
                                        type="text"
                                        value={inviteData.full_name}
                                        onChange={(e) => setInviteData({...inviteData, full_name: e.target.value})}
                                        placeholder="Jean Dupont"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Rôle *
                                    </label>
                                    <select
                                        value={inviteData.role}
                                        onChange={(e) => setInviteData({...inviteData, role: e.target.value as User['role']})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="collaborator">Collaborateur - Accès limité</option>
                                        <option value="accountant">Comptable - Validation factures</option>
                                        <option value="admin">Administrateur - Tous les droits</option>
                                    </select>
                                    <p className="mt-1 text-xs text-gray-500">
                                        L'utilisateur recevra un email d'invitation
                                    </p>
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                                <button
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleInvite}
                                    disabled={inviting}
                                    className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d] flex items-center gap-2 disabled:opacity-50"
                                >
                                    {inviting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Envoi...
                                        </>
                                    ) : (
                                        <>
                                            <Mail className="h-4 w-4" />
                                            Envoyer l'invitation
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
