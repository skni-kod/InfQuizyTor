import React from "react";
import styles from "./QuizGraph.module.scss";
// Poprawne importy
import { QuizNode, Subject, Topic } from "../../assets/types.tsx";
import { FaArrowLeft, FaCheckCircle, FaLock, FaPlay } from "react-icons/fa";
// Import danych z nowego pliku
import { MOCK_GRAPH, MOCK_TOPIC_MAP } from "./mock-graph-data";

// --- Interfejsy ---

interface QuizGraphProps {
  subject: Subject;
  onBack: () => void;
  onNodeClick: (topic: Topic) => void; // Prop do obsługi kliknięcia
}

interface TreeNodeProps {
  node: QuizNode;
  tree: Map<string | null, QuizNode[]>;
  onNodeClick: (topic: Topic) => void; // Przekazujemy handler
  depth?: number;
}

// --- Funkcja budująca drzewo (z Twojego pliku) ---
const buildTree = (nodes: QuizNode[]): Map<string | null, QuizNode[]> => {
  const tree = new Map<string | null, QuizNode[]>();
  const nodeMap = new Map<string, QuizNode>(
    nodes.map((node) => [node.id, node])
  );

  nodes.forEach((node) => {
    if (node.dependencies.length === 0) {
      const children = tree.get(null) || [];
      children.push(node);
      tree.set(null, children);
    } else {
      // Proste podejście: linkuj do pierwszego rodzica
      const primaryParentId = node.dependencies[0];
      if (nodeMap.has(primaryParentId)) {
        const children = tree.get(primaryParentId) || [];
        children.push(node);
        tree.set(primaryParentId, children);
      } else {
        // Zapasowo, jeśli rodzic nie istnieje (np. złożone zależności)
        const children = tree.get(null) || [];
        children.push(node);
        tree.set(null, children);
      }
    }
  });
  return tree;
};

// --- Komponent Węzła (TreeNode) ---
const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  tree,
  onNodeClick,
  depth = 0,
}) => {
  const children = tree.get(node.id) || [];
  const isUnlocked = node.status !== "locked";

  const getStatusIcon = (status: QuizNode["status"]) => {
    switch (status) {
      case "completed":
        return <FaCheckCircle />;
      case "available":
        return <FaPlay />;
      case "locked":
        return <FaLock />;
    }
  };

  // --- POPRAWKA: Obsługa kliknięcia ---
  const handleClick = () => {
    // Znajdź temat (Topic) w naszej mapie używając 'title' z węzła
    const topic = MOCK_TOPIC_MAP[node.title];
    if (topic) {
      onNodeClick(topic); // Przekaż pełny obiekt Topic do rodzica
    } else {
      console.warn(`Nie znaleziono tematu dla węzła: ${node.title}`);
    }
  };
  // --- KONIEC POPRAWKI ---

  return (
    <li className={`${styles.treeNode} ${depth > 0 ? styles.isChild : ""}`}>
      <div
        className={`${styles.nodeContent} ${styles[node.status]}`}
        style={{ "--delay": `${depth * 100}ms` } as React.CSSProperties}
        onClick={isUnlocked ? handleClick : undefined} // Klikalny tylko jeśli odblokowany
      >
        <span className={styles.nodeTitle}>{node.title}</span>
        <span className={styles.nodeIcon}>{getStatusIcon(node.status)}</span>
      </div>
      {children.length > 0 && (
        <ul className={styles.childrenList}>
          {children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              tree={tree}
              onNodeClick={onNodeClick} // Przekaż dalej
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

// --- Główny Komponent QuizGraph ---
const QuizGraph: React.FC<QuizGraphProps> = ({
  subject,
  onBack,
  onNodeClick,
}) => {
  // Użyj MOCK_GRAPH (z importu) zamiast MOCK_GRAPH_DATA
  const nodeTree = buildTree(MOCK_GRAPH);
  const rootNodes = nodeTree.get(null) || [];

  return (
    <div className={styles.graphContainer}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={onBack}>
          <FaArrowLeft /> Wróć do pulpitu
        </button>
        <h1 className={styles.title}>{subject.name} - Ścieżka Nauki</h1>
      </header>
      <div className={styles.treeWrapper}>
        <ul className={styles.treeRoot}>
          {rootNodes.map((rootNode) => (
            <TreeNode
              key={rootNode.id}
              node={rootNode}
              tree={nodeTree}
              onNodeClick={onNodeClick} // Przekaż handler do pierwszych węzłów
            />
          ))}
        </ul>
      </div>
    </div>
  );
};

export default QuizGraph;
