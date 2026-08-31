import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Chrome } from "@/components/Chrome";
import { getActiveMembers } from "@/lib/team";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Polify Post Tracker",
  description: "Track and celebrate the team's Polify posts on X and LinkedIn.",
};

// Every page reads shared, frequently-changing data (team roster, posts),
// so there's nothing worth statically prerendering here.
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const members = await getActiveMembers();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Chrome members={members.map((m) => ({ id: m.id, name: m.name }))}>
          {children}
        </Chrome>
      </body>
    </html>
  );
}
