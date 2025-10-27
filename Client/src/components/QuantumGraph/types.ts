// src/components/QuantumGraph/types.ts
import type { SimulationNodeDatum } from "d3-force";

export type NodeType = "galaxy" | "quiz";

export interface BaseNode {
  id: string;
  label: string;
  type: NodeType;
  color: string;
}

export interface GalaxyNode extends BaseNode {
  type: "galaxy";
  children: string[];
}

export interface QuizNode extends BaseNode {
  type: "quiz";
  parentId: string;
  progress: number;
}

export type GraphNode = (GalaxyNode | QuizNode) & SimulationNodeDatum;

export interface GraphLink {
  id: string;
  source: string;
  target: string;
  type: "galaxy-to-galaxy" | "quiz-to-quiz";
}

// Typ dla linków, które zostały przetworzone przez D3
export type ProcessedLink = GraphLink &
  SimulationNodeDatum & {
    source: GraphNode;
    target: GraphNode;
  };
