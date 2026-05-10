import logo from "@/assets/sperin-logo.png";

export function Logo({ className = "h-16 w-auto" }: { className?: string }) {
  return (
    <img
      src={logo}
      alt="Sperin Services"
      className={`${className} block select-none`}
      draggable={false}
      style={{
        objectFit: "contain",
        imageRendering: "auto",
        filter: "drop-shadow(0 2px 8px oklch(0 0 0 / 0.5))",
      }}
    />
  );
}
