// @/app/layout
import { IBM_Plex_Sans as FontSans } from "next/font/google"
import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from "@/components/ThemeProvider"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"
import ErrorBoundary from "@/components/ErrorBoundary"
import "./globals.css"

const fontSans = FontSans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
})

export const metadata = {
  title: "Freight Management System",
  description: "A modern freight management system for efficient logistics operations",
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
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
          <Toaster
            theme="light"
            toastOptions={{
              classNames: {
                error: 'bg-red-500 text-white',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
    </ClerkProvider>
  )
}
