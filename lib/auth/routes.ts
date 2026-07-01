export type AppRole = "admin" | "participant" | "judge";

export const protectedPrefixes = [
  "/dashboard",
  "/hackathons",
  "/profile",
  "/results",
  "/teams",
] as const;

export const roleProtectedPrefixes: Record<string, AppRole[]> = {
  "/admin": ["admin"],
  "/judge": ["judge", "admin"],
};
