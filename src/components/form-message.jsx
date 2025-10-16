"use client"

import React from "react"
import { Alert } from "@/components/ui/alert"

// message: { error?: string|null, success?: string|null }
export function FormMessage({ message }) {
  if (!message) return null
  const { error, success } = message
  if (!error && !success) return null

  return (
    <div className="mt-2">
      {error ? (
        <Alert variant="destructive">{error}</Alert>
      ) : null}
      {success ? (
        <Alert className="bg-green-50 text-green-700 border-green-200">{success}</Alert>
      ) : null}
    </div>
  )
}

export default FormMessage
