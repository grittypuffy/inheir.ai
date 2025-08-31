import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inheir.ai",
  description: "An AI-powered legal research assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
