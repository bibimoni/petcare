import { useNavigate } from "react-router";

export function useNavigation() {
  const navigate = useNavigate();

  const handleNavigation = (action?: string) => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      navigate(`/${action || "login"}`);
      return;
    }

    navigate("/dashboard");
  };

  return handleNavigation;
}
