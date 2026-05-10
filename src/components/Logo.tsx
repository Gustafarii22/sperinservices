import logo from "@/assets/sperin-logo.png";

export function Logo({ className = "h-12 w-auto" }: { className?: string }) {
  return (
    <img
      src={logo}
      alt="Sperin Services logo"
      className={className}
      width={400}
      height={400}
      style={{ objectFit: "contain" }}
    />
  );
}
