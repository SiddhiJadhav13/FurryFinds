import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { AppProvider } from "@/context/AppContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata = {
  title: "FurryFinds | Premium Pet Marketplace",
  description: "Modern pet marketplace with secure client/admin dashboards",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${manrope.variable} ${spaceGrotesk.variable}`}>
      <body>
        <AppProvider>
          <TooltipProvider>
            <AppShell>
              {children}
            </AppShell>
            <Toaster position="top-right" richColors />
          </TooltipProvider>
        </AppProvider>
      </body>
    </html>
  );
}
