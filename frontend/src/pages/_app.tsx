import type { AppProps } from "next/app";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import "@/styles/sidebar-fixes.css";
import { ToastProvider } from "@/components/ui/ToastContainer";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { useRouter } from "next/router";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

// Pages qui n'ont pas besoin de sidebar
const noSidebarPages = ['/login', '/register', '/landing', '/pricing', '/about', '/blog', '/faq', '/privacy', '/terms'];

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const showSidebar = !noSidebarPages.includes(router.pathname);

  return (
    <ToastProvider>
      <div className={`${inter.variable} font-sans min-h-screen bg-gray-50`}>
        {showSidebar && <PennylaneSidebar />}
        <main className={showSidebar ? "ml-[220px] transition-all duration-300" : ""}>
          <Component {...pageProps} />
        </main>
      </div>
    </ToastProvider>
  );
}
