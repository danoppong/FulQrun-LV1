import OpportunityForm from '@/components/opportunities/OpportunityForm'
import AuthWrapper from '@/components/auth/AuthWrapper'

interface OpportunityEditPageProps {
  params: {
    id: string
  }
}

export default function OpportunityEditPage({ params }: OpportunityEditPageProps) {
  return (
    <AuthWrapper>
      <OpportunityForm mode="edit" opportunityId={params.id} />
    </AuthWrapper>
  )
}
