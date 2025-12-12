import { useState, useEffect } from "react";
import Head from "next/head";
import {
    Users, Plus, Search, Mail, Phone, MessageSquare,
    MoreVertical, Edit2, Trash2, Building2, MapPin,
    Send, X, Loader2, Filter, Download, Upload
} from "lucide-react";
import { getClients, createClient, type Client, type ClientCreate } from "@/lib/api";

interface Contact extends Client {
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    contact_person?: string;
    notes?: string;
    created_at?: string;
}

export default function ContactsPage() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [messageType, setMessageType] = useState<"email" | "whatsapp" | "sms">("email");
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    const [newContact, setNewContact] = useState<Partial<Contact>>({
        name: "",
        slug: "",
        sector: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        country: "Bénin",
        contact_person: "",
    });

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        try {
            const token = localStorage.getItem("seka_access_token");
            if (token) {
                const data = await getClients(token);
                // Add mock contact info for demo (in production, this comes from backend)
                const enriched = data.map((c) => ({
                    ...c,
                    email: `contact@${c.slug || c.name.toLowerCase().replace(/\s/g, "")}.com`,
                    phone: "+229 " + Math.floor(Math.random() * 90000000 + 10000000),
                    country: "Bénin",
                }));
                setContacts(enriched);
            }
        } catch (error) {
            console.error("Failed to fetch contacts:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateContact = async () => {
        try {
            const token = localStorage.getItem("seka_access_token");
            if (!token || !newContact.name) return;

            const slug = newContact.slug || newContact.name.toLowerCase().replace(/\s+/g, "-");
            const clientData: ClientCreate = {
                name: newContact.name,
                slug,
                sector: newContact.sector,
            };

            await createClient(clientData, token);
            setShowCreateModal(false);
            setNewContact({
                name: "",
                slug: "",
                sector: "",
                email: "",
                phone: "",
                address: "",
                city: "",
                country: "Bénin",
                contact_person: "",
            });
            fetchContacts();
        } catch (error) {
            console.error("Failed to create contact:", error);
            alert("Erreur lors de la création du contact");
        }
    };

    const handleDeleteContact = async () => {
        try {
            const token = localStorage.getItem("seka_access_token");
            if (!token || !selectedContact) return;

            // In production, call delete API
            // await deleteClient(selectedContact.id, token);

            setContacts((prev) => prev.filter((c) => c.id !== selectedContact.id));
            setShowDeleteModal(false);
            setSelectedContact(null);
        } catch (error) {
            console.error("Failed to delete contact:", error);
        }
    };

    const handleSendMessage = (contact: Contact, type: "email" | "whatsapp" | "sms") => {
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
                const phone = selectedContact.phone?.replace(/\s/g, "").replace(/^\+/, "");
                window.open(`https://wa.me/${phone}`, "_blank");
                break;
            case "sms":
                window.open(`sms:${selectedContact.phone}`, "_blank");
                break;
        }
        setShowContactModal(false);
    };

    const filteredContacts = contacts.filter(
        (c) =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.email?.toLowerCase().includes(search.toLowerCase()) ||
            c.sector?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <Head>
                <title>Contacts - SEKA</title>
            </Head>

            <div className="min-h-screen bg-gray-50 pt-14">
                <main className="p-6">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                    <Users className="h-7 w-7 text-emerald-600" />
                                    Contacts / Clients
                                </h1>
                                <p className="text-sm text-gray-500 mt-1">
                                    Gérez vos clients et contacts professionnels
                                </p>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
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
                                        placeholder="Rechercher par nom, email, secteur..."
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                                    <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
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
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
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
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Secteur</th>
                                            <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredContacts.map((contact) => (
                                            <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                                            <span className="text-emerald-700 font-bold">
                                                                {contact.name.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">{contact.name}</p>
                                                            {contact.contact_person && (
                                                                <p className="text-xs text-gray-500">{contact.contact_person}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 hidden md:table-cell">
                                                    {contact.email || "-"}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 hidden lg:table-cell">
                                                    {contact.phone || "-"}
                                                </td>
                                                <td className="px-6 py-4 hidden lg:table-cell">
                                                    {contact.sector && (
                                                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                                                            {contact.sector}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => handleSendMessage(contact, "email")}
                                                            className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                                                            title="Envoyer un email"
                                                        >
                                                            <Mail className="h-4 w-4" />
                                                        </button>
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
                                                                            // Open edit modal
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
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l&apos;entreprise *</label>
                                <input
                                    type="text"
                                    value={newContact.name}
                                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    placeholder="Ex: ACME Corp"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Identifiant (slug)</label>
                                    <input
                                        type="text"
                                        value={newContact.slug}
                                        onChange={(e) => setNewContact({ ...newContact, slug: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        placeholder="acme-corp"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Secteur</label>
                                    <input
                                        type="text"
                                        value={newContact.sector}
                                        onChange={(e) => setNewContact({ ...newContact, sector: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        placeholder="Commerce"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={newContact.email}
                                        onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        placeholder="contact@exemple.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                                    <input
                                        type="tel"
                                        value={newContact.phone}
                                        onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        placeholder="+229 XX XX XX XX"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Personne de contact</label>
                                <input
                                    type="text"
                                    value={newContact.contact_person}
                                    onChange={(e) => setNewContact({ ...newContact, contact_person: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    placeholder="Jean Dupont"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                                <input
                                    type="text"
                                    value={newContact.address}
                                    onChange={(e) => setNewContact({ ...newContact, address: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    placeholder="123 Avenue..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                                    <input
                                        type="text"
                                        value={newContact.city}
                                        onChange={(e) => setNewContact({ ...newContact, city: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        placeholder="Cotonou"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
                                    <input
                                        type="text"
                                        value={newContact.country}
                                        onChange={(e) => setNewContact({ ...newContact, country: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
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
                                disabled={!newContact.name}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
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
                            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                                {messageType === "email" && <Mail className="h-8 w-8 text-emerald-600" />}
                                {messageType === "whatsapp" && <MessageSquare className="h-8 w-8 text-green-600" />}
                                {messageType === "sms" && <Phone className="h-8 w-8 text-purple-600" />}
                            </div>
                            <h2 className="text-lg font-semibold mb-2">
                                Contacter {selectedContact.name}
                            </h2>
                            <p className="text-sm text-gray-500 mb-6">
                                {messageType === "email" && `Email: ${selectedContact.email}`}
                                {messageType === "whatsapp" && `WhatsApp: ${selectedContact.phone}`}
                                {messageType === "sms" && `SMS: ${selectedContact.phone}`}
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
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                                >
                                    <Send className="h-4 w-4" />
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
                                Êtes-vous sûr de vouloir supprimer <strong>{selectedContact.name}</strong> ?
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
