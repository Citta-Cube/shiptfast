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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EditIcon, User, Briefcase, Mail } from "lucide-react"
import { toast } from "sonner"

const ROLES = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'OPERATOR', label: 'Operator' },
  { value: 'VIEWER', label: 'Viewer' }
]

export default function EditMemberDialog({ member, onMemberUpdated }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    first_name: member.first_name || '',
    last_name: member.last_name || '',
    job_title: member.job_title || '',
    role: member.role || 'VIEWER'
  })

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/companies/members/${member.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update member')
      }

      toast.success('Team member updated successfully')
      setOpen(false)
      
      // Call the callback to refresh the member list
      if (onMemberUpdated) {
        onMemberUpdated(result.member)
      }

    } catch (error) {
      console.error('Error updating member:', error)
      toast.error(error.message || 'Failed to update team member')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      first_name: member.first_name || '',
      last_name: member.last_name || '',
      job_title: member.job_title || '',
      role: member.role || 'VIEWER'
    })
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen)
      if (!newOpen) {
        resetForm()
      }
    }}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="h-8 w-8 p-0 hover:bg-muted"
        >
          <EditIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <EditIcon className="h-5 w-5" />
            Edit Team Member
          </DialogTitle>
          <DialogDescription>
            Update the team member&apos;s information. Email cannot be changed.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                placeholder="John"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                placeholder="Doe"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="job_title" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Job Title
              </Label>
              <Input
                id="job_title"
                placeholder="e.g., Operations Manager, Logistics Coordinator"
                value={formData.job_title}
                onChange={(e) => handleInputChange('job_title', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Role *
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleInputChange('role', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              Email Address
            </Label>
            <div className="p-3 bg-muted rounded-md">
              <div className="text-sm text-muted-foreground">
                {member.email || 'Email not available'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Email cannot be changed
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}