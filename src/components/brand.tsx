import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-2 font-bold tracking-tight", className)}
    >
      <span className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground">
        <Sparkles size={16} aria-hidden="true" />
      </span>
      <span>Zeinth</span>
    </Link>
  );
}
