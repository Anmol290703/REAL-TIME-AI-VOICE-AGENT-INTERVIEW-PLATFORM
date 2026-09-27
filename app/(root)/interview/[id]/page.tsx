import React from 'react'
import { getInterviewsById } from "@/lib/actions/general.action";
import { redirect } from "next/navigation";
import Image from "next/image";
import { getRandomInterviewCover } from "@/lib/utils";
import DisplayTechIcons from "@/components/DisplayTechIcons";
import Agent from "@/components/Agent";
import { getCurrentUser } from "@/lib/actions/auth.action";

const page = async ({params}: RouteParams) => {

  const { id } = await params;
  const user = await getCurrentUser();
  const interview = await getInterviewsById(id);
  const plannedQuestionCount = interview?.questions?.length || 10;

  if(!interview) redirect("/");

  return (
    <section className="interview-page-shell">
        <div className="interview-page-head">
            <div className="interview-page-copy">
                <p className="workspace-eyebrow">Interview Session</p>

                <div className="flex flex-row gap-4 items-center max-sm:flex-col max-sm:items-start">
                    <Image 
                        src={interview.coverImage || getRandomInterviewCover()} 
                        alt="cover-image" 
                        width={40} 
                        height={40} 
                        className="rounded-full object-cover size-[40px]"
                    />
                    <div>
                      <h3 className="capitalize">{interview.role} Interview</h3>
                      <p className="mt-2 text-light-100">
                        Answer naturally across {plannedQuestionCount} planned questions. Your transcript and section-wise feedback will be linked to this exact interview.
                      </p>
                    </div>
                </div>

                <DisplayTechIcons techStack={interview.techstack}  />
            </div>

            <p className="interview-page-badge">{interview.type} • {plannedQuestionCount} Questions</p>
        </div>

        <Agent 
            userName={user?.name || ""} 
            userId={user?.id} 
            interviewId={id}
            type="interview"
            questions={interview.questions}
        />
    </section>
  )
}

export default page
