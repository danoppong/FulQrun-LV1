import ContactForm from '@/components/contacts/ContactForm'
import AuthWrapper from '@/components/auth/AuthWrapper';

interface ContactEditPageProps {
  params: {
    id: string
  }
}

export default function ContactEditPage({ params }: ContactEditPageProps) {
  return (
    <AuthWrapper>
      <ContactForm mode="edit" contactId={params.id} />
    </AuthWrapper>
  )
}
