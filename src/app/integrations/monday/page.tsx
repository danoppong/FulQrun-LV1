/**
 * Monday.com Integration Demo Page
 * Showcases Monday.com integration capabilities
 */

import { MondayConnectionManager } from '@/components/integrations/monday/MondayConnectionManager';

export const metadata = {
  title: 'Monday.com Integration | FulQrun',
  description: 'Connect and manage your Monday.com workspace'
};

export default function MondayIntegrationPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <MondayConnectionManager />
    </div>
  );
}
