export const Logo = () => {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
        <span className="material-symbols-outlined text-2xl">pets</span>
      </div>
      <span className="text-xl font-bold tracking-tight text-text-main dark:text-white">
        PetCare
      </span>
    </div>
  );
};
