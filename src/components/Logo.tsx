import logo from "@/assets/sperin-logo.png";

export function Logo({ className = "h-20 w-auto" }: { className?: string }) {
  return (
    <img
      src={logo}
      alt="Sperin Services"
      className={`${className} block select-none`}
      draggable={false}
      decoding="async"
      style={{
        objectFit: "contain",
        imageRendering: "auto",
        filter: "drop-shadow(0 0 12px rgba(40,150,230,.18))",
      }}
    />
  );
}
