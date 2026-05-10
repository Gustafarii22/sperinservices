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
        filter:
          "drop-shadow(0 2px 10px oklch(0 0 0 / 0.6)) drop-shadow(0 0 18px oklch(0.7 0.22 240 / 0.25))",
      }}
    />
  );
}
