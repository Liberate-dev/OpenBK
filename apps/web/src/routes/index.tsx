import { createFileRoute, redirect } from "@tanstack/react-router";
import { NisGateForm } from "~features/nis-gate/components/NisGateForm";
import { authService } from "~lib/auth";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    // If user is already authenticated, redirect straight to sending a letter
    if (authService.isAuthenticated()) {
      throw redirect({ to: "/send-letter" });
    }
  },
  component: HomePage
});

function HomePage() {
  return <NisGateForm />;
}

