import { useRouter } from "next/router";
import { useEffect } from "react";

export default function ApiPage() {
    const router = useRouter();
    
    useEffect(() => {
        router.push("/settings");
    }, [router]);
    
    return null;
}
