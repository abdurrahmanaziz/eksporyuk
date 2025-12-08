import { redirect } from 'next/navigation'

// Redirect to new universal profile page
export default function CommunityProfileRedirect() {
  redirect('/profile')
}
