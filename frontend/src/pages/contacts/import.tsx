import { useEffect } from "react";
import { useRouter } from "next/router";

export default function ImportContactsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/coming-soon?feature=Importer des contacts");
  }, [router]);

  return null;
}
