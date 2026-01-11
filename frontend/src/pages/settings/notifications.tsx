import { useRouter } from "next/router";
import { useEffect } from "react";

export default function NotificationsPage() {
    const router = useRouter();
    
    useEffect(() => {
        // Redirect to main settings for now
        router.push("/settings");
    }, [router]);
    
    return null;
}
