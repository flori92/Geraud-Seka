import { useEffect } from "react";
import { useRouter } from "next/router";

export default function BonsLivraisonRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/coming-soon?feature=Bons de livraison");
  }, [router]);

  return null;
}
