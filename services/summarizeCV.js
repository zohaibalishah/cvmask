const COMMON_SKILLS = [
  "React", "Angular", "Vue", "Node.js", "Express", "Next.js", "Vite", "Svelte",
  "Python", "Django", "Flask", "FastAPI", "Java", "Spring Boot", "C++", "C#", ".NET",
  "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Elasticsearch", "SQLite",
  "Docker", "Kubernetes", "AWS", "Azure", "GCP", "DevOps", "CI/CD", "Git",
  "HTML", "CSS", "Tailwind", "Bootstrap", "TypeScript", "JavaScript", "PHP", "Laravel",
  "Machine Learning", "Deep Learning", "Data Science", "Pandas", "NumPy", "TensorFlow", "PyTorch",
  "Project Management", "Agile", "Scrum", "Product Management", "UI/UX", "Figma"
];

function extractSkills(text) {
  const matched = [];
  const lowerText = text.toLowerCase();
  for (const skill of COMMON_SKILLS) {
    const escaped = skill.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    if (regex.test(lowerText)) {
      matched.push(skill);
    }
  }
  return matched.slice(0, 8); // top 8 matched skills
}

function extractExperience(text) {
  // 1. Check for explicit mention of years of experience
  const explicitRegex = /\b(\d{1,2})\+?\s*(?:years?|yrs?)\s*(?:of\s+)?experience\b/i;
  const match = text.match(explicitRegex);
  if (match) {
    return parseInt(match[1], 10);
  }

  // 2. Fallback: parse date ranges (e.g. 2018 - 2022)
  const rangeRegex = /\b(19\d{2}|20\d{2})\s*[-–—]\s*(19\d{2}|20\d{2}|present|current)\b/gi;
  const currentYear = new Date().getFullYear();
  let totalYears = 0;
  const matches = [...text.matchAll(rangeRegex)];

  for (const m of matches) {
    const startYear = parseInt(m[1], 10);
    const endStr = m[2].toLowerCase();
    const endYear = (endStr === "present" || endStr === "current") ? currentYear : parseInt(endStr, 10);
    
    if (endYear >= startYear && (endYear - startYear) <= 15) {
      totalYears += (endYear - startYear);
    }
  }

  if (totalYears > 0) {
    return Math.min(totalYears, 25);
  }

  return 0; 
}

function extractLatestTitle(text) {
  const titleKeywords = [
    "Software Engineer", "Software Developer", "Full Stack Developer", "Backend Developer", 
    "Frontend Developer", "Data Scientist", "Data Analyst", "Project Manager", "Product Manager",
    "DevOps Engineer", "System Administrator", "UI/UX Designer", "Solutions Architect", 
    "Quality Assurance", "QA Engineer", "Mobile Developer", "iOS Developer", "Android Developer",
    "Security Analyst", "Network Engineer", "Consultant", "Director", "VP", "Manager", "Lead Developer"
  ];
  
  const headerText = text.substring(0, 1000);
  for (const title of titleKeywords) {
    const regex = new RegExp(`\\b${title}\\b`, "i");
    if (regex.test(headerText)) {
      return title;
    }
  }

  // Fallback: search lines in the top of the text containing engineer/developer/etc.
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 5);
  const titleFallbackRegex = /\b(?:engineer|developer|manager|consultant|analyst|specialist|lead|designer|architect|programmer)\b/i;
  for (let i = 1; i < Math.min(lines.length, 15); i++) {
    if (titleFallbackRegex.test(lines[i]) && lines[i].length < 60) {
      return lines[i];
    }
  }

  return "Professional Candidate";
}

function summarizeCV(text = "") {
  if (!text) {
    return {
      yearsOfExperience: 0,
      skills: [],
      latestTitle: "Professional Candidate"
    };
  }

  return {
    yearsOfExperience: extractExperience(text),
    skills: extractSkills(text),
    latestTitle: extractLatestTitle(text)
  };
}

module.exports = { summarizeCV };
