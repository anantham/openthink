import "./styles.css";
import type { DataFile, GraphNode } from "./types";
import { createTopbar, type TopTab } from "./topbar";
import { createSidebar } from "./sidebar";
import { createGraph } from "./graph";
import { createTooltip } from "./tooltip";
import { createDrawer } from "./drawer";
import { createGeographicView } from "./geographic";
import { createEventsView } from "./events";
import { createProjectsView } from "./projects";
import { h, clear } from "./dom";

async function main() {
  const app = document.getElementById("app")!;
  clear(app);

  // Fetch data
  let data: DataFile;
  try {
    const res = await fetch("/data.json");
    if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
    data = (await res.json()) as DataFile;
  } catch (err) {
    createTopbar(app, { onTabChange: () => {} });
    app.appendChild(
      h(
        "div",
        { class: "stub" },
        h(
          "div",
          { class: "inner" },
          h("h2", {}, "Couldn't load data"),
          h("p", {}, (err as Error).message),
        ),
      ),
    );
    return;
  }

  let activeTab: TopTab = "map";

  const topbar = createTopbar(
    app,
    { onTabChange: (t) => setTab(t) },
    activeTab,
  );

  // ---- Shared content area (one of these is visible at a time) ----
  const content = h("div", { class: "content" });
  // Make content fill the remaining space
  content.style.position = "relative";
  content.style.overflow = "hidden";
  app.appendChild(content);

  // ----- Map view (sidebar + graph + drawer) -----
  const mapView = h("div", { class: "view map", style: "height:100%" });
  mapView.style.display = "grid";
  mapView.style.gridTemplateColumns = "var(--sidebar-w) 1fr";
  content.appendChild(mapView);

  const tooltip = createTooltip();

  let graphApi: ReturnType<typeof createGraph> | null = null;
  let drawerApi: ReturnType<typeof createDrawer> | null = null;

  const sidebar = createSidebar(mapView, data, {
    onChange: (visible) => {
      graphApi?.setVisibleCoalitions(visible);
    },
  });

  const graphContainer = h("div", {
    style: "position:relative;overflow:hidden",
  });
  mapView.appendChild(graphContainer);

  drawerApi = createDrawer(graphContainer, data, {
    onCoalitionClick: (cid) => {
      const coalition = data.coalitions.find((c) => c.id === cid);
      if (!coalition) return;
      const node: GraphNode = { ...coalition, kind: "coalition" };
      drawerApi!.open(node);
      graphApi?.setSelectedNode(node);
      graphApi?.focusOnCoalition(cid);
    },
  });

  graphApi = createGraph(graphContainer, data, tooltip, {
    onNodeClick: (node) => {
      drawerApi!.open(node);
      graphApi!.setSelectedNode(node);
    },
  });
  graphApi.setVisibleCoalitions(sidebar.getVisibleCoalitions());

  // ----- Geographic view -----
  const geoView = createGeographicView(data, {
    onNodeClick: (node) => {
      drawerApi!.open(node);
    },
  });
  geoView.el.style.display = "none";
  geoView.el.style.height = "100%";
  geoView.el.style.position = "absolute";
  geoView.el.style.inset = "0";
  content.appendChild(geoView.el);
  // The drawer is mounted inside the map view's graphContainer; we want
  // it to overlay other views too — re-parent it to content so it appears
  // above all views.
  if (drawerApi) {
    const drawerEl = graphContainer.querySelector(".drawer");
    if (drawerEl) content.appendChild(drawerEl);
  }

  // ----- Events view -----
  const eventsView = createEventsView(data, {
    onCoalitionClick: (node) => {
      setTab("map");
      // Defer drawer open so the map is visible first
      setTimeout(() => {
        drawerApi!.open(node);
        graphApi!.setSelectedNode(node);
        if (node.kind === "coalition") graphApi!.focusOnCoalition(node.id);
      }, 60);
    },
  });
  eventsView.el.style.display = "none";
  eventsView.el.style.height = "100%";
  eventsView.el.style.position = "absolute";
  eventsView.el.style.inset = "0";
  content.appendChild(eventsView.el);

  // ----- Projects view -----
  const projectsView = createProjectsView(data, {
    onCoalitionClick: (node) => {
      setTab("map");
      setTimeout(() => {
        drawerApi!.open(node);
        graphApi!.setSelectedNode(node);
        if (node.kind === "coalition") graphApi!.focusOnCoalition(node.id);
      }, 60);
    },
  });
  projectsView.el.style.display = "none";
  projectsView.el.style.height = "100%";
  projectsView.el.style.position = "absolute";
  projectsView.el.style.inset = "0";
  content.appendChild(projectsView.el);

  function setTab(tab: TopTab) {
    activeTab = tab;
    topbar.setActive(tab);
    mapView.style.display = tab === "map" ? "grid" : "none";
    geoView.el.style.display = tab === "geo" ? "block" : "none";
    eventsView.el.style.display = tab === "events" ? "grid" : "none";
    projectsView.el.style.display = tab === "projects" ? "grid" : "none";
    if (tab === "geo") geoView.invalidate();
    if (tab !== "map") {
      tooltip.hide();
    }
  }

  // Escape closes drawer
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      drawerApi?.close();
      graphApi?.setSelectedNode(null);
    }
  });
}

main();
