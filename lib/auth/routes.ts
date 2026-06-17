export type AppRole = "admin" | "participant" | "judge";

export const protectedPrefixes = ["/dashboard", "/hackathons", "/profile"] as const;

export const roleProtectedPrefixes: Record<string, AppRole[]> = {
  "/admin": ["admin"],
  "/judge": ["judge", "admin"],
};
