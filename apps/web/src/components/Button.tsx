import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[10px] border text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8a94e] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "border-[#d8a94e]/70 bg-[#d8a94e] text-[#100c08] shadow-[0_14px_30px_rgba(216,169,78,.22)] hover:bg-[#f1c66b]",
        ghost: "border-[#d8a94e]/20 bg-[#f4d28a0d] text-[#f6e2ad] hover:border-[#d8a94e]/50 hover:bg-[#f4d28a1a]",
        danger: "border-[#a8483f]/50 bg-[#a8483f]/20 text-[#f2aaa1] hover:bg-[#a8483f]/30"
      },
      size: {
        sm: "h-9 px-3",
        md: "h-11 px-4",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "ghost",
      size: "md"
    }
  }
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
