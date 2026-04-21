import { createFileRoute, redirect } from '@tanstack/react-router';
import { authService } from '~lib/auth';
import { NisGateForm } from '~features/nis-gate/components/NisGateForm';

export const Route = createFileRoute('/')(
  {
    beforeLoad: () => {
      // If student is already authenticated, redirect to student dashboard
      if (authService.isAuthenticated()) {
        throw redirect({ to: '/student' });
      }
    },
    component: Index,
  }
);

function Index() {
  return <NisGateForm />;
}
