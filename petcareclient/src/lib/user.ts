import api from "@/lib/api";

export type SidebarUser = {
  email: string;
  phone: string;
  store_id: number;
  full_name: string;
  role: {
    id: string;
    name: string;
    store_id: number;
    description: string;
    role_permissions: unknown;
  } | null;
};

const emptySidebarUser: SidebarUser = {
  role: null,
  email: "",
  phone: "",
  store_id: 0,
  full_name: "",
};

export async function getSidebarUser(): Promise<SidebarUser> {
  try {
    const response = await api.get("/users/profile");
    const profile = response.data?.data ?? response.data ?? response;

    const normalizedRole = (() => {
      if (profile?.role) {
        const role = profile.role as Record<string, unknown>;
        return {
          description: String(role.description ?? ""),
          id: String(role.id ?? ""),
          name: String(role.name ?? ""),
          role_permissions: role.role_permissions ?? null,
          store_id: Number(role.store_id ?? 0),
        };
      }

      return null;
    })();

    return {
      role: normalizedRole,
      email: String(profile?.email ?? ""),
      phone: String(profile?.phone ?? ""),
      store_id: Number(profile?.store_id ?? 0),
      full_name: String(profile?.full_name ?? profile?.fullName ?? ""),
    };
  } catch {
    return emptySidebarUser;
  }
}

export const sidebarUser = getSidebarUser();
