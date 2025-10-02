'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { UsersIcon } from "lucide-react"
import EditMemberDialog from './EditMemberDialog'
import DeleteMemberDialog from './DeleteMemberDialog'

export default function TeamMembersList({ 
  initialMembers, 
  currentUserRole, 
  currentUserId 
}) {
  const [members, setMembers] = useState(initialMembers)

  // Helper function to generate avatar fallback for team members
  function getAvatarFallback(firstName, lastName) {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase()
    }
    return '👤'
  }

  const handleMemberUpdated = (updatedMember) => {
    setMembers(prevMembers => 
      prevMembers.map(member => 
        member.id === updatedMember.id ? updatedMember : member
      )
    )
  }

  const handleMemberDeleted = (deletedMemberId) => {
    setMembers(prevMembers => 
      prevMembers.filter(member => member.id !== deletedMemberId)
    )
  }

  const isAdmin = currentUserRole === 'ADMIN'

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <UsersIcon className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No Team Members</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          You're currently the only member of your company.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {members.map((member) => (
        <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {getAvatarFallback(member.first_name, member.last_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 text-sm">
                <span className="font-medium truncate">
                  {member.first_name && member.last_name
                    ? `${member.first_name} ${member.last_name}`
                    : 'Team Member'}
                </span>
                <span className="text-muted-foreground truncate">
                  {member.user_id ? `${member.user_id}@company.com` : 'Email not available'}
                </span>
                <span className="text-muted-foreground truncate">
                  {member.job_title || 'No job title'}
                </span>
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  {member.role || 'Member'}
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Action buttons - Only show for admins and not for current user */}
          {isAdmin && member.user_id !== currentUserId && (
            <div className="flex items-center gap-1 ml-2">
              <EditMemberDialog 
                member={member} 
                onMemberUpdated={handleMemberUpdated}
              />
              <DeleteMemberDialog 
                member={member} 
                onMemberDeleted={handleMemberDeleted}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
