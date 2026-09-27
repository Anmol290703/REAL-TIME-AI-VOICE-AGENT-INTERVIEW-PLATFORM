import { interviewCovers, mappings } from "@/constants";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const techIconBaseURL = "https://cdn.jsdelivr.net/gh/devicons/devicon/icons";

const normalizeTechName = (tech: string) => {
  const key = tech.toLowerCase().replace(/\.js$/, "").replace(/\s+/g, "");
  return mappings[key as keyof typeof mappings];
};

const checkIconExists = async (url: string) => {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok; // Returns true if the icon exists
  } catch {
    return false;
  }
};

export const getTechLogos = async (techArray: string[]) => {
  const logoURLs = techArray.map((tech) => {
    const normalized = normalizeTechName(tech);
    return {
      tech,
      url: `${techIconBaseURL}/${normalized}/${normalized}-original.svg`,
    };
  });

  const results = await Promise.all(
    logoURLs.map(async ({ tech, url }) => ({
      tech,
      url: (await checkIconExists(url)) ? url : "/tech.svg",
    }))
  );

  return results;
};

export const getRandomInterviewCover = () => {
  const randomIndex = Math.floor(Math.random() * interviewCovers.length);
  return `/covers${interviewCovers[randomIndex]}`;
};

export const buildFallbackImprovementPlan = (feedback?: Feedback | null): ImprovementPlanItem[] => {
  if (!feedback?.categoryScores?.length) return [];

  return [...feedback.categoryScores]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((category, index) => ({
      section: category.name,
      weakness: feedback.areasForImprovement?.[index] || category.comment,
      whyItMatters: category.comment,
      howToImprove: [
        `Practice one focused answer for ${category.name.toLowerCase()} out loud every day.`,
        "Review the core concepts behind the questions you missed or answered weakly.",
        "Record a short mock response and tighten the structure before your next interview."
      ],
      practiceTask: `Redo one mock response with extra focus on ${category.name.toLowerCase()}.`,
    }));
};

export const getWeakestFeedbackFocus = (feedback?: Feedback | null) => {
  if (!feedback) {
    return {
      section: "Next Focus",
      issue: "Complete an interview to unlock tailored coaching.",
    };
  }

  const weakPoint = feedback.weakPoints?.[0];

  if (weakPoint) return weakPoint;

  const fallbackPlan = buildFallbackImprovementPlan(feedback)[0];

  if (fallbackPlan) {
    return {
      section: fallbackPlan.section,
      issue: fallbackPlan.weakness,
    };
  }

  return {
    section: "Next Focus",
    issue: "Review the latest feedback and keep practicing.",
  };
};
