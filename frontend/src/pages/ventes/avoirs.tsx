import { useEffect } from "react";
import { useRouter } from "next/router";

export default function AvoirsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/coming-soon?feature=Avoirs");
  }, [router]);

  return null;
}
