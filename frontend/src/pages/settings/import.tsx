import { useEffect } from "react";
import { useRouter } from "next/router";

export default function ImportSettingsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/coming-soon?feature=Import de données");
  }, [router]);

  return null;
}
