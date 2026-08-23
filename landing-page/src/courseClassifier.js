const DEGREE_WORDS = new Set([
  "ba",
  "bachelor",
  "bachelors",
  "beng",
  "bsc",
  "diploma",
  "hnd",
  "honours",
  "honors",
  "hons",
  "ma",
  "masters",
  "meng",
  "msc",
  "nd",
  "of",
  "science",
]);

export const COURSE_FAMILIES = [
  {
    id: "computing",
    label: "Computing and technology",
    aliases: ["computer science", "computing", "computer engineering", "software engineering", "software development", "information technology", "information systems", "informatics", "data science", "data analytics", "business analytics", "cyber security", "cybersecurity", "artificial intelligence", "machine learning", "cloud computing", "network engineering", "telecommunications", "web development", "mobile app development", "game development", "database management", "human computer interaction", "user experience design", "computer applications"],
    skills: {
      courseDerived: ["Problem decomposition", "Data reasoning"],
      applied: ["Software testing", "Technical documentation"],
      transferable: ["Systems thinking", "Collaborative delivery"],
    },
  },
  {
    id: "engineering",
    label: "Engineering",
    aliases: ["mechanical engineering", "civil engineering", "electrical engineering", "electronic engineering", "chemical engineering", "mechatronics", "aerospace engineering", "biomedical engineering", "petroleum engineering", "automotive engineering", "industrial engineering", "systems engineering", "production engineering", "structural engineering", "materials engineering", "robotics engineering", "environmental engineering", "agricultural engineering", "engineering"],
    skills: {
      courseDerived: ["Requirements analysis", "Technical modelling"],
      applied: ["Quality checks", "Design documentation"],
      transferable: ["Structured problem-solving", "Project delivery"],
    },
  },
  {
    id: "business-economics",
    label: "Business and economics",
    aliases: ["economics", "business administration", "business management", "business studies", "commerce", "accounting", "finance", "banking and finance", "marketing", "human resources", "supply chain management", "logistics", "operations management", "project management", "entrepreneurship", "actuarial science", "insurance", "real estate", "estate management", "tourism management", "hospitality management", "procurement", "management"],
    skills: {
      courseDerived: ["Commercial analysis", "Market research"],
      applied: ["Spreadsheet modelling", "Business presentation"],
      transferable: ["Decision framing", "Stakeholder communication"],
    },
  },
  {
    id: "communications-creative",
    label: "Communications and creative arts",
    aliases: ["mass communication", "communication arts", "journalism", "broadcasting", "media studies", "digital media", "public relations", "graphic design", "visual communication", "film studies", "film production", "creative arts", "advertising", "animation", "photography", "fashion design", "fine arts", "music", "music production", "theatre arts", "performing arts", "publishing"],
    skills: {
      courseDerived: ["Audience research", "Story development"],
      applied: ["Content production", "Campaign planning"],
      transferable: ["Clear communication", "Creative collaboration"],
    },
  },
  {
    id: "law-policy",
    label: "Law and public policy",
    aliases: ["law", "legal studies", "corporate law", "political science", "politics", "public policy", "public administration", "governance", "international relations", "international development", "criminology", "security studies", "peace studies", "human rights"],
    skills: {
      courseDerived: ["Evidence review", "Policy analysis"],
      applied: ["Case research", "Structured argument"],
      transferable: ["Critical reasoning", "Stakeholder analysis"],
    },
  },
  {
    id: "life-health",
    label: "Life and health sciences",
    aliases: ["microbiology", "biology", "biochemistry", "biotechnology", "genetics", "molecular biology", "medicine", "medical science", "nursing", "pharmacy", "public health", "epidemiology", "anatomy", "physiology", "physiotherapy", "radiography", "medical laboratory science", "medical rehabilitation", "nutrition", "dietetics", "dentistry", "veterinary medicine", "neuroscience", "health information management"],
    skills: {
      courseDerived: ["Scientific observation", "Research review"],
      applied: ["Data recording", "Technical reporting"],
      transferable: ["Evidence-led decisions", "Ethical practice"],
    },
  },
  {
    id: "physical-sciences",
    label: "Physical sciences",
    aliases: ["chemistry", "industrial chemistry", "analytical chemistry", "physics", "applied physics", "mathematics", "applied mathematics", "statistics", "data statistics", "geology", "geophysics", "meteorology", "astronomy", "materials science"],
    skills: {
      courseDerived: ["Quantitative analysis", "Scientific modelling"],
      applied: ["Experimental design", "Data interpretation"],
      transferable: ["Logical reasoning", "Precise communication"],
    },
  },
  {
    id: "social-sciences",
    label: "Social sciences",
    aliases: ["sociology", "psychology", "social work", "social policy", "anthropology", "development studies", "development economics", "geography", "human geography", "demography", "gender studies", "community development", "social sciences"],
    skills: {
      courseDerived: ["Human-centred research", "Behavioural analysis"],
      applied: ["Interview design", "Qualitative synthesis"],
      transferable: ["Empathy", "Contextual reasoning"],
    },
  },
  {
    id: "education",
    label: "Education",
    aliases: ["education", "education management", "educational management", "guidance and counselling", "early childhood education", "primary education", "secondary education", "special education", "adult education", "science education", "technical education", "curriculum studies", "educational psychology", "teaching"],
    skills: {
      courseDerived: ["Learning design", "Assessment planning"],
      applied: ["Facilitation", "Progress evaluation"],
      transferable: ["Coaching", "Clear communication"],
    },
  },
  {
    id: "built-environment",
    label: "Built environment",
    aliases: ["architecture", "quantity surveying", "estate management", "urban planning", "town planning", "building technology", "construction management", "surveying", "geomatics", "land surveying", "property management", "interior design", "landscape architecture"],
    skills: {
      courseDerived: ["Spatial reasoning", "Specification review"],
      applied: ["Design documentation", "Project planning"],
      transferable: ["Constraint management", "Team coordination"],
    },
  },
  {
    id: "agriculture-environment",
    label: "Agriculture and environment",
    aliases: ["agriculture", "agricultural economics", "agricultural science", "crop science", "animal science", "fisheries", "forestry", "soil science", "environmental science", "environmental management", "conservation", "climate science", "water resources", "food science", "fisheries management"],
    skills: {
      courseDerived: ["Environmental assessment", "Resource analysis"],
      applied: ["Field data collection", "Sustainability planning"],
      transferable: ["Systems thinking", "Community engagement"],
    },
  },
  {
    id: "humanities-languages",
    label: "Humanities and languages",
    aliases: ["english", "english language", "english literature", "history", "philosophy", "linguistics", "languages", "modern languages", "french", "german", "spanish", "religious studies", "theology", "classics", "cultural studies", "literature", "theatre arts"],
    skills: {
      courseDerived: ["Textual analysis", "Contextual research"],
      applied: ["Editorial writing", "Argument development"],
      transferable: ["Critical thinking", "Cultural awareness"],
    },
  },
];

export const POPULAR_COURSES = [
  "Computer Science",
  "Economics",
  "Mass Communication",
  "Mechanical Engineering",
  "Law",
  "Microbiology",
];

export function normalizeCourse(value = "") {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\bb\s*\.\s*sc\b/g, " bsc ")
    .replace(/\bb\s*\.\s*eng\b/g, " beng ")
    .replace(/\bm\s*\.\s*sc\b/g, " msc ")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((word) => !DEGREE_WORDS.has(word))
    .join(" ");
}

function bigrams(value) {
  const compact = value.replace(/\s+/g, " ");
  if (compact.length < 2) return new Set([compact]);
  return new Set(Array.from({ length: compact.length - 1 }, (_, index) => compact.slice(index, index + 2)));
}

function diceCoefficient(left, right) {
  const leftSet = bigrams(left);
  const rightSet = bigrams(right);
  let matches = 0;
  leftSet.forEach((entry) => {
    if (rightSet.has(entry)) matches += 1;
  });
  return (2 * matches) / Math.max(1, leftSet.size + rightSet.size);
}

function tokenOverlap(left, right) {
  const leftTokens = new Set(left.split(" ").filter(Boolean));
  const rightTokens = new Set(right.split(" ").filter(Boolean));
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;
  return intersection / Math.max(1, union);
}

function scoreAlias(input, alias) {
  const normalizedAlias = normalizeCourse(alias);
  if (input === normalizedAlias) return 1;
  if (input.includes(normalizedAlias) || normalizedAlias.includes(input)) return 0.9;
  return 0.62 * diceCoefficient(input, normalizedAlias) + 0.38 * tokenOverlap(input, normalizedAlias);
}

export function rankCourseMatches(value) {
  const input = normalizeCourse(value);
  if (!input) return [];

  return COURSE_FAMILIES.map((family) => {
    const aliases = family.aliases.map((alias) => ({ alias, score: scoreAlias(input, alias) }));
    aliases.sort((left, right) => right.score - left.score);
    return { ...family, matchedAlias: aliases[0].alias, score: aliases[0].score };
  }).sort((left, right) => right.score - left.score);
}

function mergeSkills(families) {
  const groups = { courseDerived: [], applied: [], transferable: [] };
  Object.keys(groups).forEach((group) => {
    families.forEach((family) => {
      family.skills[group].forEach((skill) => {
        if (!groups[group].includes(skill) && groups[group].length < 2) groups[group].push(skill);
      });
    });
  });
  return groups;
}

export function profileForFamily(familyId, courseLabel) {
  const family = COURSE_FAMILIES.find((entry) => entry.id === familyId);
  if (!family) return null;
  return {
    status: "matched",
    course: courseLabel?.trim() || family.label,
    families: [family],
    skills: mergeSkills([family]),
    basis: "Suggested from the course title only. Verify each area with evidence before adding it to a profile.",
  };
}

export function classifyCourse(value) {
  const course = value.trim();
  const normalized = normalizeCourse(course);
  if (!normalized) return { status: "empty", course: "", suggestions: [], families: [] };

  const jointParts = normalized.split(/\b(?:and|with)\b/).map((part) => part.trim()).filter(Boolean);
  if (jointParts.length > 1) {
    const jointFamilies = jointParts
      .map((part) => rankCourseMatches(part)[0])
      .filter((match) => match?.score >= 0.58)
      .filter((match, index, entries) => entries.findIndex((entry) => entry.id === match.id) === index)
      .slice(0, 2);
    if (jointFamilies.length > 1) {
      return {
        status: "matched",
        course,
        families: jointFamilies,
        skills: mergeSkills(jointFamilies),
        basis: "Suggested from the joint course title only. Verify each area with evidence before adding it to a profile.",
      };
    }
  }

  const ranked = rankCourseMatches(course);
  const top = ranked[0];
  const runnerUp = ranked[1];
  if ((top.score >= 0.72 && top.score - runnerUp.score >= 0.06) || (top.score >= 0.44 && top.score - runnerUp.score >= 0.2)) {
    return {
      status: "matched",
      course,
      families: [top],
      skills: mergeSkills([top]),
      basis: "Suggested from the course title only. Verify each area with evidence before adding it to a profile.",
    };
  }

  if (top.score >= 0.48) {
    return { status: "ambiguous", course, suggestions: ranked.slice(0, 3), families: [] };
  }

  return { status: "unknown", course, suggestions: [], families: COURSE_FAMILIES };
}
