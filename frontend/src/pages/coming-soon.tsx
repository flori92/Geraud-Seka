
import { useRouter } from "next/router";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Construction, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ComingSoonPage() {
    const router = useRouter();
    const { feature } = router.query;

    return (
        <DashboardLayout title="Fonctionnalité à venir">
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <div className="bg-blue-50 p-6 rounded-full mb-6 animate-pulse">
                    <Construction className="w-16 h-16 text-blue-600" />
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Bientôt disponible !
                </h1>

                <p className="text-xl text-gray-600 mb-2">
                    La fonctionnalité <span className="font-semibold text-blue-600">{feature || "demandée"}</span> est en cours de développement.
                </p>
                <p className="text-gray-500 max-w-md mb-8">
                    Nous travaillons dur pour vous apporter cette fonctionnalité très prochainement.
                    Restez à l'écoute pour les mises à jour !
                </p>

                <div className="flex gap-4">
                    <Button variant="outline" onClick={() => router.back()} className="flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Retour
                    </Button>
                    <Link href="/dashboard">
                        <Button>Retour au Tableau de Bord</Button>
                    </Link>
                </div>
            </div>
        </DashboardLayout>
    );
}
