interface CategoryScore {
  name: string;
  score: number;
  comment: string;
}

interface FeedbackWeakPoint {
  section: string;
  issue: string;
}

interface ImprovementPlanItem {
  section: string;
  weakness: string;
  whyItMatters: string;
  howToImprove: string[];
  practiceTask: string;
}

interface Feedback {
  id: string;
  interviewId: string;
  userId?: string;
  role?: string;
  type?: string;
  techstack?: string[];
  totalScore: number;
  categoryScores: CategoryScore[];
  strengths: string[];
  areasForImprovement: string[];
  weakPoints?: FeedbackWeakPoint[];
  improvementPlan?: ImprovementPlanItem[];
  finalAssessment: string;
  createdAt: string;
}

interface Interview {
  id: string;
  role: string;
  level: string;
  questions: string[];
  techstack: string[];
  createdAt: string;
  userId: string;
  type: string;
  finalized: boolean;
  source?: string;
  presetSlug?: string;
  coverImage?: string;
  guide?: string;
}

interface CreateFeedbackParams {
  interviewId: string;
  userId: string;
  transcript: { role: string; content: string }[];
  feedbackId?: string;
}

interface User {
  name: string;
  email: string;
  id: string;
}

interface InterviewCardProps {
  id?: string;
  userId?: string;
  role: string;
  type: string;
  techstack: string[];
  createdAt?: string;
  coverImage?: string;
}

interface AgentProps {
  userName: string;
  userId?: string;
  interviewId?: string;
  feedbackId?: string;
  type: "generate" | "interview";
  questions?: string[];
}

interface RouteParams {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}

interface GetFeedbackByInterviewIdParams {
  interviewId: string;
  userId: string;
}

interface GetLatestInterviewsParams {
  userId: string;
  limit?: number;
}

interface DashboardFeedbackItem extends Feedback {
  role: string;
  type: string;
  techstack: string[];
  weakPoint: string;
  focusSection: string;
}

interface SignInParams {
  email: string;
  idToken: string;
}

interface SignUpParams {
  uid: string;
  name: string;
  email: string;
  password: string;
}

type FormType = "sign-in" | "sign-up";

interface InterviewFormProps {
  interviewId: string;
  role: string;
  level: string;
  type: string;
  techstack: string[];
  amount: number;
}

interface TechIconProps {
  techStack: string[];
}
