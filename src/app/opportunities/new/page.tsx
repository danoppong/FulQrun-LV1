import React from 'react';
import OpportunityForm from '@/components/opportunities/OpportunityForm';
import { AuthWrapper } from '@/components/auth/AuthWrapper';

export default function NewOpportunityPage() {
  return (
    <AuthWrapper>
      <OpportunityForm mode="create" />
    </AuthWrapper>
  );
}