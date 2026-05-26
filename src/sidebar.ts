import type { DataFile } from "./types";
import { h, clear } from "./dom";

export interface Sidebar {
  setVisibleCoalitions(ids: Set<string>): void;
  getVisibleCoalitions(): Set<string>;
}

export interface SidebarCallbacks {
  onChange(visible: Set<string>): void;
}

export function createSidebar(
  parent: HTMLElement,
  data: DataFile,
  cb: SidebarCallbacks,
): Sidebar {
  const aside = h("aside", { class: "sidebar" });
  parent.appendChild(aside);

  let visible = new Set(data.coalitions.map((c) => c.id));

  function render() {
    clear(aside);
    aside.appendChild(h("h3", {}, "Coalitions"));

    for (const c of data.coalitions) {
      const cb_in = h("input", {
        type: "checkbox",
        id: `co-${c.id}`,
      }) as HTMLInputElement;
      cb_in.checked = visible.has(c.id);
      cb_in.addEventListener("change", () => {
        if (cb_in.checked) visible.add(c.id);
        else visible.delete(c.id);
        cb.onChange(new Set(visible));
      });
      const row = h(
        "label",
        { class: "coalition-row", for: `co-${c.id}` },
        cb_in,
        h("div", { class: "dot", style: `background:${c.color}` }),
        h("span", { class: "label" }, c.name),
        h("span", { class: "count" }, String(c.member_count)),
      );
      aside.appendChild(row);
    }

    const actions = h("div", { class: "actions" });
    const allBtn = h("button", {}, "All");
    const noneBtn = h("button", {}, "None");
    allBtn.addEventListener("click", () => {
      visible = new Set(data.coalitions.map((c) => c.id));
      render();
      cb.onChange(new Set(visible));
    });
    noneBtn.addEventListener("click", () => {
      visible = new Set();
      render();
      cb.onChange(new Set(visible));
    });
    actions.appendChild(allBtn);
    actions.appendChild(noneBtn);
    aside.appendChild(actions);

    // Legend showing node-size meaning
    const legend = h("div", { class: "legend" });
    legend.appendChild(h("h3", {}, "Legend"));
    legend.appendChild(
      h(
        "div",
        { class: "row" },
        h("div", {
          class: "swatch",
          style: "width:22px;height:22px",
        }),
        h("div", {}, "Coalition (size ∝ members)"),
      ),
    );
    legend.appendChild(
      h(
        "div",
        { class: "row" },
        h("div", {
          class: "swatch",
          style: "width:10px;height:10px",
        }),
        h("div", {}, "Member organization"),
      ),
    );
    legend.appendChild(
      h(
        "div",
        { class: "row" },
        h("div", {
          style:
            "width:24px;height:1px;background:rgba(255,255,255,0.3);align-self:center",
        }),
        h("div", {}, "Membership edge"),
      ),
    );
    aside.appendChild(legend);
  }

  render();

  return {
    setVisibleCoalitions(ids) {
      visible = new Set(ids);
      render();
    },
    getVisibleCoalitions() {
      return new Set(visible);
    },
  };
}
