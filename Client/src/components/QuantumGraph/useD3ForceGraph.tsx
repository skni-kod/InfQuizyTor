// src/components/QuantumGraph/useD3ForceGraph.tsx
import { useEffect, useRef } from "react";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
} from "d3-force";
import { select } from "d3-selection";
import type { Simulation, ForceLink } from "d3-force";
import type { Selection, EnterElement } from "d3-selection";

import type {
  GraphNode,
  GraphLink,
  GalaxyNode,
  QuizNode,
  ProcessedLink,
} from "./types";
import { cn } from "../../utils/cn";

const FORCE_SETTINGS = {
  macro: {
    charge: -1500,
    linkDistance: 200,
    linkStrength: 0.2,
  },
  micro: {
    charge: (d: GraphNode) => (d.type === "galaxy" ? -2000 : -500),
    linkDistance: 120,
    linkStrength: (l: ProcessedLink) => (l.type === "quiz-to-quiz" ? 1 : 0.1),
  },
};

type D3Data = {
  nodes: GraphNode[];
  links: GraphLink[];
};

export const useD3ForceGraph = (
  svgRef: React.RefObject<SVGSVGElement | null>,
  data: D3Data,
  activeGalaxyId: string | null,
  onGalaxyClick: (node: GalaxyNode) => void
) => {
  const simulationRef = useRef<Simulation<GraphNode, ProcessedLink> | null>(
    null
  );
  const mainGroupRef = useRef<Selection<
    SVGGElement,
    unknown,
    null,
    undefined
  > | null>(null);
  const dimensionsRef = useRef({ width: 0, height: 0 });

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = select(svgRef.current);
    const { width, height } = svgRef.current.getBoundingClientRect();
    dimensionsRef.current = { width, height };

    if (!simulationRef.current) {
      const mainGroup = svg.append("g").attr("class", "main-group");
      mainGroupRef.current = mainGroup;

      mainGroup
        .append("g")
        .attr("class", "links")
        .selectAll<SVGLineElement, ProcessedLink>("line");

      mainGroup
        .append("g")
        .attr("class", "nodes")
        .selectAll<SVGGElement, GraphNode>("g");

      const simulation = forceSimulation<GraphNode, ProcessedLink>()
        .force(
          "charge",
          forceManyBody<GraphNode>().strength(FORCE_SETTINGS.macro.charge)
        )
        .force(
          "link",
          // POPRAWKA 1: Inicjujemy forceLink BEZ danych
          forceLink<GraphNode, ProcessedLink>()
            .id((d) => d.id)
            .distance(FORCE_SETTINGS.macro.linkDistance)
            .strength(FORCE_SETTINGS.macro.linkStrength)
        )
        .force("center", forceCenter(width / 2, height / 2))
        .on("tick", () => {
          // Funkcja tick musi być zdefiniowana wewnątrz, aby mieć dostęp do nodeGroup i linkGroup
          // z właściwego zasięgu (closure) po inicjalizacji.
          // Alternatywnie, moglibyśmy je przypisać do refów, ale to jest czystsze.

          // Aktualizujemy węzły
          mainGroup
            .select<SVGGElement>("g.nodes")
            .selectAll<SVGGElement, GraphNode>("g.graph-node")
            .attr("transform", (d: GraphNode) => `translate(${d.x}, ${d.y})`);

          // Aktualizujemy linki
          mainGroup
            .select<SVGGElement>("g.links")
            .selectAll<SVGLineElement, ProcessedLink>("line.graph-link")
            .attr("x1", (d: ProcessedLink) => d.source.x!)
            .attr("y1", (d: ProcessedLink) => d.source.y!)
            .attr("x2", (d: ProcessedLink) => d.target.x!)
            .attr("y2", (d: ProcessedLink) => d.target.y!);
        });

      simulationRef.current = simulation;
    }

    const simulation = simulationRef.current;
    const mainGroup = mainGroupRef.current!;

    // --- POPRAWKA KOLEJNOŚCI ---
    // POPRAWKA 2: Najpierw ładujemy WĘZŁY
    simulation.nodes(data.nodes);

    // POPRAWKA 3: Dopiero teraz ładujemy LINKI
    simulation
      .force<ForceLink<GraphNode, ProcessedLink>>("link")!
      .links(data.links as ProcessedLink[]);
    // -------------------------

    const isVisibleNode = (d: GraphNode) =>
      activeGalaxyId === null
        ? d.type === "galaxy"
        : d.id === activeGalaxyId ||
          (d as QuizNode).parentId === activeGalaxyId;

    const isVisibleLink = (l: ProcessedLink) => {
      const source = l.source as GraphNode;
      const target = l.target as GraphNode;
      return activeGalaxyId === null
        ? l.type === "galaxy-to-galaxy"
        : (source.id === activeGalaxyId &&
            (target as QuizNode).parentId === activeGalaxyId) ||
            (target.id === activeGalaxyId &&
              (source as QuizNode).parentId === activeGalaxyId) ||
            ((source as QuizNode).parentId === activeGalaxyId &&
              (target as QuizNode).parentId === activeGalaxyId);
    };

    const node = mainGroup
      .select<SVGGElement>("g.nodes")
      .selectAll<SVGGElement, GraphNode>("g.graph-node")
      .data(data.nodes, (d: GraphNode) => d.id)
      .join(
        (enter: Selection<EnterElement, GraphNode, SVGGElement, unknown>) => {
          const nodeEnter = enter
            .append("g")
            .on("click", (_event: MouseEvent, d: GraphNode) => {
              if (d.type === "galaxy") {
                onGalaxyClick(d as GalaxyNode);
              }
            });

          nodeEnter.append("circle").attr("fill", (d: GraphNode) => d.color);

          nodeEnter.append("text").text((d: GraphNode) => d.label);

          return nodeEnter;
        },
        (update: Selection<SVGGElement, GraphNode, SVGGElement, unknown>) =>
          update,
        (exit: Selection<SVGGElement, GraphNode, SVGGElement, unknown>) =>
          exit.remove()
      );

    const link = mainGroup
      .select<SVGGElement>("g.links")
      .selectAll<SVGLineElement, ProcessedLink>("line.graph-link")
      .data(data.links as ProcessedLink[], (d: ProcessedLink) => d.id)
      .join(
        (enter: Selection<EnterElement, ProcessedLink, SVGGElement, unknown>) =>
          enter.append("line").attr("class", "graph-link"),
        (
          update: Selection<SVGLineElement, ProcessedLink, SVGGElement, unknown>
        ) => update,
        (
          exit: Selection<SVGLineElement, ProcessedLink, SVGGElement, unknown>
        ) => exit.remove()
      );

    if (activeGalaxyId === null) {
      // --- STAN: MAKRO ---
      simulation.force(
        "charge",
        forceManyBody<GraphNode>().strength(FORCE_SETTINGS.macro.charge)
      );
      simulation
        .force<ForceLink<GraphNode, ProcessedLink>>("link")!
        .distance(FORCE_SETTINGS.macro.linkDistance)
        .strength((l) =>
          isVisibleLink(l as ProcessedLink)
            ? FORCE_SETTINGS.macro.linkStrength
            : 0
        );

      data.nodes.forEach((n) => {
        n.fx = null;
        n.fy = null;
      });

      node
        .attr("class", (d: GraphNode) =>
          cn(
            "graph-node",
            isVisibleNode(d) ? "node-visible" : "node-hidden",
            d.type === "galaxy" && "node-galaxy"
          )
        )
        .attr("pointer-events", (d: GraphNode) =>
          isVisibleNode(d) ? "all" : "none"
        );

      node
        .select("circle")
        .attr("r", (d: GraphNode) => (d.type === "galaxy" ? 30 : 5));

      node
        .select("text")
        .attr("font-size", (d: GraphNode) =>
          d.type === "galaxy" ? "var(--text-lg)" : "var(--text-xs)"
        )
        .attr("dy", 0);

      link
        .attr("class", (l: ProcessedLink) =>
          cn("graph-link", isVisibleLink(l) ? "link-visible" : "link-hidden")
        )
        .style("stroke-dasharray", "none");
    } else {
      // --- STAN: MIKRO ---
      simulation.force(
        "charge",
        forceManyBody<GraphNode>().strength(FORCE_SETTINGS.micro.charge)
      );
      simulation
        .force<ForceLink<GraphNode, ProcessedLink>>("link")!
        .distance(FORCE_SETTINGS.micro.linkDistance)
        .strength((l) =>
          isVisibleLink(l as ProcessedLink)
            ? FORCE_SETTINGS.micro.linkStrength(l as ProcessedLink)
            : 0
        );

      const centerNode = data.nodes.find((n) => n.id === activeGalaxyId);
      if (centerNode) {
        centerNode.fx = width / 2;
        centerNode.fy = height / 2;
      }

      node
        .attr("class", (d: GraphNode) =>
          cn(
            "graph-node",
            isVisibleNode(d) ? "node-visible" : "node-hidden",
            d.id === activeGalaxyId && "node-galaxy-active"
          )
        )
        .attr("pointer-events", (d: GraphNode) =>
          isVisibleNode(d) ? "all" : "none"
        );

      node
        .select("circle")
        .attr("r", (d: GraphNode) => (d.id === activeGalaxyId ? 40 : 20));

      node
        .select("text")
        .attr("font-size", "var(--text-base)")
        .attr("dy", (d: GraphNode) => (d.id === activeGalaxyId ? "2.8em" : 0));

      link.attr("class", (l: ProcessedLink) =>
        cn(
          "graph-link",
          isVisibleLink(l) ? "link-visible" : "link-hidden",
          isVisibleLink(l) && l.type === "quiz-to-quiz" && "link-active"
        )
      );

      link.filter(".link-active").style("stroke-dasharray", "8 4");
    }

    simulation.alpha(0.3).restart();
  }, [data, activeGalaxyId, onGalaxyClick, svgRef]);
};
