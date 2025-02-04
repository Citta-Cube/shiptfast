// @/app/layout
import { Inter as FontSans } from "next/font/google"
import { ThemeProvider } from "@/components/ThemeProvider"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"
import ErrorBoundary from "@/components/ErrorBoundary"
import "./globals.css"

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata = {
  title: "Freight Management System",
  description: "A modern freight management system for efficient logistics operations",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
