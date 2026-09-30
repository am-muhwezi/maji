import { BarChart3, ClipboardList, LayoutDashboard, Package, ShoppingCart, Wallet, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  /** Shorter label for the phone tab bar. */
  short: string;
  icon: LucideIcon;
  /** One line shown as the link's tooltip on the icon rail. */
  hint: string;
}

export const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", short: "Home", icon: LayoutDashboard, hint: "Today at a glance" },
  { href: "/daily-log", label: "Daily Log", short: "Daily", icon: ClipboardList, hint: "Production, counts, close the day" },
  { href: "/sales", label: "Sales", short: "Sales", icon: ShoppingCart, hint: "Receipts and money owed" },
  { href: "/stock", label: "Stock", short: "Stock", icon: Package, hint: "What is on hand, shortages" },
  { href: "/expenses", label: "Expenses", short: "Expenses", icon: Wallet, hint: "Money spent this month" },
  { href: "/reports", label: "Reports", short: "Reports", icon: BarChart3, hint: "Monthly profit and trends" },
];

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
