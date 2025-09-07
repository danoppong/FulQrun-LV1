import LeadForm from '@/components/leads/LeadForm'
import AuthWrapper from '@/components/auth/AuthWrapper'

interface LeadEditPageProps {
  params: {
    id: string
  }
}

export default function LeadEditPage({ params }: LeadEditPageProps) {
  return (
    <AuthWrapper>
      <LeadForm mode="edit" leadId={params.id} />
    </AuthWrapper>
  )
}
