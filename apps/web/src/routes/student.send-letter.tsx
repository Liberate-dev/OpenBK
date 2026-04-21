import { createFileRoute } from '@tanstack/react-router';
import { SendLetterForm } from '~features/send-letter/components/SendLetterForm';

export const Route = createFileRoute('/student/send-letter')({
  component: StudentSendLetterPage,
});

function StudentSendLetterPage() {
  return <SendLetterForm />;
}
