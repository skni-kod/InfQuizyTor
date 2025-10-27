// src/assets/icons.tsx
import { Icon, type SpecificIconProps } from "../components/common/Icon"; // <-- Poprawny import
import { cn } from "../utils/cn";

// --- Ikony Nawigacji ---

export const IconHome = ({ className }: SpecificIconProps) => (
  <Icon className={cn("icon-home", className)}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </Icon>
);

export const IconGraph = ({ className }: SpecificIconProps) => (
  <Icon className={cn("icon-graph", className)}>
    <circle cx="12" cy="12" r="1"></circle>
    <circle cx="19" cy="19" r="1"></circle>
    <circle cx="5" cy="5" r="1"></circle>
    <circle cx="12" cy="5" r="1"></circle>
    <circle cx="5" cy="12" r="1"></circle>
    <circle cx="19" cy="5" r="1"></circle>
    <circle cx="5" cy="19" r="1"></circle>
    <path d="M12 12l-7 -7"></path>
    <path d="M12 12v-7"></path>
    <path d="M12 12l7 -7"></path>
    <path d="M12 12l-7 7"></path>
    <path d="M12 12l7 7"></path>
    <path d="M12 12h-7"></path>
  </Icon>
);

export const IconUsers = ({ className }: SpecificIconProps) => (
  <Icon className={cn("icon-users", className)}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </Icon>
);

export const IconUser = ({ className }: SpecificIconProps) => (
  <Icon className={cn("icon-user", className)}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </Icon>
);

// --- Ikony Widżetów ---

export const IconCalendar = ({ className }: SpecificIconProps) => (
  <Icon className={cn("icon-calendar", className)}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </Icon>
);

export const IconBookOpen = ({ className }: SpecificIconProps) => (
  <Icon className={cn("icon-book-open", className)}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
  </Icon>
);

export const IconStar = ({ className }: SpecificIconProps) => (
  <Icon className={cn("icon-star", className)}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
  </Icon>
);

export const IconCrown = ({ className }: SpecificIconProps) => (
  <Icon className={cn("icon-crown", className)}>
    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
    <polyline points="2 17 12 22 22 17"></polyline>
    <polyline points="2 12 12 17 22 12"></polyline>
  </Icon>
);

export const IconBadge = ({ className }: SpecificIconProps) => (
  <Icon className={cn("icon-badge", className)}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
  </Icon>
);

// --- Inne Ikony ---

export const IconChevronLeft = ({ className }: SpecificIconProps) => (
  <Icon className={cn("icon-chevron-left", className)}>
    <polyline points="15 18 9 12 15 6"></polyline>
  </Icon>
);

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
