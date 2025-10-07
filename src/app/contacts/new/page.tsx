import ContactForm from '@/components/contacts/ContactForm';

interface NewContactPageProps {
  searchParams: { opportunityId?: string }
}

export default function NewContactPage({ searchParams }: NewContactPageProps) {
  return <ContactForm mode="create" opportunityId={searchParams.opportunityId} />
}