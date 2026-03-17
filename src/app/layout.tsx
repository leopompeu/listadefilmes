import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Caralho Flix DB",
  description: "Streaming vibes com lista de filmes e visual liquid glass.",
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
