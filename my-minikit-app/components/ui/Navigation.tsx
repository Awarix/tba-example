"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/trade", label: "Trade", icon: "📈" },
  { href: "/portfolio", label: "Portfolio", icon: "💼" },
  { href: "/fund", label: "Fund", icon: "💰" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-md border-t border-surface-elevated shadow-2xl safe-area-inset-bottom">
      <div className="max-w-7xl mx-auto flex items-center justify-center py-3">
        <div className="flex gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-6 py-2.5 rounded-lg transition-all min-w-[90px] ${
                  isActive
                    ? "bg-accent text-white shadow-lg shadow-accent/30"
                    : "text-text-muted hover:text-text-primary hover:bg-surface-elevated"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
