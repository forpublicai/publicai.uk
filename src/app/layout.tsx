import type { Metadata } from "next";
import { Source_Serif_4, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import DemoConsentGate from "@/components/DemoConsentGate";

const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Public AI | A working prototype for BBC, justice and planning",
  description:
    "A working prototype of a UK public AI service — a sovereign AI layer that works alongside the BBC, courts and local councils, powered by structured tool calls to real public data feeds.",
  openGraph: {
    title: "Public AI — working prototype",
    description:
      "What AI could look like as UK public infrastructure: a BBC companion, justice guide and planning assistant, each grounded in real public data feeds with a live tool-call trace.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-GB"
      className={`${sourceSerif.variable} ${sourceSans.variable} antialiased`}
    >
      <body className="min-h-screen bg-stone-50 text-stone-900 font-sans">
        <DemoConsentGate />
        {children}
      </body>
    </html>
  );
}
