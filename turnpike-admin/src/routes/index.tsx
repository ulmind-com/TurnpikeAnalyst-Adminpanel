import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * The console's own pages live under /admin so that links, bookmarks and the
 * sidebar keep working unchanged now that the console is its own application.
 * Landing on the app root just forwards there.
 */
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/admin", replace: true });
  },
});
