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
      }}
    />
  );
}
