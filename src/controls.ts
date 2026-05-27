import type { GraphNode, OrgNode, CoalitionNode } from "./types";
import type { GraphSettings, GroupRule } from "./graph";
import { DEFAULT_GRAPH_SETTINGS } from "./graph";
import { h, clear } from "./dom";
import { typeLabel } from "./util";

export interface ControlsState {
  settings: GraphSettings;
  groups: GroupSpec[];
}

export interface GroupSpec {
  id: string;
  label: string;
  color: string;
  active: boolean;
  kind: "org_type" | "coalition_tag";
  matchValue: string;
}

export interface ControlsCallbacks {
  onSettingsChange(partial: Partial<GraphSettings>): void;
  onGroupsChange(rules: GroupRule[]): void;
  onAnimate(): void;
}

const STORAGE_KEY = "openthink.controls.v1";

// Built-in groups — based on real values present in the dummy data.
const DEFAULT_GROUPS: GroupSpec[] = [
  { id: "g_school_club", label: "School clubs", color: "#34d399", active: false, kind: "org_type", matchValue: "school_club" },
  { id: "g_youth_org", label: "Youth orgs", color: "#a3e635", active: false, kind: "org_type", matchValue: "youth_org" },
  { id: "g_faith_org", label: "Faith orgs", color: "#fb923c", active: false, kind: "org_type", matchValue: "faith_org" },
  { id: "g_501c3", label: "501(c)(3)s", color: "#60a5fa", active: false, kind: "org_type", matchValue: "501c3" },
  { id: "g_501c4", label: "501(c)(4)s", color: "#a78bfa", active: false, kind: "org_type", matchValue: "501c4" },
  { id: "g_union", label: "Unions", color: "#ef4444", active: false, kind: "org_type", matchValue: "union" },
  { id: "g_ej", label: "EJ-focused coalitions", color: "#f472b6", active: false, kind: "coalition_tag", matchValue: "environmental_justice" },
  { id: "g_youth_serving", label: "Youth-serving coalitions", color: "#22d3ee", active: false, kind: "coalition_tag", matchValue: "youth_serving" },
];

function loadState(): ControlsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ControlsState>;
      const settings = { ...DEFAULT_GRAPH_SETTINGS, ...(parsed.settings || {}) };
      // Merge groups: existing default list, override active/color from storage
      const stored = new Map((parsed.groups || []).map((g) => [g.id, g]));
      const groups = DEFAULT_GROUPS.map((g) => {
        const s = stored.get(g.id);
        return s ? { ...g, color: s.color, active: s.active } : g;
      });
      return { settings, groups };
    }
  } catch (_) { /* ignore */ }
  return {
    settings: { ...DEFAULT_GRAPH_SETTINGS },
    groups: DEFAULT_GROUPS.map((g) => ({ ...g })),
  };
}

function saveState(state: ControlsState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) { /* ignore quota errors */ }
}

function specToRule(spec: GroupSpec): GroupRule {
  if (spec.kind === "org_type") {
    return {
      id: spec.id,
      label: spec.label,
      color: spec.color,
      matches: (n: GraphNode) =>
        n.kind === "org" && (n as OrgNode).type === spec.matchValue,
    };
  } else {
    return {
      id: spec.id,
      label: spec.label,
      color: spec.color,
      matches: (n: GraphNode) =>
        n.kind === "coalition" &&
        (n as CoalitionNode).focus_tags.includes(spec.matchValue),
    };
  }
}

export interface ControlsPanel {
  /** Returns the current settings + groups (after init applied). */
  initialState(): ControlsState;
  /** Returns the GroupRules corresponding to active groups, for graph.setGroups(). */
  activeRules(): GroupRule[];
}

export function createControls(
  parent: HTMLElement,
  cb: ControlsCallbacks,
): ControlsPanel {
  const state = loadState();
  // Apply persisted settings on mount
  cb.onSettingsChange(state.settings);
  cb.onGroupsChange(activeRulesFromSpecs(state.groups));

  function activeRulesFromSpecs(specs: GroupSpec[]): GroupRule[] {
    return specs.filter((g) => g.active).map(specToRule);
  }

  function notifyGroupsChanged() {
    cb.onGroupsChange(activeRulesFromSpecs(state.groups));
    saveState(state);
  }

  function makeSlider(
    label: string,
    initial: number,
    onChange: (v: number) => void,
    opts: { min?: number; max?: number; step?: number } = {},
  ): HTMLElement {
    const min = opts.min ?? 0;
    const max = opts.max ?? 1;
    const step = opts.step ?? 0.01;
    const wrap = h("div", { class: "control" });
    wrap.appendChild(h("label", { class: "ctrl-label" }, label));
    const input = h("input", {
      type: "range",
      min: String(min),
      max: String(max),
      step: String(step),
      value: String(initial),
      class: "slider",
    }) as HTMLInputElement;
    input.addEventListener("input", () => {
      onChange(parseFloat(input.value));
    });
    wrap.appendChild(input);
    return wrap;
  }

  function makeToggle(
    label: string,
    initial: boolean,
    onChange: (v: boolean) => void,
  ): HTMLElement {
    const wrap = h("div", { class: "control toggle-row" });
    wrap.appendChild(h("label", { class: "ctrl-label" }, label));
    const sw = h("button", {
      class: `switch ${initial ? "on" : ""}`,
      type: "button",
    });
    sw.appendChild(h("span", { class: "knob" }));
    sw.addEventListener("click", () => {
      const next = !sw.classList.contains("on");
      sw.classList.toggle("on", next);
      onChange(next);
    });
    wrap.appendChild(sw);
    return wrap;
  }

  function makeSection(title: string, initiallyOpen = true): {
    section: HTMLElement;
    body: HTMLElement;
  } {
    const section = h("section", { class: `panel-section ${initiallyOpen ? "open" : ""}` });
    const head = h("button", { class: "section-head", type: "button" });
    head.appendChild(h("span", { class: "caret" }, "▾"));
    head.appendChild(h("span", { class: "section-title" }, title));
    head.addEventListener("click", () => section.classList.toggle("open"));
    section.appendChild(head);
    const body = h("div", { class: "section-body" });
    section.appendChild(body);
    return { section, body };
  }

  // ---- Forces ----
  const { section: forcesSection, body: forcesBody } = makeSection("Forces");
  forcesBody.appendChild(
    makeSlider("Centre force", state.settings.centerForce, (v) => {
      state.settings.centerForce = v;
      cb.onSettingsChange({ centerForce: v });
      saveState(state);
    }),
  );
  forcesBody.appendChild(
    makeSlider("Repel force", state.settings.repelForce, (v) => {
      state.settings.repelForce = v;
      cb.onSettingsChange({ repelForce: v });
      saveState(state);
    }),
  );
  forcesBody.appendChild(
    makeSlider("Link force", state.settings.linkForce, (v) => {
      state.settings.linkForce = v;
      cb.onSettingsChange({ linkForce: v });
      saveState(state);
    }),
  );
  forcesBody.appendChild(
    makeSlider("Link distance", state.settings.linkDistance, (v) => {
      state.settings.linkDistance = v;
      cb.onSettingsChange({ linkDistance: v });
      saveState(state);
    }),
  );
  parent.appendChild(forcesSection);

  // ---- Groups ----
  const { section: groupsSection, body: groupsBody } = makeSection("Groups");

  function renderGroups() {
    clear(groupsBody);
    for (const g of state.groups) {
      const row = h("div", { class: `group-row ${g.active ? "active" : ""}` });
      // Color picker (native input[type=color] for now)
      const colorInput = h("input", {
        type: "color",
        value: g.color,
        class: "color-input",
        title: "Pick color",
      }) as HTMLInputElement;
      colorInput.addEventListener("input", () => {
        g.color = colorInput.value;
        // Live update if active
        if (g.active) notifyGroupsChanged();
        else saveState(state);
      });
      const labelEl = h("div", { class: "group-label" }, g.label);
      const swatch = h("div", {
        class: "group-swatch",
        style: `background:${g.color}`,
      });
      // Toggle pill
      const toggle = h("button", {
        class: `switch sm ${g.active ? "on" : ""}`,
        type: "button",
        "aria-label": g.active ? "Disable group" : "Enable group",
      });
      toggle.appendChild(h("span", { class: "knob" }));
      toggle.addEventListener("click", () => {
        g.active = !g.active;
        row.classList.toggle("active", g.active);
        toggle.classList.toggle("on", g.active);
        notifyGroupsChanged();
      });
      // Clicking the swatch opens the color picker
      swatch.addEventListener("click", () => colorInput.click());
      row.appendChild(swatch);
      row.appendChild(labelEl);
      row.appendChild(toggle);
      row.appendChild(colorInput);
      groupsBody.appendChild(row);
    }
  }
  renderGroups();
  parent.appendChild(groupsSection);

  // ---- Display ----
  const { section: displaySection, body: displayBody } = makeSection("Display");
  displayBody.appendChild(
    makeToggle("Arrows", state.settings.arrows, (v) => {
      state.settings.arrows = v;
      cb.onSettingsChange({ arrows: v });
      saveState(state);
    }),
  );
  displayBody.appendChild(
    makeSlider("Text fade threshold", state.settings.textFadeThreshold, (v) => {
      state.settings.textFadeThreshold = v;
      cb.onSettingsChange({ textFadeThreshold: v });
      saveState(state);
    }),
  );
  displayBody.appendChild(
    makeSlider("Node size", state.settings.nodeSize, (v) => {
      state.settings.nodeSize = v;
      cb.onSettingsChange({ nodeSize: v });
      saveState(state);
    }, { min: 0.4, max: 2.5, step: 0.05 }),
  );
  displayBody.appendChild(
    makeSlider("Link thickness", state.settings.linkThickness, (v) => {
      state.settings.linkThickness = v;
      cb.onSettingsChange({ linkThickness: v });
      saveState(state);
    }, { min: 0.5, max: 5, step: 0.1 }),
  );

  const animateBtn = h(
    "button",
    { class: "animate-btn", type: "button" },
    "Animate",
  );
  animateBtn.addEventListener("click", () => cb.onAnimate());
  displayBody.appendChild(animateBtn);

  const resetBtn = h(
    "button",
    { class: "reset-btn", type: "button" },
    "Reset to defaults",
  );
  resetBtn.addEventListener("click", () => {
    state.settings = { ...DEFAULT_GRAPH_SETTINGS };
    for (const g of state.groups) g.active = false;
    cb.onSettingsChange(state.settings);
    notifyGroupsChanged();
    saveState(state);
    // Rebuild the panel with new values
    // (Easiest: reload entire controls section)
    location.reload();
  });
  displayBody.appendChild(resetBtn);

  parent.appendChild(displaySection);

  // Suppress unused-import warning for typeLabel (kept for future use in group labels)
  void typeLabel;

  return {
    initialState() {
      return state;
    },
    activeRules() {
      return activeRulesFromSpecs(state.groups);
    },
  };
}
