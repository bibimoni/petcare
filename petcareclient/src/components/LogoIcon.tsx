export const LogoIcon = () => {
  return (
    <div className="w-10 h-10 bg-orange-600/10 rounded-full flex items-center justify-center">
      <img
        src="/favicon.svg"
        alt="PetCare Logo"
        className="w-6 h-6 cursor-pointer"
        onClick={() => (window.location.href = "/")}
      />
    </div>
  );
};
