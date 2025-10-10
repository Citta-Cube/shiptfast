import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background/50 to-background">
      <div className="relative w-full max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <SignIn />
      </div>
    </div>
  )
}