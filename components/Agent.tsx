'use client'

import Image from "next/image"
import React, { useEffect, useRef, useState } from 'react'
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { vapi } from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";
import { toast } from "sonner";

enum CallStatus {
    INACTIVE = 'INACTIVE',
    CONNECTING = 'CONNECTING',
    ACTIVE = 'ACTIVE',
    ENDING = 'ENDING',
    FINISHED = 'FINISHED'
}

interface SavedMessage {
    role: 'user' | 'system' | 'assistant';
    content: string;
}

const normalizeErrorMessage = (message: unknown) => {
  if(typeof message === "string") return message;
  if(message && typeof message === "object") {
    try {
      return JSON.stringify(message);
    } catch {
      return "Unknown Vapi error.";
    }
  }

  return "";
}

const isIgnorableVapiError = (error: unknown) => {
  const message = getVapiErrorMessage(error).toLowerCase();

  return (
    message.includes("meeting has ended") ||
    message.includes("meeting ended due to ejection") ||
    message.includes("call has ended") ||
    message.includes("meeting ended") ||
    message.includes("call ended") ||
    message.includes("ejection")
  );
}

const getVapiErrorMessage = (error: unknown) => {
  const rawMessage = error instanceof Error ? error.message : normalizeErrorMessage(error);
  const lowerRawMessage = rawMessage.toLowerCase();

  if(
    lowerRawMessage.includes("wallet balance") ||
    lowerRawMessage.includes("purchase more credits") ||
    lowerRawMessage.includes("upgrade your plan")
  ) {
    return "Vapi billing is blocking this call. Add credits or upgrade the Vapi account connected to NEXT_PUBLIC_VAPI_WEB_TOKEN, then try again.";
  }

  if(error instanceof Error) return error.message;

  if(error && typeof error === "object") {
    const event = error as {
      error?: { message?: unknown; statusCode?: number; error?: unknown } | unknown;
      message?: unknown;
      type?: string;
      stage?: string;
    };

    const innerError = event.error && typeof event.error === "object"
      ? event.error as { message?: unknown; statusCode?: number; error?: unknown }
      : undefined;
    const message = innerError?.message || event.message || innerError?.error || event.error;
    const statusCode = innerError?.statusCode;
    const prefix = statusCode ? `${statusCode}: ` : "";
    const normalizedMessage = normalizeErrorMessage(message);
    const lowerMessage = normalizedMessage.toLowerCase();

    if(
      lowerMessage.includes("wallet balance") ||
      lowerMessage.includes("purchase more credits") ||
      lowerMessage.includes("upgrade your plan")
    ) {
      return "Vapi billing is blocking this call. Add credits or upgrade the Vapi account connected to NEXT_PUBLIC_VAPI_WEB_TOKEN, then try again.";
    }

    if(normalizedMessage) return `${prefix}${normalizedMessage}`;
    if(event.type || event.stage) return `Vapi ${event.type || "error"} at ${event.stage || "unknown stage"}.`;
  }

  return "Voice call could not start. Please check Vapi keys and microphone permission.";
}

const Agent = ({ userName, userId, type, interviewId, feedbackId, questions }: AgentProps) => {

  const router = useRouter();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const isIntentionalEndingRef = useRef(false);
  const isGeneratingFeedbackRef = useRef(false);
  const hasShownStartErrorRef = useRef(false);

  useEffect(() => {
    const onCallStart = () => {
      isIntentionalEndingRef.current = false;
      isGeneratingFeedbackRef.current = false;
      hasShownStartErrorRef.current = false;
      setCallStatus(CallStatus.ACTIVE);
    };

    const onCallEnd = () => {
      setCallStatus(CallStatus.FINISHED);
      isIntentionalEndingRef.current = false;
    };

    const onMessage = (message: Message) => {
        if(message.type === 'transcript' && message.transcriptType === 'final'){
            const newMessage = { role: message.role, content: message.transcript };

            setMessages((prev) => [...prev, newMessage]);
        }
    }

    const onSpeechStart = () => setIsSpeaking(true);
    const onSpeechEnd = () => setIsSpeaking(false);

    const onCallStartFailed = (error: unknown) => {
      if(isIntentionalEndingRef.current || isIgnorableVapiError(error)) {
        setCallStatus(CallStatus.INACTIVE);
        isIntentionalEndingRef.current = false;
        return;
      }

      const message = getVapiErrorMessage(error);
      console.log('Vapi call start failed', error);
      hasShownStartErrorRef.current = true;
      toast.error(message);
      setCallStatus(CallStatus.INACTIVE);
    };

    const onError = (error: unknown) => {
      if(isIntentionalEndingRef.current && isIgnorableVapiError(error)) {
        return;
      }

      if(isIgnorableVapiError(error)) {
        setCallStatus(CallStatus.FINISHED);
        return;
      }

      const message = getVapiErrorMessage(error);
      console.log('Vapi error', error);
      hasShownStartErrorRef.current = true;
      toast.error(message);
      setCallStatus(CallStatus.INACTIVE);
    };

    vapi.on('call-start', onCallStart);
    vapi.on('call-end', onCallEnd);
    vapi.on('call-start-failed', onCallStartFailed);
    vapi.on('message', onMessage);
    vapi.on('speech-start', onSpeechStart);
    vapi.on('speech-end', onSpeechEnd);
    vapi.on('error', onError);

    return () => {
        vapi.off('call-start', onCallStart);
        vapi.off('call-end', onCallEnd);
        vapi.off('call-start-failed', onCallStartFailed);
        vapi.off('message', onMessage);
        vapi.off('speech-start', onSpeechStart);
        vapi.off('speech-end', onSpeechEnd);
        vapi.off('error', onError);
    }
  }, [])  

  useEffect(() => {

    const handleGenerateFeedback = async (messages: SavedMessage[]) => {
      if(isGeneratingFeedbackRef.current) return;
      isGeneratingFeedbackRef.current = true;

      const result = await createFeedback({
          interviewId: interviewId!,
          userId: userId!,
          transcript: messages
      });

      if(result.success && result.feedbackId){
          router.push(`/interview/${interviewId}/feedback`);
      } else {
          toast.error(result.message || "Feedback could not be generated.");
          isGeneratingFeedbackRef.current = false;
          router.push("/");
      }
    }

    if(callStatus === CallStatus.FINISHED){
        if(type === "generate"){
            router.push("/");
        } else{
            handleGenerateFeedback(messages);
        }
    }

  }, [messages, callStatus, feedbackId, interviewId, router, type, userId])

  const ensureMicrophonePermission = async () => {
    if(!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Your browser does not support microphone recording.");
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
  }

  const startWithTimeout = async (startCall: Promise<unknown>) => {
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Voice call timed out. Please try Chrome and allow microphone access.")), 15000);
    });

    const call = await Promise.race([startCall, timeout]);

    if(!call) {
      throw new Error("Vapi did not create a call. Check that your Vapi public key and workflow/assistant are valid.");
    }
  }

  const handleCall = async () => {
    if(callStatus === CallStatus.CONNECTING) return;

    try {
      hasShownStartErrorRef.current = false;
      setCallStatus(CallStatus.CONNECTING);

      if(!process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN) {
        throw new Error("Missing NEXT_PUBLIC_VAPI_WEB_TOKEN.");
      }

      await ensureMicrophonePermission();

      if (type === "generate") {
        const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
        const workflowId = process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID;

        if(assistantId) {
          await startWithTimeout(vapi.start(assistantId, {
            variableValues: {
              username: userName,
              userid: userId,
            },
          }));

          return;
        }

        if(!workflowId) {
          throw new Error("Missing NEXT_PUBLIC_VAPI_ASSISTANT_ID or NEXT_PUBLIC_VAPI_WORKFLOW_ID.");
        }

        await startWithTimeout(vapi.start(
          undefined,
          undefined,
          undefined,
          workflowId,
          {
            variableValues: {
              username: userName,
              userid: userId,
            },
          }
        ));
      } else {
        let formattedQuestions = "";
        if (questions) {
          formattedQuestions = questions
            .map((question) => `- ${question}`)
            .join("\n");
        }

        await startWithTimeout(vapi.start(interviewer, {
          variableValues: {
            questions: formattedQuestions,
          },
        }));
      }
    } catch(error) {
      console.log("Call start failed", error);
      setCallStatus(CallStatus.INACTIVE);
      if(!hasShownStartErrorRef.current) {
        toast.error(getVapiErrorMessage(error));
      }
    }
  };

  const handleDisconnect = async () => {
    isIntentionalEndingRef.current = true;
    setCallStatus(CallStatus.ENDING);

    try {
      vapi.send({
        type: 'end-call',
      });
    } catch (error) {
      if(!isIgnorableVapiError(error)) {
        toast.error(getVapiErrorMessage(error));
      }

      setCallStatus(CallStatus.FINISHED);
      isIntentionalEndingRef.current = false;
    }
  }

  const latestMessage = messages[messages.length - 1]?.content;
  const isCallInactiveOrFinished = callStatus === CallStatus.INACTIVE || callStatus === CallStatus.FINISHED;
  const isCallEnding = callStatus === CallStatus.ENDING;

  return (
    <section className="interview-studio">
        <div className="interview-studio-head">
            <div>
                <p className="workspace-eyebrow">Live Voice Round</p>
                <h3 className="mt-3">Speak naturally. The transcript updates in real time.</h3>
            </div>

            <div className="studio-status-pill">
                {callStatus === CallStatus.ACTIVE
                  ? "Listening"
                  : isCallEnding
                    ? "Ending"
                    : callStatus === CallStatus.CONNECTING
                      ? "Connecting"
                      : "Ready"}
            </div>
        </div>

        <div className="call-view">
            <div className={cn("card-interviewer", isSpeaking && "studio-card-speaking")}>
                <div className="avatar">
                    <Image 
                        src="/ai-avatar.png" 
                        alt="vapi" 
                        width={65} 
                        height={54} 
                        className="object-cover" 
                    />
                    {isSpeaking && <span className="animate-speak"/>}
                </div>
                <h3>AI Interviewer</h3>
                <p className="studio-card-copy">
                  Focuses on your answers, follow-ups, and voice confidence during the round.
                </p>
            </div>

            <div className="card-border studio-user-shell">
                <div className="card-content studio-user-card">
                    <Image 
                        src="/user-avatar.png" 
                        alt="user avatar" 
                        width={540} 
                        height={540} 
                        className="rounded-full object-cover size-[120px] "
                    />
                    <h3>{userName}</h3>
                    <p className="studio-card-copy">
                      Keep answers structured, concise, and technical where needed.
                    </p>
                </div>
            </div>
        </div>

        {messages.length > 0 && (
            <div className="transcript-border">
                <div className="transcript">
                    <p key={latestMessage} className={cn("transition-opacity duration-500 opacity-0", "animate-fadeIn opacity-100")}>
                        {latestMessage}
                    </p>
                </div>
            </div>
        )}

        <div className="w-full flex justify-center">
            {callStatus !== "ACTIVE" && callStatus !== "ENDING" ? (
                <button className="relative btn-call" onClick={handleCall} disabled={callStatus === CallStatus.CONNECTING}>
                    <span className={cn('absolute animate-ping rounded-full opacity-75', callStatus !== "CONNECTING" && "hidden")}/>
                    
                    <span>
                        {isCallInactiveOrFinished ? "Call" : "Connecting..."}
                    </span>
                </button>
            ) : isCallEnding ? (
                <button className="btn-disconnect" disabled>
                    Ending...
                </button>
            ) : (
                <button className="btn-disconnect" onClick={handleDisconnect}>
                    End
                </button>
            )}
        </div>
    </section>
    
  )
}

export default Agent
