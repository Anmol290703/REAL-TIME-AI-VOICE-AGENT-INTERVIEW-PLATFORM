"use client";

import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import {
  ArrowRight,
  BookOpen,
  Languages,
  Loader2,
  MessageSquare,
  Mic,
  Sparkles,
  Target,
  X,
} from "lucide-react";

type LauncherMode = "topic" | "qa" | "mock" | "language" | "weakness";
type GuideId = "joanna" | "sallie" | "matthew";
const QUESTION_COUNT = 10;

interface DashboardLaunchpadProps {
  userId: string;
  suggestedTopic?: string;
}

const guides = [
  {
    id: "joanna" as const,
    name: "Joanna",
    focus: "Concept teacher",
    summary: "Breaks subjects into clear building blocks before the interview starts.",
    typeBias: "Technical",
    accent: "bg-[linear-gradient(135deg,#ffbfa3_0%,#ff8d7c_100%)]",
  },
  {
    id: "sallie" as const,
    name: "Sallie",
    focus: "Communication coach",
    summary: "Pushes for sharper stories, clearer structure, and better confidence.",
    typeBias: "Behavioural",
    accent: "bg-[linear-gradient(135deg,#ffe19d_0%,#ffb457_100%)]",
  },
  {
    id: "matthew" as const,
    name: "Matthew",
    focus: "Problem solver",
    summary: "Leans into reasoning, follow-up questions, and deeper technical pressure.",
    typeBias: "Mixed",
    accent: "bg-[linear-gradient(135deg,#ae9cff_0%,#615fff_100%)]",
  },
] as const;

const levels = ["Beginner", "Intermediate", "Advanced"] as const;

const launchpadItems = [
  {
    id: "topic" as const,
    title: "Topic Based Prep",
    description: "Turn any topic into a focused 10-question voice round with practical questions.",
    icon: BookOpen,
    accent: "bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_100%)]",
    placeholder: "Enter a topic like React hooks, DBMS normalization, or OS scheduling",
    defaultLevel: "Beginner" as const,
  },
  {
    id: "qa" as const,
    title: "Ques-Ans Prep",
    description: "Build a rapid-fire 10-question set to tighten answers before the real interview.",
    icon: MessageSquare,
    accent: "bg-[linear-gradient(135deg,#f4f5ff_0%,#ffffff_100%)]",
    placeholder: "Enter a topic or role for short answer practice",
    defaultLevel: "Intermediate" as const,
  },
  {
    id: "mock" as const,
    title: "Mockup Interview",
    description: "Create a full 10-question interview simulation with balanced voice prompts.",
    icon: Mic,
    accent: "bg-[linear-gradient(135deg,#eefcf7_0%,#ffffff_100%)]",
    placeholder: "Enter the target role or stack for the mock interview",
    defaultLevel: "Intermediate" as const,
  },
  {
    id: "language" as const,
    title: "Learn Language",
    description: "Practice 10-question language interview rounds for Java, Python, React, and more.",
    icon: Languages,
    accent: "bg-[linear-gradient(135deg,#f4fbff_0%,#ffffff_100%)]",
    placeholder: "Enter a language or stack like Java, Python, MongoDB, or C++",
    defaultLevel: "Beginner" as const,
  },
  {
    id: "weakness" as const,
    title: "Weak Point Fix",
    description: "Turn your latest weak area into a 10-question retry plan with sharper prompts.",
    icon: Target,
    accent: "bg-[linear-gradient(135deg,#fff5f5_0%,#ffffff_100%)]",
    placeholder: "Enter the weak section or topic you want to repair",
    defaultLevel: "Intermediate" as const,
  },
] as const;

const getRoleFromMode = (mode: LauncherMode, topic: string) => {
  const cleanTopic = topic.trim();

  switch (mode) {
    case "topic":
      return `${cleanTopic} Deep Dive`;
    case "qa":
      return `${cleanTopic} Ques-Ans Prep`;
    case "mock":
      return `${cleanTopic} Mock Interview`;
    case "language":
      return `${cleanTopic} Language Interview`;
    case "weakness":
      return `${cleanTopic} Recovery Interview`;
    default:
      return cleanTopic;
  }
};

const getTypeFromMode = (mode: LauncherMode, guideId: GuideId) => {
  const guide = guides.find((item) => item.id === guideId);

  if (mode === "mock") return "Mixed";
  if (mode === "language") return "Technical";
  if (mode === "weakness") return "Technical";

  return guide?.typeBias || "Mixed";
};

const getQuestionAmount = () => QUESTION_COUNT;

const buildTechstack = (mode: LauncherMode, topic: string) => {
  const parts = topic
    .split(/[,+]/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (!parts.length) return topic;

  const extras =
    mode === "mock"
      ? ["Communication"]
      : mode === "qa"
        ? ["Interview Practice"]
        : mode === "weakness"
          ? ["Focused Revision"]
          : [];

  return Array.from(new Set([...parts, ...extras])).join(", ");
};

const DashboardLaunchpad = ({ userId, suggestedTopic }: DashboardLaunchpadProps) => {
  const router = useRouter();
  const [activeMode, setActiveMode] = useState<LauncherMode | null>(null);
  const [selectedGuide, setSelectedGuide] = useState<GuideId>("matthew");
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState<(typeof levels)[number]>("Intermediate");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  const activeItem = useMemo(
    () => launchpadItems.find((item) => item.id === activeMode),
    [activeMode]
  );

  useEffect(() => {
    if (!activeMode) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveMode(null);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => window.removeEventListener("keydown", handleEscape);
  }, [activeMode]);

  const openMode = (mode: LauncherMode) => {
    const selectedItem = launchpadItems.find((item) => item.id === mode);

    setActiveMode(mode);
    setLevel(selectedItem?.defaultLevel || "Intermediate");
    setSelectedGuide(mode === "topic" ? "joanna" : mode === "qa" ? "sallie" : "matthew");
    setTopic(mode === "weakness" && suggestedTopic ? suggestedTopic : "");
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setActiveMode(null);
  };

  const handleGenerateInterview = async () => {
    if (!activeMode || !topic.trim()) {
      toast.error("Add a topic before creating the interview.");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        userid: userId,
        guide: guides.find((item) => item.id === selectedGuide)?.name,
        role: getRoleFromMode(activeMode, topic),
        type: getTypeFromMode(activeMode, selectedGuide),
        level,
        amount: getQuestionAmount(),
        techstack: buildTechstack(activeMode, topic),
      };

      const response = await fetch("/api/vapi/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      let data: { success?: boolean; interviewId?: string; error?: string } = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = {
          success: false,
          error: response.ok
            ? "Interview generation returned an invalid response."
            : responseText || "Interview generation failed. Please try again in a moment.",
        };
      }

      if (!response.ok || !data?.success || !data?.interviewId) {
        throw new Error(data?.error || "Could not create the interview.");
      }

      toast.success(`Your ${QUESTION_COUNT}-question interview is ready.`);

      startTransition(() => {
        router.push(`/interview/${data.interviewId}`);
        router.refresh();
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong while creating the interview.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="workspace-launchpad">
        {launchpadItems.map(({ id, title, description, icon: Icon, accent }) => (
          <button
            key={id}
            type="button"
            className="workspace-tool"
            onClick={() => openMode(id)}
          >
            <span className={cn("workspace-tool-icon", accent)}>
              <Icon className="size-7" />
            </span>
            <span className="workspace-tool-title">{title}</span>
            <span className="workspace-tool-copy">{description}</span>
          </button>
        ))}
      </div>

      {activeItem && (
        <div
          className="workspace-modal-backdrop"
          onClick={closeModal}
          role="presentation"
        >
          <div
            className="workspace-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="launchpad-title"
          >
            <div className="workspace-modal-head">
              <div>
                <div className="workspace-modal-kicker">
                  <Sparkles className="size-4" />
                  Dynamic Interview Builder
                </div>
                <h3 id="launchpad-title" className="workspace-modal-title">
                  {activeItem.title}
                </h3>
                <p className="workspace-modal-copy">
                  {activeItem.description} You will get section-wise marks and improvement feedback after the round.
                </p>
              </div>

              <button
                type="button"
                className="workspace-close"
                onClick={closeModal}
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="workspace-form-stack">
              <label className="workspace-field">
                <span className="workspace-field-label">Topic or role</span>
                <textarea
                  className="workspace-textarea"
                  placeholder={activeItem.placeholder}
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  rows={4}
                />
              </label>

              {activeMode === "weakness" && suggestedTopic && (
                <p className="workspace-suggestion">
                  Latest feedback suggests focusing on <strong>{suggestedTopic}</strong>.
                </p>
              )}

              <div className="workspace-field">
                <span className="workspace-field-label">Interview level</span>
                <div className="workspace-segmented">
                  {levels.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={cn("workspace-segment", level === item && "workspace-segment-active")}
                      onClick={() => setLevel(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="workspace-field">
                <span className="workspace-field-label">Select an AI guide</span>
                <div className="workspace-guides">
                  {guides.map((guide) => (
                    <button
                      key={guide.id}
                      type="button"
                      className={cn(
                        "workspace-guide",
                        selectedGuide === guide.id && "workspace-guide-active"
                      )}
                      onClick={() => setSelectedGuide(guide.id)}
                    >
                      <span className={cn("workspace-guide-avatar", guide.accent)}>
                        {guide.name.slice(0, 1)}
                      </span>

                      <span className="workspace-guide-name">{guide.name}</span>
                      <span className="workspace-guide-focus">{guide.focus}</span>
                      <span className="workspace-guide-summary">{guide.summary}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="workspace-modal-actions">
              <Button
                type="button"
                className="btn-secondary"
                onClick={closeModal}
                disabled={isSubmitting}
              >
                Cancel
              </Button>

              <Button
                type="button"
                className="btn-primary"
                onClick={handleGenerateInterview}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creating
                  </>
                ) : (
                  <>
                    Create {QUESTION_COUNT}-Question Interview
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardLaunchpad;
