import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { Construction, ArrowLeft } from "lucide-react";

export default function ComingSoonPage() {
    const router = useRouter();
    const { feature } = router.query;

    return (
        <>
            <Head><title>Bientôt disponible - SEKA</title></Head>
            <div className="min-h-screen bg-gray-50">
                <PennylaneSidebar />
                <main className="ml-[220px] flex flex-col items-center justify-center min-h-screen text-center p-8">
                    <div className="bg-blue-50 p-6 rounded-full mb-6 animate-pulse">
                        <Construction className="w-16 h-16 text-[#1e3a5f]" />
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Bientôt disponible !</h1>

                    <p className="text-xl text-gray-600 mb-2">
                        La fonctionnalité <span className="font-semibold text-[#1e3a5f]">{feature || "demandée"}</span> est en cours de développement.
                    </p>
                    <p className="text-gray-500 max-w-md mb-8">
                        Nous travaillons dur pour vous apporter cette fonctionnalité très prochainement.
                        Restez à l&apos;écoute pour les mises à jour !
                    </p>

                    <div className="flex gap-4">
                        <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                            <ArrowLeft className="w-4 h-4" /> Retour
                        </button>
                        <Link href="/dashboard" className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d]">
                            Retour au Tableau de Bord
                        </Link>
                    </div>
                </main>
            </div>
        </>
    );
}
