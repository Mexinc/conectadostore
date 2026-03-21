interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { name: "text-lg", sub: "text-[0.5rem]" },
  md: { name: "text-2xl", sub: "text-[0.6rem]" },
  lg: { name: "text-3xl", sub: "text-xs" },
};

const Logo = ({ size = "md", className = "" }: LogoProps) => {
  const s = sizeMap[size];
  return (
    <div className={`flex flex-col items-center leading-none ${className}`}>
      <span
        className={`${s.name} font-normal tracking-wide text-brand-yellow`}
        style={{ fontFamily: "'Sephora', sans-serif" }}
      >
        Conectado
      </span>
      <span className={`${s.sub} font-medium uppercase tracking-[0.25em] text-brand-yellow/80`}>
        Informática
      </span>
    </div>
  );
};

export default Logo;
