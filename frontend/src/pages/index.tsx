import { useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page on load
    router.push("/login");
  }, [router]);

  return (
    <>
      <Head>
        <title>SEKA Platform</title>
      </Head>
      <main className="flex min-h-screen items-center justify-center bg-accents-1">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accents-2 border-t-foreground"></div>
      </main>
    </>
  );
}
