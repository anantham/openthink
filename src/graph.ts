import * as d3 from "d3";
import type {
  DataFile,
  GraphNode,
  GraphLink,
  CoalitionNode,
  OrgNode,
} from "./types";
import { coalitionRadius, orgRadius, initials } from "./util";
import type { Tooltip } from "./tooltip";

export interface GraphCallbacks {
  onNodeClick(node: GraphNode): void;
}

export interface Graph {
  setVisibleCoalitions(ids: Set<string>): void;
  setSelectedNode(node: GraphNode | null): void;
  focusOnCoalition(id: string): void;
}

const COALITION_LABEL_FONT_SIZE = 14;
const ORG_LABEL_FONT_SIZE = 10;
const ORG_NAME_FONT_SIZE = 11;

export function createGraph(
  parent: HTMLElement,
  data: DataFile,
  tooltip: Tooltip,
  cb: GraphCallbacks,
): Graph {
  // ----- Build node + link collections -----
  const coalitionNodes: CoalitionNode[] = data.coalitions.map((c) => ({
    ...c,
    kind: "coalition" as const,
  }));
  const orgNodes: OrgNode[] = data.organizations.map((o) => ({
    ...o,
    kind: "org" as const,
  }));

  const allNodes: GraphNode[] = [...coalitionNodes, ...orgNodes];
  const nodeById = new Map<string, GraphNode>(allNodes.map((n) => [n.id, n]));

  const allLinks: GraphLink[] = data.edges.map((e) => ({
    source: e.source,
    target: e.target,
    coalitionId: e.source, // source is always coalition in our data
  }));

  let visibleCoalitions = new Set(data.coalitions.map((c) => c.id));
  let selectedId: string | null = null;

  // ----- SVG scaffolding -----
  const wrap = document.createElement("div");
  wrap.className = "graph-wrap";
  parent.appendChild(wrap);

  const hint = document.createElement("div");
  hint.className = "hint";
  hint.textContent = "Drag nodes · Scroll to zoom · Click for details";
  wrap.appendChild(hint);

  const svg = d3
    .select(wrap)
    .append("svg")
    .attr("xmlns", "http://www.w3.org/2000/svg");

  // Inner <g> we transform for zoom/pan
  const root = svg.append("g").attr("class", "root");
  const linkLayer = root.append("g").attr("class", "links");
  const nodeLayer = root.append("g").attr("class", "nodes");

  // Zoom behavior
  const zoom = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.2, 4])
    .filter((event) => {
      // Allow wheel + drag on background, but not on nodes (so node drag works)
      if (event.type === "mousedown" || event.type === "touchstart") {
        const target = event.target as Element;
        if (target.closest(".node-coalition,.node-org")) return false;
      }
      return !event.ctrlKey && !event.button;
    })
    .on("zoom", (event) => {
      root.attr("transform", event.transform.toString());
      // Hide tooltip while zooming
      tooltip.hide();
    });

  svg.call(zoom);

  // Size + center based on container
  function dimensions(): { w: number; h: number } {
    const r = wrap.getBoundingClientRect();
    return { w: r.width, h: r.height };
  }

  // ----- Force simulation -----
  const sim = d3
    .forceSimulation<GraphNode>(allNodes)
    .force(
      "link",
      d3
        .forceLink<GraphNode, GraphLink>(allLinks)
        .id((d) => d.id)
        .distance((l) => {
          const src =
            typeof l.source === "string" ? nodeById.get(l.source) : l.source;
          if (!src) return 160;
          return src.kind === "coalition"
            ? coalitionRadius(src) + 140
            : 160;
        })
        .strength(0.4),
    )
    .force(
      "charge",
      d3
        .forceManyBody<GraphNode>()
        .strength((n) => (n.kind === "coalition" ? -3200 : -420))
        .distanceMax(900),
    )
    .force(
      "collide",
      d3
        .forceCollide<GraphNode>()
        .radius((n) =>
          n.kind === "coalition"
            ? coalitionRadius(n) + 14
            : orgRadius(n) + 14,
        )
        .iterations(2),
    )
    .force("x", d3.forceX<GraphNode>(0).strength(0.025))
    .force("y", d3.forceY<GraphNode>(0).strength(0.025))
    .alphaDecay(0.02);

  // Re-center on resize
  function center() {
    const { w, h } = dimensions();
    svg.attr("viewBox", `${-w / 2} ${-h / 2} ${w} ${h}`);
  }
  center();
  window.addEventListener("resize", () => {
    center();
    sim.alpha(0.3).restart();
  });

  // ----- Drag behavior on nodes -----
  const drag = d3
    .drag<SVGGElement, GraphNode>()
    .on("start", (event, d) => {
      if (!event.active) sim.alphaTarget(0.25).restart();
      d.fx = d.x ?? 0;
      d.fy = d.y ?? 0;
    })
    .on("drag", (event, d) => {
      d.fx = event.x;
      d.fy = event.y;
    })
    .on("end", (event, d) => {
      if (!event.active) sim.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    });

  // ----- Render links + nodes -----
  type LinkSel = d3.Selection<SVGLineElement, GraphLink, SVGGElement, unknown>;
  type NodeSel = d3.Selection<SVGGElement, GraphNode, SVGGElement, unknown>;

  let linkSel: LinkSel = linkLayer
    .selectAll<SVGLineElement, GraphLink>("line")
    .data(allLinks)
    .enter()
    .append("line")
    .attr("class", "link") as LinkSel;

  let nodeSel: NodeSel = nodeLayer
    .selectAll<SVGGElement, GraphNode>("g.node")
    .data(allNodes, (d) => (d as GraphNode).id)
    .enter()
    .append("g")
    .attr("class", (d) =>
      d.kind === "coalition" ? "node-coalition" : "node-org",
    ) as NodeSel;

  // Append shapes + labels per node
  nodeSel.each(function (this: SVGGElement, d) {
    const sel = d3.select(this);
    if (d.kind === "coalition") {
      const r = coalitionRadius(d);
      sel
        .append("circle")
        .attr("class", "ring")
        .attr("r", r)
        .attr("fill", d.color);
      sel
        .append("text")
        .attr("class", "node-label")
        .attr("font-size", Math.min(r * 0.55, 22))
        .text(d.abbrev || initials(d.name));
      sel
        .append("text")
        .attr("class", "node-name")
        .attr("font-size", COALITION_LABEL_FONT_SIZE)
        .attr("y", r + 14)
        .text(d.name);
    } else {
      const r = orgRadius(d);
      sel
        .append("circle")
        .attr("class", "ring")
        .attr("r", r)
        .attr("fill", "#2a2a36");
      sel
        .append("text")
        .attr("class", "node-label")
        .attr("font-size", ORG_LABEL_FONT_SIZE)
        .text(initials(d.name, 3));
      sel
        .append("text")
        .attr("class", "node-name")
        .attr("font-size", ORG_NAME_FONT_SIZE)
        .attr("y", r + 12)
        .text(shorten(d.name, 28));
    }
  });

  // Drag + events
  nodeSel
    .call(drag)
    .on("mouseenter", function (event, d) {
      tooltip.show(d, event.clientX, event.clientY);
      highlightConnected(d);
    })
    .on("mousemove", function (event) {
      tooltip.move(event.clientX, event.clientY);
    })
    .on("mouseleave", function () {
      tooltip.hide();
      clearHighlight();
    })
    .on("click", function (event, d) {
      event.stopPropagation();
      cb.onNodeClick(d);
    });

  // Clicking the background closes selection
  svg.on("click", () => {
    api.setSelectedNode(null);
  });

  // ----- Highlight connected nodes/edges on hover -----
  function highlightConnected(node: GraphNode) {
    const connectedNodeIds = new Set<string>();
    connectedNodeIds.add(node.id);
    for (const l of allLinks) {
      const s = (l.source as GraphNode).id ?? l.source;
      const t = (l.target as GraphNode).id ?? l.target;
      if (s === node.id) connectedNodeIds.add(t as string);
      if (t === node.id) connectedNodeIds.add(s as string);
    }
    nodeSel.classed("dim", (n) => !connectedNodeIds.has(n.id));
    linkSel
      .classed("highlight", (l) => {
        const s = (l.source as GraphNode).id ?? l.source;
        const t = (l.target as GraphNode).id ?? l.target;
        return s === node.id || t === node.id;
      })
      .classed("dim", (l) => {
        const s = (l.source as GraphNode).id ?? l.source;
        const t = (l.target as GraphNode).id ?? l.target;
        return s !== node.id && t !== node.id;
      });
  }

  function clearHighlight() {
    nodeSel.classed("dim", false);
    linkSel.classed("highlight", false).classed("dim", false);
  }

  // ----- Tick -----
  sim.on("tick", () => {
    linkSel
      .attr("x1", (l) => (l.source as GraphNode).x ?? 0)
      .attr("y1", (l) => (l.source as GraphNode).y ?? 0)
      .attr("x2", (l) => (l.target as GraphNode).x ?? 0)
      .attr("y2", (l) => (l.target as GraphNode).y ?? 0);
    nodeSel.attr(
      "transform",
      (n) => `translate(${n.x ?? 0},${n.y ?? 0})`,
    );
  });

  // Auto-fit once the simulation has settled enough
  let didInitialFit = false;
  sim.on("end", () => {
    if (didInitialFit) return;
    didInitialFit = true;
    fitToView(false);
  });
  // Fallback in case "end" doesn't fire in time (large graphs)
  setTimeout(() => {
    if (didInitialFit) return;
    didInitialFit = true;
    fitToView(false);
  }, 2500);

  function fitToView(animate = true) {
    let xs: number[] = [];
    let ys: number[] = [];
    allNodes.forEach((n) => {
      if (n.x === undefined || n.y === undefined) return;
      const display = (
        nodeSel
          .filter((nn) => nn.id === n.id)
          .node() as SVGGElement | null
      )?.style.display;
      if (display === "none") return;
      const r =
        n.kind === "coalition" ? coalitionRadius(n) : orgRadius(n);
      xs.push(n.x - r, n.x + r);
      ys.push(n.y - r - 14, n.y + r + 14);
    });
    if (!xs.length) return;
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const pad = 60;
    const bw = maxX - minX + pad * 2;
    const bh = maxY - minY + pad * 2;
    const { w, h } = dimensions();
    const scale = Math.min(w / bw, h / bh, 1.6);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const t = d3.zoomIdentity.translate(-cx * scale, -cy * scale).scale(scale);
    const target = animate ? svg.transition().duration(600) : svg;
    target.call(zoom.transform, t);
  }

  // ----- Visibility filtering -----
  function applyVisibility() {
    // A node is visible iff:
    //  - it's a coalition and its id ∈ visible set
    //  - it's an org and at least one of its coalition_ids ∈ visible set
    const orgVisible = new Map<string, boolean>();
    for (const o of orgNodes) {
      orgVisible.set(
        o.id,
        o.coalition_ids.some((c) => visibleCoalitions.has(c)),
      );
    }
    nodeSel.style("display", (n) => {
      if (n.kind === "coalition") {
        return visibleCoalitions.has(n.id) ? null : "none";
      }
      return orgVisible.get(n.id) ? null : "none";
    });
    linkSel.style("display", (l) => {
      const sid = (l.source as GraphNode).id ?? l.source;
      const tid = (l.target as GraphNode).id ?? l.target;
      if (typeof sid !== "string" || typeof tid !== "string") return null;
      if (!visibleCoalitions.has(sid)) return "none";
      if (!orgVisible.get(tid)) return "none";
      return null;
    });
    sim.alpha(0.3).restart();
  }

  // ----- Selection -----
  function applySelection() {
    nodeSel.classed("selected", (n) => n.id === selectedId);
  }

  const api: Graph = {
    setVisibleCoalitions(ids) {
      visibleCoalitions = new Set(ids);
      applyVisibility();
    },
    setSelectedNode(node) {
      selectedId = node?.id ?? null;
      applySelection();
    },
    focusOnCoalition(id) {
      const n = nodeById.get(id);
      if (!n || n.x === undefined || n.y === undefined) return;
      const { w, h } = dimensions();
      const scale = 1.4;
      const t = d3.zoomIdentity
        .translate(-n.x * scale, -n.y * scale)
        .scale(scale);
      void w;
      void h;
      svg.transition().duration(550).call(zoom.transform, t);
    },
  };

  return api;
}

function shorten(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
