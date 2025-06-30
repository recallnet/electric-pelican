import React from "react";

import { cn } from "@/lib/utils";

export interface ElectricButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant using Electric Pelican design */
  variant?: "primary" | "secondary" | "tertiary" | "outline" | "ghost";
  /** Button size */
  size?: "sm" | "md" | "lg";
  /** Full width on mobile, auto on larger screens */
  responsive?: boolean;
}

/**
 * Electric Button component following Electric Pelican design system.
 * Uses custom interactive surfaces with responsive design.
 */
export const ElectricButton = React.forwardRef<HTMLButtonElement, ElectricButtonProps>(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      responsive = true,
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseClasses = [
      // Base styling
      "font-semibold",
      "transition-all",
      "duration-200",
      "focus:outline-none",
      "focus:ring-2",
      "focus:ring-offset-2",
      // Responsive width
      responsive ? "w-full sm:w-auto" : "",
      // Disabled state
      disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
      // Elevation
      "shadow-e1",
    ];

    const variantClasses = {
      primary: [
        "bg-brand-blue",
        "text-brand-white",
        "hover:bg-brand-blue/90",
        "active:bg-brand-blue/80",
        "focus:ring-brand-blue",
        "hover:shadow-e2",
      ],
      secondary: [
        "bg-brand-green",
        "text-brand-white",
        "hover:bg-brand-green/90",
        "active:bg-brand-green/80",
        "focus:ring-brand-green",
        "hover:shadow-e2",
      ],
      tertiary: [
        "bg-brand-yellow",
        "text-brand-black",
        "hover:bg-brand-yellow/90",
        "active:bg-brand-yellow/80",
        "focus:ring-brand-yellow",
        "hover:shadow-e2",
      ],
      outline: [
        "border-2",
        "border-brand-blue",
        "text-brand-blue",
        "bg-transparent",
        "hover:bg-brand-blue/10",
        "hover:text-brand-blue",
        "active:bg-brand-blue/20",
        "focus:ring-brand-blue",
        "hover:shadow-e2",
      ],
      ghost: [
        "text-brand-gray-04",
        "bg-transparent",
        "hover:bg-brand-gray-01",
        "active:bg-brand-gray-02",
        "focus:ring-brand-gray-03",
        "hover:shadow-e2",
      ],
    };

    const sizeClasses = {
      sm: "py-1 px-3 text-label rounded-md",
      md: "py-2 px-4 text-body rounded-md",
      lg: "py-3 px-6 text-headline rounded-lg",
    };

    return (
      <button
        ref={ref}
        className={cn(...baseClasses, ...variantClasses[variant], sizeClasses[size], className)}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  },
);

ElectricButton.displayName = "ElectricButton";
