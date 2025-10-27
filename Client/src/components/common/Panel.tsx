// components/common/Panel.tsx
import React from "react";
import styles from "./Panel.module.css";
import { cn } from "../../utils/cn"; // <-- DODAJ TĘ LINIĘ

type PanelProps = {
  children: React.ReactNode;
  className?: string;
};

export const Panel = ({ children, className }: PanelProps) => {
  return <div className={cn(styles.panel, className)}>{children}</div>;
};
