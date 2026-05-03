import { useState, useEffect } from "react";

import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { NavMenu } from "@/features/landing-page/components/nav-menu";
import { NavigationSheet } from "@/features/landing-page/components/navigation-sheet";
import { useNavigation } from "@/features/landing-page/hooks/navigation";

const Navbar = () => {
  const handleNavigation = useNavigation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setIsAuthenticated(!!token);

    if (token) {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr) as { role?: string | null };
          setUserRole(user.role ?? null);
        } catch (e) {
          console.error("Failed to parse user from localStorage", e);
        }
      }
    }
  }, []);

  return (
    <nav className="h-16 sticky top-0 z-50 border-b bg-background/15 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-(--breakpoint-xl) items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        {/* Desktop Menu */}
        <NavMenu className="hidden md:block" />

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Button
              className="cursor-pointer rounded-full font-bold"
              onClick={() => {
                if (userRole === null) {
                  handleNavigation("create-store");
                } else {
                  handleNavigation("dashboard");
                }
              }}
            >
              Dashboard
            </Button>
          ) : (
            <>
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
            </>
          )}

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
