import { ReactNode } from "react";
import { clsx } from "clsx";

export function Badge({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full bg-sep-primary/10 px-2 py-0.5 text-[10px] font-medium text-sep-primary",
        className
      )}
    >
      {children}
    </span>
  );
}

