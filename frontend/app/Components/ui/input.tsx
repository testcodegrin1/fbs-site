import * as React from "react";
import { cn } from "@/app/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", onWheel, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/60 disabled:cursor-not-allowed disabled:opacity-50",
          type === "file" &&
            "h-11 p-1 items-center leading-none text-xs text-slate-600 file:border-0 file:bg-slate-100 file:text-slate-800 file:text-xs file:font-bold file:px-3 file:py-1.5 file:rounded-md file:mr-3 file:cursor-pointer hover:file:bg-slate-200",
          className
        )}
        ref={ref}
        onWheel={(e) => {
          if (type === "number") {
            e.currentTarget.blur();
          }
          onWheel?.(e);
        }}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
