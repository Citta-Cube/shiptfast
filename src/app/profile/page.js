'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import useSupabaseAuthClient from '@/hooks/useSupabaseAuthClient'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CalendarIcon, BuildingIcon, GlobeIcon, PhoneIcon, MailIcon, BriefcaseIcon, CheckCircleIcon, UsersIcon, MoreHorizontal, Edit, Trash2, Star } from "lucide-react"
import { format } from 'date-fns'
import { reconcileUserInvitations } from '@/app/auth/actions'
import InviteMemberDialog from '@/components/profile/InviteMemberDialog'
import PendingInvitations from '@/components/profile/PendingInvitations'
import EditMemberDialog from '@/components/profile/EditMemberDialog'
import DeleteMemberDialog from '@/components/profile/DeleteMemberDialog'

export default function ProfilePage() {
  const { user, isLoaded } = useUser()
  const supabase = useSupabaseAuthClient()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('personal')
  const [companyMembership, setCompanyMembership] = useState(null)
  const [companyMembers, setCompanyMembers] = useState([])
  const [loading, setLoading] = useState(true)

  // Handle member updates
  const handleMemberUpdated = (updatedMember) => {
    setCompanyMembers(prevMembers =>
      prevMembers.map(member =>
        member.id === updatedMember.id ? updatedMember : member
      )
    )
  }

  const handleMemberDeleted = (deletedMemberId) => {
    setCompanyMembers(prevMembers =>
      prevMembers.filter(member => member.id !== deletedMemberId)
    )
  }

  // Get active tab from URL params
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['personal', 'company', 'team-members'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  // Handle tab change
  const handleTabChange = (value) => {
    setActiveTab(value)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', value)
    router.push(`/profile?${params.toString()}`, { scroll: false })
  }

  // Fetch user data
  useEffect(() => {
    if (!isLoaded || !user || !supabase) return

    const fetchUserData = async () => {
      try {
        setLoading(true)
        
        // Reconcile any pending invitations stored with email as user_id
        try {
          const primaryEmail = user.emailAddresses?.[0]?.emailAddress
          await reconcileUserInvitations(user.id, primaryEmail)
        } catch (e) {
          console.error('Failed to reconcile pending invitations:', e)
        }

        // Fetch user's company information
        const { data: companyData, error: companyError } = await supabase
          .from('company_members')
          .select(`
            id,
            job_title,
            role,
            is_active,
            first_name,
            last_name,
            created_at,
            companies:company_id (
              id,
              name,
              website,
              email,
              phone,
              address,
              description,
              type,
              business_registration_number,
              vat_number,
              created_at,
              is_verified,
              average_rating
            )
          `)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single()

        if (companyError && companyError.code !== 'PGRST116') {
          console.error('Error fetching company data:', companyError)
        }

        setCompanyMembership(companyData)

        // Fetch other company members if user belongs to a company
        if (companyData?.companies?.id) {
          const { data: members, error: membersError } = await supabase
            .from('company_members')
            .select(`
              id,
              user_id,
              first_name,
              last_name,
              job_title,
              role,
              email,
              created_at,
              is_active
            `)
            .eq('company_id', companyData.companies.id)
            .eq('is_active', true)
            .neq('user_id', user.id)
            .order('role', { ascending: false })
            .order('created_at', { ascending: true })

          if (membersError) {
            console.error('Error fetching company members:', membersError)
          } else {
            setCompanyMembers(members || [])
          }

          // Overall rating is read from companies.average_rating and companies.total_ratings
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [isLoaded, user, supabase, pathname])

  if (!isLoaded || loading) {
    return (
      <div className="container">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push('/auth/signin')
    return null
  }

  // Use Clerk user data or fallback to company member data
  const userName = user.fullName ||
    (companyMembership?.first_name && companyMembership?.last_name
      ? `${companyMembership.first_name} ${companyMembership.last_name}`
      : user.emailAddresses[0]?.emailAddress.split('@')[0])

  const userEmail = user.emailAddresses[0]?.emailAddress

  // Avatar fallback
  const avatarFallback = user.firstName && user.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : (companyMembership?.first_name && companyMembership?.last_name
      ? `${companyMembership.first_name[0]}${companyMembership.last_name[0]}`
      : userEmail?.charAt(0).toUpperCase())

  // Format dates
  const memberSince = companyMembership?.created_at
    ? format(new Date(companyMembership.created_at), 'MMMM yyyy')
    : format(new Date(user.createdAt), 'MMMM yyyy')

  const companyCreatedAt = companyMembership?.companies?.created_at
    ? format(new Date(companyMembership.companies.created_at), 'MMMM yyyy')
    : null


  return (
    <div className="container">
      <div className="grid gap-8 md:grid-cols-[300px_1fr]">
        {/* Left column - User profile summary */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={user.imageUrl} alt={userName} />
                  <AvatarFallback className="text-2xl bg-primary/10">
                    {avatarFallback}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-semibold">{userName}</h2>
                <p className="text-sm text-muted-foreground mb-2">{userEmail}</p>

                {companyMembership?.role && (
                  <Badge className="mt-1" variant="outline">
                    {companyMembership.role}
                  </Badge>
                )}

                <div className="flex items-center text-sm text-muted-foreground mt-4">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span>Member since {memberSince}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {companyMembership?.companies && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Company</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    {companyMembership.companies.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center">
                      <h4 className="font-medium">{companyMembership.companies.name}</h4>
                      {companyMembership.companies.is_verified && (
                        <CheckCircleIcon className="h-4 w-4 ml-1 text-blue-500" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  {companyMembership.job_title && (
                    <div className="flex">
                      <BriefcaseIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{companyMembership.job_title}</span>
                    </div>
                  )}
                  {companyMembership.companies.type && (
                    <div className="flex">
                      <BuildingIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{companyMembership.companies.type}</span>
                    </div>
                  )}
                  {companyMembership.companies.website && (
                    <div className="flex">
                      <GlobeIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                      <a
                        href={companyMembership.companies.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate"
                      >
                        {companyMembership.companies.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column - Detailed information */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal">Personal Information</TabsTrigger>
              <TabsTrigger value="company">Company Details</TabsTrigger>
              <TabsTrigger value="team-members">Team Members</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Your personal details and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h3 className="text-sm font-medium mb-1">First Name</h3>
                      <p className="text-sm">{user.firstName || companyMembership?.first_name || 'Not specified'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-1">Last Name</h3>
                      <p className="text-sm">{user.lastName || companyMembership?.last_name || 'Not specified'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-1">Email</h3>
                      <p className="text-sm">{userEmail}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-1">Job Title</h3>
                      <p className="text-sm">{companyMembership?.job_title || 'Not specified'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-1">Role</h3>
                      <Badge variant="outline">{companyMembership?.role || 'User'}</Badge>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-1">Member Since</h3>
                      <p className="text-sm">{memberSince}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="company" className="mt-6">
              {companyMembership?.companies ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Company Information</CardTitle>
                    <CardDescription>
                      Details about your associated company
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h3 className="text-sm font-medium mb-1">Company Name</h3>
                        <p className="text-sm">{companyMembership.companies.name}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium mb-1">Company Type</h3>
                        <p className="text-sm">{companyMembership.companies.type || 'Not specified'}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium mb-1">Email</h3>
                        <div className="flex items-center">
                          <MailIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                          <p className="text-sm">{companyMembership.companies.email || 'Not specified'}</p>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium mb-1">Phone</h3>
                        <div className="flex items-center">
                          <PhoneIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                          <p className="text-sm">{companyMembership.companies.phone || 'Not specified'}</p>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium mb-1">Business Registration</h3>
                        <p className="text-sm">{companyMembership.companies.business_registration_number || 'Not specified'}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium mb-1">VAT Number</h3>
                        <p className="text-sm">{companyMembership.companies.vat_number || 'Not specified'}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium mb-1">Address</h3>
                        <p className="text-sm">{companyMembership.companies.address || 'Not specified'}</p>
                      </div>

                      {/* Ratings (overall) */}
                      <div>
                        <h3 className="text-sm font-medium mb-1">Ratings</h3>
                        {companyMembership.companies.average_rating ? (
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= Math.round(Number(companyMembership.companies.average_rating))
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                            <span className="ml-2 text-sm font-medium">
                              {Number(companyMembership.companies.average_rating).toFixed(1)}/5 {companyMembership.companies.total_ratings ? `( ${companyMembership.companies.total_ratings} ratings )` : ''}
                            </span>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">No ratings yet</div>
                        )}
                      </div>

                      {companyMembership.companies.description && (
                        <div className="col-span-2">
                          <h3 className="text-sm font-medium mb-1">Description</h3>
                          <p className="text-sm">{companyMembership.companies.description}</p>
                        </div>
                      )}
                      
                      {companyCreatedAt && (
                        <div className="col-span-2">
                          <h3 className="text-sm font-medium mb-1">Established</h3>
                          <p className="text-sm">{companyCreatedAt}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-10">
                    <BuildingIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Company Associated</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-md">
                      You are not currently associated with any company. Contact your administrator if you believe this is an error.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="team-members" className="mt-6">
              <div className="space-y-6">
                {/* Team Members Section with Invite Button */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Team Members</CardTitle>
                        <CardDescription>
                          Members of your company
                        </CardDescription>
                      </div>
                      {/* Invite Member Button - Only show for ADMIN and MANAGER roles */}
                      {(companyMembership?.role === 'ADMIN' || companyMembership?.role === 'MANAGER') && companyMembership?.companies?.id && (
                        <InviteMemberDialog
                          companyId={companyMembership.companies.id}
                        />
                      )}
                    </div>
                  </CardHeader>

                  <CardContent>
                    {companyMembers.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Member Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Job Title</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {companyMembers.map((member) => (
                            <TableRow key={member.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center space-x-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs">
                                      {member.first_name && member.last_name
                                        ? `${member.first_name[0]}${member.last_name[0]}`
                                        : member.email?.charAt(0).toUpperCase() || '?'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>
                                    {member.first_name && member.last_name
                                      ? `${member.first_name} ${member.last_name}`
                                      : 'No name provided'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>{member.email || 'No email'}</TableCell>
                              <TableCell>{member.job_title || 'Not specified'}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {member.role}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {(companyMembership?.role === 'ADMIN') && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <EditMemberDialog
                                        member={member}
                                        onMemberUpdated={handleMemberUpdated}
                                        trigger={
                                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit Member
                                          </DropdownMenuItem>
                                        }
                                      />
                                      <DeleteMemberDialog
                                        member={member}
                                        onMemberDeleted={handleMemberDeleted}
                                        trigger={
                                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Remove Member
                                          </DropdownMenuItem>
                                        }
                                      />
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-10">
                        <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Team Members</h3>
                        <p className="text-sm text-muted-foreground">
                          {(companyMembership?.role === 'ADMIN' || companyMembership?.role === 'MANAGER')
                            ? 'Start building your team by inviting members.'
                            : 'No other team members found.'}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Pending Invitations Section - Only show for ADMIN and MANAGER roles */}
                {(companyMembership?.role === 'ADMIN' || companyMembership?.role === 'MANAGER') && companyMembership?.companies?.id && (
                  <PendingInvitations companyId={companyMembership.companies.id} />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}