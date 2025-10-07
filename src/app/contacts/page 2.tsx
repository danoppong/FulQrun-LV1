import ContactList from '@/components/contacts/ContactList'
import { AuthWrapper } from '@/components/auth/AuthWrapper';

export default function ContactsPage() {
  return (
    <AuthWrapper>
      <ContactList />
    </AuthWrapper>
  )
}