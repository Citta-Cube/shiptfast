import { redirect } from 'next/navigation'
import { auth, currentUser } from '@clerk/nextjs/server' 
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, BuildingIcon, GlobeIcon, PhoneIcon, MailIcon, BriefcaseIcon, CheckCircleIcon, UsersIcon } from "lucide-react"
import { format } from 'date-fns'
import { reconcilePendingInvitationsForUser } from '@/data-access/companies'
import InviteMemberForm from '@/components/profile/InviteMemberForm'
import PendingInvitations from '@/components/profile/PendingInvitations'

export default async function ProfilePage() {
  const { userId } = await auth()  
  const user = await currentUser() 

  if (!userId || !user) {
    redirect('/auth/signin')
  }

  const supabase = createClient()

  // Reconcile any pending invitations stored with email as user_id
  try {
    const primaryEmail = user.emailAddresses?.[0]?.emailAddress
    await reconcilePendingInvitationsForUser(userId, primaryEmail)
  } catch (e) {
    console.error('Failed to reconcile pending invitations:', e)
  }

  // Fetch user's company information
  const { data: companyMembership, error: companyError } = await supabase
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
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()

  if (companyError && companyError.code !== 'PGRST116') {
    console.error('Error fetching company data:', companyError)
  }

  // Fetch other company members if user belongs to a company
  let companyMembers = []
  if (companyMembership?.companies?.id) {
    const { data: members, error: membersError } = await supabase
      .from('company_members')
      .select(`
        id,
        user_id,
        first_name,
        last_name,
        job_title,
        role,
        created_at,
        is_active
      `)
      .eq('company_id', companyMembership.companies.id)
      .eq('is_active', true)
      .neq('user_id', userId)
      .order('role', { ascending: false })
      .order('created_at', { ascending: true })

    if (membersError) {
      console.error('Error fetching company members:', membersError)
    } else {
      companyMembers = members || []
    }
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

  // Helper function to generate avatar fallback for team members
  function getAvatarFallback(firstName, lastName) {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase()
    }
    return '👤'
  }

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
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal">Personal Information</TabsTrigger>
              <TabsTrigger value="company">Company Details</TabsTrigger>
              <TabsTrigger value="team">Team Members</TabsTrigger>
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
                      <div className="col-span-2">
                        <h3 className="text-sm font-medium mb-1">Address</h3>
                        <p className="text-sm">{companyMembership.companies.address || 'Not specified'}</p>
                      </div>
                      {companyMembership.companies.description && (
                        <div className="col-span-2">
                          <h3 className="text-sm font-medium mb-1">Description</h3>
                          <p className="text-sm">{companyMembership.companies.description}</p>
                        </div>
                      )}
                      {companyMembership.companies.average_rating && (
                        <div>
                          <h3 className="text-sm font-medium mb-1">Average Rating</h3>
                          <div className="flex items-center">
                            <span className="text-sm mr-1">{companyMembership.companies.average_rating}</span>
                            <span className="text-yellow-500">★</span>
                          </div>
                        </div>
                      )}
                      {companyCreatedAt && (
                        <div>
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
            
            <TabsContent value="team" className="mt-6">
              <div className="space-y-6">
                {/* Invite Member Form - Only show for ADMIN and MANAGER roles */}
                {companyMembership?.role === 'ADMIN' || companyMembership?.role === 'MANAGER' ? (
                  <>
                    <InviteMemberForm 
                      companyId={companyMembership.companies?.id}
                    />
                    <PendingInvitations companyId={companyMembership.companies?.id} />
                  </>
                ) : null}

                <Card>
                  <CardHeader>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>
                      Other members of your company
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {companyMembers.length > 0 ? (
                      <div className="space-y-4">
                        {companyMembers.map((member) => (
                          <div key={member.id} className="flex items-center p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                            <Avatar className="h-10 w-10 mr-4">
                              <AvatarFallback className="bg-primary/10">
                                {getAvatarFallback(member.first_name, member.last_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium truncate">
                                  {member.first_name && member.last_name 
                                    ? `${member.first_name} ${member.last_name}` 
                                    : 'Team Member'}
                                </h4>
                                <Badge variant="outline" className="ml-2">
                                  {member.role || 'Member'}
                                </Badge>
                              </div>
                              {member.job_title && (
                                <p className="text-sm text-muted-foreground truncate">
                                  {member.job_title}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <UsersIcon className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Team Members</h3>
                        <p className="text-sm text-muted-foreground max-w-md">
                          {companyMembership?.companies 
                            ? "You're currently the only member of your company."
                            : "You're not associated with any company."}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}