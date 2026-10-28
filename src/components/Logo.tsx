import logo from "@/assets/sperin-logo.webp";

export function Logo({ className = "h-20 w-auto" }: { className?: string }) {
  return (
    <img
      src={logo}
      alt="Sperin Services"
      width="1888"
      height="833"
      className={`${className} site-logo block select-none`}
      draggable={false}
      decoding="async"
      style={{
        objectFit: "contain",
        imageRendering: "auto",
      }}
    />
  );
}
