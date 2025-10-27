// src/components/common/Icon.tsx
import React from "react";
import { cn } from "../../utils/cn";

// Typ dla ikon (np. IconHome), które przyjmują tylko className
export type SpecificIconProps = {
  className?: string;
};

const iconBaseProps = {
  width: "1em",
  height: "1em",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

type IconProps = React.SVGProps<SVGSVGElement>;

export const Icon = ({ className, children, ...rest }: IconProps) => {
  return (
    <svg {...iconBaseProps} {...rest} className={cn("icon-svg", className)}>
      {children}
    </svg>
  );
};
