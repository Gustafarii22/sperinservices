import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/gallery")({
  beforeLoad: () => {
    throw redirect({ to: "/our-work", replace: true });
  },
  component: () => null,
});
