import { useEffect } from "react";
import { useRouter } from "next/router";

export default function VentesIndex() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/ventes/factures");
  }, [router]);
  return null;
}
