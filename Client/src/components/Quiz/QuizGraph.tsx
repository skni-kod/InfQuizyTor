import React from "react";
import styles from "./QuizGraph.module.scss";
import { QuizNode, Subject } from "../../assets/types.tsx"; // Ensure path is correct
import { FaArrowLeft, FaCheckCircle, FaLock, FaPlay } from "react-icons/fa";

interface QuizGraphProps {
  subject: Subject; // Needs subject info (like name)
  onBack: () => void; // Function to go back
}

// --- EXPANDED MOCK DATA ---
const MOCK_GRAPH: QuizNode[] = [
  // Core Path 1
  { id: "q1", title: "Podstawy Równań", status: "completed", dependencies: [] },
  {
    id: "q2",
    title: "Pochodne Cząstkowe",
    status: "completed",
    dependencies: ["q1"],
  },
  {
    id: "q3",
    title: "Całki Wielokrotne",
    status: "available",
    dependencies: ["q2"],
  },
  {
    id: "q4",
    title: "Całki Krzywoliniowe",
    status: "available",
    dependencies: ["q3"],
  },
  {
    id: "q5",
    title: "Twierdzenie Greena",
    status: "locked",
    dependencies: ["q4"],
  },
  {
    id: "q6",
    title: "Twierdzenie Stokesa",
    status: "locked",
    dependencies: ["q5"],
  },

  // Branch 1 from Pochodne
  {
    id: "q7",
    title: "Ekstrema Funkcji Wielu Zmiennych",
    status: "available",
    dependencies: ["q2"],
  },
  {
    id: "q8",
    title: "Mnożniki Lagrange'a",
    status: "locked",
    dependencies: ["q7"],
  },

  // Branch 2 from Podstawy (Independent Path)
  {
    id: "q9",
    title: "Szeregi Liczbowe",
    status: "completed",
    dependencies: ["q1"],
  },
  {
    id: "q10",
    title: "Kryteria Zbieżności",
    status: "completed",
    dependencies: ["q9"],
  },
  {
    id: "q11",
    title: "Szeregi Potęgowe",
    status: "available",
    dependencies: ["q10"],
  },
  {
    id: "q12",
    title: "Rozwinięcie Taylora",
    status: "locked",
    dependencies: ["q11"],
  },

  // Deeper Branch from Całki
  {
    id: "q13",
    title: "Całki Powierzchniowe",
    status: "locked",
    dependencies: ["q4"],
  }, // Depends on Krzywoliniowe
  {
    id: "q14",
    title: "Twierdzenie Gaussa-Ostrogradskiego",
    status: "locked",
    dependencies: ["q13", "q6"],
  }, // Depends on 2 paths completing

  // Another Root Node Path (Example: Probability)
  {
    id: "p1",
    title: "Podstawy Prawdopodobieństwa",
    status: "completed",
    dependencies: [],
  },
  {
    id: "p2",
    title: "Zmienne Losowe",
    status: "available",
    dependencies: ["p1"],
  },
  {
    id: "p3",
    title: "Rozkład Normalny",
    status: "locked",
    dependencies: ["p2"],
  },
];
// --- END EXPANDED MOCK DATA ---

// Helper function to build the tree structure
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
      // Simple approach: Link to the *first* dependency listed
      // More complex logic needed for nodes depending on multiple branches finishing (like q14)
      const primaryParentId = node.dependencies[0];
      if (nodeMap.has(primaryParentId)) {
        const children = tree.get(primaryParentId) || [];
        children.push(node);
        tree.set(primaryParentId, children);
      } else {
        console.warn(
          `Primary parent node ${primaryParentId} not found for node ${node.id}. Adding as root.`
        );
        const children = tree.get(null) || [];
        children.push(node);
        tree.set(null, children);
      }
      // Note: This simple buildTree won't visually represent dependencies like q14 accurately
      // without modifications to how children are found or how the tree is rendered.
    }
  });
  return tree;
};

// --- Recursive TreeNode Component ---
interface TreeNodeProps {
  node: QuizNode;
  tree: Map<string | null, QuizNode[]>;
  depth?: number;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, tree, depth = 0 }) => {
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

  return (
    <li className={`${styles.treeNode} ${depth > 0 ? styles.isChild : ""}`}>
      <div
        className={`${styles.nodeContent} ${styles[node.status]}`}
        style={{ "--delay": `${depth * 100}ms` } as React.CSSProperties}
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
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
};
// --- End TreeNode Component ---

// --- Main QuizGraph Component ---
const QuizGraph = ({ subject, onBack }: QuizGraphProps) => {
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
            <TreeNode key={rootNode.id} node={rootNode} tree={nodeTree} />
          ))}
        </ul>
      </div>
    </div>
  );
};

export default QuizGraph;
