export interface NavItem {
  href: string;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/charge-calculator", label: "Charge Calculator" },
  { href: "/composition-checker", label: "Composition Checker" },
  { href: "/library", label: "Material Library" },
  { href: "/about", label: "About" },
];

export const APP_CONFIG = {
  name: "AlloyCal",
  shortDescription:
    "An engineering metallurgy application for alloy chemical composition verification and simultaneous mass-balance melting charge calculations.",
  currentYear: 2026,
};
