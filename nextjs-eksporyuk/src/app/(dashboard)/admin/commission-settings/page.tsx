import { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { redirect } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import CommissionSettingsManager from '@/components/admin/CommissionSettingsManager'

export const metadata: Metadata = {
  title: 'Commission Settings - Admin Dashboard',
  description: 'Manage affiliate commission rates and types for memberships and products',
}

export default async function CommissionSettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/login')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/')
  }

  return (
    <ResponsivePageWrapper>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Commission Settings</h1>
          <p className="text-muted-foreground">
            Manage affiliate commission rates and types for all memberships and products
          </p>
        </div>

        <CommissionSettingsManager />
      </div>
    </ResponsivePageWrapper>
  )
}