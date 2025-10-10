'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { TrashIcon } from "lucide-react"
import { toast } from "sonner"

export default function DeleteMemberDialog({ member, onMemberDeleted }) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/companies/members/${member.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete member')
      }

      // Show success message with details about what was deleted
      const successMessage = result.clerkDeletion?.success 
        ? `${result.deletedMember.name} has been completely removed from the team and their account has been deleted`
        : `${result.deletedMember.name} has been removed from the team`
      
      toast.success(successMessage)
      
      // Call the callback to refresh the member list
      if (onMemberDeleted) {
        onMemberDeleted(member.id)
      }

    } catch (error) {
      console.error('Error deleting member:', error)
      toast.error(error.message || 'Failed to delete team member')
    } finally {
      setLoading(false)
    }
  }

  const memberName = member.first_name && member.last_name 
    ? `${member.first_name} ${member.last_name}`
    : 'Team Member'

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>⚠️ Permanently Delete Team Member</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to permanently delete <strong>{memberName}</strong> from your team? 
            <br /><br />
            <strong>This action cannot be undone!</strong> This will:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Remove their access to the company account immediately</li>
              <li>Delete their user account from the authentication system</li>
              <li>Permanently remove all their data from the database</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Deleting...' : 'Permanently Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
