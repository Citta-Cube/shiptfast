import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background/50 to-background">
      <div className="relative w-full max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <SignIn 
          appearance={{
            elements: {
              formButtonPrimary: 
                "bg-primary text-primary-foreground hover:bg-primary/90 text-sm normal-case",
              card: "shadow-lg border",
              headerTitle: "text-2xl font-medium",
              headerSubtitle: "text-muted-foreground",
              socialButtonsBlockButton: 
                "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
              formFieldInput: 
                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              footerActionLink: "text-primary hover:text-primary/90 underline"
            }
          }}
          redirectUrl="/dashboard"
          signUpUrl="/auth/signup"
        />
      </div>
    </div>
  )
}