import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { connection } from "next/server";
import { QuickEntryProvider } from "@/components/entry/quick-entry";
import { AppShell } from "@/components/shell/app-shell";
import { isoDayIn } from "@/lib/format";
import { StoreProvider } from "@/lib/store";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], weight: ["600", "700"] });

export const metadata: Metadata = {
  title: { default: "AquaFlow Operations", template: "%s · AquaFlow" },
  description: "Daily production, sales, stock and expenses for a water bottling plant.",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Render per request, never at build time: "today" drives every page. The server picks the
  // business day once and hands it to the client store, so server HTML and hydration agree.
  await connection();
  const today = isoDayIn(new Date());
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable} antialiased`}>
      <body className="min-h-dvh">
        <StoreProvider today={today}>
          <QuickEntryProvider>
            <AppShell>{children}</AppShell>
          </QuickEntryProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
