import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { AuthProvider } from "@/components/auth-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { themeStorageKey } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DAO Logistics | AI-Native Freight Brokerage",
  description:
    "DAO Logistics — AI-native freight brokerage connecting shippers with carriers across the Southeast and beyond.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeInitScript = `
    (function() {
      try {
        var storageKey = ${JSON.stringify(themeStorageKey)};
        var preference = localStorage.getItem(storageKey) || "system";
        if (preference !== "light" && preference !== "dark" && preference !== "system") {
          preference = "system";
        }
        var systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        var theme = preference === "system" ? (systemDark ? "dark" : "light") : preference;
        var root = document.documentElement;
        root.classList.toggle("dark", theme === "dark");
        root.dataset.themePreference = preference;
        root.dataset.theme = theme;
        root.style.colorScheme = theme;
      } catch (error) {}
    })();
  `;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
