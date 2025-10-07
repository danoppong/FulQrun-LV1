import ContactForm from '@/components/contacts/ContactForm'
import AuthWrapper from '@/components/auth/AuthWrapper';

interface ContactEditPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ContactEditPage({ params }: ContactEditPageProps) {
  const { id } = await params
  
  return (
    <AuthWrapper>
      <ContactForm mode="edit" contactId={id} />
    </AuthWrapper>
  )
}
