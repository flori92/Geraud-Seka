import Head from 'next/head';

export default function CabinetSettingsPage() {
    return (
        <>
            <Head><title>Paramètres Cabinet - SEKA</title></Head>
            <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Paramètres du Cabinet</h1>
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
                    Configuration du cabinet à venir.
                </div>
            </div>
        </>
    );
}
