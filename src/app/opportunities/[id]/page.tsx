import OpportunityView from '@/components/opportunities/OpportunityView'
import AuthWrapper from '@/components/auth/AuthWrapper';

interface OpportunityViewPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function OpportunityViewPage({ params }: OpportunityViewPageProps) {
  const { id } = await params
  
  return (
    <AuthWrapper>
      <OpportunityView opportunityId={id} />
    </AuthWrapper>
  )
}
