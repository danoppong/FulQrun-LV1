import ContactForm from '@/components/contacts/ContactForm';

interface NewContactPageProps {
  searchParams: Promise<{ opportunityId?: string }>
}

export default async function NewContactPage({ searchParams }: NewContactPageProps) {
  const params = await searchParams
  return <ContactForm mode="create" opportunityId={params.opportunityId} />
}