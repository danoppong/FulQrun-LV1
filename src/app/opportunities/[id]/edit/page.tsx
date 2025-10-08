import OpportunityForm from '@/components/opportunities/OpportunityFormFixed'
import AuthWrapper from '@/components/auth/AuthWrapper';

interface OpportunityEditPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function OpportunityEditPage({ params }: OpportunityEditPageProps) {
  const { id } = await params
  
  return (
    <AuthWrapper>
      <OpportunityForm mode="edit" opportunityId={id} />
    </AuthWrapper>
  )
}
