import { ReactNode } from "react";
import { clsx } from "clsx";

export function Card({
  className,
  children
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-sep-border bg-sep-card shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardContent({
  className,
  children
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={clsx("p-6", className)}>{children}</div>;
}

