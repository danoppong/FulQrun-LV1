import LeadFormNew from '@/components/leads/LeadFormNew'
import AuthWrapper from '@/components/auth/AuthWrapper'

interface LeadEditPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function LeadEditPage({ params }: LeadEditPageProps) {
  const { id } = await params
  
  return (
    <AuthWrapper>
      <LeadFormNew mode="edit" leadId={id} />
    </AuthWrapper>
  )
}
