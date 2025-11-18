import React, { useState, useEffect, useMemo } from "react";
import styles from "./QuizGraph.module.scss";
import { QuizNode, Subject, Topic, AppSubject } from "../../assets/types.tsx";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaLock,
  FaPlay,
  FaSpinner,
} from "react-icons/fa";
import * as d3 from "d3-force";
import useMeasure from "react-use-measure";

// --- Interfejsy ---

interface QuizGraphProps {
  subject: Subject | AppSubject;
  topics: Topic[]; // Lista odblokowanych tematów
  onBack?: () => void;
  onNodeClick: (topic: Topic) => void;
  UsosID: string; // UsosID kursu
  subjectColor: string;
}

// Interfejsy D3
interface D3Node extends QuizNode {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}
interface D3Link {
  source: number; // ID węzła (number)
  target: number; // ID węzła (number)
}

// --- Komponent Węzła (Node) ---
const GraphNode: React.FC<{
  node: D3Node;
  topics: Topic[]; // Lista odblokowanych tematów
  onNodeClick: (topic: Topic) => void;
}> = ({ node, topics, onNodeClick }) => {
  const topic = topics.find((t) => t.Name === node.Title);
  const status = topic ? "available" : "locked";
  // TODO: Dodać logikę dla 'completed'

  const getStatusIcon = (s: "locked" | "available" | "completed") => {
    switch (s) {
      case "completed":
        return <FaCheckCircle className={styles.icon} />;
      case "available":
        return <FaPlay className={styles.icon} />;
      case "locked":
        return <FaLock className={styles.icon} />;
    }
  };

  const handleClick = () => {
    if (status !== "locked" && topic) {
      onNodeClick(topic);
    }
  };

  return (
    <g
      className={`${styles.node} ${styles[status]}`}
      transform={`translate(${node.x}, ${node.y})`}
      onClick={handleClick}
    >
      <circle r={40} />
      {getStatusIcon(status)}
      <text x={0} y={60} textAnchor="middle" className={styles.nodeTitle}>
        {node.Title}
      </text>
    </g>
  );
};

// --- Główny Komponent QuizGraph ---
const QuizGraph: React.FC<QuizGraphProps> = ({
  subject,
  topics,
  onBack,
  onNodeClick,
  UsosID,
  subjectColor,
}) => {
  const [ref, bounds] = useMeasure();
  const [renderedNodes, setRenderedNodes] = useState<D3Node[]>([]);

  // Stany do pobierania grafu
  const [graphStructure, setGraphStructure] = useState<QuizNode[]>([]);
  const [isLoadingGraph, setIsLoadingGraph] = useState(true);
  const [graphError, setGraphError] = useState<string | null>(null);

  // Pobieranie struktury grafu
  useEffect(() => {
    const fetchGraphStructure = async () => {
      if (!UsosID) return;

      setIsLoadingGraph(true);
      setGraphError(null);
      try {
        // --- POPRAWKA: Używamy nowej trasy /api/subjects/... ---
        // Stary URL: /api/courses/${UsosID}/graph
        const res = await fetch(
          `/api/subjects/${UsosID}/graph`, // Zgodny z main.go
          {
            credentials: "include",
          }
        );
        // --- KONIEC POPRAWKI ---

        if (!res.ok)
          throw new Error(`Nie udało się pobrać grafu: ${res.status}`);
        const data: QuizNode[] = await res.json();
        setGraphStructure(data);
      } catch (e: any) {
        setGraphError(e.message || "Błąd ładowania grafu");
      }
      setIsLoadingGraph(false);
    };

    fetchGraphStructure();
  }, [UsosID]);

  // Krok 1: Przekształć dane w format D3
  const graphData = useMemo(() => {
    if (!bounds.width || !bounds.height || graphStructure.length === 0) {
      return { nodes: [], links: [] };
    }

    const links: D3Link[] = [];

    const rootNode: D3Node = {
      ID: 0,
      Title: "",
      UsosCourseID: UsosID,
      Dependencies: [],
      x: bounds.width / 2,
      y: bounds.height / 2,
      fx: bounds.width / 2,
      fy: bounds.height / 2,
    };

    const topicNodes: D3Node[] = graphStructure.map((node) => ({ ...node }));
    const nodes = [rootNode, ...topicNodes];

    for (const node of topicNodes) {
      if (!node.Dependencies || node.Dependencies.length === 0) {
        links.push({ source: 0, target: node.ID }); // Połącz z ROOT
      } else {
        node.Dependencies.forEach((depId: number) => {
          links.push({ source: depId, target: node.ID });
        });
      }
    }

    return { nodes, links };
  }, [graphStructure, bounds.width, bounds.height, UsosID]);

  // Krok 2: Uruchom symulację D3
  useEffect(() => {
    if (!graphData.nodes.length) return;

    const nodesCopy = graphData.nodes.map((n) => ({ ...n }));
    const linksCopy = graphData.links.map((l) => ({ ...l }));

    const simulation = d3
      .forceSimulation(nodesCopy)
      .force(
        "link",
        d3
          .forceLink(linksCopy)
          .id((d: any) => d.ID)
          .distance(120)
      )
      .force("charge", d3.forceManyBody().strength(-500))
      .force("collide", d3.forceCollide(50));

    simulation.stop();
    simulation.tick(300);
    setRenderedNodes([...nodesCopy]);
  }, [graphData]);

  // Znajdź pozycje końcowe dla linii (linków)
  const renderedLinks = useMemo(() => {
    return graphData.links.map((link) => {
      const source = renderedNodes.find((n) => n.ID === link.source);
      const target = renderedNodes.find((n) => n.ID === link.target);
      return { source, target };
    });
  }, [graphData.links, renderedNodes]);

  const subjectName = "Name" in subject ? subject.Name : subject.name;

  return (
    <div className={styles.graphContainer}>
      <header className={styles.header}>
        {onBack && (
          <button className={styles.backButton} onClick={onBack}>
            <FaArrowLeft /> Wróć
          </button>
        )}
        <h2 className={styles.title}>{subjectName} - Ścieżka Nauki</h2>
      </header>
      <div className={styles.svgWrapper} ref={ref}>
        {/* Obsługa ładowania i błędów */}
        {isLoadingGraph && (
          <FaSpinner className={`${styles.spinner} icon-spin`} />
        )}
        {!isLoadingGraph && graphError && (
          <div className={styles.error}>{graphError}</div>
        )}

        {!isLoadingGraph && !graphError && bounds.width > 0 && (
          <svg width={bounds.width} height={bounds.height}>
            <g
              className={styles.links}
              style={{ "--link-color": subjectColor } as React.CSSProperties}
            >
              {renderedLinks.map((link, i) => (
                <line
                  key={i}
                  x1={link.source?.x}
                  y1={link.source?.y}
                  x2={link.target?.x}
                  y2={link.target?.y}
                />
              ))}
            </g>
            <g className={styles.nodes}>
              {renderedNodes
                .filter((node) => node.ID !== 0) // Nie renderuj kotwicy ROOT
                .map((node) => (
                  <GraphNode
                    key={node.ID}
                    node={node}
                    topics={topics} // Przekaż odblokowane tematy
                    onNodeClick={onNodeClick}
                  />
                ))}
            </g>
          </svg>
        )}
      </div>
    </div>
  );
};

export default QuizGraph;
