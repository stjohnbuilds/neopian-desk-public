const destinations = {
  page: [
    "dailies",
    "favorites",
    "items",
    "profit",
    "achievements",
    "personalization",
    "tools",
  ],
  personalization: ["names", "scripts", "pages", "account"],
  profit: ["sales", "restocks", "trades"],
  achievements: ["avatars", "goals", "battledome", "stamps", "petpets"],
} as const;

export type ToolSection = "app" | "tampermonkey" | "names";
export type Navigation = {
  [K in keyof typeof destinations]: (typeof destinations)[K][number];
} & { tools?: ToolSection; dailies?: "daily" | "avatars" | "scores" };

export const defaultNavigation: Navigation = {
  page: "dailies",
  personalization: "pages",
  tools: "app",
  dailies: "daily",
  profit: "sales",
  achievements: "avatars",
};

export function validateNavigation(
  value: unknown,
): asserts value is Navigation {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("Invalid saved navigation. Nothing imported.");
  const saved = value as Record<string, unknown>;
  if (
    saved.tools !== undefined &&
    !["app", "tampermonkey", "names"].includes(saved.tools as string)
  )
    throw Error("Invalid saved tools section. Nothing imported.");
  if (
    saved.dailies !== undefined &&
    !["daily", "avatars", "scores"].includes(saved.dailies as string)
  )
    throw Error("Invalid saved dailies section. Nothing imported.");
  for (const [key, options] of Object.entries(destinations))
    if (!(options as readonly unknown[]).includes(saved[key]))
      throw Error("Invalid saved navigation. Nothing imported.");
}

/** Resolve legacy destinations on read, including restored backups. Persist on
 * the next normal navigation save, leaving all feature records untouched. */
export function resolveNavigation(
  saved: Navigation = defaultNavigation,
): Navigation {
  const legacyTool = saved.personalization === "names" ? "names" : "app";
  return {
    ...saved,
    page:
      saved.page === "favorites" ? "dailies" : saved.page === "personalization" &&
      ["names", "scripts"].includes(saved.personalization)
        ? "tools"
        : saved.page,
    personalization: saved.personalization === "account" ? "account" : "pages",
    dailies: saved.dailies ?? "daily",
    tools: saved.tools ?? legacyTool,
  };
}
