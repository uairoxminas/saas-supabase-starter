"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { appConfig } from "@/lib/config";

type BuiltWithProps = {
  variant?: "compact" | "default";
  className?: string;
};

export function BuiltWithLasyAI({ variant = "default", className }: BuiltWithProps) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors",
        variant === "compact" ? "text-xs" : "text-sm",
        className,
      )}
      aria-label={`Built with ${appConfig.projectName}`}
    >
      <span>
        Built with{" "}
        <span className="font-medium">{appConfig.projectName}</span>
      </span>
    </Link>
  );
}
