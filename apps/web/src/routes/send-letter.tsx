import { createFileRoute, redirect } from "@tanstack/react-router";
import { SendLetterForm } from "~features/send-letter/components/SendLetterForm";

export const Route = createFileRoute("/send-letter")({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated()) {
      throw redirect({ to: "/" });
    }
  },
  component: SendLetterPage
});

function SendLetterPage() {
  return <SendLetterForm />;
}

