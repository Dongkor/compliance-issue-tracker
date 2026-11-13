"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/issues", label: "Issues" },
];

// The pill-shaped navigation. It runs in the browser because it needs the
// current URL (usePathname) to highlight the page the user is on.
// Example: on /issues/12 the "Issues" pill is highlighted.
export default function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 rounded-full border border-line bg-card p-1 text-sm">
      {links.map((link) => {
        let isActive = pathname === link.href;
        if (link.href !== "/" && pathname.startsWith(link.href)) {
          isActive = true;
        }

        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              isActive
                ? "rounded-full bg-line px-3 py-1 text-white"
                : "rounded-full px-3 py-1 text-muted hover:text-white"
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
