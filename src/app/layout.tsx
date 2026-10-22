import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/state/AppContext";
import { AppShell } from "@/components/shell/AppShell";

export const metadata: Metadata = {
  title: "ResolvOS — Multi-agent Refund Resolution",
  description:
    "Enterprise demo: AI agents resolve customer refund and dispute cases across Banking, Insurance, E-commerce, Travel, and Subscriptions domains.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
