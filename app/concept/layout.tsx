import type { Metadata } from "next";
import "./globals.css";
import { RootProvider } from "fumadocs-ui/provider/next";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Subreel Launcher Concept",
  description: "Пример дизайна сайта в формате Minecraft лаунчера",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="antialiased">
        <RootProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </RootProvider>
      </body>
    </html>
  );
}
