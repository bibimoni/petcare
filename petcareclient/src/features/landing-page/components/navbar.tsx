import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { NavMenu } from "@/features/landing-page/components/nav-menu";
import { NavigationSheet } from "@/features/landing-page/components/navigation-sheet";
import { useNavigation } from "@/features/landing-page/hooks/navigation";

const Navbar = () => {
  const handleNavigation = useNavigation();

  return (
    <nav className="h-16 sticky top-0 z-50 border-b bg-background/15 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-(--breakpoint-xl) items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        {/* Desktop Menu */}
        <NavMenu className="hidden md:block" />

        <div className="flex items-center gap-3">
          <Button
            className="hidden sm:inline-flex cursor-pointer rounded-full font-bold"
            variant="outline"
            onClick={() => handleNavigation("login")}
          >
            Đăng nhập
          </Button>
          <Button
            className="cursor-pointer rounded-full font-bold"
            onClick={() => handleNavigation("register")}
          >
            Đăng ký
          </Button>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <NavigationSheet />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
