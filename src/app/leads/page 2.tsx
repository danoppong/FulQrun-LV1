import LeadList from '@/components/leads/LeadList'
import { AuthWrapper } from '@/components/auth/AuthWrapper';

export default function LeadsPage() {
  return (
    <AuthWrapper>
      <LeadList />
    </AuthWrapper>
  )
}