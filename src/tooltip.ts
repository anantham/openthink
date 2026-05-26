import type { GraphNode } from "./types";
import { initials, relTime, typeLabel } from "./util";
import { h, clear } from "./dom";

export interface Tooltip {
  show(node: GraphNode, x: number, y: number): void;
  hide(): void;
  move(x: number, y: number): void;
}

export function createTooltip(): Tooltip {
  const el = document.createElement("div");
  el.className = "tooltip";
  document.body.appendChild(el);

  let currentNode: GraphNode | null = null;

  function position(x: number, y: number) {
    const rect = el.getBoundingClientRect();
    let left = x + 14;
    let top = y + 14;
    if (left + rect.width > window.innerWidth - 8) {
      left = x - rect.width - 14;
    }
    if (top + rect.height > window.innerHeight - 8) {
      top = y - rect.height - 14;
    }
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  }

  function stat(val: string | number, lbl: string): HTMLElement {
    return h(
      "div",
      { class: "stat" },
      h("div", { class: "val" }, String(val)),
      h("div", { class: "lbl" }, lbl),
    );
  }

  function render(node: GraphNode): HTMLElement[] {
    if (node.kind === "coalition") {
      const ttl = node.abbrev || initials(node.name);
      return [
        h(
          "div",
          { class: "header" },
          h(
            "div",
            { class: "swatch", style: `background:${node.color}` },
            ttl,
          ),
          h(
            "div",
            {},
            h("div", { class: "title" }, node.name),
            h(
              "div",
              { class: "subtitle" },
              `${node.geographic_scope} coalition`,
            ),
          ),
        ),
        h(
          "div",
          { class: "stats" },
          stat(node.member_count, "Members"),
          stat(node.projects.length, "Projects"),
          stat(node.events.length, "Events"),
          stat(node.actions.length, "Actions"),
        ),
        h(
          "div",
          { class: "footer" },
          `Last activity ${relTime(node.last_activity)}`,
        ),
      ];
    } else {
      const ttl = initials(node.name);
      return [
        h(
          "div",
          { class: "header" },
          h(
            "div",
            {
              class: "swatch",
              style: "background:#3a3a4a;color:#e5e7eb",
            },
            ttl,
          ),
          h(
            "div",
            {},
            h("div", { class: "title" }, node.name),
            h(
              "div",
              { class: "subtitle" },
              `${typeLabel(node.type)} · ${node.geographic_focus}`,
            ),
          ),
        ),
        h(
          "div",
          { class: "stats" },
          stat(node.coalition_ids.length, "Coalitions"),
          stat(relTime(node.last_activity), "Last active"),
        ),
      ];
    }
  }

  return {
    show(node, x, y) {
      if (currentNode !== node) {
        currentNode = node;
        clear(el);
        for (const child of render(node)) el.appendChild(child);
      }
      el.classList.add("visible");
      position(x, y);
    },
    hide() {
      currentNode = null;
      el.classList.remove("visible");
    },
    move(x, y) {
      if (!currentNode) return;
      position(x, y);
    },
  };
}
