import { createRouter } from "@tanstack/react-router";
import { queryClient } from "~providers/queryClient";
import { routeTree } from "@/routeTree.gen";
import { authService } from "~lib/auth";

export const router = createRouter({
  routeTree,
  context: {
    queryClient,
    auth: authService
  },
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  scrollRestoration: true
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

