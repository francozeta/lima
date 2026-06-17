const ACRONYMS = new Set([
  "AI",
  "API",
  "AWS",
  "BI",
  "CSS",
  "HTML",
  "IA",
  "IoT",
  "JS",
  "KPI",
  "ML",
  "NLP",
  "QA",
  "SQL",
  "UI",
  "UX",
]);

export type SkillSeed = {
  category: string;
  name: string;
};

export const DEFAULT_SKILLS: SkillSeed[] = [
  { category: "Frontend", name: "HTML" },
  { category: "Frontend", name: "CSS" },
  { category: "Frontend", name: "JavaScript" },
  { category: "Frontend", name: "TypeScript" },
  { category: "Frontend", name: "React" },
  { category: "Frontend", name: "Next.js" },
  { category: "Frontend", name: "Vue" },
  { category: "Frontend", name: "Angular" },
  { category: "Frontend", name: "Tailwind CSS" },
  { category: "Frontend", name: "Accesibilidad web" },
  { category: "Frontend", name: "Responsive design" },
  { category: "Backend", name: "Node.js" },
  { category: "Backend", name: "Express" },
  { category: "Backend", name: "NestJS" },
  { category: "Backend", name: "Python" },
  { category: "Backend", name: "Django" },
  { category: "Backend", name: "FastAPI" },
  { category: "Backend", name: "Java" },
  { category: "Backend", name: "Spring Boot" },
  { category: "Backend", name: "C#" },
  { category: "Backend", name: ".NET" },
  { category: "Backend", name: "Go" },
  { category: "Backend", name: "REST APIs" },
  { category: "Backend", name: "GraphQL" },
  { category: "Datos", name: "PostgreSQL" },
  { category: "Datos", name: "MySQL" },
  { category: "Datos", name: "SQL" },
  { category: "Datos", name: "MongoDB" },
  { category: "Datos", name: "Supabase" },
  { category: "Datos", name: "Firebase" },
  { category: "Datos", name: "Data modeling" },
  { category: "Datos", name: "Dashboards" },
  { category: "Datos", name: "Power BI" },
  { category: "Datos", name: "Excel avanzado" },
  { category: "IA y Data", name: "Machine Learning" },
  { category: "IA y Data", name: "Deep Learning" },
  { category: "IA y Data", name: "NLP" },
  { category: "IA y Data", name: "Computer Vision" },
  { category: "IA y Data", name: "Prompt engineering" },
  { category: "IA y Data", name: "Python para datos" },
  { category: "IA y Data", name: "Pandas" },
  { category: "IA y Data", name: "NumPy" },
  { category: "IA y Data", name: "Scikit-learn" },
  { category: "IA y Data", name: "OpenAI API" },
  { category: "Diseno", name: "UI" },
  { category: "Diseno", name: "UX" },
  { category: "Diseno", name: "UI/UX" },
  { category: "Diseno", name: "Figma" },
  { category: "Diseno", name: "Design systems" },
  { category: "Diseno", name: "Prototipado" },
  { category: "Diseno", name: "User research" },
  { category: "Diseno", name: "Wireframing" },
  { category: "Diseno", name: "Branding" },
  { category: "Producto", name: "Product management" },
  { category: "Producto", name: "Lean startup" },
  { category: "Producto", name: "Design thinking" },
  { category: "Producto", name: "Storytelling" },
  { category: "Producto", name: "Pitch" },
  { category: "Producto", name: "Roadmapping" },
  { category: "Producto", name: "Validacion de usuarios" },
  { category: "DevOps", name: "Git" },
  { category: "DevOps", name: "GitHub" },
  { category: "DevOps", name: "Docker" },
  { category: "DevOps", name: "CI/CD" },
  { category: "DevOps", name: "Vercel" },
  { category: "DevOps", name: "AWS" },
  { category: "DevOps", name: "Linux" },
  { category: "DevOps", name: "Testing" },
  { category: "Mobile", name: "React Native" },
  { category: "Mobile", name: "Flutter" },
  { category: "Mobile", name: "Kotlin" },
  { category: "Mobile", name: "Swift" },
  { category: "Mobile", name: "Android" },
  { category: "Mobile", name: "iOS" },
  { category: "Hardware", name: "Arduino" },
  { category: "Hardware", name: "Raspberry Pi" },
  { category: "Hardware", name: "IoT" },
  { category: "Hardware", name: "Electronica basica" },
  { category: "Negocio", name: "Marketing digital" },
  { category: "Negocio", name: "Ventas" },
  { category: "Negocio", name: "Investigacion de mercado" },
  { category: "Negocio", name: "Modelo de negocio" },
  { category: "Negocio", name: "Finanzas basicas" },
  { category: "Soft skills", name: "Liderazgo" },
  { category: "Soft skills", name: "Comunicacion" },
  { category: "Soft skills", name: "Trabajo en equipo" },
  { category: "Soft skills", name: "Gestion del tiempo" },
  { category: "Soft skills", name: "Resolucion de problemas" },
  { category: "Soft skills", name: "Facilitacion" },
];

function stripAccents(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function displayWord(word: string) {
  const upper = word.toUpperCase();
  if (ACRONYMS.has(upper)) return upper;
  if (upper === "IOT") return "IoT";
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function normalizeSkillName(value: string) {
  return stripAccents(value)
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((part) => part.split("/").map(displayWord).join("/"))
    .join(" ");
}

export function toSkillSlug(value: string) {
  return stripAccents(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function dedupeSkillNames(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  values.forEach((value) => {
    const name = normalizeSkillName(value);
    const slug = toSkillSlug(name);
    if (!slug || seen.has(slug)) return;
    seen.add(slug);
    result.push(name);
  });

  return result;
}
