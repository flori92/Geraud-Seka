import { useEffect } from "react";
import { useRouter } from "next/router";

export default function NouveauDevisRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/coming-soon?feature=Nouveau devis");
  }, [router]);

  return null;
}
