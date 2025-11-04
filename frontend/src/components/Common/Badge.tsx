import React from "react";
import styles from "./Badge.module.scss";

// Define possible badge variants based on our CSS variables
type BadgeVariant =
  | "primary"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "default";

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
}

const Badge: React.FC<BadgeProps> = ({ text, variant = "default" }) => {
  // Map variant name to CSS variable for background
  const getVariantClass = () => {
    switch (variant) {
      case "primary":
        return styles.primary;
      case "success":
        return styles.success;
      case "error":
        return styles.error;
      case "warning":
        return styles.warning;
      case "info":
        return styles.info;
      default:
        return styles.default;
    }
  };

  return <span className={`${styles.badge} ${getVariantClass()}`}>{text}</span>;
};

export default Badge;
