import { useEffect } from "react";
import { useRouter } from "next/router";

export default function NouvelleFactureRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/coming-soon?feature=Nouvelle facture");
  }, [router]);

  return null;
}
