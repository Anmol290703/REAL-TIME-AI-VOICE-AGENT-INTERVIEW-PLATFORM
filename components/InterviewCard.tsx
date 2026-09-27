import React from 'react'
import dayjs from "dayjs"
import Image from "next/image";
import { getRandomInterviewCover, getWeakestFeedbackFocus } from "@/lib/utils";
import { Button } from "./ui/button";
import Link from "next/link";
import DisplayTechIcons from "./DisplayTechIcons";
import { getFeedbackByInterviewId } from "@/lib/actions/general.action";

const InterviewCard = async ({ id, userId, role, type, techstack, createdAt, coverImage }: InterviewCardProps) => {

  const feedback = userId && id ? await getFeedbackByInterviewId({ interviewId: id, userId}) : null; 
  const normalizedType = /mix/gi.test(type) ? "Mixed" : type;
  const formattedDate = dayjs(feedback?.createdAt || createdAt || Date.now()).format("MMM D, YYYY");
  const weakestFocus = getWeakestFeedbackFocus(feedback);

  return (
    <div className="card-border interview-card-shell">
        <div className="card-interview">
            <div>
                <div className="absolute top-0 right-0 w-fit px-4 py-2 rounded-bl-lg bg-light-600">
                    <p className="badge-text">{normalizedType}</p>
                </div>

                <Image 
                    src={coverImage || getRandomInterviewCover()} 
                    alt="cover" 
                    width={90} 
                    height={90} 
                    className="rounded-full object-cover size-[88px]"
                />
                <h3 className="mt-5 capitalize">
                    {role} Interview
                </h3>

                <div className="flex flex-row flex-wrap gap-x-5 gap-y-2 mt-3">
                    <div className="flex flex-row gap-2 items-center">
                        <Image src="/calendar.svg" alt="calendar" width={22} height={22} />
                        <p>{formattedDate}</p>
                    </div>
                    
                    <div className="flex flex-row gap-2 items-center">
                        <Image src="/star.svg" alt="star" width={22} height={22} />
                        <p>{feedback?.totalScore || "---"}/100</p>
                    </div>
                </div>

                <p className="line-clamp-2 mt-5">
                    {feedback?.finalAssessment || "You haven't taken this interview yet. Take it now to improve your skills."}
                </p>

                {feedback && (
                  <p className="mt-3 text-sm text-primary-200">
                    Weakest section: {weakestFocus.section}
                  </p>
                )}
            </div>

            <div className="flex flex-row items-end justify-between gap-4">
                <DisplayTechIcons techStack={techstack} />

                <Button asChild className="btn-primary shrink-0">
                    <Link href={feedback 
                        ? `/interview/${id}/feedback`
                        : `/interview/${id}`}>
                            {feedback ? "Check Feedback" : "View Interview"}
                    </Link>
                </Button>
            </div>
        </div>
    </div>
  )
}

export default InterviewCard
