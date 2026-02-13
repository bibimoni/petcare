import { Button } from "@/components/ui/button";
import { Logo } from "@/features/landing-page/components/logo";
import { NavMenu } from "@/features/landing-page/components/nav-menu";
import { NavigationSheet } from "@/features/landing-page/components/navigation-sheet";

const Navbar = () => {
  return (
    <nav className="h-16 border-b bg-background">
      <div className="mx-auto flex h-full max-w-(--breakpoint-xl) items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        {/* Desktop Menu */}
        <NavMenu className="hidden md:block" />

        <div className="flex items-center gap-3">
          <Button className="hidden sm:inline-flex" variant="outline">
            Đăng nhập
          </Button>
          <Button>Đăng ký</Button>

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
