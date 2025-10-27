// np. w src/components/common/Icon.tsx

import React from "react";
import { cn } from "../../utils/cn"; // Upewnij się, że ścieżka jest poprawna

// Definiujemy bazowe propsy, które będą wspólne dla każdej ikony
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

// Nasz generyczny komponent-wrapper
// Akceptuje wszystkie standardowe atrybuty SVG, aby umożliwić nadpisywanie
type IconProps = React.SVGProps<SVGSVGElement>;

export const Icon = ({ className, children, ...rest }: IconProps) => {
  return (
    <svg
      {...iconBaseProps} // 1. Zastosuj domyślne propsy
      {...rest} // 2. Zastosuj wszelkie nadpisania (np. inny fill, strokeWidth)
      className={cn("icon-svg", className)} // 3. Połącz bazową klasę z przekazaną
    >
      {children}
    </svg>
  );
};
