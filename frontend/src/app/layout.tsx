import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RESTIGO — AI-Powered Hourly Stays & Micro-Bookings",
  description: "Book hotels, workspaces, rest pods, and lounges by the hour. AI-optimized dynamic pricing for flexible micro-stays and short-duration accommodations.",
  keywords: ["hourly booking", "micro stay", "short stay hotel", "coworking", "nap pod", "transit hotel", "flexible accommodation"],
  openGraph: {
    title: "RESTIGO — Book Spaces by the Hour",
    description: "AI-powered platform for hourly hotels, workspaces, and rest spaces.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
