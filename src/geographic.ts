import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { DataFile, GraphNode } from "./types";
import { h } from "./dom";
import { initials, typeLabel } from "./util";

export interface GeographicView {
  el: HTMLElement;
  invalidate(): void;
}

export interface GeoCallbacks {
  onNodeClick(node: GraphNode): void;
}

export function createGeographicView(
  data: DataFile,
  cb: GeoCallbacks,
): GeographicView {
  const wrap = h("div", { class: "geo-wrap" });
  const mapEl = h("div", { class: "geo-map" });
  wrap.appendChild(mapEl);

  const legend = h(
    "div",
    { class: "geo-legend" },
    h("h3", {}, "On the map"),
    h(
      "div",
      { class: "row" },
      h("div", {
        class: "swatch",
        style: "width:22px;height:22px;background:#34d399",
      }),
      h("div", {}, `${data.coalitions.length} coalitions (sized by members)`),
    ),
    h(
      "div",
      { class: "row" },
      h("div", {
        class: "swatch",
        style:
          "width:10px;height:10px;background:#2a2a36;border:1px solid #fff;",
      }),
      h("div", {}, `${data.organizations.length} member orgs`),
    ),
    h(
      "div",
      { class: "row hint" },
      h("div", {}, "Click any marker for details."),
    ),
  );
  wrap.appendChild(legend);

  let map: L.Map | null = null;

  function ensureMap() {
    if (map) return map;
    map = L.map(mapEl, {
      zoomControl: true,
      attributionControl: true,
    });
    // Fit to MA bounds + small padding
    map.fitBounds(
      [
        [41.45, -73.55],
        [42.95, -69.85],
      ],
      { padding: [20, 20] },
    );
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OSM</a> · © <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      },
    ).addTo(map);

    // Coalition markers (large colored circles with abbrev label)
    for (const c of data.coalitions) {
      const r = 14 + Math.sqrt(c.member_count) * 2.5;
      const labelText = c.abbrev || initials(c.name);
      // Build a safe DOM node for the divIcon (no innerHTML)
      const labelNode = document.createElement("div");
      labelNode.className = "geo-coalition-label";
      labelNode.style.background = c.color;
      labelNode.style.width = `${r * 2}px`;
      labelNode.style.height = `${r * 2}px`;
      labelNode.style.lineHeight = `${r * 2}px`;
      labelNode.textContent = labelText;
      const marker = L.marker([c.lat, c.lng], {
        icon: L.divIcon({
          className: "",
          iconSize: [r * 2, r * 2],
          iconAnchor: [r, r],
          html: labelNode.outerHTML,
        }),
      });
      marker.bindTooltip(
        `<strong>${escapeHTML(c.name)}</strong><br/><span style="color:#94a3b8">${c.member_count} members · ${escapeHTML(c.geographic_scope)}</span>`,
        { direction: "top", offset: [0, -2] },
      );
      marker.on("click", () => {
        cb.onNodeClick({ ...c, kind: "coalition" });
      });
      marker.addTo(map);
    }

    // Org markers
    for (const o of data.organizations) {
      const dot = L.circleMarker([o.lat, o.lng], {
        radius: 4,
        color: "#94a3b8",
        weight: 1,
        opacity: 0.8,
        fillColor: "#2a2a36",
        fillOpacity: 0.95,
      });
      dot.bindTooltip(
        `<strong>${escapeHTML(o.name)}</strong><br/><span style="color:#94a3b8">${typeLabel(o.type)} · ${escapeHTML(o.geographic_focus)}</span>`,
        { direction: "top", offset: [0, -2] },
      );
      dot.on("click", () => cb.onNodeClick({ ...o, kind: "org" }));
      dot.addTo(map);
    }

    return map;
  }

  return {
    el: wrap,
    invalidate() {
      // Mount map lazily on first show; on subsequent shows invalidate sizing
      const m = ensureMap();
      setTimeout(() => m.invalidateSize(), 50);
    },
  };
}

// Leaflet tooltips accept HTML; we escape user-controllable strings.
function escapeHTML(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      default: return "&#39;";
    }
  });
}
