import OpportunityList from '@/components/opportunities/OpportunityList'
import { AuthWrapper } from '@/components/auth/AuthWrapper';

export default function OpportunitiesPage() {
  return (
    <AuthWrapper>
      <OpportunityList />
    </AuthWrapper>
  )
}