import { generateObject } from "ai";
import { google } from "@ai-sdk/google"
import { getRandomInterviewCover } from "@/lib/utils";
import { z } from "zod";

const cleanQuestionText = (question: string) => (
  question.replace(/[/*]/g, "").replace(/\s+/g, " ").trim()
);

const stringifyUnknownError = (error: unknown) => {
  if (error instanceof Error) return error.message;

  if (error && typeof error === "object") {
    try {
      return JSON.stringify(error);
    } catch {
      return "Unknown error object.";
    }
  }

  return String(error || "Unknown error.");
};

const buildFallbackQuestions = ({
  role,
  level,
  techstack,
  type,
}: {
  role: string;
  level: string;
  techstack: string[];
  type: string;
}) => {
  const primaryTopic = techstack[0] || role;
  const secondaryTopic = techstack[1] || primaryTopic;
  const stackList = techstack.length ? techstack.join(", ") : role;
  const isMixedRound = /mixed|behaviour/i.test(type);

  const baseQuestions = [
    `Can you briefly introduce your experience with ${role}?`,
    `What core concepts should someone understand to work confidently with ${primaryTopic}?`,
    `How would you explain ${primaryTopic} to a beginner on your team?`,
    `What is a common problem you can solve with ${primaryTopic}?`,
    `How would you debug an issue involving ${secondaryTopic}?`,
    `What trade-offs would you consider when choosing ${stackList} for a project?`,
    `Tell me about a small project or example where you applied ${primaryTopic}.`,
    `How would you improve performance, quality, or reliability in work related to ${role}?`,
    isMixedRound
      ? `Describe a time you had to communicate a technical decision clearly to someone else.`
      : `What mistakes do beginners usually make with ${primaryTopic}, and how would you avoid them?`,
    isMixedRound
      ? `What would you improve first before your next ${level.toLowerCase()} interview for ${role}?`
      : `If I give you a new task in ${role}, how would you break it into clear steps?`,
  ];

  const uniqueQuestions = Array.from(
    new Set(baseQuestions.map(cleanQuestionText).filter(Boolean))
  );

  while (uniqueQuestions.length < 10) {
    uniqueQuestions.push(
      cleanQuestionText(`What additional practice area would you focus on to improve in ${role}?`)
    );
  }

  return uniqueQuestions.slice(0, 10);
};

export async function GET() {
    return Response.json({ success: true, data: "Thank You!" }, { status: 200 });
}

export async function POST(request: Request) {
    try {
        const { type, role, level, techstack, userid, guide } = await request.json();
        const interviewQuestionCount = 10;
        const safeRole = String(role || "").trim();
        const safeLevel = String(level || "Beginner").trim();
        const safeType = String(type || "Mixed").trim();
        const safeUserId = String(userid || "").trim();

        if (!safeRole || !safeUserId) {
          return Response.json(
            { success: false, error: "Missing interview topic or user. Please sign in and add a topic." },
            { status: 400 }
          );
        }

        const normalizedTechstack = String(techstack)
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);

        let questions: string[];

        try {
          const { object } = await generateObject({
              model: google('gemini-2.0-flash-001'),
              schema: z.object({
                questions: z.array(z.string()).length(interviewQuestionCount),
              }),
              prompt: `Prepare questions for a job interview.
                      The job role is ${safeRole}.
                      The job experience level is ${safeLevel}.
                      The tech stack used in the job is: ${normalizedTechstack.join(", ")}.
                      The focus between behavioural and technical questions should lean towards: ${safeType}.
                      Create exactly ${interviewQuestionCount} distinct interview questions.
                      The AI guide chosen for this interview is: ${guide || "Default guide"}.
                      Please return exactly ${interviewQuestionCount} questions as structured output.
                      The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
                      Thank you! <3`

          });

          questions = object.questions.map(cleanQuestionText);
        } catch (error) {
          console.warn(
            "Gemini question generation failed. Falling back to local interview questions:",
            stringifyUnknownError(error)
          );
          questions = buildFallbackQuestions({
            role: safeRole,
            level: safeLevel,
            techstack: normalizedTechstack,
            type: safeType,
          });
        }

        const interview = {
            role: safeRole,
            type: safeType,
            level: safeLevel,
            techstack: normalizedTechstack,
            guide: guide || "Default guide",
            questions,
            userId: safeUserId,
            finalized: true,
            source: "custom",
            coverImage: getRandomInterviewCover(),
            createdAt: new Date().toISOString(),
        }

        const { db } = await import("@/firebase/admin");
        const doc = await db.collection("interviews").add(interview);

        return Response.json({ success: true, interviewId: doc.id }, {status: 200})
    } catch(error){
        console.error("Error:", error);

        const message = error instanceof Error ? error.message : "Interview generation failed.";
        const userMessage = /quota|resource_exhausted|429/i.test(message)
          ? "Gemini API quota is exceeded right now. Please try again later or update your billing plan."
          : "Interview generation failed. Please try again in a moment.";

        return Response.json({ success: false, error: userMessage }, {status: 500});
    }
}
