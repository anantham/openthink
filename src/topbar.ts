import { h } from "./dom";

export type TopTab = "map" | "geo" | "events" | "projects";

export interface TopbarCallbacks {
  onTabChange(tab: TopTab): void;
}

export function createTopbar(
  parent: HTMLElement,
  cb: TopbarCallbacks,
  active: TopTab = "map",
): { setActive(tab: TopTab): void } {
  const bar = h("header", { class: "topbar" });
  parent.appendChild(bar);

  bar.appendChild(h("div", { class: "brand" }, "Openthink"));

  const tabs: { id: TopTab; label: string; disabled?: boolean }[] = [
    { id: "map", label: "Map" },
    { id: "geo", label: "Geographic" },
    { id: "events", label: "Events" },
    { id: "projects", label: "Projects" },
  ];
  const buttons = new Map<TopTab, HTMLElement>();

  for (const t of tabs) {
    const btn = h(
      "button",
      {
        class: `tab ${t.id === active ? "active" : ""} ${t.disabled ? "disabled" : ""}`,
      },
      t.label,
    );
    if (!t.disabled) {
      btn.addEventListener("click", () => {
        for (const [, el] of buttons) el.classList.remove("active");
        btn.classList.add("active");
        cb.onTabChange(t.id);
      });
    }
    buttons.set(t.id, btn);
    bar.appendChild(btn);
  }

  return {
    setActive(tab) {
      for (const [id, el] of buttons) {
        el.classList.toggle("active", id === tab);
      }
    },
  };
}
