"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sep-primary/60 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants: Record<string, string> = {
      default: "bg-sep-primary text-white hover:bg-sep-primary/90",
      outline:
        "border border-sep-border bg-transparent hover:bg-sep-border/80 text-sep-foreground",
      ghost:
        "bg-transparent hover:bg-sep-border/60 text-sep-muted hover:text-sep-foreground"
    };

    const sizes: Record<string, string> = {
      sm: "text-xs h-8 px-3",
      md: "text-sm h-9 px-4"
    };

    return (
      <button
        ref={ref}
        className={clsx(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

