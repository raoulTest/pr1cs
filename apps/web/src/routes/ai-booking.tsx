import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { 
  Bot, 
  Truck, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Container,
  Activity,
  Zap,
  MoreHorizontal,
  Copy,
  RefreshCw
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { 
  Message, 
  MessageContent,
  MessageActions,
  MessageAction
} from "@/components/ai-elements/message";
import { 
  Plan, 
  PlanHeader, 
  PlanTitle, 
  PlanContent, 
  PlanTrigger 
} from "@/components/ai-elements/plan";
import { 
  Artifact, 
  ArtifactHeader, 
  ArtifactTitle, 
  ArtifactContent,
  ArtifactActions,
  ArtifactAction
} from "@/components/ai-elements/artifact";
import { 
  PromptInput, 
  PromptInputTextarea, 
  PromptInputSubmit,
  PromptInputTools,
  PromptInputButton
} from "@/components/ai-elements/prompt-input";
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion";

export const Route = createFileRoute("/ai-booking")({
  component: AIBookingShowcase,
});

function AIBookingShowcase() {
  const [step, setStep] = useState(0);

  // Mock Data & State
  const containerId = "CNTU-4829103";
  const terminal = "Terminal B (Port of Antwerp)";
  
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-amber-500/30">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded bg-amber-500 flex items-center justify-center text-zinc-950 font-bold">
              <Truck size={18} />
            </div>
            <span className="font-bold text-lg tracking-tight">LogiMind <span className="text-zinc-600 font-normal">// Ops Center</span></span>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-zinc-400">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              System Online
            </div>
            <div className="w-px h-4 bg-zinc-800" />
            <span>Fri Feb 06, 14:30 UTC</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-4rem)]">
        
        {/* Left Column: Conversation Stream */}
        <div className="lg:col-span-7 flex flex-col gap-6 h-full overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-4 space-y-8 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            
            {/* Initial Context */}
            <div className="flex justify-center my-8">
              <Badge variant="outline" className="bg-zinc-900/50 text-zinc-500 border-zinc-800 py-1.5 px-4 font-mono text-xs uppercase tracking-wider">
                Session Started ID: #9928-A
              </Badge>
            </div>

            {/* User Request */}
            <Message from="user">
              <MessageContent>
                I need to book a pickup slot for container {containerId} at {terminal} for next Tuesday morning.
              </MessageContent>
            </Message>

            {/* AI Response 1: Analysis */}
            <div className="space-y-4">
              <Message from="assistant">
                <div className="flex items-center gap-3 mb-2">
                  <div className="size-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                    <Bot size={14} />
                  </div>
                  <span className="text-xs font-medium text-zinc-400">LogiMind AI</span>
                </div>
                
                {/* The Plan Component */}
                <Plan className="mb-4 border-zinc-800 bg-zinc-900/30">
                  <PlanHeader>
                    <PlanTitle>Analyzing Request</PlanTitle>
                    <PlanTrigger />
                  </PlanHeader>
                  <PlanContent>
                    <ul className="space-y-3 py-2">
                      <li className="flex items-center gap-3 text-sm text-zinc-300">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        <span>Validated container ID <strong>{containerId}</strong></span>
                      </li>
                      <li className="flex items-center gap-3 text-sm text-zinc-300">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        <span>Checked Terminal B operating hours</span>
                      </li>
                      <li className="flex items-center gap-3 text-sm text-zinc-300">
                        <Activity size={16} className="text-amber-500 animate-pulse" />
                        <span>Analyzing traffic predictions for Tuesday...</span>
                      </li>
                      <li className="flex items-center gap-3 text-sm text-zinc-500">
                        <MoreHorizontal size={16} />
                        <span>Cross-referencing carrier availability</span>
                      </li>
                    </ul>
                  </PlanContent>
                </Plan>

                <MessageContent>
                  I've checked the availability at Terminal B for next Tuesday (Feb 10th). Morning slots are running tight due to high congestion, but I found 3 optimal windows.
                </MessageContent>
                <MessageActions>
                  <MessageAction label="Copy details">
                    <Copy size={14} />
                  </MessageAction>
                  <MessageAction label="Regenerate options">
                    <RefreshCw size={14} />
                  </MessageAction>
                </MessageActions>
              </Message>

              {/* Suggestions / Options */}
              <div className="pl-9 grid gap-3 sm:grid-cols-3">
                 <button onClick={() => setStep(1)} className={`text-left p-3 rounded-lg border transition-all hover:bg-zinc-800 ${step >= 1 ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-800 bg-zinc-900'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="bg-zinc-950 border-zinc-700 text-zinc-400">08:00 - 09:00</Badge>
                      {step >= 1 && <CheckCircle2 size={14} className="text-emerald-500" />}
                    </div>
                    <div className="text-sm font-medium">Early Bird</div>
                    <div className="text-xs text-zinc-500 mt-1">Low congestion</div>
                 </button>
                 <button className="text-left p-3 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-all opacity-60">
                    <div className="mb-2"><Badge variant="outline" className="bg-zinc-950 border-zinc-700 text-zinc-400">10:30 - 11:30</Badge></div>
                    <div className="text-sm font-medium">Mid-Morning</div>
                    <div className="text-xs text-zinc-500 mt-1">Moderate traffic</div>
                 </button>
                 <button className="text-left p-3 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-all opacity-60">
                    <div className="mb-2"><Badge variant="outline" className="bg-zinc-950 border-zinc-700 text-zinc-400">11:45 - 12:45</Badge></div>
                    <div className="text-sm font-medium">Pre-Lunch</div>
                    <div className="text-xs text-zinc-500 mt-1">High demand</div>
                 </button>
              </div>
            </div>

            {/* Step 1: Confirmation */}
            {step >= 1 && (
              <>
                <Message from="user">
                  <MessageContent>Let's go with the 08:00 slot.</MessageContent>
                </Message>

                <Message from="assistant">
                  <MessageContent>
                    Slot reserved. I've generated your digital gate pass. Please ensure the driver has this code upon entry.
                  </MessageContent>
                  
                  {/* Artifact: The Ticket */}
                  <Artifact className="mt-4 border-zinc-800 bg-zinc-900/50 w-full max-w-md">
                    <ArtifactHeader>
                      <div className="flex items-center gap-2">
                        <Zap size={16} className="text-amber-500 fill-amber-500/20" />
                        <ArtifactTitle>Booking Confirmation</ArtifactTitle>
                      </div>
                      <ArtifactActions>
                         <ArtifactAction label="Download PDF" />
                         <ArtifactAction label="Share" />
                      </ArtifactActions>
                    </ArtifactHeader>
                    <ArtifactContent className="p-0">
                      <div className="p-6 space-y-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Booking Ref</div>
                            <div className="text-2xl font-mono text-emerald-400 tracking-tight">BK-9281-X</div>
                          </div>
                          <div className="bg-white p-1 rounded">
                             {/* Mock QR */}
                             <div className="size-12 bg-zinc-900 pattern-grid-lg opacity-80" />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 py-4 border-y border-zinc-800/50">
                           <div>
                              <div className="text-xs text-zinc-500 mb-1">Container</div>
                              <div className="font-mono text-sm">{containerId}</div>
                           </div>
                           <div>
                              <div className="text-xs text-zinc-500 mb-1">Terminal</div>
                              <div className="font-mono text-sm">Term-B / Gate 4</div>
                           </div>
                           <div>
                              <div className="text-xs text-zinc-500 mb-1">Date</div>
                              <div className="font-mono text-sm">Tue, Feb 10</div>
                           </div>
                           <div>
                              <div className="text-xs text-zinc-500 mb-1">Time Window</div>
                              <div className="font-mono text-sm text-amber-500">08:00 - 09:00</div>
                           </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-zinc-400 bg-zinc-950/50 p-3 rounded border border-zinc-800/50">
                          <Clock size={14} />
                          <span>Driver must arrive 15 min prior to slot.</span>
                        </div>
                      </div>
                    </ArtifactContent>
                  </Artifact>
                </Message>
              </>
            )}

            {step >= 1 && <div className="h-24" />} {/* Spacing for scroll */}

          </div>

          {/* Input Area */}
          <div className="mt-auto pt-4 border-t border-zinc-800/50 space-y-4">
             {/* Quick Actions / Suggestions */}
            <Suggestions>
              <Suggestion suggestion="Reschedule to afternoon" />
              <Suggestion suggestion="Check Terminal A" />
              <Suggestion suggestion="Show traffic map" />
              <Suggestion suggestion="Cancel request" className="text-red-400 hover:text-red-300 hover:bg-red-950/30 border-red-900/50" />
            </Suggestions>

            <PromptInput onSubmit={() => {}} className="bg-zinc-900/50 border-zinc-800 rounded-xl focus-within:ring-1 focus-within:ring-zinc-700 transition-all">
              <PromptInputTextarea placeholder="Ask LogiMind to reschedule, cancel, or find new slots..." className="text-zinc-200 placeholder:text-zinc-600 min-h-[50px] max-h-[200px]" />
              <div className="flex justify-between items-center p-2">
                 <PromptInputTools>
                    <PromptInputButton className="text-zinc-500 hover:text-zinc-300">
                      <MoreHorizontal size={16} />
                    </PromptInputButton>
                 </PromptInputTools>
                 <PromptInputSubmit className="bg-amber-600 hover:bg-amber-500 text-white rounded-lg" />
              </div>
            </PromptInput>
            <div className="text-center text-[10px] text-zinc-600 mt-2 font-mono">
               LogiMind v2.4 (Beta) &bull; Latency: 12ms &bull; Encryption: AES-256
            </div>
          </div>
        </div>

        {/* Right Column: Live Data / Visuals */}
        <div className="hidden lg:block lg:col-span-5 space-y-6">
           {/* Map / Visualization Placeholder */}
           <Card className="bg-zinc-900/40 border-zinc-800 overflow-hidden h-80 relative group">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-zinc-950/0 to-zinc-950/0" />
              
              <div className="absolute top-4 left-4 z-10">
                 <Badge className="bg-zinc-950/80 backdrop-blur border-zinc-700 text-zinc-300 gap-2 hover:bg-zinc-900">
                    <MapPin size={12} className="text-amber-500" /> Live Terminal Map
                 </Badge>
              </div>

              {/* Abstract Map UI */}
              <div className="w-full h-full flex items-center justify-center relative opacity-80">
                 <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 gap-1 p-4">
                    {Array.from({length: 24}).map((_, i) => (
                       <div key={i} className={`rounded-sm border border-zinc-800/50 transition-all duration-1000 ${[3,7,12,18].includes(i) ? 'bg-amber-900/20 border-amber-800/50' : 'bg-zinc-900/20'}`}>
                          {[3,7].includes(i) && <div className="w-full h-full animate-pulse bg-amber-500/10" />}
                       </div>
                    ))}
                 </div>
                 {/* Pin */}
                 <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="size-4 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-bounce" />
                    <div className="mt-2 bg-zinc-950/90 text-[10px] px-2 py-1 rounded border border-zinc-800 font-mono text-zinc-300">
                       Term-B
                    </div>
                 </div>
              </div>
           </Card>

           {/* Stats / Capacity */}
           <div className="grid grid-cols-2 gap-4">
              <Card className="bg-zinc-900/30 border-zinc-800 p-4">
                 <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Gate Traffic</div>
                 <div className="text-2xl font-mono text-zinc-200">Moderate</div>
                 <div className="mt-2 h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[45%]" />
                 </div>
              </Card>
              <Card className="bg-zinc-900/30 border-zinc-800 p-4">
                 <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Slot Availability</div>
                 <div className="text-2xl font-mono text-zinc-200">12 / 40</div>
                 <div className="mt-2 h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 w-[30%]" />
                 </div>
              </Card>
           </div>

           {/* Context Info */}
           <Card className="bg-zinc-900/20 border-zinc-800/50 p-5">
              <h3 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
                 <Container size={14} /> Active Container Context
              </h3>
              <div className="space-y-4">
                 <div className="flex justify-between items-center text-sm border-b border-zinc-800/50 pb-2">
                    <span className="text-zinc-500">ID</span>
                    <span className="font-mono text-zinc-300">{containerId}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm border-b border-zinc-800/50 pb-2">
                    <span className="text-zinc-500">Type</span>
                    <span className="font-mono text-zinc-300">40ft HC / Reefer</span>
                 </div>
                 <div className="flex justify-between items-center text-sm border-b border-zinc-800/50 pb-2">
                    <span className="text-zinc-500">Origin</span>
                    <span className="font-mono text-zinc-300">Shanghai, CN</span>
                 </div>
                 <div className="flex justify-between items-center text-sm border-b border-zinc-800/50 pb-2">
                    <span className="text-zinc-500">Status</span>
                    <Badge variant="outline" className="border-emerald-900 bg-emerald-950 text-emerald-400 text-[10px]">Customs Cleared</Badge>
                 </div>
              </div>
           </Card>

        </div>

      </main>
    </div>
  );
}
