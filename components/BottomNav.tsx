"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Scale, Footprints, Utensils, Dumbbell, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: Home, label: "Accueil" },
  { href: "/poids", icon: Scale, label: "Poids" },
  { href: "/pas", icon: Footprints, label: "Pas" },
  { href: "/bouffe", icon: Utensils, label: "Bouffe" },
  { href: "/salle", icon: Dumbbell, label: "Salle" },
  { href: "/objectifs", icon: Target, label: "Objectifs" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-[#1E1E2E]">
      <div className="max-w-[480px] mx-auto flex items-center justify-around px-1 py-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-all min-w-[48px]",
                isActive
                  ? "text-[#00D4AA]"
                  : "text-[#7A7A9A] hover:text-[#F0F0F5]"
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
