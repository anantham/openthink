import type {
  Coalition,
  Organization,
  Action,
  CoalitionEvent,
  Project,
  GraphNode,
  DataFile,
} from "./types";
import { initials, relTime, fmtDateTime, typeLabel } from "./util";
import { h, clear } from "./dom";

type DrawerTab = "projects" | "events" | "actions" | "coalitions" | "about";

export interface Drawer {
  open(node: GraphNode): void;
  close(): void;
  isOpen(): boolean;
  setActiveTab(tab: DrawerTab): void;
}

export interface DrawerCallbacks {
  onCoalitionClick?(coalitionId: string): void;
}

export function createDrawer(
  parent: HTMLElement,
  data: DataFile,
  cb: DrawerCallbacks = {},
): Drawer {
  const el = h("aside", { class: "drawer" });
  parent.appendChild(el);

  let currentNode: GraphNode | null = null;
  let activeTab: DrawerTab = "projects";
  const orgsById = new Map(data.organizations.map((o) => [o.id, o]));
  const coalitionsById = new Map(data.coalitions.map((c) => [c.id, c]));

  function renderHead(node: GraphNode): HTMLElement {
    const head = h("div", { class: "head" });
    const closeBtn = h("button", { class: "close", "aria-label": "Close" }, "×");
    closeBtn.addEventListener("click", () => api.close());
    head.appendChild(closeBtn);

    if (node.kind === "coalition") {
      const c = node as Coalition;
      head.appendChild(
        h(
          "div",
          { class: "title-row" },
          h(
            "div",
            { class: "badge", style: `background:${c.color}` },
            c.abbrev || initials(c.name),
          ),
          h(
            "div",
            {},
            h("h2", {}, c.name),
            h("div", { class: "sub" }, `${c.geographic_scope} coalition`),
          ),
        ),
      );
      head.appendChild(h("div", { class: "desc" }, c.description));
      if (c.focus_tags.length) {
        const tags = h("div", { class: "tags" });
        for (const t of c.focus_tags) {
          tags.appendChild(h("span", { class: "tag" }, prettifyTag(t)));
        }
        head.appendChild(tags);
      }
      head.appendChild(
        h(
          "div",
          { class: "meta" },
          metaCell(c.member_count, "Members"),
          metaCell(c.projects.length, "Projects"),
          metaCell(c.events.length, "Events"),
        ),
      );
    } else {
      const o = node as Organization;
      head.appendChild(
        h(
          "div",
          { class: "title-row" },
          h(
            "div",
            {
              class: "badge",
              style: "background:#3a3a4a;color:#e5e7eb",
            },
            initials(o.name),
          ),
          h(
            "div",
            {},
            h("h2", {}, o.name),
            h(
              "div",
              { class: "sub" },
              `${typeLabel(o.type)} · ${o.geographic_focus}`,
            ),
          ),
        ),
      );
      head.appendChild(h("div", { class: "desc" }, o.description));
      head.appendChild(
        h(
          "div",
          { class: "meta" },
          metaCell(o.coalition_ids.length, "Coalitions"),
          metaCell(relTime(o.last_activity), "Last active"),
        ),
      );
    }
    return head;
  }

  function metaCell(val: string | number, lbl: string): HTMLElement {
    return h(
      "div",
      { class: "cell" },
      h("div", { class: "val" }, String(val)),
      h("div", { class: "lbl" }, lbl),
    );
  }

  function prettifyTag(t: string): string {
    return t.replace(/_/g, " ");
  }

  function renderTabs(node: GraphNode): HTMLElement {
    const tabs = h("div", { class: "drawer-tabs" });
    const tabList: { id: DrawerTab; label: string }[] =
      node.kind === "coalition"
        ? [
            { id: "projects", label: "Projects" },
            { id: "events", label: "Events" },
            { id: "actions", label: "Actions" },
          ]
        : [
            { id: "coalitions", label: "Coalitions" },
            { id: "about", label: "About" },
          ];
    // Ensure activeTab is valid for this node kind
    if (!tabList.find((t) => t.id === activeTab)) {
      activeTab = tabList[0].id;
    }
    for (const t of tabList) {
      const btn = h(
        "button",
        {
          class: `drawer-tab ${t.id === activeTab ? "active" : ""}`,
        },
        t.label,
      );
      btn.addEventListener("click", () => api.setActiveTab(t.id));
      tabs.appendChild(btn);
    }
    return tabs;
  }

  function renderBody(node: GraphNode): HTMLElement {
    const body = h("div", { class: "body" });
    if (node.kind === "coalition") {
      const c = node as Coalition;
      if (activeTab === "projects") {
        renderProjects(body, c.projects);
      } else if (activeTab === "events") {
        renderEvents(body, c.events);
      } else if (activeTab === "actions") {
        renderActions(body, c.actions);
      }
    } else {
      const o = node as Organization;
      if (activeTab === "coalitions") {
        renderCoalitionList(body, o);
      } else if (activeTab === "about") {
        renderOrgAbout(body, o);
      }
    }
    return body;
  }

  function renderProjects(body: HTMLElement, items: Project[]): void {
    if (!items.length) {
      body.appendChild(h("div", { class: "empty" }, "No active projects."));
      return;
    }
    for (const p of items) {
      body.appendChild(
        h(
          "div",
          { class: "item" },
          h("div", { class: "name" }, p.name),
          h("div", { class: "desc" }, p.description),
          h(
            "div",
            { class: "row" },
            h("span", { class: "pill kind" }, p.status),
          ),
        ),
      );
    }
  }

  function renderEvents(body: HTMLElement, items: CoalitionEvent[]): void {
    if (!items.length) {
      body.appendChild(h("div", { class: "empty" }, "No upcoming events."));
      return;
    }
    for (const e of items) {
      body.appendChild(
        h(
          "div",
          { class: "item" },
          h("div", { class: "name" }, e.name),
          h(
            "div",
            { class: "row" },
            h("span", { class: "pill deadline" }, fmtDateTime(e.date)),
            h("span", { class: "pill kind" }, e.location),
          ),
        ),
      );
    }
  }

  function renderActions(body: HTMLElement, items: Action[]): void {
    if (!items.length) {
      body.appendChild(h("div", { class: "empty" }, "No open actions."));
      return;
    }
    for (const a of items) {
      const row = h(
        "div",
        { class: "row" },
        h(
          "span",
          { class: `pill ${a.urgency}` },
          `${a.urgency} urgency`,
        ),
        h("span", { class: "pill kind" }, a.kind),
      );
      if (a.deadline) {
        row.appendChild(
          h("span", { class: "pill deadline" }, `by ${a.deadline}`),
        );
      }
      for (const s of a.skills_needed) {
        row.appendChild(h("span", { class: "pill skill" }, s));
      }
      body.appendChild(
        h(
          "div",
          { class: "item" },
          h("div", { class: "name" }, a.name),
          row,
        ),
      );
    }
  }

  function renderCoalitionList(body: HTMLElement, org: Organization): void {
    if (!org.coalition_ids.length) {
      body.appendChild(
        h("div", { class: "empty" }, "Not currently in any coalition."),
      );
      return;
    }
    for (const cid of org.coalition_ids) {
      const c = coalitionsById.get(cid);
      if (!c) continue;
      const row = h(
        "div",
        { class: "coalition-link" },
        h("div", { class: "dot", style: `background:${c.color}` }),
        h(
          "div",
          {},
          h("div", { class: "name", style: "font-size:13px" }, c.name),
          h(
            "div",
            { class: "sub", style: "font-size:11px;color:#6b7280" },
            `${c.member_count} members`,
          ),
        ),
      );
      row.addEventListener("click", () => cb.onCoalitionClick?.(cid));
      body.appendChild(row);
    }
  }

  function renderOrgAbout(body: HTMLElement, org: Organization): void {
    body.appendChild(
      h(
        "div",
        { class: "item" },
        h("div", { class: "name" }, "Type"),
        h("div", { class: "desc" }, typeLabel(org.type)),
      ),
    );
    body.appendChild(
      h(
        "div",
        { class: "item" },
        h("div", { class: "name" }, "Geographic focus"),
        h("div", { class: "desc" }, org.geographic_focus),
      ),
    );
    body.appendChild(
      h(
        "div",
        { class: "item" },
        h("div", { class: "name" }, "Description"),
        h("div", { class: "desc" }, org.description),
      ),
    );
  }

  // suppress unused-import warning
  void orgsById;

  function rerender() {
    if (!currentNode) return;
    clear(el);
    el.appendChild(renderHead(currentNode));
    el.appendChild(renderTabs(currentNode));
    el.appendChild(renderBody(currentNode));
  }

  const api: Drawer = {
    open(node) {
      currentNode = node;
      // Default tab depends on node kind
      activeTab = node.kind === "coalition" ? "projects" : "coalitions";
      rerender();
      el.classList.add("open");
    },
    close() {
      el.classList.remove("open");
      currentNode = null;
    },
    isOpen() {
      return el.classList.contains("open");
    },
    setActiveTab(tab) {
      activeTab = tab;
      rerender();
    },
  };

  return api;
}
