import OpportunityView from '@/components/opportunities/OpportunityView'
import AuthWrapper from '@/components/auth/AuthWrapper';

interface OpportunityViewPageProps {
  params: {
    id: string
  }
}

export default function OpportunityViewPage({ params }: OpportunityViewPageProps) {
  console.log('OpportunityViewPage rendered with params:', params)
  return (
    <AuthWrapper>
      <OpportunityView opportunityId={params.id} />
    </AuthWrapper>
  )
}
