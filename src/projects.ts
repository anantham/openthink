import type { DataFile, Coalition, Project, GraphNode } from "./types";
import { h, clear } from "./dom";
import { initials } from "./util";

export interface ProjectsView {
  el: HTMLElement;
  refresh(): void;
}

export interface ProjectsCallbacks {
  onCoalitionClick(node: GraphNode): void;
}

interface Row {
  project: Project;
  coalition: Coalition;
}

export function createProjectsView(
  data: DataFile,
  cb: ProjectsCallbacks,
): ProjectsView {
  const wrap = h("div", { class: "list-view" });

  const rows: Row[] = [];
  for (const c of data.coalitions) {
    for (const p of c.projects) {
      rows.push({ project: p, coalition: c });
    }
  }

  // Skill universe across all projects
  const skillSet = new Set<string>();
  for (const r of rows) for (const s of r.project.skills_needed) skillSet.add(s);
  const allSkills = Array.from(skillSet).sort();

  type StatusFilter = "all" | "active" | "planning" | "completed";
  let q = "";
  let statusFilter: StatusFilter = "all";
  const selectedSkills = new Set<string>();

  // ---- Toolbar ----
  const toolbar = h("div", { class: "list-toolbar" });
  toolbar.appendChild(h("h2", {}, "Projects"));
  const count = h("span", { class: "count" }, "");
  toolbar.appendChild(count);

  const search = h("input", {
    class: "search",
    type: "search",
    placeholder: "Search projects or coalitions…",
  }) as HTMLInputElement;
  search.addEventListener("input", () => {
    q = search.value.trim().toLowerCase();
    render();
  });
  toolbar.appendChild(search);

  const statusFilters = h("div", { class: "filters" });
  const statusDefs: { id: StatusFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "planning", label: "Planning" },
  ];
  const statusChips = new Map<string, HTMLElement>();
  for (const f of statusDefs) {
    const chip = h(
      "button",
      { class: `chip ${statusFilter === f.id ? "active" : ""}` },
      f.label,
    );
    chip.addEventListener("click", () => {
      statusFilter = f.id;
      for (const [id, el] of statusChips) el.classList.toggle("active", id === statusFilter);
      render();
    });
    statusChips.set(f.id, chip);
    statusFilters.appendChild(chip);
  }
  toolbar.appendChild(statusFilters);
  wrap.appendChild(toolbar);

  // Second toolbar row for skill chips (so they wrap nicely)
  const skillBar = h("div", {
    class: "list-toolbar",
    style: "padding-top:8px;padding-bottom:8px;border-bottom:1px solid var(--border)",
  });
  skillBar.appendChild(
    h(
      "span",
      { class: "count", style: "color:var(--text-faint);font-size:11px;text-transform:uppercase;letter-spacing:0.06em" },
      "Skills needed",
    ),
  );
  const skillChips = h("div", { class: "filters" });
  for (const s of allSkills) {
    const chip = h("button", { class: "chip" }, s);
    chip.addEventListener("click", () => {
      if (selectedSkills.has(s)) {
        selectedSkills.delete(s);
        chip.classList.remove("active");
      } else {
        selectedSkills.add(s);
        chip.classList.add("active");
      }
      render();
    });
    skillChips.appendChild(chip);
  }
  skillBar.appendChild(skillChips);
  wrap.appendChild(skillBar);

  // ---- Body ----
  const body = h("div", { class: "list-body" });
  wrap.appendChild(body);

  function matches(r: Row): boolean {
    if (statusFilter !== "all" && r.project.status !== statusFilter) return false;
    if (selectedSkills.size > 0) {
      const need = r.project.skills_needed;
      let any = false;
      for (const s of selectedSkills) {
        if (need.includes(s)) { any = true; break; }
      }
      if (!any) return false;
    }
    if (!q) return true;
    return (
      r.project.name.toLowerCase().includes(q) ||
      r.project.description.toLowerCase().includes(q) ||
      r.coalition.name.toLowerCase().includes(q) ||
      r.coalition.abbrev.toLowerCase().includes(q)
    );
  }

  function render() {
    clear(body);
    const filtered = rows.filter(matches);
    count.textContent = `${filtered.length} project${filtered.length === 1 ? "" : "s"}`;
    if (!filtered.length) {
      body.appendChild(h("div", { class: "list-empty" }, "No projects match."));
      return;
    }
    for (const r of filtered) {
      const meta = h("div", { class: "meta-row" });
      meta.appendChild(
        h("span", { class: `pill status-${r.project.status}` }, r.project.status),
      );
      for (const s of r.project.skills_needed) {
        meta.appendChild(h("span", { class: "pill skill" }, s));
      }
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
        h("div", { class: "name" }, r.project.name),
        h("div", { class: "desc" }, r.project.description),
        meta,
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
