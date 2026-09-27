import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Real Time AI Voice Agent Interview Platform",
  description: "A real-time AI voice agent platform for mock interviews and practice sessions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className="antialiased pattern"
      >
        {children}

        <Toaster />
      </body>
    </html>
  );
}
