import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/our-work")({
  component: OurWorkLayout,
});

function OurWorkLayout() {
  return <Outlet />;
}
