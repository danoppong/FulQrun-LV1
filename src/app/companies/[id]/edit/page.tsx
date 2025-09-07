import CompanyForm from '@/components/companies/CompanyForm'
import AuthWrapper from '@/components/auth/AuthWrapper'

interface CompanyEditPageProps {
  params: {
    id: string
  }
}

export default function CompanyEditPage({ params }: CompanyEditPageProps) {
  return (
    <AuthWrapper>
      <CompanyForm mode="edit" companyId={params.id} />
    </AuthWrapper>
  )
}
