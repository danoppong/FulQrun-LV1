import React from 'react';
import OpportunityForm from '@/components/opportunities/OpportunityFormTabbed';
import { AuthWrapper } from '@/components/auth/AuthWrapper';

export default function NewOpportunityPage() {
  return (
    <AuthWrapper>
      <OpportunityForm mode="create" />
    </AuthWrapper>
  );
}