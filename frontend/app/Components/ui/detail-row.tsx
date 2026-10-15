"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/app/lib/utils";

/** Opens the existing detail view without intercepting actions within a row. */
export function DetailRow({ className, onClick, onKeyDown, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      {...props}
      tabIndex={0}
      className={cn("portal-detail-row cursor-pointer", className)}
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("button, a, input, select, textarea, label")) return;
        onClick?.(event);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!event.defaultPrevented && event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          event.currentTarget.click();
        }
      }}
    />
  );
}
