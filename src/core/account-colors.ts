export const colorRoles = [
  ["background", "Outer background"],
  ["surface", "Container background"],
  ["text", "Body text"],
  ["heading", "Main headings"],
  ["subheading", "Smaller headings"],
  ["link", "Links and accents"],
  ["highlight", "First pastel"],
  ["border", "Second pastel and dividers"],
] as const;
export type ColorRole = (typeof colorRoles)[number][0];
export type AccountColors = Record<ColorRole, string>;
export const defaultColors: AccountColors = {
  background: "#FFFDF9",
  surface: "#FFFEFA",
  text: "#64667C",
  heading: "#747C96",
  subheading: "#747C96",
  link: "#747C96",
  highlight: "#F6DDED",
  border: "#E0E9F8",
};
export const colorPairings = {
  "Pink + periwinkle": ["#F6DDED", "#E0E9F8", "#747C96"],
  "Lavender + pink": ["#E7E1F8", "#F6DDED", "#7C718F"],
  "Mint + lavender": ["#E2F0E7", "#E7E1F8", "#747F86"],
  "Mint + pink": ["#E2F0E7", "#F6DDED", "#7B7B89"],
} as const;
export function pairedColors(name: keyof typeof colorPairings): AccountColors {
  const [highlight, border, heading] = colorPairings[name];
  return {
    ...defaultColors,
    highlight,
    border,
    heading,
    subheading: heading,
    link: heading,
  };
}
export const colorSwatches = [
  ["Cloud cream", "#FFFDF9"],
  ["Light ivory", "#FFFEFA"],
  ["Pink", "#F6DDED"],
  ["Periwinkle", "#E0E9F8"],
  ["Lavender", "#E7E1F8"],
  ["Mint", "#E2F0E7"],
  ["Butter", "#F8F0D9"],
  ["Soft peach", "#FAE8DE"],
  ["Blue-grey ink", "#64667C"],
  ["Periwinkle ink", "#747C96"],
  ["Purple-grey ink", "#7C718F"],
  ["Mint-grey ink", "#747F86"],
] as const;
export function validateAccountColors(
  value: unknown,
): asserts value is AccountColors {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).length !== colorRoles.length ||
    !colorRoles.every(
      ([key]) =>
        typeof (value as AccountColors)[key] === "string" &&
        /^#[0-9a-f]{6}$/i.test((value as AccountColors)[key]),
    )
  ) {
    throw Error(
      "Use a six-digit hex colour for every colour role, such as #FFF1E2.",
    );
  }
}
export const signatureDefaults: Record<string, string> = {
  "neo-signature:default:html": "",
  "neo-signature:default:signature": "",
  "neo-signature:art:html": "",
  "neo-signature:art:signature": "",
};
export const stripPreviewArtifacts = (html: string) => html;
export function applyCodeColors(
  key: string,
  value: string,
  colors?: AccountColors,
) {
  if (!colors || !value) return value;
  validateAccountColors(colors);
  if (key.startsWith("neo-signature:"))
    return value.replace(/(\[font[^\]]*c=)#[0-9a-f]{6}/gi, `$1${colors.text}`);
  const clean = value.replace(/<style data-desk-colors>[\s\S]*?<\/style>/g, "");
  return (
    clean +
    `\n<style data-desk-colors>body{background:${colors.background};color:${colors.text}}h1{color:${colors.heading}}h2,h3{color:${colors.subheading}}a{color:${colors.link}}</style>`
  );
}
