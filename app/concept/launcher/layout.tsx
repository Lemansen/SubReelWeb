import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SubReel Launcher Concept",
  description: "Интерактивный концепт вкладки лаунчера Minecraft",
};

export default function ConceptLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
