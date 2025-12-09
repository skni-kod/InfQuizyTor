import React, { useState, useEffect, useRef } from "react";
import styles from "./QuizGraph.module.scss";
import * as d3 from "d3";
// POPRAWKA: Importujemy typy Subject i Topic
import { Subject, Topic } from "../../assets/types";

// --- TYPY GRAFU ---

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  topicData: Topic;
  isRoot: boolean;
  color: string;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: GraphNode | string;
  target: GraphNode | string;
}

interface QuizGraphProps {
  subject: Subject;
  topics: Topic[];
  UsosID: string;
  onNodeClick: (topic: Topic) => void;
  onBack: () => void;
  subjectColor: string;
}

// --- FUNKCJE POMOCNICZE: PRZETWARZANIE DANYCH ---

const transformTopicsToGraph = (
  subject: Subject,
  topics: Topic[],
  subjectColor: string
): { nodes: GraphNode[]; links: GraphLink[] } => {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const nodeMap = new Map<string, GraphNode>();

  // 1. Węzeł Główny (ROOT) - Przedmiot
  const rootNode: GraphNode = {
    id: subject.UsosID,
    name: subject.Name,
    // POPRAWKA BŁĘDU 2352: Dodano pole CreatedByUsosID, aby spełnić wymagania typu Topic.
    topicData: {
      ID: 0,
      SubjectID: subject.ID,
      Name: subject.Name,
      CreatedByUsos: "",
      CreatedByUsosID: "", // Wymagane
    } as Topic,
    isRoot: true,
    color: subjectColor,
    fx: 0,
    fy: 0,
  };
  nodes.push(rootNode);
  nodeMap.set(rootNode.id, rootNode);

  // 2. Węzły Tematów
  for (const topic of topics) {
    const topicIdString = `T${topic.ID}`;
    const node: GraphNode = {
      id: topicIdString,
      name:
        topic.Name.length > 20
          ? topic.Name.substring(0, 17) + "..."
          : topic.Name,
      topicData: topic,
      isRoot: false,
      color: "#4a90e2",
    };
    nodes.push(node);
    nodeMap.set(node.id, node);

    // 3. Krawędź do węzła głównego
    const link: GraphLink = {
      source: rootNode.id,
      target: node.id,
    } as unknown as GraphLink;
    links.push(link);
  }

  return { nodes, links };
};

// --- GŁÓWNY KOMPONENT ---

const QuizGraph: React.FC<QuizGraphProps> = ({
  subject,
  topics,
  onNodeClick,
  subjectColor,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  const graphData = React.useMemo(() => {
    return transformTopicsToGraph(subject, topics, subjectColor);
  }, [subject, topics, subjectColor]);

  // Ustawienie wymiarów SVG
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.clientWidth);
        setHeight(containerRef.current.clientHeight);
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // --- Logika Rysowania D3 ---
  useEffect(() => {
    if (
      !svgRef.current ||
      width === 0 ||
      height === 0 ||
      graphData.nodes.length === 0
    )
      return;

    const nodes = graphData.nodes.map((d) => ({ ...d }));
    const links = graphData.links.map((d) => ({ ...d }));

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");

    const simulation = d3
      .forceSimulation<GraphNode, GraphLink>(nodes)
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance(120)
          .strength(1)
      )
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .on("tick", ticked);

    // Rysowanie krawędzi
    const linkElements = g
      .append("g")
      .attr("stroke", "#888")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 2);

    // Rysowanie węzłów (kół)
    const nodeElements = g
      .append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d) => (d.isRoot ? 30 : 18))
      .attr("fill", (d) => d.color)
      .style("cursor", (d) => (d.isRoot ? "default" : "pointer"))
      .on("click", (_event, d) => {
        if (!d.isRoot) {
          onNodeClick(d.topicData);
        }
      })
      .call(drag as any);
    // Rysowanie etykiet tekstowych
    const labelElements = g
      .append("g")
      .attr("class", styles.labels)
      .selectAll("text")
      .data(nodes)
      .join("text")
      .text((d) => d.name)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("font-size", (d) => (d.isRoot ? "1.4em" : "0.9em"))
      .attr("pointer-events", "none");

    function ticked() {
      linkElements
        .attr("x1", (d) => (d.source as GraphNode).x!)
        .attr("y1", (d) => (d.source as GraphNode).y!)
        .attr("x2", (d) => (d.target as GraphNode).x!)
        .attr("y2", (d) => (d.target as GraphNode).y!);

      nodeElements.attr("cx", (d) => d.x!).attr("cy", (d) => d.y!);
      labelElements.attr("x", (d) => d.x!).attr("y", (d) => d.y!);
    }

    // --- Dodanie funkcji Zoom/Pan ---
    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoomBehavior);
    svg.call(zoomBehavior.translateTo, width / 2, height / 2);

    simulation.alpha(1).restart();
    setTimeout(() => simulation.stop(), 3000);

    // --- Funkcja Drag D3 (Korekta typowania) ---
    function drag(simulation: d3.Simulation<GraphNode, GraphLink>) {
      type DragEvent = d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>;

      const dragstarted = (event: DragEvent) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      };

      const dragged = (event: DragEvent) => {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      };

      const dragended = (event: DragEvent) => {
        if (!event.active) simulation.alphaTarget(0);
        if (!event.subject.isRoot) {
          event.subject.fx = null;
          event.subject.fy = null;
        }
      };

      return d3
        .drag<SVGCircleElement, GraphNode>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }
  }, [width, height, graphData, onNodeClick]);

  return (
    <div ref={containerRef} className={styles.graphWrapper}>
      <svg ref={svgRef} width={width} height={height}></svg>
      {topics.length === 0 && (
        <div className={styles.noTopicsOverlay}>
          <p>Brak tematów dla tego przedmiotu. Utwórz nowe w Studio Treści!</p>
        </div>
      )}
    </div>
  );
};

export default QuizGraph;
