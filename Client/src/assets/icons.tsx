// w src/assets/icons.tsx

import { Icon } from "../components/common/Icon"; // Importuj swój nowy wrapper
import { cn } from "../utils/cn";

// Typ dla specyficznych ikon pozostaje ten sam
type SpecificIconProps = {
  className?: string;
};

// Zobacz, o ile prostszy jest teraz ten komponent:
export const IconChevronLeft = ({ className }: SpecificIconProps) => (
  <Icon className={cn("icon-chevron-left", className)}>
    <polyline points="15 18 9 12 15 6"></polyline>
  </Icon>
);

// I kolejna ikona:
export const IconCrown = ({ className }: SpecificIconProps) => (
  <Icon className={cn("icon-crown", className)}>
    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
    <polyline points="2 17 12 22 22 17"></polyline>
    <polyline points="2 12 12 17 22 12"></polyline>
  </Icon>
);

// I kolejna:
export const IconAtom = ({ className }: SpecificIconProps) => (
  <Icon className={cn("icon-atom", className)}>
    <circle cx="12" cy="12" r="1"></circle>
    <ellipse cx="12" cy="12" rx="10" ry="4"></ellipse>
    <ellipse
      cx="12"
      cy="12"
      rx="4"
      ry="10"
      transform="rotate(60 12 12)"
    ></ellipse>
    <ellipse
      cx="12"
      cy="12"
      rx="4"
      ry="10"
      transform="rotate(120 12 12)"
    ></ellipse>
  </Icon>
);

export const IconBadge = ({ className }: SpecificIconProps) => (
  <Icon className={cn("icon-badge", className)}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
  </Icon>
);
