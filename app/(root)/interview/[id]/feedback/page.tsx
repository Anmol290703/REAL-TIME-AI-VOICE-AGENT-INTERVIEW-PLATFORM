import { getCurrentUser } from "@/lib/actions/auth.action";
import { getFeedbackByInterviewId, getInterviewsById } from "@/lib/actions/general.action";
import { redirect } from "next/navigation";
import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import dayjs from "dayjs";
import DisplayTechIcons from "@/components/DisplayTechIcons";
import { buildFallbackImprovementPlan, getWeakestFeedbackFocus } from "@/lib/utils";

const page = async ({ params }: RouteParams) => {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) redirect("/sign-in");

  const interview = await getInterviewsById(id);

  if (!interview) redirect("/");

  const plannedQuestionCount = interview.questions?.length || 10;

  const feedback = await getFeedbackByInterviewId({
    interviewId: id,
    userId: user.id,
  });

  if (!feedback) {
    return (
      <section className="section-feedback">
        <div className="feedback-empty-state">
          <h1>No feedback yet for {interview.role}</h1>
          <p>
            Finish this {plannedQuestionCount}-question interview once and the platform will show
            section-wise marks, weak areas, and the improvement plan here.
          </p>

          <div className="buttons">
            <Button asChild className="btn-secondary flex-1">
              <Link href="/">Back to dashboard</Link>
            </Button>

            <Button asChild className="btn-primary flex-1">
              <Link href={`/interview/${id}`}>Start Interview</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const weakestFocus = getWeakestFeedbackFocus(feedback);
  const improvementPlan =
    feedback.improvementPlan?.length ? feedback.improvementPlan : buildFallbackImprovementPlan(feedback);
  const sortedScores = [...feedback.categoryScores].sort((a, b) => a.score - b.score);
  const strongestSection = [...feedback.categoryScores].sort((a, b) => b.score - a.score)[0];

  return (
    <section className="section-feedback">
      <div className="feedback-hero">
        <div className="feedback-hero-copy">
          <p className="workspace-eyebrow">Related Interview</p>
          <h1>Feedback for {interview.role}</h1>
          <p>{feedback.finalAssessment}</p>
          <p className="mt-4 text-light-100">
            This report is based on your {plannedQuestionCount}-question round and highlights
            the marks, weak sections, and what to improve next.
          </p>

          <div className="feedback-summary-row">
            <span className="feedback-pill">{feedback.totalScore}/100 overall</span>
            <span className="feedback-pill">{interview.type}</span>
            <span className="feedback-pill">{plannedQuestionCount} questions</span>
            <span className="feedback-pill">
              {dayjs(feedback.createdAt).format("MMM D, YYYY h:mm A")}
            </span>
          </div>
        </div>

        <div className="feedback-context-card">
          <p className="feedback-context-label">Interview context</p>
          <h3>{interview.role}</h3>
          <p className="feedback-context-meta">
            {interview.level} level
          </p>
          <DisplayTechIcons techStack={interview.techstack} />
        </div>
      </div>

      <div className="feedback-stat-grid">
        <div className="feedback-stat-card">
          <p className="feedback-stat-label">Overall Marks</p>
          <h2>{feedback.totalScore}/100</h2>
          <p>The latest score from this {plannedQuestionCount}-question interview.</p>
        </div>

        <div className="feedback-stat-card">
          <p className="feedback-stat-label">Strongest Section</p>
          <h2>{strongestSection?.name || "Not available"}</h2>
          <p>{strongestSection?.comment || "Keep building on the parts that already feel natural."}</p>
        </div>

        <div className="feedback-stat-card feedback-stat-card-alert">
          <p className="feedback-stat-label">Weakest Section</p>
          <h2>{weakestFocus.section}</h2>
          <p>{weakestFocus.issue}</p>
        </div>
      </div>

      <div className="workspace-section-copy">
        <h2>Section-wise Marks</h2>
        <p>Each section is scored out of 100 based on how you performed across the full interview.</p>
      </div>

      <div className="feedback-score-grid">
        {sortedScores.map((category) => (
          <div key={category.name} className="feedback-score-card">
            <div className="feedback-score-head">
              <p className="feedback-score-title">{category.name}</p>
              <span className="feedback-score-value">{category.score}/100</span>
            </div>

            <div className="feedback-score-track">
              <span
                className="feedback-score-fill"
                style={{ width: `${Math.max(category.score, 8)}%` }}
              />
            </div>

            <p>{category.comment}</p>
          </div>
        ))}
      </div>

      <div className="feedback-improvement-layout">
        <div className="feedback-improvement-column">
          <div className="workspace-section-copy">
            <h2>How to Improve</h2>
            <p>These steps are tied to the lowest-scoring sections from this interview.</p>
          </div>

          <div className="feedback-plan-list">
            {improvementPlan.map((item) => (
              <div key={`${item.section}-${item.practiceTask}`} className="feedback-plan-card">
                <div className="feedback-plan-head">
                  <div>
                    <p className="feedback-plan-section">{item.section}</p>
                    <h3>{item.weakness}</h3>
                  </div>
                  <span className="feedback-pill">{item.section}</span>
                </div>

                <p>{item.whyItMatters}</p>

                <ul className="feedback-bullet-list">
                  {item.howToImprove.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>

                <p className="feedback-practice-task">Practice task: {item.practiceTask}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="feedback-side-column">
          <div className="feedback-stack-card">
            <h3>Strengths</h3>
            <ul className="feedback-bullet-list">
              {feedback.strengths.map((strength) => (
                <li key={strength}>{strength}</li>
              ))}
            </ul>
          </div>

          <div className="feedback-stack-card">
            <h3>Weak Points</h3>
            <ul className="feedback-bullet-list">
              {(feedback.weakPoints?.length ? feedback.weakPoints : improvementPlan).map((item) => (
                <li key={"issue" in item ? `${item.section}-${item.issue}` : `${item.section}-${item.weakness}`}>
                  {"issue" in item
                    ? `${item.section}: ${item.issue}`
                    : `${item.section}: ${item.weakness}`}
                </li>
              ))}
            </ul>
          </div>

          <div className="feedback-stack-card">
            <h3>Areas for Improvement</h3>
            <ul className="feedback-bullet-list">
              {feedback.areasForImprovement.map((area) => (
                <li key={area}>{area}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="buttons">
        <Button asChild className="btn-secondary flex-1">
          <Link href="/">Back to dashboard</Link>
        </Button>

        <Button asChild className="btn-primary flex-1">
          <Link href={`/interview/${id}`}>Retake Interview</Link>
        </Button>
      </div>
    </section>
  );
};

export default page;
