// Generates public/data.json from a concise spec of coalitions + their members.
// Run with: node scripts/generate-data.mjs

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "..", "public", "data.json");

// ---- Coalitions ----
// Each has: id, name, abbrev, description, focus_tags, geographic_scope, members (org ids), lat/lng of HQ
const coalitions = [
  { id: "mycc", name: "Massachusetts Youth Climate Coalition", abbrev: "MYCC",
    description: "Youth-led statewide coalition of school clubs and youth groups organizing for climate justice in Massachusetts.",
    focus_tags: ["youth_serving","school_clubs","climate_policy"], geographic_scope: "statewide", color: "#34d399",
    lat: 42.3470, lng: -71.0840, // Mission Hill area
  },
  { id: "mpf", name: "Mass Power Forward", abbrev: "MPF",
    description: "Statewide coalition of climate, environmental, and EJ organizations pushing comprehensive MA climate policy.",
    focus_tags: ["climate_policy","environmental_justice","grassroots"], geographic_scope: "statewide", color: "#60a5fa",
    lat: 42.3585, lng: -71.0640, // State House
  },
  { id: "mara", name: "Massachusetts Renews Alliance", abbrev: "MARA",
    description: "Alliance focused on accelerating MA's transition to 100% renewable energy through policy and grassroots organizing.",
    focus_tags: ["clean_energy","climate_policy"], geographic_scope: "statewide", color: "#a78bfa",
    lat: 42.3870, lng: -71.1100, // Somerville
  },
  { id: "gjc", name: "Green Justice Coalition", abbrev: "GJC",
    description: "EJ-led coalition centering frontline communities in climate, energy, and environmental decision-making.",
    focus_tags: ["environmental_justice","grassroots","health"], geographic_scope: "statewide", color: "#f472b6",
    lat: 42.3970, lng: -71.0330, // Chelsea
  },
  { id: "ejlt", name: "Environmental Justice Legislative Table", abbrev: "EJ Table",
    description: "Coordinated table of orgs advancing EJ legislation at the State House.",
    focus_tags: ["environmental_justice","climate_policy"], geographic_scope: "statewide", color: "#22d3ee",
    lat: 42.3520, lng: -71.0560, // Downtown Boston
  },
  { id: "gfn", name: "Green Future Now", abbrev: "GFN",
    description: "Coalition campaigning for corporate polluter fees and revenue-raising climate finance in MA.",
    focus_tags: ["climate_policy","just_transition"], geographic_scope: "statewide", color: "#facc15",
    lat: 42.3540, lng: -71.1320, // Allston
  },
  { id: "ghs", name: "Green and Healthy Schools", abbrev: "GHS",
    description: "Coalition advancing healthy, low-carbon school facilities across Massachusetts.",
    focus_tags: ["green_buildings","school_clubs","health"], geographic_scope: "statewide", color: "#fb923c",
    lat: 42.2626, lng: -71.8023, // Worcester
  },
  { id: "hero", name: "HERO Coalition", abbrev: "HERO",
    description: "Coalition pushing efficient, electrified, equitable homes and buildings policy.",
    focus_tags: ["green_buildings","clean_energy","housing"], geographic_scope: "statewide", color: "#f87171",
    lat: 42.3736, lng: -71.1190, // Cambridge
  },
  { id: "zcrf", name: "Zero Carbon Renovation Fund", abbrev: "ZCRF",
    description: "Coalition advocating for a state fund to deep-retrofit existing buildings to zero carbon.",
    focus_tags: ["green_buildings","clean_energy","housing"], geographic_scope: "statewide", color: "#38bdf8",
    lat: 42.3260, lng: -71.0710, // South End
  },
  { id: "crs", name: "Climate Resilient Schools Coalition", abbrev: "CRS",
    description: "Coalition organizing for climate-resilient, equitable school infrastructure investments.",
    focus_tags: ["green_buildings","school_clubs","climate_policy"], geographic_scope: "statewide", color: "#a3e635",
    lat: 42.1015, lng: -72.5898, // Springfield
  },
];

// ---- Organizations (canonical list) ----
// id, name, type, geographic_focus, description
const orgs = [
  // Youth / school clubs
  { id: "bls_youthcan", name: "BLS YouthCAN", type: "school_club", geo: "Boston", desc: "Boston Latin School's Youth Climate Action Network." },
  { id: "andover_climate_lobby", name: "Andover Climate Lobby", type: "school_club", geo: "Andover", desc: "Phillips Academy student-led climate advocacy group." },
  { id: "andover_hs_env", name: "Andover HS Environmental Club", type: "school_club", geo: "Andover", desc: "Andover High School environmental club." },
  { id: "belmont_hs", name: "Belmont HS Climate Club", type: "school_club", geo: "Belmont", desc: "Belmont High School climate club." },
  { id: "may4cj", name: "MA Youth for Climate Justice", type: "youth_org", geo: "statewide", desc: "Statewide youth-led climate strike organizers." },
  { id: "lorax", name: "Lorax Climate Lobby (Milton Academy)", type: "school_club", geo: "Milton", desc: "Milton Academy student climate lobby." },
  { id: "green_heifers", name: "Green Heifers (Gann Academy)", type: "school_club", geo: "Waltham", desc: "Gann Academy environmental club." },
  { id: "ccl_youth", name: "CCL MA Youth", type: "youth_org", geo: "statewide", desc: "Citizens' Climate Lobby MA youth chapter." },
  { id: "fff_ma", name: "Fridays For Future MA", type: "youth_org", geo: "statewide", desc: "MA chapter of the global youth climate strike movement." },
  { id: "mass_climate_edu", name: "Mass Climate Education Org", type: "501c3", geo: "statewide", desc: "Climate curriculum and education advocacy." },
  { id: "spring_forward", name: "Spring Forward", type: "youth_org", geo: "Boston", desc: "Youth EJ leadership development program." },
  { id: "greenroots_eco", name: "Greenroots ECO Team", type: "youth_org", geo: "Chelsea", desc: "Chelsea youth EJ team within GreenRoots." },
  { id: "bsac", name: "Boston Student Advisory Council", type: "youth_org", geo: "Boston", desc: "Elected BPS students advising the superintendent." },
  { id: "project9", name: "Project 9", type: "youth_org", geo: "Boston", desc: "Youth civic-engagement organization." },
  { id: "act_on_mass", name: "Act on Mass", type: "501c4", geo: "statewide", desc: "Transparency and democracy reform at the MA State House." },
  { id: "vietaid", name: "VietAID", type: "501c3", geo: "Boston", desc: "Vietnamese American community development organization in Dorchester." },

  // Sunrise hubs
  { id: "sunrise_boston", name: "Sunrise Boston", type: "501c4", geo: "Boston", desc: "Boston hub of the Sunrise Movement." },
  { id: "sunrise_worcester", name: "Sunrise Worcester", type: "youth_org", geo: "Worcester", desc: "Worcester hub of the Sunrise Movement." },
  { id: "sunrise_ipswich", name: "Sunrise Ipswich", type: "youth_org", geo: "Ipswich", desc: "Ipswich hub of the Sunrise Movement." },
  { id: "sunrise_western_ma", name: "Sunrise Western Mass", type: "youth_org", geo: "Western MA", desc: "Western MA hub of the Sunrise Movement." },
  { id: "sunrise_lex", name: "Sunrise Lexington", type: "youth_org", geo: "Lexington", desc: "Lexington hub of the Sunrise Movement." },

  // 350 chapters
  { id: "350ma", name: "350 Mass", type: "501c4", geo: "statewide", desc: "Statewide volunteer-powered climate movement, MA chapter of 350.org." },
  { id: "350cape", name: "350MA Cape Cod", type: "volunteer", geo: "Cape Cod", desc: "Cape Cod node of 350 Mass." },
  { id: "350central", name: "350MA Central Mass", type: "volunteer", geo: "Central MA", desc: "Central MA node of 350 Mass." },
  { id: "350berks", name: "350MA Berkshires", type: "volunteer", geo: "Berkshires", desc: "Berkshires node of 350 Mass." },

  // EJ
  { id: "ace", name: "Alternatives for Community & Environment", type: "501c3", geo: "Roxbury", desc: "Roxbury-based EJ organization, founded 1993." },
  { id: "reep", name: "Roxbury Environmental Empowerment Project", type: "501c3", geo: "Roxbury", desc: "Youth EJ program of ACE." },
  { id: "greenroots", name: "GreenRoots", type: "501c3", geo: "Chelsea", desc: "Chelsea-based EJ organization." },
  { id: "naicob", name: "North American Indian Center of Boston", type: "501c3", geo: "Boston", desc: "Indigenous community center with climate/EJ work." },
  { id: "cps", name: "Coalition for Social Justice", type: "501c3", geo: "Southeastern MA", desc: "Southeastern MA economic and environmental justice coalition." },
  { id: "pioneer_asthma", name: "Pioneer Valley Asthma Coalition", type: "501c3", geo: "Pioneer Valley", desc: "Asthma-focused public-health coalition." },
  { id: "healthlink", name: "HealthLink", type: "501c3", geo: "North Shore", desc: "North Shore public-health/environmental org." },
  { id: "salem_env", name: "Salem Alliance for the Environment", type: "501c3", geo: "Salem", desc: "Salem-area environmental advocacy." },

  // Statewide / large enviro
  { id: "mass_audubon", name: "Mass Audubon", type: "501c3", geo: "statewide", desc: "Largest MA conservation org with significant climate program." },
  { id: "audubon_metro", name: "Mass Audubon — Metro West", type: "501c3", geo: "Metro West", desc: "Metro West sanctuary network of Mass Audubon." },
  { id: "sierra_ma", name: "Sierra Club Massachusetts", type: "501c4", geo: "statewide", desc: "MA chapter of the Sierra Club." },
  { id: "mcan", name: "Mass Climate Action Network", type: "501c3", geo: "statewide", desc: "Network of local MA climate-action groups." },
  { id: "envt_ma", name: "Environment Massachusetts", type: "501c4", geo: "statewide", desc: "Statewide environmental policy advocacy." },
  { id: "clf", name: "Conservation Law Foundation", type: "501c3", geo: "New England", desc: "Regional environmental legal advocacy organization." },
  { id: "elm", name: "Environmental League of MA", type: "501c3", geo: "statewide", desc: "Statewide environmental policy organization." },
  { id: "cwa", name: "Clean Water Action", type: "501c4", geo: "statewide", desc: "Water-and-climate policy advocacy." },
  { id: "climate_xc", name: "Climate XChange", type: "501c3", geo: "statewide", desc: "Carbon pricing and climate-policy think tank." },
  { id: "gbpsr", name: "Greater Boston Physicians for Social Responsibility", type: "501c3", geo: "Greater Boston", desc: "Health professionals advocating on climate and EJ." },
  { id: "geca", name: "Green Energy Consumers Alliance", type: "501c3", geo: "New England", desc: "Consumer-facing clean-energy nonprofit." },
  { id: "masspirg", name: "MASSPIRG", type: "501c4", geo: "statewide", desc: "Statewide public interest research group." },
  { id: "food_water", name: "Food & Water Watch", type: "501c3", geo: "statewide", desc: "Food, water, and climate policy advocacy." },
  { id: "elf", name: "Mass Land Trust Coalition", type: "501c3", geo: "statewide", desc: "Coalition of MA land trusts." },
  { id: "crwa", name: "Charles River Watershed Association", type: "501c3", geo: "Charles River watershed", desc: "Watershed-focused environmental org." },
  { id: "mt_grace", name: "Mount Grace Land Conservation Trust", type: "501c3", geo: "North Quabbin", desc: "North Central MA land conservation trust." },
  { id: "beat", name: "Berkshire Environmental Action Team", type: "501c3", geo: "Berkshires", desc: "Berkshire-region environmental org." },
  { id: "mass_peace", name: "Massachusetts Peace Action", type: "501c4", geo: "statewide", desc: "Peace org with climate/disarmament work." },

  // Faith
  { id: "miph", name: "Massachusetts Interfaith Power & Light", type: "faith_org", geo: "statewide", desc: "Faith-based climate advocacy network." },
  { id: "jcan", name: "Jewish Climate Action Network", type: "faith_org", geo: "statewide", desc: "Jewish climate advocacy and organizing." },
  { id: "jalsa", name: "Jewish Alliance for Law and Social Action", type: "faith_org", geo: "statewide", desc: "Jewish social-justice and policy advocacy." },
  { id: "uuma", name: "UU Mass Action", type: "faith_org", geo: "statewide", desc: "Unitarian Universalist social-justice arm in MA." },
  { id: "afsc", name: "American Friends Service Committee — Northeast", type: "faith_org", geo: "Northeast", desc: "Quaker peace and justice organization, Northeast region." },
  { id: "isbcc", name: "Islamic Society of Boston Cultural Center", type: "faith_org", geo: "Boston", desc: "Boston Muslim community institution with sustainability work." },
  { id: "bodhi", name: "Bodhisara Dharma Community", type: "faith_org", geo: "statewide", desc: "Buddhist community with climate engagement." },
  { id: "first_parish_concord", name: "First Parish Concord — Social Action", type: "faith_org", geo: "Concord", desc: "UU congregation environmental-justice team." },

  // Mothers / parents
  { id: "mothers", name: "Mothers Out Front", type: "501c4", geo: "statewide", desc: "Mothers organizing for a livable climate." },

  // Local action groups
  { id: "green_cambridge", name: "Green Cambridge", type: "volunteer", geo: "Cambridge", desc: "Cambridge climate advocacy." },
  { id: "green_newton", name: "Green Newton", type: "volunteer", geo: "Newton", desc: "Newton climate advocacy." },
  { id: "boston_can", name: "Boston Climate Action Network", type: "volunteer", geo: "Boston", desc: "Boston neighborhood climate organizing." },
  { id: "qcan", name: "Quincy Climate Action Network", type: "volunteer", geo: "Quincy", desc: "Quincy climate advocacy." },
  { id: "climate_bkln", name: "Climate Action Brookline", type: "volunteer", geo: "Brookline", desc: "Brookline climate advocacy." },
  { id: "sustain_milton", name: "Sustainable Milton", type: "volunteer", geo: "Milton", desc: "Milton local sustainability group." },
  { id: "canton_residents", name: "Canton Residents for a Sustainable Equitable Future", type: "volunteer", geo: "Canton", desc: "Canton sustainability organizing." },
  { id: "fore_river", name: "Fore River Residents Against the Compressor Station", type: "volunteer", geo: "Weymouth", desc: "Weymouth/Quincy compressor-station opposition." },
  { id: "climate_code_blue", name: "Climate Code Blue", type: "volunteer", geo: "Cape Cod", desc: "Cape Cod climate advocacy group." },
  { id: "xr_western", name: "XR Western Mass", type: "volunteer", geo: "Western MA", desc: "Extinction Rebellion Western MA chapter." },
  { id: "enviro_show", name: "The Enviro Show", type: "media", geo: "Western MA", desc: "Western-MA environmental radio show." },
  { id: "prog_dems", name: "Progressive Democrats of Mass", type: "501c4", geo: "statewide", desc: "Progressive electoral org with climate priorities." },

  // Schools / buildings
  { id: "century21", name: "21st Century Schools Fund", type: "501c3", geo: "national", desc: "School facilities research and advocacy." },
  { id: "aft_mass", name: "AFT-Mass", type: "union", geo: "statewide", desc: "American Federation of Teachers, MA chapter." },
  { id: "center_green_schools", name: "Center for Green Schools at US GBC", type: "501c3", geo: "national", desc: "Green schools research and advocacy." },
  { id: "chps", name: "Collaborative for High Performance Schools", type: "501c3", geo: "national", desc: "High-performance school facilities collaborative." },
  { id: "cooler_communities", name: "Cooler Communities", type: "501c3", geo: "statewide", desc: "Heat-resilience and cooling for low-income communities." },
  { id: "mfaa", name: "Mass Facilities Administrators Association", type: "professional", geo: "statewide", desc: "MA school facilities professionals association." },
  { id: "mapc", name: "Metropolitan Area Planning Council", type: "regional_gov", geo: "Greater Boston", desc: "Boston-area regional planning agency." },
  { id: "undauntedk12", name: "UndauntedK12", type: "501c3", geo: "national", desc: "K-12 climate action and curriculum." },
  { id: "passive_house", name: "Passive House Massachusetts", type: "professional", geo: "statewide", desc: "MA passive-house building professionals network." },
  { id: "students_equity", name: "Students for Equity in Education (Brookline)", type: "school_club", geo: "Brookline", desc: "Brookline High School equity-in-education group." },

  // Misc
  { id: "our_climate", name: "Our Climate MA", type: "501c4", geo: "statewide", desc: "Youth-led climate-policy advocacy with MA field staff." },
  { id: "community_action_works", name: "Community Action Works", type: "501c3", geo: "New England", desc: "Frontline community organizing support." },
];

// ---- Lat/lng for orgs (by geographic focus) ----
const geoCoords = {
  "Boston": [42.3601, -71.0589],
  "Greater Boston": [42.3501, -71.1054],
  "Roxbury": [42.3110, -71.0894],
  "Chelsea": [42.3917, -71.0328],
  "Cambridge": [42.3736, -71.1097],
  "Newton": [42.3370, -71.2092],
  "Brookline": [42.3318, -71.1213],
  "Quincy": [42.2529, -71.0023],
  "Weymouth": [42.2206, -70.9395],
  "Salem": [42.5197, -70.8955],
  "Andover": [42.6583, -71.1368],
  "Milton": [42.2495, -71.0662],
  "Belmont": [42.3959, -71.1786],
  "Waltham": [42.3756, -71.2358],
  "Lexington": [42.4430, -71.2290],
  "Worcester": [42.2626, -71.8023],
  "Ipswich": [42.6792, -70.8412],
  "Western MA": [42.1015, -72.5898],
  "Springfield": [42.1015, -72.5898],
  "Berkshires": [42.4500, -73.2500],
  "Pioneer Valley": [42.3265, -72.6398],
  "Cape Cod": [41.7003, -70.3002],
  "Central MA": [42.3370, -71.8226],
  "North Shore": [42.5584, -70.8800],
  "Southeastern MA": [41.7038, -71.1500],
  "Charles River watershed": [42.3601, -71.1097],
  "North Quabbin": [42.5670, -72.3300],
  "Metro West": [42.3033, -71.4348],
  "Canton": [42.1584, -71.1448],
  "Dorchester": [42.2992, -71.0608],
  "Concord": [42.4604, -71.3489],
  "statewide": [42.3601, -71.0589],
  "national": [42.3601, -71.0589],
  "New England": [42.3601, -71.0589],
  "Northeast": [42.3601, -71.0589],
};

function jitter(lat, lng, r = 0.03) {
  const j = () => (Math.random() - 0.5) * r * 2;
  return [lat + j(), lng + j()];
}

// ---- Memberships: which orgs belong to which coalitions ----
const memberships = {
  mycc: [
    "bls_youthcan","andover_climate_lobby","andover_hs_env","belmont_hs","may4cj",
    "lorax","green_heifers","ccl_youth","fff_ma","mass_climate_edu","spring_forward",
    "greenroots_eco","bsac","project9","sunrise_boston","sunrise_worcester","sunrise_ipswich",
    "sunrise_western_ma","sunrise_lex","mass_audubon","audubon_metro","our_climate",
    "vietaid","reep","ace","act_on_mass","students_equity",
  ],
  mpf: [
    "mass_audubon","sierra_ma","350ma","mcan","envt_ma","cwa","miph","mothers","jcan",
    "uuma","climate_xc","ace","greenroots","clf","gbpsr","geca","mass_peace","masspirg",
    "sunrise_boston","sunrise_western_ma","audubon_metro","beat","food_water","jalsa","cps",
    "climate_code_blue","boston_can","crwa","elm","community_action_works","afsc","mt_grace",
    "salem_env","naicob","climate_bkln","healthlink","350cape","350central","qcan","reep",
    "our_climate",
  ],
  mara: [
    "350ma","mass_audubon","sierra_ma","cwa","mcan","climate_xc","geca","elm","passive_house",
    "crwa","mothers","green_newton","green_cambridge","sunrise_boston","uuma",
    "boston_can","qcan","350berks","beat","prog_dems",
  ],
  gjc: [
    "ace","reep","greenroots","cps","naicob","boston_can","vietaid","pioneer_asthma",
    "healthlink","gbpsr","spring_forward","greenroots_eco",
  ],
  ejlt: [
    "ace","reep","greenroots","clf","mass_audubon","masspirg","crwa","elm","cps","healthlink",
    "pioneer_asthma","naicob",
  ],
  gfn: [
    "sierra_ma","masspirg","clf","elm","jalsa","cwa","climate_xc","food_water","prog_dems",
    "350ma","mothers",
  ],
  ghs: [
    "century21","aft_mass","center_green_schools","chps","cooler_communities","mfaa","mapc",
    "pioneer_asthma","students_equity","undauntedk12","mass_climate_edu",
  ],
  hero: [
    "mass_audubon","sierra_ma","geca","passive_house","clf","mothers","climate_xc","uuma",
    "beat","green_newton","green_cambridge","elm",
  ],
  zcrf: [
    "passive_house","mass_audubon","sierra_ma","geca","clf","elm","climate_xc","mcan",
    "sunrise_boston","mothers","green_cambridge","green_newton","climate_bkln","gbpsr",
  ],
  crs: [
    "mass_climate_edu","undauntedk12","aft_mass","center_green_schools","chps","cooler_communities",
    "mapc","century21","mfaa",
  ],
};

// ---- Fake projects/events/actions per coalition ----
const skillPool = ["graphic design","social media","writing","translation","data entry","outreach","public speaking","facilitation","legal","research","photography","video editing","spanish","portuguese","mandarin","vietnamese","fundraising","event logistics"];
const urgencyPool = ["low","medium","high"];

const sampleProjects = {
  mycc: [
    { name: "Climate Education Bill", desc: "Push H.4093 through the State House this session.", status: "active", skills: ["legal","writing","public speaking"] },
    { name: "Youth Summit 2026", desc: "Coordinate the annual MA youth climate summit at UMass Boston.", status: "active", skills: ["event logistics","graphic design","social media"] },
    { name: "Member-org Onboarding Sprint", desc: "Onboard five new school clubs by July.", status: "active", skills: ["outreach","facilitation"] },
    { name: "Climate Curriculum Pilot", desc: "Pilot peer-led climate curriculum in three schools.", status: "planning", skills: ["writing","research"] },
  ],
  mpf: [
    { name: "Comprehensive Climate Bill 2026", desc: "Pass the omnibus climate package with EJ amendments.", status: "active", skills: ["legal","writing","public speaking"] },
    { name: "Statewide Lobby Day", desc: "300 visits to legislators in March.", status: "active", skills: ["event logistics","outreach"] },
    { name: "Frontline Endorsement Process", desc: "Re-do the EJ endorsement vote for the bill priorities.", status: "active", skills: ["facilitation"] },
    { name: "Coalition Member Survey", desc: "Annual member-org survey on priorities and capacity.", status: "planning", skills: ["data entry","research"] },
  ],
  mara: [
    { name: "100% Renewables by 2035", desc: "Campaign to advance the accelerated renewables timeline.", status: "active", skills: ["writing","research","public speaking"] },
    { name: "Offshore Wind Workforce", desc: "Just-transition workforce policy push.", status: "active", skills: ["research","writing"] },
    { name: "Net Metering Defense", desc: "Defend distributed solar net-metering rules.", status: "active", skills: ["legal","public speaking"] },
  ],
  gjc: [
    { name: "Cumulative Impacts Reg", desc: "Implementation push on EJ cumulative-impacts regulation.", status: "active", skills: ["legal","spanish","translation"] },
    { name: "EJ Roundtable Series", desc: "Quarterly statewide EJ roundtables.", status: "active", skills: ["facilitation","event logistics"] },
    { name: "Frontline Voices Story Bank", desc: "Story-collection from frontline community members.", status: "active", skills: ["video editing","photography","writing"] },
  ],
  ejlt: [
    { name: "EJ Bill Tracker", desc: "Maintain shared tracker of EJ legislation.", status: "active", skills: ["research","data entry"] },
    { name: "Joint Testimony Drives", desc: "Coordinated testimony for committee hearings.", status: "active", skills: ["writing","public speaking","legal"] },
    { name: "EJ 101 Trainings", desc: "Quarterly EJ training series for allied orgs.", status: "active", skills: ["facilitation"] },
  ],
  gfn: [
    { name: "Polluter Fee Campaign", desc: "Pass corporate polluter fees in MA.", status: "active", skills: ["public speaking","writing","outreach"] },
    { name: "Member Education Series", desc: "Workshops on revenue-raising climate finance.", status: "active", skills: ["facilitation","graphic design"] },
    { name: "Polluter Database Build", desc: "Public-facing database of MA's top corporate emitters.", status: "planning", skills: ["data entry","research"] },
  ],
  ghs: [
    { name: "Healthy Schools Audit", desc: "Indoor-air-quality audits at 20 MA schools.", status: "active", skills: ["data entry","research"] },
    { name: "Solar-on-Schools Map", desc: "Statewide map of school solar installations.", status: "active", skills: ["data entry","graphic design"] },
    { name: "School Heat-Pump Pilots", desc: "Pilot heat-pump retrofits at two pilot districts.", status: "planning", skills: ["research"] },
  ],
  hero: [
    { name: "Building Code Update", desc: "Push the next stretch energy code.", status: "active", skills: ["legal","writing","research"] },
    { name: "Heat-Pump Tax Credit", desc: "State-level credit for residential heat-pump installs.", status: "active", skills: ["writing","public speaking"] },
    { name: "Renter Decarbonization Toolkit", desc: "Decarbonization-toolkit for tenant organizers.", status: "active", skills: ["writing","graphic design","translation"] },
  ],
  zcrf: [
    { name: "ZCRF Bill", desc: "Establish the Zero Carbon Renovation Fund in MA budget.", status: "active", skills: ["legal","writing","public speaking"] },
    { name: "Pilot Building Selection", desc: "Identify 10 pilot retrofit buildings statewide.", status: "active", skills: ["research","outreach"] },
    { name: "Workforce Pipeline", desc: "Build workforce pipeline for the retrofit fund.", status: "planning", skills: ["research"] },
  ],
  crs: [
    { name: "Climate Resilience Audit", desc: "Audit 15 districts for climate-resilient capital plans.", status: "active", skills: ["research","data entry"] },
    { name: "MSBA Engagement", desc: "Push MSBA to weight climate resilience in school funding.", status: "active", skills: ["writing","public speaking"] },
    { name: "Cooling Center Mapping", desc: "Map cooling centers and heat-island risk by district.", status: "active", skills: ["data entry","graphic design"] },
  ],
};

const sampleEvents = {
  mycc: [
    { name: "MYCC Steering Meeting", date: "2026-06-12T18:00:00", loc: "Boston Latin School + Zoom" },
    { name: "Youth Lobby Day", date: "2026-06-25T09:00:00", loc: "MA State House" },
    { name: "Summer Climate Camp", date: "2026-07-15T09:00:00", loc: "Walden Pond" },
    { name: "New-Member Orientation", date: "2026-09-08T18:30:00", loc: "Zoom" },
    { name: "Earth Day Rally Debrief", date: "2026-05-01T17:00:00", loc: "Boston Common" },
  ],
  mpf: [
    { name: "Coalition All-Member Meeting", date: "2026-06-05T17:00:00", loc: "Zoom" },
    { name: "Statehouse Lobby Day", date: "2026-06-18T09:00:00", loc: "MA State House" },
    { name: "Climate Bill Strategy Retreat", date: "2026-08-22T09:00:00", loc: "Holy Cross, Worcester" },
    { name: "Frontline Listening Session", date: "2026-07-09T18:00:00", loc: "Springfield" },
  ],
  mara: [
    { name: "Renewables Now Rally", date: "2026-07-08T12:00:00", loc: "Boston Common" },
    { name: "Offshore Wind Workforce Convening", date: "2026-09-15T10:00:00", loc: "New Bedford" },
    { name: "Solar Net-Metering Hearing", date: "2026-06-19T13:00:00", loc: "MA DPU" },
  ],
  gjc: [
    { name: "EJ Roundtable — Chelsea", date: "2026-06-22T18:00:00", loc: "Chelsea Senior Center" },
    { name: "EJ Roundtable — Springfield", date: "2026-09-14T18:00:00", loc: "Springfield Public Library" },
    { name: "Frontline Voices Storytelling Night", date: "2026-08-04T19:00:00", loc: "Roxbury" },
  ],
  ejlt: [
    { name: "Hearing Day: EJ Bills", date: "2026-06-10T10:00:00", loc: "MA State House Rm A-1" },
    { name: "EJ 101 Training", date: "2026-07-23T17:00:00", loc: "Zoom" },
    { name: "EJ Tracker Update Sync", date: "2026-06-30T15:00:00", loc: "Zoom" },
  ],
  gfn: [
    { name: "Polluter Fee Briefing", date: "2026-06-14T12:00:00", loc: "Zoom" },
    { name: "Member Workshop: Revenue Tools", date: "2026-07-21T17:30:00", loc: "Zoom" },
    { name: "Public Forum on Polluter Fees", date: "2026-09-25T18:30:00", loc: "Cambridge" },
  ],
  ghs: [
    { name: "Green Schools Symposium", date: "2026-09-20T09:00:00", loc: "UMass Boston" },
    { name: "IAQ Audit Training", date: "2026-07-11T13:00:00", loc: "Worcester" },
    { name: "School Solar Site Visit", date: "2026-08-14T10:00:00", loc: "Lowell" },
  ],
  hero: [
    { name: "Buildings Working Group", date: "2026-06-09T16:00:00", loc: "Zoom" },
    { name: "Stretch Code Public Comment", date: "2026-06-30T17:00:00", loc: "MA DOER" },
    { name: "Renter Toolkit Launch", date: "2026-10-02T18:00:00", loc: "Boston Public Library" },
  ],
  zcrf: [
    { name: "Budget Strategy Call", date: "2026-06-03T15:00:00", loc: "Zoom" },
    { name: "Pilot Building Tour: Cambridge", date: "2026-08-19T14:00:00", loc: "Cambridge" },
    { name: "Workforce Pipeline Convening", date: "2026-09-10T10:00:00", loc: "Boston" },
  ],
  crs: [
    { name: "Resilient Schools Workshop", date: "2026-07-12T09:00:00", loc: "Worcester" },
    { name: "MSBA Listening Session", date: "2026-08-26T17:00:00", loc: "Zoom" },
    { name: "Cooling Center Mapping Sprint", date: "2026-07-30T13:00:00", loc: "Boston" },
  ],
};

const sampleActions = {
  mycc: [
    { kind: "task", name: "Design Summit posters", urgency: "high", skills: ["graphic design"], deadline: "2026-06-30" },
    { kind: "task", name: "Recruit two new school clubs", urgency: "medium", skills: ["outreach"], deadline: "2026-08-01" },
    { kind: "role", name: "Social Media Co-Lead", urgency: "medium", skills: ["social media","writing"] },
    { kind: "task", name: "Photograph the Lobby Day", urgency: "low", skills: ["photography"], deadline: "2026-06-26" },
    { kind: "role", name: "Spanish Translator (Curriculum Pilot)", urgency: "medium", skills: ["spanish","translation"] },
  ],
  mpf: [
    { kind: "task", name: "Call your Senator on H.4093", urgency: "high", skills: ["public speaking"], deadline: "2026-06-15" },
    { kind: "task", name: "Translate testimony to Spanish", urgency: "medium", skills: ["spanish","translation"], deadline: "2026-06-09" },
    { kind: "role", name: "Hearing Logistics Coordinator", urgency: "medium", skills: ["event logistics"] },
    { kind: "task", name: "Sign-on Letter circulation", urgency: "high", skills: ["outreach"], deadline: "2026-06-12" },
    { kind: "role", name: "Member-Survey Data Volunteer", urgency: "low", skills: ["data entry"] },
  ],
  mara: [
    { kind: "task", name: "Sign on to Renewables Letter", urgency: "high", skills: ["writing"], deadline: "2026-06-08" },
    { kind: "role", name: "Workforce Policy Researcher", urgency: "low", skills: ["research"] },
    { kind: "task", name: "Rally tabling volunteers needed", urgency: "medium", skills: ["outreach"], deadline: "2026-07-08" },
  ],
  gjc: [
    { kind: "task", name: "Mobilize members for cumulative-impacts hearing", urgency: "high", skills: ["outreach","public speaking"], deadline: "2026-06-12" },
    { kind: "role", name: "EJ Roundtable Facilitator", urgency: "medium", skills: ["facilitation"] },
    { kind: "role", name: "Portuguese Translator", urgency: "medium", skills: ["portuguese","translation"] },
    { kind: "task", name: "Story Bank video editor", urgency: "low", skills: ["video editing"] },
  ],
  ejlt: [
    { kind: "task", name: "Submit joint testimony on H.3994", urgency: "high", skills: ["legal","writing"], deadline: "2026-06-10" },
    { kind: "role", name: "Bill Tracker Researcher", urgency: "low", skills: ["research","data entry"] },
    { kind: "task", name: "Draft EJ 101 slide deck", urgency: "medium", skills: ["writing","graphic design"], deadline: "2026-07-20" },
  ],
  gfn: [
    { kind: "task", name: "Member-org sign-on by 6/20", urgency: "medium", skills: ["outreach"], deadline: "2026-06-20" },
    { kind: "role", name: "Policy Researcher", urgency: "low", skills: ["research","writing"] },
    { kind: "task", name: "Polluter Database data entry", urgency: "low", skills: ["data entry"] },
  ],
  ghs: [
    { kind: "task", name: "Help audit IAQ at Pioneer Valley schools", urgency: "medium", skills: ["data entry"], deadline: "2026-07-30" },
    { kind: "role", name: "Solar Map Researcher", urgency: "low", skills: ["research"] },
    { kind: "task", name: "Photo essay for Symposium", urgency: "low", skills: ["photography"], deadline: "2026-09-19" },
  ],
  hero: [
    { kind: "task", name: "Comment on stretch code", urgency: "high", skills: ["writing"], deadline: "2026-06-30" },
    { kind: "task", name: "Renter Toolkit translation (Spanish)", urgency: "medium", skills: ["spanish","translation"], deadline: "2026-08-15" },
    { kind: "role", name: "Heat-Pump Outreach Volunteer", urgency: "low", skills: ["outreach"] },
  ],
  zcrf: [
    { kind: "task", name: "Pilot Building Nomination", urgency: "medium", skills: ["outreach"], deadline: "2026-07-15" },
    { kind: "role", name: "Budget Tracker Volunteer", urgency: "low", skills: ["data entry"] },
    { kind: "task", name: "Convening logistics support", urgency: "medium", skills: ["event logistics"], deadline: "2026-09-05" },
  ],
  crs: [
    { kind: "task", name: "Identify district capital plans to audit", urgency: "medium", skills: ["research"], deadline: "2026-07-01" },
    { kind: "task", name: "Cooling Center Mapping sprint", urgency: "high", skills: ["data entry","graphic design"], deadline: "2026-07-30" },
    { kind: "role", name: "MSBA Hearing Speaker", urgency: "medium", skills: ["public speaking"] },
  ],
};

// ---- Build final structure ----
function isoDaysFromNow(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

function projectId(coId, i) { return `${coId}_p${i + 1}`; }
function eventId(coId, i) { return `${coId}_e${i + 1}`; }
function actionId(coId, i) { return `${coId}_a${i + 1}`; }

const coalitionsOut = coalitions.map((co) => {
  const members = memberships[co.id] || [];
  const projects = (sampleProjects[co.id] || []).map((p, i) => ({
    id: projectId(co.id, i),
    name: p.name,
    description: p.desc,
    status: p.status || "active",
    skills_needed: p.skills || [],
  }));
  const events = (sampleEvents[co.id] || []).map((e, i) => ({
    id: eventId(co.id, i),
    name: e.name,
    date: e.date,
    location: e.loc,
  }));
  const actions = (sampleActions[co.id] || []).map((a, i) => ({
    id: actionId(co.id, i),
    kind: a.kind,
    name: a.name,
    urgency: a.urgency || "medium",
    skills_needed: a.skills || [],
    deadline: a.deadline || null,
  }));
  return {
    id: co.id,
    name: co.name,
    abbrev: co.abbrev,
    description: co.description,
    focus_tags: co.focus_tags,
    geographic_scope: co.geographic_scope,
    color: co.color,
    lat: co.lat,
    lng: co.lng,
    member_ids: members,
    member_count: members.length,
    projects,
    events,
    actions,
    last_activity: isoDaysFromNow(Math.floor(Math.random() * 14)),
  };
});

// Reverse-index: each org → which coalitions
const orgsOut = orgs.map((o) => {
  const coalitionIds = Object.entries(memberships)
    .filter(([_, ids]) => ids.includes(o.id))
    .map(([cid]) => cid);
  const base = geoCoords[o.geo] || geoCoords.statewide;
  const [lat, lng] = jitter(base[0], base[1], 0.04);
  return {
    id: o.id,
    name: o.name,
    type: o.type,
    geographic_focus: o.geo,
    description: o.desc,
    coalition_ids: coalitionIds,
    lat,
    lng,
    last_activity: isoDaysFromNow(Math.floor(Math.random() * 60)),
  };
});

// Build edges
const edges = [];
for (const [cid, orgIds] of Object.entries(memberships)) {
  for (const oid of orgIds) {
    edges.push({ source: cid, target: oid });
  }
}

// Sanity: check no edge references a missing org/coalition
const orgIdSet = new Set(orgs.map((o) => o.id));
const coIdSet = new Set(coalitions.map((c) => c.id));
const missing = [];
for (const e of edges) {
  if (!coIdSet.has(e.source)) missing.push(`coalition ${e.source}`);
  if (!orgIdSet.has(e.target)) missing.push(`org ${e.target}`);
}
if (missing.length) {
  console.error("Missing references:", [...new Set(missing)]);
  process.exit(1);
}

const out = {
  generated_at: new Date().toISOString(),
  coalitions: coalitionsOut,
  organizations: orgsOut,
  edges,
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(
  `Wrote ${outPath} — ${coalitionsOut.length} coalitions, ${orgsOut.length} orgs, ${edges.length} edges.`,
);
