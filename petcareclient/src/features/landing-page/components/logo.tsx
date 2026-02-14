export const Logo = () => {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-orange-600/10 rounded-full flex items-center justify-center">
        <img
          src="/favicon.svg"
          alt="PetCare Logo"
          className="w-6 h-6 cursor-pointer"
          onClick={() => (window.location.href = "/")}
        />
      </div>
      <span className="text-xl font-bold tracking-tight text-text-main dark:text-white">
        PetCare
      </span>
    </div>
  );
};
