export interface NavItem {
  href: string;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/composition-checker", label: "Composition Checker" },
  { href: "/library", label: "Material Library" },
  { href: "/about", label: "About" },
];

export const APP_CONFIG = {
  name: "AlloyCal",
  shortDescription:
    "An educational metallurgy application designed for students and materials engineers to explore alloy chemical compositions, understand elemental balance calculations, and inspect material specifications.",
  currentYear: 2026,
};
