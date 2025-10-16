"use client"

import React from "react"
import { Button } from "@/components/ui/button"

export function SubmitButton({ children, pendingText = "Submitting...", isLoading = false, className, ...props }) {
  return (
    <Button type="submit" className={className} disabled={isLoading} {...props}>
      {isLoading ? pendingText : children}
    </Button>
  )
}

export default SubmitButton
