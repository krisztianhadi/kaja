import type { Metadata, Viewport } from "next";
import { Kiwi_Maru } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme";

/** Kiwi Maru - global app font (experiment: rounded, matches the logo). */
const kiwi = Kiwi_Maru({
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-kiwi",
});

export const metadata: Metadata = {
  title: "Kaja - food logbook",
  description: "A simple food logbook with AI-assisted nutrition estimates.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kaja",
  },
};

export const viewport: Viewport = {
  themeColor: "#faf7f2",
};

const themeInitScript = `try{var m=localStorage.getItem("kaja-theme")||"system";var d=m==="dark"||(m==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark");}catch(e){}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={kiwi.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script
          defer
          src="https://ramen.lostsignals.studio/script.js"
          data-website-id="33d09a69-dd0e-48a0-97c8-3010512fdffc"
          data-cache="true"
          data-domains="kaja.lostsignals.studio"
        />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
