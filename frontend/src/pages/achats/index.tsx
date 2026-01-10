import { useEffect } from "react";
import { useRouter } from "next/router";

export default function AchatsIndex() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/achats/factures");
  }, [router]);
  return null;
}
