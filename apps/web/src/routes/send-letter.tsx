import { createFileRoute, redirect } from '@tanstack/react-router';
import { authService } from '~lib/auth';

export const Route = createFileRoute('/send-letter')({
  beforeLoad: () => {
    // Redirect to new student layout
    if (authService.isAuthenticated()) {
      throw redirect({ to: '/student/send-letter' });
    }
    throw redirect({ to: '/' });
  },
  component: () => null,
});
