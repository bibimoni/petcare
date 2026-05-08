import api from "@/lib/api";

export type SidebarUser = {
  email: string;
  phone: string;
  address: string;
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

type StoredUser = Record<string, unknown> & {
  email?: string;
  phone?: string;
  address?: string;
  fullName?: string;
  full_name?: string;
  role_id?: number | null;
  store_id?: number | null;
  role?: {
    id: string;
    name: string;
    store_id: number;
    description: string;
    role_permissions: unknown;
  } | null;
};

const USER_STORAGE_KEY = "user";

const emptySidebarUser: SidebarUser = {
  role: null,
  email: "",
  address: "",
  phone: "",
  store_id: 0,
  full_name: "",
};

export const getStoredUser = (): StoredUser | null => {
  try {
    const rawUser = localStorage.getItem(USER_STORAGE_KEY);
    return rawUser ? (JSON.parse(rawUser) as StoredUser) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (patch: StoredUser): StoredUser => {
  const currentUser = getStoredUser() ?? {};
  const nextUser = { ...currentUser, ...patch };
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
  return nextUser;
};

const normalizeRole = (
  role: unknown,
  storeIdFallback: number,
): SidebarUser["role"] => {
  if (!role) {
    return null;
  }

  if (typeof role === "string") {
    const roleName = role.trim();

    if (!roleName) {
      return null;
    }

    return {
      description: "",
      id: "",
      name: roleName,
      role_permissions: null,
      store_id: storeIdFallback,
    };
  }

  if (typeof role === "object") {
    const roleData = role as Record<string, unknown>;
    const roleName = String(roleData.name ?? "").trim();

    if (!roleName) {
      return null;
    }

    return {
      description: String(roleData.description ?? ""),
      id: String(roleData.id ?? ""),
      name: roleName,
      role_permissions: roleData.role_permissions ?? null,
      store_id: Number(roleData.store_id ?? storeIdFallback),
    };
  }

  return null;
};

export const buildSidebarUser = (
  profile: StoredUser | null,
  fallback: StoredUser | null = null,
): SidebarUser => {
  const storeId = Number(profile?.store_id ?? fallback?.store_id ?? 0);
  const role = profile
    ? normalizeRole(profile.role, storeId)
    : normalizeRole(fallback?.role, storeId);

  return {
    role,
    email: String(profile?.email ?? fallback?.email ?? ""),
    phone: String(profile?.phone ?? fallback?.phone ?? ""),
    address: String(profile?.address ?? fallback?.address ?? ""),
    store_id: storeId,
    full_name: String(
      profile?.full_name ??
      profile?.fullName ??
      fallback?.full_name ??
      fallback?.fullName ??
      "",
    ),
  };
};

export async function getSidebarUser(): Promise<SidebarUser> {
  try {
    const response = await api.get("/users/profile");
    const profile = response.data?.data ?? response.data ?? response;

    setStoredUser(profile);

    return buildSidebarUser(profile, getStoredUser());
  } catch {
    return (
      buildSidebarUser(getStoredUser(), getStoredUser()) ?? emptySidebarUser
    );
  }
}
