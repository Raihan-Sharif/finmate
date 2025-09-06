'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getFamilyMembers, getFamilyAccountLimits, createFamilyGroup, inviteFamilyMember } from '@/lib/services/accounts'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Users, 
  UserPlus, 
  Crown, 
  Mail, 
  Clock,
  Check,
  X,
  Heart,
  Baby,
  User,
  Sparkles,
  Shield,
  Copy
} from 'lucide-react'
import { FamilyMember, FamilyAccountLimits } from '@/types'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

export default function FamilyMembersSection() {
  const { user } = useAuth()
  const t = useTranslations('accounts')
  const [familyLimits, setFamilyLimits] = useState<FamilyAccountLimits | null>(null)
  const [loading, setLoading] = useState(true)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)

  useEffect(() => {
    if (user?.id) {
      loadFamilyData()
    }
  }, [user?.id])

  const loadFamilyData = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const limits = await getFamilyAccountLimits(user.id)
      setFamilyLimits(limits)
    } catch (error) {
      console.error('Error loading family data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Only show for Max plan users
  if (!familyLimits || familyLimits.planType !== 'max') {
    return null
  }

  if (loading) {
    return <FamilyMembersSkeleton />
  }

  return (
    <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
      <CardHeader className="border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl flex items-center space-x-2">
                <span>{t('family.title')}</span>
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0">
                  <Crown className="h-3 w-3 mr-1" />
                  Max Plan
                </Badge>
              </CardTitle>
              <CardDescription>{t('family.description')}</CardDescription>
            </div>
          </div>
          
          {familyLimits.isFamilyPrimary && (
            <InviteMemberDialog 
              onInvite={loadFamilyData}
              open={inviteDialogOpen}
              onOpenChange={setInviteDialogOpen}
            />
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {familyLimits.familyMembers && familyLimits.familyMembers.length > 0 ? (
          <div className="space-y-4">
            {/* Family Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                <Users className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {familyLimits.familyMembers.length}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">{t('family.totalMembers')}</p>
              </div>
              
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                <Shield className="h-6 w-6 mx-auto text-green-600 mb-2" />
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {familyLimits.familyAccountCount || 0}
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">{t('family.totalAccounts')}</p>
              </div>
              
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
                <Sparkles className="h-6 w-6 mx-auto text-purple-600 mb-2" />
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {familyLimits.limit - (familyLimits.familyAccountCount || 0)}
                </p>
                <p className="text-sm text-purple-700 dark:text-purple-300">{t('family.remainingSlots')}</p>
              </div>
            </div>

            {/* Family Members List */}
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
                {t('family.members')}
              </h4>
              
              {familyLimits.familyMembers.map((member, index) => (
                <FamilyMemberCard 
                  key={member.user_id} 
                  member={member} 
                  index={index}
                  isPrimary={familyLimits.isFamilyPrimary}
                />
              ))}
            </div>

            {/* Invite More Members */}
            {familyLimits.isFamilyPrimary && familyLimits.familyMembers.length < 4 && (
              <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/50 dark:border-amber-800/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-amber-900 dark:text-amber-100">
                      {t('family.inviteMore')}
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      {t('family.canInvite', { count: 4 - familyLimits.familyMembers.length })}
                    </p>
                  </div>
                  <Button
                    onClick={() => setInviteDialogOpen(true)}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {t('family.inviteMember')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <FamilyEmptyState onCreateFamily={loadFamilyData} />
        )}
      </CardContent>
    </Card>
  )
}

interface FamilyMemberCardProps {
  member: FamilyMember
  index: number
  isPrimary: boolean
}

function FamilyMemberCard({ member, index, isPrimary }: FamilyMemberCardProps) {
  const t = useTranslations('accounts')
  const roleConfig = getRoleConfig(member.family_role)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all duration-200">
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-full ${roleConfig.bg} ${roleConfig.text}`}>
            {roleConfig.icon}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                {member.full_name || member.email.split('@')[0]}
              </p>
              <Badge 
                variant="secondary"
                className={`${roleConfig.badgeColor} border-0 text-xs`}
              >
                {roleConfig.label}
              </Badge>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">{member.email}</p>
            <div className="flex items-center space-x-4 mt-1">
              <span className="text-xs text-slate-500 dark:text-slate-500">
                {member.account_count} {t('family.accounts')}
              </span>
              {member.joined_at && (
                <span className="text-xs text-slate-500 dark:text-slate-500">
                  {t('family.joinedOn')} {new Date(member.joined_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {isPrimary && member.family_role !== 'primary' && (
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Mail className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function getRoleConfig(role: string) {
  switch (role) {
    case 'primary':
      return {
        icon: <Crown className="h-5 w-5" />,
        bg: 'bg-gradient-to-br from-amber-500 to-orange-600',
        text: 'text-white',
        badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
        label: 'Primary'
      }
    case 'spouse':
      return {
        icon: <Heart className="h-5 w-5" />,
        bg: 'bg-gradient-to-br from-pink-500 to-rose-600',
        text: 'text-white',
        badgeColor: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-200',
        label: 'Spouse'
      }
    case 'child':
      return {
        icon: <Baby className="h-5 w-5" />,
        bg: 'bg-gradient-to-br from-blue-500 to-cyan-600',
        text: 'text-white',
        badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
        label: 'Child'
      }
    default:
      return {
        icon: <User className="h-5 w-5" />,
        bg: 'bg-gradient-to-br from-slate-500 to-slate-600',
        text: 'text-white',
        badgeColor: 'bg-slate-100 text-slate-800 dark:bg-slate-800/30 dark:text-slate-200',
        label: 'Member'
      }
  }
}

interface FamilyEmptyStateProps {
  onCreateFamily: () => void
}

function FamilyEmptyState({ onCreateFamily }: FamilyEmptyStateProps) {
  const t = useTranslations('accounts')
  const [creating, setCreating] = useState(false)
  const { user } = useAuth()

  const handleCreateFamily = async () => {
    if (!user?.id) return

    try {
      setCreating(true)
      await createFamilyGroup(user.id)
      toast.success(t('family.familyCreated'))
      onCreateFamily()
    } catch (error: any) {
      console.error('Error creating family:', error)
      toast.error(error.message || t('family.createFailed'))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="text-center py-12">
      <div className="mx-auto w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-2xl flex items-center justify-center mb-6">
        <Users className="h-10 w-10 text-amber-600" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
        {t('family.emptyTitle')}
      </h3>
      <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
        {t('family.emptyDescription')}
      </p>
      <Button
        onClick={handleCreateFamily}
        disabled={creating}
        className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
      >
        <Users className="h-4 w-4 mr-2" />
        {creating ? t('family.creating') : t('family.createFamily')}
      </Button>
    </div>
  )
}

interface InviteMemberDialogProps {
  onInvite: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

function InviteMemberDialog({ onInvite, open, onOpenChange }: InviteMemberDialogProps) {
  const t = useTranslations('accounts')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<string>('member')
  const [inviting, setInviting] = useState(false)
  const [invitationCode, setInvitationCode] = useState<string | null>(null)
  const { user } = useAuth()

  const handleInvite = async () => {
    if (!user?.id || !email) return

    try {
      setInviting(true)
      const code = await inviteFamilyMember(user.id, email, role)
      setInvitationCode(code)
      toast.success(t('family.inviteSent'))
      onInvite()
    } catch (error: any) {
      console.error('Error inviting member:', error)
      toast.error(error.message || t('family.inviteFailed'))
    } finally {
      setInviting(false)
    }
  }

  const handleClose = () => {
    setEmail('')
    setRole('member')
    setInvitationCode(null)
    onOpenChange(false)
  }

  const copyInvitationCode = () => {
    if (invitationCode) {
      navigator.clipboard.writeText(invitationCode)
      toast.success(t('family.codeCopied'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
          <UserPlus className="h-4 w-4 mr-2" />
          {t('family.inviteMember')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
              <UserPlus className="h-4 w-4" />
            </div>
            <span>{t('family.inviteMember')}</span>
          </DialogTitle>
          <DialogDescription>
            {invitationCode ? t('family.inviteSuccess') : t('family.inviteDescription')}
          </DialogDescription>
        </DialogHeader>

        {invitationCode ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/30">
              <div className="flex items-center space-x-2 mb-2">
                <Check className="h-5 w-5 text-green-600" />
                <p className="font-medium text-green-900 dark:text-green-100">
                  {t('family.invitationSent')}
                </p>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                {t('family.shareCodeWith')} {email}
              </p>
              <div className="flex items-center space-x-2">
                <div className="flex-1 p-3 bg-white dark:bg-slate-800 rounded-lg border font-mono text-center text-lg font-semibold">
                  {invitationCode}
                </div>
                <Button size="icon" variant="outline" onClick={copyInvitationCode}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button onClick={handleClose} className="w-full">
              {t('common.done')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('family.memberEmail')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="member@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">{t('family.memberRole')}</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spouse">
                    <div className="flex items-center space-x-2">
                      <Heart className="h-4 w-4 text-pink-600" />
                      <span>{t('family.roles.spouse')}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="child">
                    <div className="flex items-center space-x-2">
                      <Baby className="h-4 w-4 text-blue-600" />
                      <span>{t('family.roles.child')}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="member">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-slate-600" />
                      <span>{t('family.roles.member')}</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                {t('common.cancel')}
              </Button>
              <Button 
                onClick={handleInvite} 
                disabled={!email || inviting}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
              >
                {inviting ? t('family.inviting') : t('family.sendInvite')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function FamilyMembersSkeleton() {
  return (
    <Card className="shadow-xl border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-3 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-9 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl border">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}