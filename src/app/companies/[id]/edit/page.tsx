import CompanyForm from '@/components/companies/CompanyForm'
import AuthWrapper from '@/components/auth/AuthWrapper';

interface CompanyEditPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function CompanyEditPage({ params }: CompanyEditPageProps) {
  const { id } = await params
  
  return (
    <AuthWrapper>
      <CompanyForm mode="edit" companyId={id} />
    </AuthWrapper>
  )
}
