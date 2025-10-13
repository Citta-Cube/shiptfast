'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Clock, Mail, User, Briefcase, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function PendingInvitations({ companyId }) {
  const [invitations, setInvitations] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchPendingInvitations = useCallback(async () => {
    // start loading for each fetch
    setIsLoading(true)

    // if no companyId, clear and stop
    if (!companyId) {
      setInvitations([])
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/companies/${companyId}/invitations`)
      if (response.ok) {
        const data = await response.json()
        setInvitations(data.invitations || [])
      }
    } catch (error) {
      console.error('Error fetching pending invitations:', error)
    } finally {
      setIsLoading(false)
    }
  }, [companyId])

  useEffect(() => {
    fetchPendingInvitations()
  }, [fetchPendingInvitations])

  const cancelInvitation = async (invitationId) => {
    try {
      const response = await fetch(`/api/companies/invitations/${invitationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Invitation cancelled')
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId))
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to cancel invitation')
      }
    } catch (error) {
      console.error('Error cancelling invitation:', error)
      toast.error('Failed to cancel invitation')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-sm text-muted-foreground">Loading invitations...</div>
        </CardContent>
      </Card>
    )
  }

  if (invitations.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Pending Invitations
        </CardTitle>
        <CardDescription>
          Invitations that haven&apos;t been accepted yet
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {invitations.map((invitation) => (
            <div key={invitation.id} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-muted">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium truncate">
                      {invitation.first_name && invitation.last_name 
                        ? `${invitation.first_name} ${invitation.last_name}`
                        : invitation.user_id}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {invitation.role}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      <span>{invitation.email || invitation.user_id}</span>
                    </div>
                    {invitation.job_title && (
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        <span>{invitation.job_title}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => cancelInvitation(invitation.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}