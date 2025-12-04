import type { AppProps } from "next/app";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { ToastProvider } from "@/components/ui/ToastContainer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ToastProvider>
      <main className={`${inter.variable} font-sans`}>
        <Component {...pageProps} />
      </main>
    </ToastProvider>
  );
}
