import { getCurrentUser } from '@/data-access/users'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function Home() {
  let user = null
  
  try {
    user = await getCurrentUser()
  } catch (error) {
    // User is not authenticated
    user = null
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ShipFast
          </h1>
          <p className="text-gray-600">
            Your freight management solution
          </p>
        </div>

        {user ? (
          // User is logged in - show dashboard button
          <div className="space-y-4">
            <p className="text-green-600 font-medium">
              Welcome back!
            </p>
            <Link href="/dashboard" className="block">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        ) : (
          // User is not logged in - show sign in button
          <div className="space-y-4">
            <p className="text-gray-600">
              Please sign in to access your account
            </p>
            <Link href="/auth/signin" className="block">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Sign In
              </Button>
            </Link>
            <p className="text-sm text-gray-500">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-blue-600 hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
