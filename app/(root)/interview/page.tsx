import React from 'react'
import Agent from "@/components/Agent"
import { getCurrentUser } from "@/lib/actions/auth.action"
import { redirect } from "next/navigation"

const page = async () => {

  const user = await getCurrentUser();

  if(!user) redirect("/sign-in");

  return (
    <section className="interview-page-shell">
        <div className="interview-page-head">
          <div className="interview-page-copy">
            <p className="workspace-eyebrow">Voice Generator</p>
            <h3>Create a new interview session</h3>
            <p className="mt-2 text-light-100">
              Start the guided voice flow to generate a custom interview from your topic, level, and stack.
            </p>
          </div>

          <p className="interview-page-badge">Custom</p>
        </div>

        <Agent 
          userName={user.name} 
          userId={user.id} 
          type="generate" 
        />
    </section>
  )
}

export default page
