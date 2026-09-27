"use server";

import { feedbackSchema } from "@/constants";
import { db } from "@/firebase/admin";
import { getWeakestFeedbackFocus } from "@/lib/utils";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";

const presetInterviews = [
  {
    presetSlug: "javascript-basics",
    role: "JavaScript Basics",
    type: "Technical",
    level: "Beginner",
    techstack: ["JavaScript", "HTML", "CSS"],
    questions: [
      "What are variables in JavaScript and how are let, const, and var different?",
      "Explain the difference between == and ===.",
      "What is a function and why do we use functions?",
      "What are arrays and objects in JavaScript?",
      "Can you explain event handling in a browser?",
      "What is scope in JavaScript?",
      "What is the DOM and how does JavaScript interact with it?",
      "What are promises and why are they used?",
      "What is the difference between null and undefined?",
      "How do you write and use a simple callback function?"
    ],
  },
  {
    presetSlug: "python-basics",
    role: "Python Basics",
    type: "Technical",
    level: "Beginner",
    techstack: ["Python"],
    questions: [
      "What are Python lists, tuples, and dictionaries?",
      "How do if else statements work in Python?",
      "What is a function in Python?",
      "Explain loops with a simple example.",
      "How would you handle errors in Python?",
      "What is the difference between a list and a set?",
      "How does Python indentation affect code execution?",
      "What is list comprehension?",
      "How do modules work in Python?",
      "What is the purpose of a virtual environment?"
    ],
  },
  {
    presetSlug: "java-basics",
    role: "Java Basics",
    type: "Technical",
    level: "Beginner",
    techstack: ["Java"],
    questions: [
      "What is a class and object in Java?",
      "Explain the difference between JDK, JRE, and JVM.",
      "What are primitive data types in Java?",
      "What is inheritance and why is it useful?",
      "How does exception handling work in Java?",
      "What is method overloading in Java?",
      "How is an interface different from an abstract class?",
      "What is encapsulation in Java?",
      "What is the purpose of the main method?",
      "How do collections like ArrayList differ from arrays?"
    ],
  },
  {
    presetSlug: "react-frontend",
    role: "React Frontend",
    type: "Mixed",
    level: "Intermediate",
    techstack: ["React", "TypeScript", "Tailwind CSS"],
    questions: [
      "What are React components and props?",
      "How does React state work?",
      "What is the difference between useEffect and useState?",
      "How would you make a responsive user interface?",
      "How do you debug a React component that is not rendering correctly?",
      "What is JSX and why is it useful in React?",
      "How do you pass data between parent and child components?",
      "What is the difference between controlled and uncontrolled inputs?",
      "Why do React lists need keys?",
      "How would you improve performance in a React application?"
    ],
  },
  {
    presetSlug: "mongodb-basics",
    role: "MongoDB Basics",
    type: "Technical",
    level: "Beginner",
    techstack: ["MongoDB", "Mongoose", "Node.js"],
    questions: [
      "What is MongoDB and how is it different from a relational database?",
      "What is a document and a collection in MongoDB?",
      "How do you insert, update, and delete documents in MongoDB?",
      "What is indexing in MongoDB and why is it important?",
      "How would you model user and order data in MongoDB?",
      "What is the difference between embedding and referencing in MongoDB?",
      "How do aggregation pipelines work in MongoDB?",
      "What is schema validation in MongoDB?",
      "How do you query nested documents or arrays?",
      "When would you use a compound index?"
    ],
  },
  {
    presetSlug: "cpp-basics",
    role: "C++ Basics",
    type: "Technical",
    level: "Beginner",
    techstack: ["C++", "Linux", "Git"],
    questions: [
      "What is the difference between C and C++?",
      "What are classes and objects in C++?",
      "Explain the difference between stack and heap memory.",
      "What are constructors and destructors in C++?",
      "What is the Standard Template Library and when would you use it?",
      "What is a reference in C++ and how is it different from a pointer?",
      "What is polymorphism in C++?",
      "How does function overloading work in C++?",
      "What is RAII and why is it useful?",
      "When would you use a vector instead of a raw array?"
    ],
  },
  {
    presetSlug: "mysql-basics",
    role: "MySQL Basics",
    type: "Technical",
    level: "Beginner",
    techstack: ["MySQL", "PostgreSQL"],
    questions: [
      "What is MySQL and where is it commonly used?",
      "What is the difference between a primary key and a foreign key?",
      "How do you write a query to filter and sort data?",
      "What is a join and why is it useful?",
      "How would you design tables for a simple e-commerce app?",
      "What is normalization and why do we use it?",
      "What is the difference between WHERE and HAVING?",
      "How do indexes improve query performance?",
      "What is the difference between INNER JOIN and LEFT JOIN?",
      "How would you prevent duplicate data in a table?"
    ],
  },
  {
    presetSlug: "node-backend",
    role: "Node Backend",
    type: "Technical",
    level: "Intermediate",
    techstack: ["Node.js", "Express", "MongoDB"],
    questions: [
      "What is Node.js and why is it useful for backend development?",
      "How do Express routes work?",
      "What is middleware?",
      "How would you design a simple REST API?",
      "How do you validate and store user data safely?",
      "What is the event loop in Node.js?",
      "How do you handle asynchronous operations in Node.js?",
      "What is the difference between authentication and authorization?",
      "How would you handle errors in an Express application?",
      "How do you secure API endpoints?"
    ],
  },
  {
    presetSlug: "dbms-fundamentals",
    role: "DBMS Fundamentals",
    type: "Technical",
    level: "Intermediate",
    techstack: ["MySQL", "PostgreSQL", "MongoDB"],
    questions: [
      "What is a DBMS and why do applications need one?",
      "Explain normalization and why it matters in database design.",
      "What is the difference between relational and non-relational databases?",
      "How do transactions help maintain data consistency?",
      "What are ACID properties and why are they important?",
      "What is the difference between a primary key and a candidate key?",
      "What are indexes and when do they help?",
      "What is the difference between DELETE, TRUNCATE, and DROP?",
      "How do one-to-one, one-to-many, and many-to-many relationships work?",
      "What is database locking and why is it used?"
    ],
  },
  {
    presetSlug: "operating-systems-basics",
    role: "Operating Systems Basics",
    type: "Technical",
    level: "Intermediate",
    techstack: ["Linux", "Bash", "C"],
    questions: [
      "What is the role of an operating system?",
      "What is the difference between a process and a thread?",
      "How does CPU scheduling work at a high level?",
      "What is deadlock and how can it be avoided?",
      "How does memory management work in an operating system?",
      "What is the difference between user mode and kernel mode?",
      "What is virtual memory?",
      "How does context switching work?",
      "What is paging and how is it different from segmentation?",
      "Why is synchronization needed between threads?"
    ],
  },
  {
    presetSlug: "number-basics",
    role: "Number Basics",
    type: "Aptitude",
    level: "Beginner",
    techstack: ["JavaScript", "Python"],
    questions: [
      "How do you check if a number is even or odd?",
      "How would you find the largest number in a list?",
      "Explain prime numbers with an example.",
      "How do you calculate factorial of a number?",
      "How would you solve a simple percentage problem in code?",
      "How do you reverse the digits of a number?",
      "How do you check whether a number is a palindrome?",
      "How do you find the sum of digits of a number?",
      "How would you calculate simple interest or discount in a basic problem?",
      "How do you count the number of digits in an integer?"
    ],
  },
] as const;

const sortByCreatedAtDesc = <T extends { createdAt?: string }>(items: T[]) => {
    return items.sort((a, b) => (
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    ));
}

const feedbackSections = [
  "Communication Skills",
  "Technical Knowledge",
  "Problem Solving",
  "Cultural Fit",
  "Confidence and Clarity",
] as const;

const clampScore = (value: number, min = 18, max = 96) => (
  Math.max(min, Math.min(max, Math.round(value)))
);

const tokenize = (value: string) => (
  value.toLowerCase().match(/[a-z0-9+#.]+/g) ?? []
);

const countPhraseHits = (text: string, phrases: string[]) => (
  phrases.reduce((count, phrase) => count + (text.includes(phrase) ? 1 : 0), 0)
);

const getCandidateAnswers = (transcript: { role: string; content: string }[]) => (
  transcript
    .filter((entry) => entry.role === "user")
    .map((entry) => entry.content.trim())
    .filter(Boolean)
);

const buildFallbackFeedback = (
  interviewData: Interview | null,
  transcript: { role: string; content: string }[]
) => {
  const plannedQuestionCount = interviewData?.questions?.length || 10;
  const candidateAnswers = getCandidateAnswers(transcript);
  const candidateText = candidateAnswers.join(" ").toLowerCase();
  const candidateWords = tokenize(candidateText);
  const totalWords = candidateWords.length;
  const averageWords = candidateAnswers.length ? totalWords / candidateAnswers.length : 0;
  const answeredRatio = Math.min(1, candidateAnswers.length / plannedQuestionCount);
  const roleKeywords = Array.from(
    new Set(
      [interviewData?.role || "", ...(interviewData?.techstack || [])]
        .flatMap((item) => tokenize(item))
        .filter((token) => token.length > 2)
    )
  );

  const technicalHits = roleKeywords.filter((keyword) => candidateText.includes(keyword)).length;
  const structureHits = countPhraseHits(candidateText, [
    "first",
    "second",
    "then",
    "because",
    "approach",
    "example",
    "step",
    "trade off",
    "tradeoff",
    "finally",
  ]);
  const collaborationHits = countPhraseHits(candidateText, [
    "team",
    "collaborate",
    "feedback",
    "user",
    "stakeholder",
    "ownership",
    "learn",
    "impact",
    "support",
  ]);
  const hesitationHits = countPhraseHits(candidateText, [
    "not sure",
    "maybe",
    "i think",
    "i guess",
    "um",
    "uh",
  ]);
  const confidenceHits = countPhraseHits(candidateText, [
    "clearly",
    "definitely",
    "specifically",
    "confident",
    "exactly",
  ]);

  const communicationScore = clampScore(
    28 + answeredRatio * 28 + Math.min(averageWords, 65) * 0.5 + structureHits * 4 - hesitationHits * 5
  );
  const technicalScore = clampScore(
    24 + answeredRatio * 24 + technicalHits * 7 + structureHits * 2 - hesitationHits * 3
  );
  const problemSolvingScore = clampScore(
    24 + answeredRatio * 22 + structureHits * 6 + countPhraseHits(candidateText, [
      "debug",
      "solution",
      "if",
      "check",
      "optimize",
      "edge case",
    ]) * 4
  );
  const culturalFitScore = clampScore(
    30 + answeredRatio * 18 + collaborationHits * 6 + countPhraseHits(candidateText, [
      "responsibility",
      "help",
      "improve",
      "learn",
      "share",
    ]) * 3
  );
  const confidenceScore = clampScore(
    24 + answeredRatio * 26 + Math.min(averageWords, 24) + confidenceHits * 4 - hesitationHits * 6
  );

  const categoryScores: CategoryScore[] = [
    {
      name: feedbackSections[0],
      score: communicationScore,
      comment:
        communicationScore >= 75
          ? "Your answers were clear and mostly well structured."
          : communicationScore >= 55
            ? "Your ideas came through, but the structure and delivery can be tighter."
            : "Your answers felt brief or loosely structured, so the message was harder to follow.",
    },
    {
      name: feedbackSections[1],
      score: technicalScore,
      comment:
        technicalScore >= 75
          ? "You showed a usable grasp of the main concepts from this interview."
          : technicalScore >= 55
            ? "You covered some core ideas, but a few explanations needed more depth or precision."
            : "The interview exposed gaps in the core concepts and examples for this topic.",
    },
    {
      name: feedbackSections[2],
      score: problemSolvingScore,
      comment:
        problemSolvingScore >= 75
          ? "You explained your thinking in a logical, step-by-step way."
          : problemSolvingScore >= 55
            ? "Your reasoning was visible, but some answers needed a clearer approach and trade-offs."
            : "Your approach was hard to trace, so the problem-solving steps need more structure.",
    },
    {
      name: feedbackSections[3],
      score: culturalFitScore,
      comment:
        culturalFitScore >= 75
          ? "You connected your answers to teamwork, learning, and impact well."
          : culturalFitScore >= 55
            ? "You showed some alignment with collaboration and ownership, but your examples can be stronger."
            : "Your answers did not show enough ownership, collaboration, or role-fit examples yet.",
    },
    {
      name: feedbackSections[4],
      score: confidenceScore,
      comment:
        confidenceScore >= 75
          ? "You sounded composed and direct in most of your responses."
          : confidenceScore >= 55
            ? "You had a decent base, but some hesitation reduced clarity and confidence."
            : "Hesitation and short answers made the round feel less confident than it could be.",
    },
  ];

  const sectionAdvice: Record<(typeof feedbackSections)[number], {
    issue: string;
    whyItMatters: string;
    steps: (topic: string) => string[];
    practice: (topic: string) => string;
  }> = {
    "Communication Skills": {
      issue: "Answers need clearer structure and a stronger opening-to-close flow.",
      whyItMatters: "Even correct ideas lose marks when the interviewer has to work to follow your answer.",
      steps: () => [
        "Answer with a simple structure: point, example, result.",
        "Keep each response focused on one main idea before adding detail.",
        "Record one answer daily and remove filler words or repeated phrases.",
      ],
      practice: () => "Redo two interview questions and answer each in under 90 seconds with a clear structure.",
    },
    "Technical Knowledge": {
      issue: "Core concepts need more accurate explanations and examples.",
      whyItMatters: "Technical interviews reward both correctness and the ability to explain fundamentals clearly.",
      steps: (topic) => [
        `Review the main concepts in ${topic} and write one clean explanation for each.`,
        "Practice giving one beginner-friendly explanation and one interview-level explanation.",
        "Turn weak answers from this round into short revision notes.",
      ],
      practice: (topic) => `Explain three core ${topic} concepts out loud without reading from notes.`,
    },
    "Problem Solving": {
      issue: "Your reasoning needs to be more step-by-step and explicit.",
      whyItMatters: "Interviewers score how you think through uncertainty, not just the final answer.",
      steps: () => [
        "Start each solution with assumptions, then outline the steps, then mention trade-offs.",
        "Say what you would check first, second, and third when debugging.",
        "Use concrete examples instead of abstract statements whenever possible.",
      ],
      practice: () => "Solve one practice scenario aloud and narrate your approach before giving the final answer.",
    },
    "Cultural Fit": {
      issue: "Your answers need stronger examples of teamwork, ownership, and learning.",
      whyItMatters: "Companies want proof that you can work well with people and grow in the role.",
      steps: () => [
        "Prepare short stories about teamwork, feedback, and handling responsibility.",
        "Mention the impact of your actions on users, teammates, or delivery.",
        "Show what you learned from mistakes or difficult situations.",
      ],
      practice: () => "Prepare two short stories that show collaboration and ownership, then rehearse them out loud.",
    },
    "Confidence and Clarity": {
      issue: "More direct delivery is needed so your answers sound assured and polished.",
      whyItMatters: "Clear confidence helps the interviewer trust your judgment and communication.",
      steps: () => [
        "Pause briefly before answering so you can start with a direct statement.",
        "Replace uncertain phrases with clearer language when you know the concept.",
        "Practice timed answers to build a steadier rhythm and finish with confidence.",
      ],
      practice: () => "Record three answers and repeat them until the delivery sounds calm, direct, and consistent.",
    },
  };

  const sortedCategories = [...categoryScores].sort((a, b) => a.score - b.score);
  const primaryTopic = interviewData?.techstack?.[0] || interviewData?.role || "this topic";
  const weakPoints = sortedCategories.slice(0, 3).map((category) => ({
    section: category.name,
    issue: sectionAdvice[category.name as (typeof feedbackSections)[number]].issue,
  }));
  const improvementPlan = sortedCategories.slice(0, 3).map((category) => {
    const section = category.name as (typeof feedbackSections)[number];
    const advice = sectionAdvice[section];

    return {
      section,
      weakness: `${section} scored ${category.score}/100 and needs stronger answers.`,
      whyItMatters: advice.whyItMatters,
      howToImprove: advice.steps(primaryTopic),
      practiceTask: advice.practice(primaryTopic),
    };
  });

  const strengths = [...categoryScores]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((category) => `${category.name}: ${category.comment}`);
  const areasForImprovement = weakPoints.map((item) => `${item.section}: ${item.issue}`);
  const totalScore = clampScore(
    categoryScores.reduce((sum, category) => sum + category.score, 0) / categoryScores.length
  );
  const strongestSection = [...categoryScores].sort((a, b) => b.score - a.score)[0];
  const weakestSection = sortedCategories[0];

  return {
    totalScore,
    categoryScores,
    strengths,
    areasForImprovement,
    weakPoints,
    improvementPlan,
    finalAssessment:
      candidateAnswers.length === 0
        ? `No usable spoken answers were captured in this ${plannedQuestionCount}-question round, so the marks are low by default. Complete the full interview to unlock a more accurate report.`
        : candidateAnswers.length < plannedQuestionCount
          ? `This paused round captured ${candidateAnswers.length} of ${plannedQuestionCount} planned answers. The report uses the answers available so far, with your strongest section in ${strongestSection?.name || "overall delivery"} and ${weakestSection?.name || "the weaker areas"} needing the most work.`
        : `This ${plannedQuestionCount}-question round shows your strongest section in ${strongestSection?.name || "overall delivery"}, while ${weakestSection?.name || "the weaker areas"} needs the most work before the next attempt.`,
  };
};

export async function getOrCreatePresetInterviews(userId: string): Promise<Interview[]> {
    if(!userId) return [];

    const existingSnapshot = await db
      .collection('interviews')
      .where('userId', '==', userId)
      .get();

    const presetBySlug = new Map<string, (typeof presetInterviews)[number]>(
      presetInterviews.map((preset) => [preset.presetSlug, preset])
    );

    const existingInterviews = existingSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as Interview[];

    const presetSyncTasks = existingSnapshot.docs.map(async (doc) => {
      const data = doc.data() as Interview & { presetSlug?: string };
      const preset = data.presetSlug ? presetBySlug.get(data.presetSlug) : null;

      if (!preset) return;

      const shouldUpdate =
        data.role !== preset.role ||
        data.type !== preset.type ||
        data.level !== preset.level ||
        JSON.stringify(data.techstack || []) !== JSON.stringify(preset.techstack) ||
        JSON.stringify(data.questions || []) !== JSON.stringify(preset.questions) ||
        data.finalized !== true ||
        data.source !== "preset";

      if (!shouldUpdate) return;

      await doc.ref.set(
        {
          presetSlug: preset.presetSlug,
          role: preset.role,
          type: preset.type,
          level: preset.level,
          techstack: [...preset.techstack],
          questions: [...preset.questions],
          finalized: true,
          source: "preset",
        },
        { merge: true }
      );
    });

    await Promise.all(presetSyncTasks);

    const existingPresetSlugs = new Set(
      existingSnapshot.docs.map((doc) => doc.data().presetSlug).filter(Boolean)
    );

    const missingPresets = presetInterviews.filter((preset) => !existingPresetSlugs.has(preset.presetSlug));

    const createdInterviews = await Promise.all(
      missingPresets.map(async (preset) => {
        const interview = {
          presetSlug: preset.presetSlug,
          role: preset.role,
          type: preset.type,
          level: preset.level,
          techstack: [...preset.techstack],
          questions: [...preset.questions],
          userId,
          finalized: true,
          source: "preset",
          createdAt: new Date().toISOString(),
        };

        const doc = await db.collection("interviews").add(interview);

        return {
          id: doc.id,
          ...interview,
        } as Interview;
      })
    );

    return sortByCreatedAtDesc([
      ...existingInterviews
        .filter((interview) => Boolean(interview.presetSlug))
        .map((interview) => {
          const preset = interview.presetSlug ? presetBySlug.get(interview.presetSlug) : null;

          if (!preset) return interview;

          return {
            ...interview,
            role: preset.role,
            type: preset.type,
            level: preset.level,
            techstack: [...preset.techstack],
            questions: [...preset.questions],
            finalized: true,
            source: "preset",
          } as Interview;
        }),
      ...createdInterviews,
    ]);
}

export async function getInterviewsByUserId(userId: string): Promise<Interview[] | null> {
    if(!userId) return [];

    const interviews = await db
      .collection('interviews')
      .where('userId', '==', userId)
      .get();

    const userInterviews = interviews.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as Interview[];

    return sortByCreatedAtDesc(userInterviews.filter((interview) => (
      !(interview as Interview & { source?: string }).source
    )));
}

export async function getLatestInterviews(params: GetLatestInterviewsParams): Promise<Interview[] | null> {

    const { userId, limit = 20 } = params;

    if(!userId) return [];

    const interviews = await db
      .collection('interviews')
      .where('finalized', '==', true)
      .get();

    const latestInterviews = interviews.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
    })) as Interview[];

    return sortByCreatedAtDesc(latestInterviews)
      .filter((interview) => interview.userId !== userId)
      .slice(0, limit);
}

export async function getInterviewsById(id: string): Promise<Interview | null> {
    const interview = await db.collection('interviews').doc(id).get();

    if(!interview.exists) return null;

    return {
      id: interview.id,
      ...interview.data(),
    } as Interview;
}

export async function createFeedback(params: CreateFeedbackParams) {
    const { interviewId, userId, transcript, feedbackId } = params;

    try{
        const interview = interviewId
          ? await db.collection("interviews").doc(interviewId).get()
          : null;
        const interviewData = interview?.exists ? interview.data() as Interview : null;

        const formattedTranscript = transcript.map((sentence: { role: string; content: string; }) => (
            `- ${sentence.role}: ${sentence.content}\n`
        )).join("");
        const candidateAnswers = getCandidateAnswers(transcript);
        const shouldUseLocalFeedback = candidateAnswers.length <= 1;

    let generatedFeedback;

    try {
      if (shouldUseLocalFeedback) {
        generatedFeedback = buildFallbackFeedback(interviewData, transcript);
      } else {
      const { object } = await generateObject({
        model: google("gemini-2.0-flash-001", {
          structuredOutputs: false,
        }),
        schema: feedbackSchema,
        prompt: `
          You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
          Interview Role: ${interviewData?.role || "General Interview"}
          Interview Level: ${interviewData?.level || "Not specified"}
          Tech Stack or Topic: ${interviewData?.techstack?.join(", ") || "Not specified"}
          Planned Questions:
          ${(interviewData?.questions || []).map((question) => `- ${question}`).join("\n")}
          Planned Question Count: ${(interviewData?.questions || []).length || 10}

          If this is a Number Basics or aptitude interview, pay extra attention to arithmetic clarity, prime numbers, loops, factorial logic, percentages, and step-by-step problem solving.

          Transcript:
          ${formattedTranscript}

          Score the candidate only on the basis of this planned interview and transcript. Treat the scores as marks out of 100 for this full round.
          Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
          - **Communication Skills**: Clarity, articulation, structured responses.
          - **Technical Knowledge**: Understanding of key concepts for the role.
          - **Problem-Solving**: Ability to analyze problems and propose solutions.
          - **Cultural Fit**: Alignment with company values and job role.
          - **Confidence and Clarity**: Confidence in responses, engagement, and clarity.

          Then provide:
          - section-wise marks based on the interview.
          - 2 to 3 weak points, each tied to one of the scored sections.
          - a focused improvement plan for the weakest sections.
          - concrete, direct advice that tells the candidate what to improve next.

          Keep the feedback practical. The improvement steps should be specific and easy to act on before the next interview.
          `,
        system:
          "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
      });

      generatedFeedback = object;
      }
    } catch (error) {
      console.error("Falling back to local feedback scoring:", error);
      generatedFeedback = buildFallbackFeedback(interviewData, transcript);
    }

    const feedback = {
      interviewId: interviewId,
      userId: userId,
      role: interviewData?.role || "General Interview",
      type: interviewData?.type || "Interview",
      techstack: interviewData?.techstack || [],
      totalScore: generatedFeedback.totalScore,
      categoryScores: generatedFeedback.categoryScores,
      strengths: generatedFeedback.strengths,
      areasForImprovement: generatedFeedback.areasForImprovement,
      weakPoints: generatedFeedback.weakPoints,
      improvementPlan: generatedFeedback.improvementPlan,
      finalAssessment: generatedFeedback.finalAssessment,
      createdAt: new Date().toISOString(),
    };

    let feedbackRef;

    if (feedbackId) {
      feedbackRef = db.collection("feedback").doc(feedbackId);
    } else {
      feedbackRef = db.collection("feedback").doc();
    }

    await feedbackRef.set(feedback);

    return { success: true, feedbackId: feedbackRef.id };
    } catch (error) {
        console.error("Error saving feedback:", error);
        return { success: false, message: "Feedback could not be generated right now." };
    }
}

export async function getFeedbackByInterviewId(params: GetFeedbackByInterviewIdParams): Promise<Feedback | null> {

    const { interviewId, userId } = params;

    const feedback = await db.collection('feedback').where('interviewId', '==', interviewId).where('userId', '==', userId).get();

    if(feedback.empty) return null;

    const [feedbackDoc] = sortByCreatedAtDesc(feedback.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })) as Feedback[]);

    return feedbackDoc;
}

export async function getFeedbackByUserId(userId: string): Promise<DashboardFeedbackItem[]> {
    if(!userId) return [];

    const feedbackSnapshot = await db
      .collection("feedback")
      .where("userId", "==", userId)
      .get();

    if(feedbackSnapshot.empty) return [];

    const feedbackDocs = sortByCreatedAtDesc(feedbackSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Feedback[]);

    const latestFeedbackByInterview = new Map<string, Feedback>();

    feedbackDocs.forEach((feedback) => {
      if(!latestFeedbackByInterview.has(feedback.interviewId)) {
        latestFeedbackByInterview.set(feedback.interviewId, feedback);
      }
    });

    const latestFeedback = Array.from(latestFeedbackByInterview.values());

    const interviewSnapshots = await Promise.all(
      latestFeedback.map((feedback) => db.collection("interviews").doc(feedback.interviewId).get())
    );

    const interviewMap = new Map(
      interviewSnapshots
        .filter((snapshot) => snapshot.exists)
        .map((snapshot) => [snapshot.id, {
          id: snapshot.id,
          ...snapshot.data(),
        } as Interview])
    );

    return sortByCreatedAtDesc(latestFeedback.map((feedback) => {
      const interview = interviewMap.get(feedback.interviewId);
      const weakPoint = getWeakestFeedbackFocus(feedback);

      return {
        ...feedback,
        role: feedback.role || interview?.role || "Interview Practice",
        type: feedback.type || interview?.type || "Interview",
        techstack: feedback.techstack || interview?.techstack || [],
        weakPoint: weakPoint.issue,
        focusSection: weakPoint.section,
      } as DashboardFeedbackItem;
    }));
}
