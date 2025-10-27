// src/components/QuantumGraph/QuantumGraph.tsx
import React, { useRef, useState } from "react";
// import * as d3 from 'd3'; <-- USUNIĘTE, nieużywane
import { useD3ForceGraph } from "./useD3ForceGraph";
// POPRAWKA: Użyj 'import type' dla typów
import type { GraphNode, GraphLink, GalaxyNode, QuizNode } from "./types";
import styles from "./QuantumGraph.module.css";
import { cn } from "../../utils/cn";
import { IconChevronLeft } from "../../assets/icons";

// --- Mock Data ---
const nodes: GraphNode[] = [
  {
    id: "math",
    label: "Matematyka",
    type: "galaxy",
    children: ["alg", "deriv", "int"],
    color: "var(--primary)",
  } as GalaxyNode,
  {
    id: "phys",
    label: "Fizyka",
    type: "galaxy",
    children: ["kin", "dyn"],
    color: "var(--secondary)",
  } as GalaxyNode,
  {
    id: "code",
    label: "Programowanie",
    type: "galaxy",
    children: ["react", "ts"],
    color: "var(--tertiary)",
  } as GalaxyNode,

  {
    id: "alg",
    label: "Algebra",
    type: "quiz",
    parentId: "math",
    progress: 100,
    color: "var(--primary)",
  } as QuizNode,
  {
    id: "deriv",
    label: "Pochodne",
    type: "quiz",
    parentId: "math",
    progress: 80,
    color: "var(--primary)",
  } as QuizNode,
  {
    id: "int",
    label: "Całki",
    type: "quiz",
    parentId: "math",
    progress: 20,
    color: "var(--primary)",
  } as QuizNode,

  {
    id: "kin",
    label: "Kinematyka",
    type: "quiz",
    parentId: "phys",
    progress: 90,
    color: "var(--secondary)",
  } as QuizNode,
  {
    id: "dyn",
    label: "Dynamika",
    type: "quiz",
    parentId: "phys",
    progress: 40,
    color: "var(--secondary)",
  } as QuizNode,

  {
    id: "react",
    label: "React",
    type: "quiz",
    parentId: "code",
    progress: 100,
    color: "var(--tertiary)",
  } as QuizNode,
  {
    id: "ts",
    label: "TypeScript",
    type: "quiz",
    parentId: "code",
    progress: 75,
    color: "var(--tertiary)",
  } as QuizNode,
];

const links: GraphLink[] = [
  { id: "l1", source: "math", target: "phys", type: "galaxy-to-galaxy" },
  { id: "l2", source: "math", target: "code", type: "galaxy-to-galaxy" },
  { id: "l3", source: "phys", target: "code", type: "galaxy-to-galaxy" },

  { id: "l-m1", source: "alg", target: "deriv", type: "quiz-to-quiz" },
  { id: "l-m2", source: "deriv", target: "int", type: "quiz-to-quiz" },

  { id: "l-p1", source: "kin", target: "dyn", type: "quiz-to-quiz" },

  { id: "l-c1", source: "react", target: "ts", type: "quiz-to-quiz" },
];

const mockData = { nodes, links };
// --- End Mock Data ---

export const QuantumGraph = () => {
  // POPRAWKA: Ref musi zaczynać się od 'null' i mieć poprawny typ
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [activeGalaxy, setActiveGalaxy] = useState<string | null>(null);

  useD3ForceGraph(svgRef, mockData, activeGalaxy, (node) =>
    setActiveGalaxy(node.id)
  );

  const handleBackClick = () => {
    setActiveGalaxy(null);
  };

  const activeGalaxyData = activeGalaxy
    ? (nodes.find((n) => n.id === activeGalaxy) as GalaxyNode)
    : null;

  return (
    <div className={styles.graphContainer}>
      <button
        className={cn(styles.backButton, activeGalaxy && styles.visible)}
        onClick={handleBackClick}
        // Poniższy styl jest POPRAWNY. To ostrzeżenie to fałszywy alarm.
        // Używamy zmiennych CSS, aby dynamicznie przekazać kolor do CSS.
        style={
          {
            "--galaxy-color": activeGalaxyData?.color || "var(--primary)",
          } as React.CSSProperties
        }
      >
        <IconChevronLeft />
        Wróć do Galaktyk
      </button>

      <svg ref={svgRef} className={styles.graphSvg}></svg>
    </div>
  );
};
