export type AppRole = "admin" | "participant" | "judge";

export const protectedPrefixes = ["/dashboard", "/profile"] as const;

export const roleProtectedPrefixes: Record<string, AppRole[]> = {
  "/admin": ["admin"],
  "/judge": ["judge", "admin"],
};
