import { useState, useEffect } from "react";
import Head from "next/head";
import {
    Users, Plus, Search, Mail, Phone, MessageSquare,
    MoreVertical, Edit2, Trash2, X, Loader2, Filter, Download, Upload,
    Building2, Briefcase
} from "lucide-react";
import {
    getCRMContacts,
    createCRMContact,
    deleteCRMContact,
    getClients,
    type CRMContact,
    type CRMContactCreate,
    type Client
} from "@/lib/api";

export default function ContactsPage() {
    const [contacts, setContacts] = useState<CRMContact[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedContact, setSelectedContact] = useState<CRMContact | null>(null);
    const [messageType, setMessageType] = useState<"email" | "whatsapp" | "sms">("email");
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    const [newContact, setNewContact] = useState<Partial<CRMContactCreate>>({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        mobile: "",
        job_title: "",
        department: "",
        address: "",
        city: "",
        country: "Bénin",
        client_id: "",
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("seka_access_token");
            if (token) {
                const [contactsData, clientsData] = await Promise.all([
                    getCRMContacts(token),
                    getClients(token),
                ]);
                setContacts(contactsData);
                setClients(clientsData);
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateContact = async () => {
        if (!newContact.first_name || !newContact.last_name || !newContact.email) {
            alert("Veuillez remplir les champs obligatoires (Prénom, Nom, Email)");
            return;
        }

        setSaving(true);
        try {
            const token = localStorage.getItem("seka_access_token");
            if (token) {
                await createCRMContact(token, newContact as CRMContactCreate);
                setShowCreateModal(false);
                setNewContact({
                    first_name: "",
                    last_name: "",
                    email: "",
                    phone: "",
                    mobile: "",
                    job_title: "",
                    department: "",
                    address: "",
                    city: "",
                    country: "Bénin",
                    client_id: "",
                });
                fetchData();
            }
        } catch (error) {
            console.error("Failed to create contact:", error);
            alert("Erreur lors de la création du contact");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteContact = async () => {
        if (!selectedContact) return;

        try {
            const token = localStorage.getItem("seka_access_token");
            if (token) {
                await deleteCRMContact(token, selectedContact.id);
                setContacts(prev => prev.filter(c => c.id !== selectedContact.id));
                setShowDeleteModal(false);
                setSelectedContact(null);
            }
        } catch (error) {
            console.error("Failed to delete contact:", error);
            alert("Erreur lors de la suppression du contact");
        }
    };

    const handleSendMessage = (contact: CRMContact, type: "email" | "whatsapp" | "sms") => {
        setSelectedContact(contact);
        setMessageType(type);
        setShowContactModal(true);
    };

    const openExternalMessage = () => {
        if (!selectedContact) return;

        switch (messageType) {
            case "email":
                window.open(`mailto:${selectedContact.email}`, "_blank");
                break;
            case "whatsapp":
                const phone = (selectedContact.mobile || selectedContact.phone)?.replace(/\s/g, "").replace(/^\+/, "");
                if (phone) window.open(`https://wa.me/${phone}`, "_blank");
                break;
            case "sms":
                window.open(`sms:${selectedContact.mobile || selectedContact.phone}`, "_blank");
                break;
        }
        setShowContactModal(false);
    };

    const getFullName = (contact: CRMContact) => {
        return contact.full_name || `${contact.first_name} ${contact.last_name}`;
    };

    const filteredContacts = contacts.filter(c => {
        const fullName = getFullName(c).toLowerCase();
        const searchLower = search.toLowerCase();
        return (
            fullName.includes(searchLower) ||
            c.email?.toLowerCase().includes(searchLower) ||
            c.job_title?.toLowerCase().includes(searchLower) ||
            c.client_name?.toLowerCase().includes(searchLower)
        );
    });

    return (
        <>
            <Head>
                <title>Contacts CRM - SEKA</title>
            </Head>

            <div className="min-h-screen bg-gray-50 pt-14">
                <main className="p-6">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                    <Users className="h-7 w-7 text-blue-600" />
                                    Contacts CRM
                                </h1>
                                <p className="text-sm text-gray-500 mt-1">
                                    Gérez vos contacts professionnels et relations client
                                </p>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                            >
                                <Plus className="h-4 w-4" />
                                Nouveau contact
                            </button>
                        </div>

                        {/* Filters & Search */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Rechercher par nom, email, fonction..."
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-blue-500"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm text-gray-600">
                                        <Filter className="h-4 w-4" />
                                        Filtrer
                                    </button>
                                    <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm text-gray-600">
                                        <Upload className="h-4 w-4" />
                                        Importer
                                    </button>
                                    <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm text-gray-600">
                                        <Download className="h-4 w-4" />
                                        Exporter
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Contact List */}
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            {loading ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                                </div>
                            ) : filteredContacts.length === 0 ? (
                                <div className="text-center py-20">
                                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        Aucun contact trouvé
                                    </h3>
                                    <p className="text-gray-500 mb-4">
                                        {search ? "Essayez une autre recherche" : "Commencez par ajouter un contact"}
                                    </p>
                                    {!search && (
                                        <button
                                            onClick={() => setShowCreateModal(true)}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Ajouter un contact
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Email</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Téléphone</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Entreprise</th>
                                            <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredContacts.map((contact) => (
                                            <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                            <span className="text-blue-700 font-bold">
                                                                {contact.first_name?.charAt(0).toUpperCase() || "?"}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">{getFullName(contact)}</p>
                                                            {contact.job_title && (
                                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                                    <Briefcase className="h-3 w-3" />
                                                                    {contact.job_title}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 hidden md:table-cell">
                                                    {contact.email || "-"}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 hidden lg:table-cell">
                                                    {contact.mobile || contact.phone || "-"}
                                                </td>
                                                <td className="px-6 py-4 hidden lg:table-cell">
                                                    {contact.client_name && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                                                            <Building2 className="h-3 w-3" />
                                                            {contact.client_name}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {contact.email && (
                                                            <button
                                                                onClick={() => handleSendMessage(contact, "email")}
                                                                className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                                                                title="Envoyer un email"
                                                            >
                                                                <Mail className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                        {(contact.mobile || contact.phone) && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleSendMessage(contact, "whatsapp")}
                                                                    className="p-2 hover:bg-green-50 rounded-lg text-green-600 transition-colors"
                                                                    title="WhatsApp"
                                                                >
                                                                    <MessageSquare className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleSendMessage(contact, "sms")}
                                                                    className="p-2 hover:bg-purple-50 rounded-lg text-purple-600 transition-colors"
                                                                    title="SMS"
                                                                >
                                                                    <Phone className="h-4 w-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                        <div className="relative">
                                                            <button
                                                                onClick={() => setActiveMenu(activeMenu === contact.id ? null : contact.id)}
                                                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                                                            >
                                                                <MoreVertical className="h-4 w-4" />
                                                            </button>
                                                            {activeMenu === contact.id && (
                                                                <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                                                    <button
                                                                        onClick={() => {
                                                                            setSelectedContact(contact);
                                                                            setActiveMenu(null);
                                                                            // TODO: Open edit modal
                                                                        }}
                                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                                    >
                                                                        <Edit2 className="h-4 w-4" />
                                                                        Modifier
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setSelectedContact(contact);
                                                                            setActiveMenu(null);
                                                                            setShowDeleteModal(true);
                                                                        }}
                                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                        Supprimer
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Stats Footer */}
                        <div className="mt-4 text-sm text-gray-500">
                            {filteredContacts.length} contact{filteredContacts.length !== 1 ? "s" : ""} au total
                        </div>
                    </div>
                </main>
            </div>

            {/* Create Contact Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreateModal(false)} />
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Nouveau contact</h2>
                            <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                                    <input
                                        type="text"
                                        value={newContact.first_name || ""}
                                        onChange={(e) => setNewContact({ ...newContact, first_name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        placeholder="Jean"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                                    <input
                                        type="text"
                                        value={newContact.last_name || ""}
                                        onChange={(e) => setNewContact({ ...newContact, last_name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        placeholder="Dupont"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                <input
                                    type="email"
                                    value={newContact.email || ""}
                                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    placeholder="jean.dupont@exemple.com"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                                    <input
                                        type="tel"
                                        value={newContact.phone || ""}
                                        onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        placeholder="+229 XX XX XX XX"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                                    <input
                                        type="tel"
                                        value={newContact.mobile || ""}
                                        onChange={(e) => setNewContact({ ...newContact, mobile: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        placeholder="+229 XX XX XX XX"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fonction</label>
                                    <input
                                        type="text"
                                        value={newContact.job_title || ""}
                                        onChange={(e) => setNewContact({ ...newContact, job_title: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        placeholder="Directeur Commercial"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Département</label>
                                    <input
                                        type="text"
                                        value={newContact.department || ""}
                                        onChange={(e) => setNewContact({ ...newContact, department: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        placeholder="Commercial"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Entreprise (Client)</label>
                                <select
                                    value={newContact.client_id || ""}
                                    onChange={(e) => setNewContact({ ...newContact, client_id: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="">Sélectionner un client...</option>
                                    {clients.map(client => (
                                        <option key={client.id} value={client.id}>{client.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                                <input
                                    type="text"
                                    value={newContact.address || ""}
                                    onChange={(e) => setNewContact({ ...newContact, address: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    placeholder="123 Avenue..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                                    <input
                                        type="text"
                                        value={newContact.city || ""}
                                        onChange={(e) => setNewContact({ ...newContact, city: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        placeholder="Cotonou"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
                                    <input
                                        type="text"
                                        value={newContact.country || ""}
                                        onChange={(e) => setNewContact({ ...newContact, country: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        placeholder="Bénin"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleCreateContact}
                                disabled={saving || !newContact.first_name || !newContact.last_name || !newContact.email}
                                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                            >
                                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                                Créer le contact
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Contact Action Modal */}
            {showContactModal && selectedContact && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowContactModal(false)} />
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                                {messageType === "email" && <Mail className="h-8 w-8 text-blue-600" />}
                                {messageType === "whatsapp" && <MessageSquare className="h-8 w-8 text-green-600" />}
                                {messageType === "sms" && <Phone className="h-8 w-8 text-purple-600" />}
                            </div>
                            <h2 className="text-lg font-semibold mb-2">
                                Contacter {getFullName(selectedContact)}
                            </h2>
                            <p className="text-sm text-gray-500 mb-6">
                                {messageType === "email" && `Email: ${selectedContact.email}`}
                                {messageType === "whatsapp" && `WhatsApp: ${selectedContact.mobile || selectedContact.phone}`}
                                {messageType === "sms" && `SMS: ${selectedContact.mobile || selectedContact.phone}`}
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setShowContactModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={openExternalMessage}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                                >
                                    Ouvrir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedContact && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)} />
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="h-8 w-8 text-red-600" />
                            </div>
                            <h2 className="text-lg font-semibold mb-2">Supprimer ce contact ?</h2>
                            <p className="text-sm text-gray-500 mb-6">
                                Êtes-vous sûr de vouloir supprimer <strong>{getFullName(selectedContact)}</strong> ?
                                Cette action est irréversible.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleDeleteContact}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
