import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";
import InterviewCard from "@/components/InterviewCard";
import DashboardLaunchpad from "@/components/DashboardLaunchpad";
import { getCurrentUser } from "@/lib/actions/auth.action";
import {
  getFeedbackByUserId,
  getInterviewsByUserId,
  getLatestInterviews,
  getOrCreatePresetInterviews,
} from "@/lib/actions/general.action";
import { redirect } from "next/navigation";
import dayjs from "dayjs";

const page = async () => {
  const user = await getCurrentUser();

  if (!user) redirect("/sign-in");

  const [userInterviews, presetInterviews, latestInterviews, feedbackItems] =
    await Promise.all([
      getInterviewsByUserId(user.id),
      getOrCreatePresetInterviews(user.id),
      getLatestInterviews({ userId: user.id }),
      getFeedbackByUserId(user.id),
    ]);

  const ownedInterviews = userInterviews ?? [];
  const practiceTracks = presetInterviews ?? [];
  const communityInterviews = latestInterviews ?? [];

  const recentInterviews = [...ownedInterviews, ...practiceTracks]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 5);

  const recentFeedback = feedbackItems.slice(0, 5);
  const feedbackByInterviewId = new Map(
    feedbackItems.map((feedback) => [feedback.interviewId, feedback])
  );

  const suggestedTopic =
    recentFeedback[0]?.focusSection ||
    recentFeedback[0]?.role ||
    practiceTracks[0]?.role ||
    "Communication Skills";

  const hasPresetInterviews = practiceTracks.length > 0;
  const hasUpcomingInterviews = communityInterviews.length > 0;
  const summaryCards = [
    {
      label: "Practice Tracks",
      value: practiceTracks.length,
      note: "Ready-made interview sets",
    },
    {
      label: "Feedback Reports",
      value: feedbackItems.length,
      note: "Completed interview reviews",
    },
    {
      label: "Community Sets",
      value: communityInterviews.length,
      note: "Shared mock interviews",
    },
  ];

  return (
    <>
      <section className="workspace-shell">
        <div className="workspace-top-grid">
          <div className="workspace-hero-panel">
            <p className="workspace-eyebrow">My Workspace</p>

            <div className="workspace-header">
              <div className="workspace-copy">
                <h1>Welcome Back, {user.name}</h1>
                <p className="workspace-subcopy">
                  Launch a voice interview, review the weakest sections, and keep your next round targeted.
                </p>
              </div>

              <Button asChild className="btn-secondary workspace-header-cta">
                <Link href="/interview">Open Voice Generator</Link>
              </Button>
            </div>

            <DashboardLaunchpad userId={user.id} suggestedTopic={suggestedTopic} />
          </div>

          <aside className="workspace-summary-panel">
            <div className="workspace-focus-card">
              <p className="workspace-focus-label">Next Focus</p>
              <h3>{recentFeedback[0]?.focusSection || "Start your next round"}</h3>
              <p>
                {recentFeedback[0]?.weakPoint ||
                  "Complete one interview to unlock a tailored improvement plan here."}
              </p>
            </div>

            <div className="workspace-summary-grid">
              {summaryCards.map((item) => (
                <div key={item.label} className="workspace-summary-card">
                  <p className="workspace-summary-label">{item.label}</p>
                  <h2>{item.value}</h2>
                  <p>{item.note}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="workspace-columns">
        <div className="workspace-column workspace-surface">
          <div className="workspace-section-copy">
            <h2>Your Previous Interviews</h2>
            <p>Jump back into recent sessions or open the related feedback from the same flow.</p>
          </div>

          <div className="workspace-list">
            {recentInterviews.length > 0 ? (
              recentInterviews.map((interview) => {
                const feedback = feedbackByInterviewId.get(interview.id);

                return (
                  <Link
                    key={interview.id}
                    href={feedback ? `/interview/${interview.id}/feedback` : `/interview/${interview.id}`}
                    className="workspace-entry"
                  >
                    <div className="workspace-entry-avatar">
                      {interview.role.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="workspace-entry-copy">
                      <p className="workspace-entry-title">{interview.role}</p>
                      <p className="workspace-entry-meta">
                        {interview.type} interview
                      </p>
                      <p className="workspace-entry-time">
                        {dayjs(interview.createdAt).format("MMM D, YYYY")}
                      </p>
                    </div>

                    <div className="workspace-entry-side">
                      <span className="workspace-entry-stack">
                        {interview.techstack.slice(0, 2).join(" • ")}
                      </span>
                      <span className="workspace-entry-score">
                        {feedback ? `${feedback.totalScore}/100` : "Start"}
                      </span>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="workspace-empty">
                <p>No interview history yet.</p>
                <span>Create a round from the cards above and the history will start filling in here.</span>
              </div>
            )}
          </div>
        </div>

        <div className="workspace-column workspace-surface" id="feedback-hub">
          <div className="workspace-section-copy">
            <h2>Feedback Hub</h2>
            <p>Each entry points to the related interview and the section that needs the most work next.</p>
          </div>

          <div className="workspace-list">
            {recentFeedback.length > 0 ? (
              recentFeedback.map((feedback) => (
                <Link
                  key={feedback.id}
                  href={`/interview/${feedback.interviewId}/feedback`}
                  className="workspace-entry workspace-entry-feedback"
                >
                  <div className="workspace-entry-avatar workspace-entry-avatar-feedback">
                    {feedback.focusSection.slice(0, 1)}
                  </div>

                  <div className="workspace-entry-copy">
                    <p className="workspace-entry-title">{feedback.role}</p>
                    <p className="workspace-entry-meta">
                      Weak point: {feedback.focusSection}
                    </p>
                    <p className="workspace-entry-time">{feedback.weakPoint}</p>
                  </div>

                  <div className="workspace-entry-side">
                    <span className="workspace-entry-stack">
                      {dayjs(feedback.createdAt).format("MMM D, YYYY")}
                    </span>
                    <span className="workspace-entry-score workspace-entry-score-good">
                      {feedback.totalScore}/100
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="workspace-empty">
                <p>No feedback yet.</p>
                <span>Complete one interview and the weakest sections plus next-step coaching will show here.</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="workspace-surface workspace-track-section mt-12">
        <div>
          <h2>Practice Tracks</h2>
          <p className="mt-2">
            Ready-made panels for languages, databases, systems, and frontend practice.
          </p>
        </div>

        <div className="interviews-section">
          {hasPresetInterviews ? (
            practiceTracks.map((interview) => (
              <InterviewCard {...interview} key={interview.id} />
            ))
          ) : (
            <p>No practice tracks are available yet.</p>
          )}
        </div>
      </section>

      <section className="workspace-surface workspace-track-section mt-12">
        <div>
          <h2>Community Interviews</h2>
          <p className="mt-2">
            Explore interview sets created by other users and compare your performance.
          </p>
        </div>

        <div className="interviews-section">
          {hasUpcomingInterviews ? (
            communityInterviews.map((interview) => (
              <InterviewCard {...interview} key={interview.id} />
            ))
          ) : (
            <p>There are no new community interviews available right now.</p>
          )}
        </div>
      </section>
    </>
  );
};

export default page;
