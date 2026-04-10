import { LogoIcon } from "./LogoIcon";

export const Logo = () => {
  return (
    <div className="flex items-center gap-3 shrink-0">
      <LogoIcon />
      <span className="text-xl font-bold tracking-tight text-text-main dark:text-white">
        PetCare System
      </span>
    </div>
  );
};
