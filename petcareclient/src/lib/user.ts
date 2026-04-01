const rawUser = localStorage.getItem("user");
const user = rawUser ? JSON.parse(rawUser) : null;

export const sidebarUser = {
  email: String(user?.email ?? ""),
  full_name: String(user?.full_name ?? ""),
  phone: String(user?.phone ?? ""),
  role: String(user?.role ?? ""),
};
