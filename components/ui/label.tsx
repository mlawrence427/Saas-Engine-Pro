import { LabelHTMLAttributes } from "react";
import { clsx } from "clsx";

export function Label({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={clsx("text-xs font-medium text-sep-muted", className)}
      {...props}
    />
  );
}

