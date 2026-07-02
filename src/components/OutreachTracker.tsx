/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Briefcase, 
  Send, 
  CheckCircle2, 
  ChevronRight, 
  Sparkles, 
  Loader2, 
  Copy, 
  Check, 
  MessageSquareCode, 
  Database,
  ArrowRight,
  User,
  ShieldCheck,
  Award,
  X
} from "lucide-react";
import { Campaign, PartnerLead } from "../types.js";
import { ContactLogManager } from "./ContactLogManager.js";

interface OutreachTrackerProps {
  campaigns: Campaign[];
  onUpdateOutreachStatus: (campaignId: string, leadId: string, status: string) => Promise<void>;
  onRefreshCampaigns: () => Promise<void>;
}

const OUTREACH_STAGES = [
  { id: "not_contacted", label: "Cataloged Leads", bg: "bg-[#FAF6F0] border-[#EBE4D8] text-neutral-800" },
  { id: "contact_made", label: "Contact Initiated", bg: "bg-amber-50/55 border-amber-200 text-amber-900" },
  { id: "pitch_sent", label: "Strategic Pitch Sent", bg: "bg-[#FCF5EB] border-[#EBE4D8]/80 text-[#EF6C00]" },
  { id: "meeting_scheduled", label: "Briefing Booked", bg: "bg-purple-50/55 border-purple-200 text-purple-900" },
  { id: "partnered", label: "Partnership Secured", bg: "bg-emerald-50/70 border-emerald-200 text-emerald-900" }
];

export function OutreachTracker({ campaigns, onUpdateOutreachStatus, onRefreshCampaigns }: OutreachTrackerProps) {
  const [selectedPipelineLead, setSelectedPipelineLead] = useState<any | null>(null);
  const [generatedPitch, setGeneratedPitch] = useState<string>("");
  const [isCompilingPitch, setIsCompilingPitch] = useState(false);
  const [pitchCopied, setPitchCopied] = useState(false);

  // Native HTML5 Drag and Drop State Bindings
  const [draggedLead, setDraggedLead] = useState<any | null>(null);
  const [activeStageHover, setActiveStageHover] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, lead: any) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", lead.id);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setActiveStageHover(stageId);
  };

  const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    setActiveStageHover(null);
    if (!draggedLead) return;
    if (draggedLead.outreachStatus === targetStageId) return;

    await handleMoveStage(draggedLead, targetStageId);
    setDraggedLead(null);
  };

  // Compile all leads
  const compiledLeadsWithCamp = campaigns.flatMap(camp => {
    return (camp.leads || []).map(lead => ({
      ...lead,
      campaignId: camp.id,
      campaignName: camp.name,
      countryName: camp.country,
      outreachStatus: (lead as any).outreachStatus || "not_contacted"
    }));
  });

  // Handle stage change click
  const handleMoveStage = async (lead: any, newStage: string) => {
    try {
      await onUpdateOutreachStatus(lead.campaignId, lead.id, newStage);
      // Refresh local selected lead copy state
      if (selectedPipelineLead && selectedPipelineLead.id === lead.id) {
        setSelectedPipelineLead({
          ...selectedPipelineLead,
          outreachStatus: newStage
        });
      }
    } catch (err) {
      console.error("Failed to move outreach stage", err);
    }
  };

  // Compile pitch from endpoint
  const handleCompileAIPitch = async (lead: any) => {
    setIsCompilingPitch(true);
    setGeneratedPitch("");
    setPitchCopied(false);
    try {
      const res = await fetch(`/api/campaigns/${lead.campaignId}/leads/${lead.id}/pitch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedPitch(data.pitch || "");
      } else {
        setGeneratedPitch("Could not compile pitch template from backend.");
      }
    } catch (err) {
      console.error(err);
      setGeneratedPitch("Transient error compiling outreach brief.");
    } finally {
      setIsCompilingPitch(false);
    }
  };

  const handleCopyPitch = () => {
    if (!generatedPitch) return;
    navigator.clipboard.writeText(generatedPitch);
    setPitchCopied(true);
    setTimeout(() => setPitchCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" id="outreach-tracker-workspace">
      
      {/* Description header */}
      <div className="bg-[#FAF6F0] border border-[#EBE4D8] rounded-xl p-5 mb-4">
        <h3 className="font-serif text-lg font-bold text-[#1A1A1B] flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-[#EF6C00]" />
          Partner Outreach Pipeline
        </h3>
        <p className="text-xs text-[#514F4A] mt-1 font-light leading-relaxed">
          Manage corporate alliance interactions, track contact milestones, and draft hyper-specific business propositions. Target rival agencies with calculated ROI margins.
        </p>
      </div>

      {/* Kanban Layout columns Board */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 overflow-x-auto pb-4 items-start select-none" id="kanban-pipeline-columns">
        {OUTREACH_STAGES.map((stage) => {
          const stageLeads = compiledLeadsWithCamp.filter(l => l.outreachStatus === stage.id);
          const isOverThisStage = activeStageHover === stage.id;
          
          return (
            <div 
              key={stage.id} 
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragEnter={(e) => handleDragEnter(e, stage.id)}
              onDrop={(e) => handleDrop(e, stage.id)}
              className={`border rounded-xl p-3 min-w-[220px] shrink-0 transition-all duration-300 ${
                isOverThisStage 
                  ? "bg-[#EF6C00]/10 border-[#EF6C00] shadow-md scale-[1.02]" 
                  : "bg-[#FAF6F0]/40 border-[#EBE4D8]"
              }`}
            >
              
              {/* Header column bar */}
              <div className={`p-2.5 rounded-lg border font-serif text-xs font-bold ${stage.bg} flex justify-between items-center mb-3 shadow-2xs`}>
                <span>{stage.label}</span>
                <span className="font-mono bg-white/70 px-1.5 py-0.2 rounded text-[10px]">
                  {stageLeads.length}
                </span>
              </div>

              {/* Cards pool */}
              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-0.5 animate-fade-in">
                {stageLeads.length === 0 ? (
                  <div className="text-[10px] text-neutral-400 font-light border border-dashed border-[#EBE4D8]/80 text-center py-8 rounded-lg">
                    Drag leads here
                  </div>
                ) : (
                  stageLeads.map((lead) => {
                    const isSelected = selectedPipelineLead?.id === lead.id;
                    const compsLength = lead.trackRecord?.competitors?.length || 0;
                    const isBeingDragged = draggedLead?.id === lead.id;
                    
                    return (
                      <div
                        key={lead.id}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, lead)}
                        onDragEnd={() => {
                          setDraggedLead(null);
                          setActiveStageHover(null);
                        }}
                        onClick={() => {
                          setSelectedPipelineLead(lead);
                          setGeneratedPitch("");
                          setPitchCopied(false);
                        }}
                        className={`p-3 bg-white border rounded-lg cursor-grab active:cursor-grabbing transition-all duration-200 text-left ${
                          isBeingDragged 
                            ? "opacity-30 border-dashed border-[#EF6C00] scale-95 shadow-inner" 
                            : isSelected 
                              ? "border-[#EF6C00] shadow-sm ring-1 ring-[#EF6C00]/10 scale-[1.01]" 
                              : "border-[#EBE4D8] hover:border-[#C0B7A6] hover:shadow-xs"
                        }`}
                      >
                        <div className="text-[9px] uppercase tracking-wider font-mono text-[#827F78] mb-1 font-semibold flex justify-between">
                          <span>{lead.countryName}</span>
                          {compsLength === 0 && (
                            <span className="text-emerald-700 font-bold font-sans">Rival-Free</span>
                          )}
                        </div>

                        <h4 className="font-serif text-xs font-bold text-[#1A1A1B] truncate">
                          {lead.name}
                        </h4>

                        <div className="text-[10px] text-[#514F4A] truncate font-light mt-0.5">
                          {lead.hqLocation}
                        </div>

                        {/* Financials details mini tags */}
                        <div className="mt-2 text-xs font-mono flex justify-between">
                          <span className="text-slate-400 text-[10px]">{lead.financials?.revenue.split(" ")[0]}</span>
                          <span className="text-[#EF6C00] font-bold text-[10px]">{lead.financials?.gpm}</span>
                        </div>

                        {/* Quick controls inside cards */}
                        <div className="mt-2.5 pt-2 border-t border-dashed border-[#EBE4D8] flex items-center justify-between gap-1.5 flex-wrap">
                          <div className="flex items-center gap-1">
                            <span className="text-[8px] font-mono uppercase text-[#827F78]">Move:</span>
                            <select
                              value={lead.outreachStatus}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleMoveStage(lead, e.target.value)}
                              className="bg-white border border-[#EBE4D8] text-[9px] text-[#514F4A] rounded p-0.5 focus:outline-none focus:border-[#EF6C00] font-sans font-semibold text-slate-700 cursor-pointer animate-fade-in"
                            >
                              {OUTREACH_STAGES.map(s => (
                                <option key={s.id} value={s.id}>
                                  {s.label.replace("OrangeHRM ", "").replace("!", "")}
                                </option>
                              ))}
                            </select>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPipelineLead(lead);
                              handleCompileAIPitch(lead);
                            }}
                            title="Generate custom pitch"
                            className="bg-[#EF6C00]/10 hover:bg-[#EF6C00] text-[#EF6C00] hover:text-white transition-all text-[8.5px] font-bold px-1 py-0.5 rounded font-sans flex items-center gap-0.5 cursor-pointer"
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>Draft</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Sliding Right-side Drawer for Lead Details & Draft */}
      {selectedPipelineLead && (
        <>
          {/* Backdrop overlay */}
          <div 
            onClick={() => setSelectedPipelineLead(null)}
            className="fixed inset-0 bg-[#1A1A1B]/40 backdrop-blur-[2px] z-40 transition-opacity animate-in fade-in duration-200 cursor-pointer"
          />

          {/* Drawer container */}
          <div 
            id="bdr-slide-drawer"
            className="fixed inset-y-0 right-0 w-full md:w-[600px] lg:w-[680px] bg-[#FAF6F0] border-l border-[#EBE4D8] shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300"
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-[#EBE4D8] bg-white flex justify-between items-center shadow-2xs">
              <div>
                <span className="bg-[#EF6C00]/10 text-[#EF6C00] text-[10px] uppercase font-mono tracking-wider font-extrabold px-2 py-0.5 rounded">
                  {selectedPipelineLead.countryName} Workspace
                </span>
                <h4 className="font-serif text-lg font-bold text-[#1A1A1B] mt-1.5 leading-tight">
                  {selectedPipelineLead.name}
                </h4>
                <p className="text-[11px] text-[#514F4A] mt-0.5 font-light italic">
                  {selectedPipelineLead.hqLocation} • Size: {selectedPipelineLead.employeeSize}
                </p>
              </div>
              <button
                onClick={() => setSelectedPipelineLead(null)}
                className="p-2 border border-[#EBE4D8] hover:border-red-300 text-[#514F4A] hover:text-red-700 bg-white hover:bg-red-50/30 rounded-xl flex items-center gap-1 cursor-pointer font-bold text-xs transition-all"
                id="close-drawer-btn"
              >
                <X className="w-3.5 h-3.5" />
                <span>Close</span>
              </button>
            </div>

            {/* Drawer Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Draft card box with status embedded! */}
              <div className="bg-[#FCF5EB]/80 border border-[#EBE4D8] rounded-2xl p-5 space-y-4 relative shadow-sm">
                
                {/* Header title inside the card */}
                <div className="flex justify-between items-center border-b border-[#EBE4D8]/80 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#EF6C00]" />
                    <span className="font-serif text-sm font-bold text-[#1A1A1B]">Client Recruiter (Open-Core Pitch)</span>
                  </div>

                  {generatedPitch && (
                    <button
                      onClick={handleCopyPitch}
                      className="text-[10px] uppercase font-mono font-bold bg-white hover:bg-[#FAF6F0] border border-[#EBE4D8] text-[#514F4A] hover:text-[#EF6C00] px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {pitchCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Draft</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Direct BDR Stage selector inside the Draft edit card */}
                <div className="bg-white border border-[#EBE4D8] rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="space-y-0.5">
                    <div className="text-[9px] font-mono uppercase tracking-wider text-[#827F78] font-bold">Interactions Outreach Status:</div>
                    <div className="text-xs font-semibold text-[#1A1A1B]">
                      Active Stage: <span className="text-[#EF6C00]">{OUTREACH_STAGES.find(s => s.id === selectedPipelineLead.outreachStatus)?.label.replace("OrangeHRM ", "").replace("!", "")}</span>
                    </div>
                  </div>

                  <select
                    value={selectedPipelineLead.outreachStatus}
                    onChange={(e) => handleMoveStage(selectedPipelineLead, e.target.value)}
                    className="bg-white border border-[#EBE4D8] text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#EF6C00] text-slate-800 cursor-pointer shadow-3xs"
                  >
                    {OUTREACH_STAGES.map(stage => (
                      <option key={stage.id} value={stage.id}>
                        {stage.label.replace("OrangeHRM ", "").replace("!", "")}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Editor textbox or formulator trigger */}
                {generatedPitch ? (
                  <textarea
                    value={generatedPitch}
                    onChange={(e) => setGeneratedPitch(e.target.value)}
                    className="w-full min-h-[220px] text-xs p-3 bg-white border border-[#EBE4D8] rounded-xl focus:ring-1 focus:ring-[#EF6C00] outline-none font-mono leading-relaxed resize-y overflow-y-auto"
                  />
                ) : (
                  <div className="border border-dashed border-[#EBE4D8] rounded-xl p-6 text-center space-y-3 bg-white/50 my-2">
                    <MessageSquareCode className="w-8 h-8 text-neutral-400 mx-auto animate-bounce" />
                    <div className="text-xs text-[#1A1A1B] font-semibold">Ready to draft high-conversion email proposal?</div>
                    <p className="text-[11px] text-[#827F78] max-w-xs mx-auto font-light leading-relaxed">
                      This will analyze competing platforms, margins, and compliance rules to shape a strong alliance proposal.
                    
                    <button
                      onClick={() => handleCompileAIPitch(selectedPipelineLead)}
                      disabled={isCompilingPitch}
                      className="bg-[#EF6C00] hover:bg-[#D45F00] text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 mx-auto select-none cursor-pointer duration-200"
                    >
                      {isCompilingPitch ? (
                        <>
                          <Loader2 className="w-3 animate-spin text-white" />
                          <span>Formulating pitch draft...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Draft Customized Proposal</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {generatedPitch && (
                  <p className="text-[10px] text-[#827F78] leading-tight font-light font-sans">
                    <strong>Strategy Tips:</strong> Position the solution as an extension to corporate cloud consulting fees and highlight the private data advantage.
                  </p>
                )}
              </div>

              {/* Rationale and Profile Information */}
              <div className="bg-white border border-[#EBE4D8] rounded-2xl p-5 space-y-4 shadow-3xs">
                <h5 className="font-serif text-sm font-bold text-[#1A1A1B] flex items-center gap-1.5 border-b border-stone-100 pb-2">
                  <Award className="w-4 h-4 text-[#EF6C00]" />
                  Competitor Alignment & Intelligence
                </h5>

                <div className="grid grid-cols-2 gap-3 text-xs text-[#514F4A] leading-relaxed font-light">
                  <div className="bg-[#FAF6F0]/40 p-2 text-[11px] border border-[#EBE4D8]/50 rounded-lg">
                    <div className="text-slate-400 uppercase text-[8px] tracking-wider mb-0.5">Est. Revenue:</div>
                    <div className="font-bold text-[#1A1A1B]">{selectedPipelineLead.financials?.revenue}</div>
                  </div>
                  <div className="bg-[#FAF6F0]/40 p-2 text-[11px] border border-[#EBE4D8]/50 rounded-lg">
                    <div className="text-slate-400 uppercase text-[8px] tracking-wider mb-0.5">Est. GPM:</div>
                    <div className="font-bold text-[#EF6C00]">{selectedPipelineLead.financials?.gpm}</div>
                  </div>
                  <div className="bg-[#FAF6F0]/40 p-2 text-[11px] border border-[#EBE4D8]/50 rounded-lg col-span-2">
                    <div className="text-slate-400 uppercase text-[8px] tracking-wider mb-0.5">Registered Rivals Represented:</div>
                    <div className="font-bold text-[#1A1A1B]">{selectedPipelineLead.trackRecord?.competitors?.join(', ') || "Rival-Free Independent"}</div>
                  </div>
                </div>

                <div className="space-y-1 bg-[#FAF6F0]/40 p-3.5 rounded-xl border border-[#EBE4D8]">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#827F78] font-bold block">Strategic Target Rationale & Gaps:</span>
                  <div className="text-xs text-[#514F4A] leading-relaxed font-light">
                    {selectedPipelineLead.strategicFit?.whyOrangeHRM || "Favorable market expansion profile."}
                  </div>
                </div>

                {selectedPipelineLead.customNotes && (
                  <div className="space-y-1 bg-amber-50/40 p-3.5 rounded-xl border border-amber-200/50">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#827F78] font-bold block">Saved Vetting remarks:</span>
                    <p className="text-xs text-stone-600 italic leading-relaxed font-sans">
                      "{selectedPipelineLead.customNotes}"
                    </p>
                  </div>
                )}
              </div>

              {/* Structured Outreach logs */}
              <ContactLogManager
                campaignId={selectedPipelineLead.campaignId}
                lead={selectedPipelineLead}
                onRefreshCampaigns={async () => {
                  await onRefreshCampaigns();
                  // Re-find the updated lead to maintain current state
                  const updatedCamp = campaigns.find(c => c.id === selectedPipelineLead.campaignId);
                  const updatedLead = updatedCamp?.leads.find(l => l.id === selectedPipelineLead.id);
                  if (updatedLead) {
                    setSelectedPipelineLead({
                      ...updatedLead,
                      campaignId: selectedPipelineLead.campaignId,
                      campaignName: selectedPipelineLead.campaignName,
                      countryName: selectedPipelineLead.countryName,
                      outreachStatus: (updatedLead as any).outreachStatus || "not_contacted"
                    });
                  }
                }}
              />

            </div>
          </div>
        </>
      )}

    </div>
  );
}
