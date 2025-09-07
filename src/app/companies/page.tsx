import CompanyList from '@/components/companies/CompanyList'
import AuthWrapper from '@/components/auth/AuthWrapper'

export default function CompaniesPage() {
  return (
    <AuthWrapper>
      <CompanyList />
    </AuthWrapper>
  )
}