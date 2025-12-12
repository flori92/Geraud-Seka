import { useEffect } from "react";
import { useRouter } from "next/router";

export default function BonsCommandeRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/coming-soon?feature=Bons de commande");
  }, [router]);

  return null;
}
