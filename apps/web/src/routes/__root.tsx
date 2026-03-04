import { Suspense } from "react";
import { Link, Outlet, createRootRouteWithContext, useRouter } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { Box, Chip, Container, Stack } from "@mui/material";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { SuspenseLoader } from "~components/SuspenseLoader";
import { ErrorFallback } from "~components/ErrorFallback";
import { authService } from "~lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import SchoolIcon from "@mui/icons-material/School";

function RootLayout() {
  const router = useRouter();
  const currentPath = router.state.location.pathname;

  // We consider the root "/" (which is NisGate) or "/send-letter" as user-facing pages
  // Note: we can keep showing this header container for consistency unless they are on /admin
  const isAdminRoute = currentPath.startsWith('/admin');

  if (isAdminRoute) {
    return (
      <Suspense fallback={<SuspenseLoader />}>
        <Outlet />
      </Suspense>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", position: "relative", overflow: "hidden", bgcolor: "background.default" }}>
      {/* Playful Background Accessories */}
      <Box sx={{ position: "absolute", top: -100, left: -100, width: 300, height: 300, borderRadius: "50%", bgcolor: "primary.light", opacity: 0.2, filter: "blur(40px)", zIndex: 0 }} />
      <Box sx={{ position: "absolute", bottom: -50, right: -50, width: 250, height: 250, borderRadius: "50%", bgcolor: "secondary.light", opacity: 0.2, filter: "blur(40px)", zIndex: 0 }} />

      <Container maxWidth="md" sx={{ position: "relative", zIndex: 1, py: { xs: 4, md: 8 } }}>
        <Stack spacing={4}>
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center" sx={{ mb: 2 }}>
              <Chip
                icon={<SchoolIcon />}
                label="Open BK"
                component={Link}
                to="/"
                clickable
                color="primary"
                sx={{ px: 1, fontWeight: 'bold' }}
              />
            </Stack>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Suspense fallback={<SuspenseLoader />}>
                <Outlet />
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </Stack>
      </Container>
      {import.meta.env.DEV ? <TanStackRouterDevtools position="bottom-right" /> : null}
    </Box>
  );
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  auth: typeof authService;
}>()({
  component: RootLayout,
  errorComponent: ErrorFallback
});
