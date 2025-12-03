"use client";

import { InputHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={clsx(
        "flex h-9 w-full rounded-md border border-sep-border bg-black/40 px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sep-primary/60",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";

