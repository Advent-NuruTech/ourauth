import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ants — Authentication as a Service",
  description: "Secured by Ants. Drop-in authentication for your apps.",
  icons: { icon: "/logo.jpg", apple: "/logo.jpg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
