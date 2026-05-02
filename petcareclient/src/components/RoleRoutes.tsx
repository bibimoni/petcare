import type { ReactNode } from "react";

import { useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";

import { getSidebarUser } from "@/lib/user";

interface Props {
  children: ReactNode;
  allowedRoles: string[]; // e.g., ["ADMIN", "STAFF", "NULL"]
}

export default function RoleRoute({ children, allowedRoles }: Props) {
  const token = localStorage.getItem("accessToken");

  const { data: userInfo, isLoading } = useQuery({
    queryKey: ["sidebar-user"],
    queryFn: getSidebarUser,
    enabled: !!token,
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const roleName = userInfo?.role?.name?.toUpperCase() || "NULL";

  if (!allowedRoles.includes(roleName)) {
    return <Navigate to="/not-authenticated" replace />;
  }

  return <>{children}</>;
}
