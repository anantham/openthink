import type { DataFile, Coalition, CoalitionEvent, GraphNode } from "./types";
import { h, clear } from "./dom";
import { fmtDateTime, initials } from "./util";

export interface EventsView {
  el: HTMLElement;
  refresh(): void;
}

export interface EventsCallbacks {
  onCoalitionClick(node: GraphNode): void;
}

type TimeFilter = "all" | "upcoming" | "past";

interface Row {
  event: CoalitionEvent;
  coalition: Coalition;
  isUpcoming: boolean;
}

export function createEventsView(
  data: DataFile,
  cb: EventsCallbacks,
): EventsView {
  const wrap = h("div", { class: "list-view" });

  // Flatten and tag every event with its parent coalition
  const now = Date.now();
  const rows: Row[] = [];
  for (const c of data.coalitions) {
    for (const e of c.events) {
      rows.push({
        event: e,
        coalition: c,
        isUpcoming: new Date(e.date).getTime() >= now,
      });
    }
  }
  rows.sort((a, b) => {
    if (a.isUpcoming !== b.isUpcoming) return a.isUpcoming ? -1 : 1;
    return new Date(a.event.date).getTime() - new Date(b.event.date).getTime();
  });

  let q = "";
  let timeFilter: TimeFilter = "upcoming";

  // ---- Toolbar ----
  const toolbar = h("div", { class: "list-toolbar" });
  toolbar.appendChild(h("h2", {}, "Events"));
  const count = h("span", { class: "count" }, "");
  toolbar.appendChild(count);

  const search = h("input", {
    class: "search",
    type: "search",
    placeholder: "Search events, locations, or coalitions…",
  }) as HTMLInputElement;
  search.addEventListener("input", () => {
    q = search.value.trim().toLowerCase();
    render();
  });
  toolbar.appendChild(search);

  const filters = h("div", { class: "filters" });
  const filterDefs: { id: TimeFilter; label: string }[] = [
    { id: "upcoming", label: "Upcoming" },
    { id: "past", label: "Past" },
    { id: "all", label: "All" },
  ];
  const chipEls = new Map<TimeFilter, HTMLElement>();
  for (const f of filterDefs) {
    const chip = h(
      "button",
      {
        class: `chip ${timeFilter === f.id ? "active" : ""}`,
      },
      f.label,
    );
    chip.addEventListener("click", () => {
      timeFilter = f.id;
      for (const [id, el] of chipEls) el.classList.toggle("active", id === timeFilter);
      render();
    });
    chipEls.set(f.id, chip);
    filters.appendChild(chip);
  }
  toolbar.appendChild(filters);
  wrap.appendChild(toolbar);

  // ---- Body ----
  const body = h("div", { class: "list-body" });
  wrap.appendChild(body);

  function matches(r: Row): boolean {
    if (timeFilter === "upcoming" && !r.isUpcoming) return false;
    if (timeFilter === "past" && r.isUpcoming) return false;
    if (!q) return true;
    return (
      r.event.name.toLowerCase().includes(q) ||
      r.event.location.toLowerCase().includes(q) ||
      r.coalition.name.toLowerCase().includes(q) ||
      r.coalition.abbrev.toLowerCase().includes(q)
    );
  }

  function render() {
    clear(body);
    const filtered = rows.filter(matches);
    count.textContent = `${filtered.length} event${filtered.length === 1 ? "" : "s"}`;
    if (!filtered.length) {
      body.appendChild(h("div", { class: "list-empty" }, "No events match."));
      return;
    }
    for (const r of filtered) {
      const card = h(
        "div",
        { class: "list-card" },
        h(
          "div",
          { class: "head" },
          h(
            "div",
            {
              class: "coalition-badge",
              style: `background:${r.coalition.color}`,
            },
            r.coalition.abbrev || initials(r.coalition.name),
          ),
          h("div", { class: "coalition-name" }, r.coalition.name),
        ),
        h("div", { class: "name" }, r.event.name),
        h(
          "div",
          { class: "meta-row" },
          h("span", { class: "pill deadline" }, fmtDateTime(r.event.date)),
          h("span", { class: "pill kind" }, r.event.location),
          !r.isUpcoming && h("span", { class: "pill" }, "past"),
        ),
      );
      card.addEventListener("click", () => {
        cb.onCoalitionClick({ ...r.coalition, kind: "coalition" });
      });
      body.appendChild(card);
    }
  }

  render();
  return { el: wrap, refresh: render };
}
