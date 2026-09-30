import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { QuickEntryProvider } from "@/components/entry/quick-entry";
import { AppShell } from "@/components/shell/app-shell";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable} antialiased`}>
      <body className="min-h-dvh">
        <StoreProvider>
          <QuickEntryProvider>
            <AppShell>{children}</AppShell>
          </QuickEntryProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
