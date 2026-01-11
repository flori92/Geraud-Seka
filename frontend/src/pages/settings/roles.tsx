import { useRouter } from "next/router";
import { useEffect } from "react";

export default function RolesPage() {
    const router = useRouter();
    
    useEffect(() => {
        // Redirect to users page which includes roles
        router.push("/parametres/utilisateurs");
    }, [router]);
    
    return null;
}
