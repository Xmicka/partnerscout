/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Building2, 
  ExternalLink, 
  Plus, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  FileText, 
  Award, 
  HelpCircle, 
  ShieldCheck, 
  X, 
  Calendar, 
  User, 
  Mail, 
  MessageSquare, 
  Check, 
  TrendingUp, 
  Compass, 
  Layers,
  Globe,
  Linkedin,
  MapPin,
  Users,
  Star
} from "lucide-react";
import { InboundPartnerVetting } from "../types.js";

interface InboundVettingCenterProps {
  onRefreshCampaigns?: () => void;
}

export function InboundVettingCenter({ onRefreshCampaigns }: InboundVettingCenterProps) {
  const [vettings, setVettings] = useState<InboundPartnerVetting[]>([]);
  const [selectedVetting, setSelectedVetting] = useState<InboundPartnerVetting | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);

  // Form states
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [inboundMessage, setInboundMessage] = useState("");
  const [formError, setFormError] = useState("");

  // Decision editing states
  const [decisionNotes, setDecisionNotes] = useState("");
  const [savingDecision, setSavingDecision] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Email Customizer state
  const [emailTone, setEmailTone] = useState<"semi-casual" | "semi-professional" | "corporate-formal">("semi-professional");
  const [emailCTA, setEmailCTA] = useState<"call" | "details" | "email">("call");
  const [emailCustomContext, setEmailCustomContext] = useState("");
  const [isRegeneratingEmail, setIsRegeneratingEmail] = useState(false);
  const [regError, setRegError] = useState("");

  const handleCopyEmail = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(true);
    setTimeout(() => {
      setCopiedEmail(false);
    }, 2000);
  };

  useEffect(() => {
    if (selectedVetting?.evaluation?.orangeHrmAlignment?.fitVerdict) {
      const verdict = selectedVetting.evaluation.orangeHrmAlignment.fitVerdict;
      if (verdict === "HIGH FIT") {
        setEmailCTA("call");
      } else if (verdict === "MODERATE FIT") {
        setEmailCTA("details");
      } else if (verdict === "LOW FIT / CONFLICT") {
        setEmailCTA("email");
      }
      setEmailTone("semi-professional");
      setEmailCustomContext("");
      setRegError("");
    }
  }, [selectedVetting?.id]);

  const handleRegenerateEmail = async () => {
    if (!selectedVetting) return;
    setIsRegeneratingEmail(true);
    setRegError("");
    try {
      const res = await fetch(`/api/inbound/${selectedVetting.id}/generate-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tone: emailTone,
          cta: emailCTA,
          customContext: emailCustomContext
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Update local state to reflect the edited draft
          setSelectedVetting(prev => {
            if (!prev) return null;
            return {
              ...prev,
              evaluation: prev.evaluation ? {
                ...prev.evaluation,
                discoveryCallKit: prev.evaluation.discoveryCallKit ? {
                  ...prev.evaluation.discoveryCallKit,
                  emailPitchDraft: data.emailPitchDraft
                } : {
                  agendaTitle: `${prev.companyName} Inbound Partnership Orientation`,
                  qualifyingQuestions: [],
                  elevatorPitch: "",
                  emailPitchDraft: data.emailPitchDraft
                }
              } : prev.evaluation
            };
          });
          // Also fetch from backend quietly to persist
          await fetchVettings(true);
        } else {
          setRegError("Error in response from email processor.");
        }
      } else {
        setRegError("Server returned an error generating draft.");
      }
    } catch (err: any) {
      setRegError(err?.message || "Connection error during email drafting.");
    } finally {
      setIsRegeneratingEmail(false);
    }
  };

  // Load inbound records
  const fetchVettings = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/inbound");
      if (res.ok) {
        const data = await res.json();
        setVettings(data);
        // Sync selected vetting if open
        if (selectedVetting) {
          const updated = data.find((v: InboundPartnerVetting) => v.id === selectedVetting.id);
          if (updated) {
            setSelectedVetting(updated);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load inbound vettings:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchVettings();
    
    // Poll for processing vettings to show real-time progress beautifully
    const interval = setInterval(() => {
      fetchVettings(true);
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedVetting?.id]);

  const handleSubmitVetting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !website.trim()) {
      setFormError("Company Name and Website are required.");
      return;
    }
    setFormError("");
    setActionLoading(true);

    try {
      const res = await fetch("/api/inbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          website,
          contactName,
          contactEmail,
          inboundMessage
        })
      });

      if (res.ok) {
        const rawNew = await res.json();
        // Reset form
        setCompanyName("");
        setWebsite("");
        setContactName("");
        setContactEmail("");
        setInboundMessage("");
        setIsFormOpen(false);
        
        // Immediately fetch list
        await fetchVettings();
        // Set selected vetting to preview progress
        setSelectedVetting(rawNew);
      } else {
        const errData = await res.json();
        setFormError(errData.error || "Submission failed.");
      }
    } catch (err: any) {
      setFormError(err?.message || "Inbound transmission error.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveDecision = async (decision: "approved" | "rejected" | "contacted") => {
    if (!selectedVetting) return;
    setSavingDecision(true);
    try {
      const res = await fetch(`/api/inbound/${selectedVetting.id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          notes: decisionNotes
        })
      });

      if (res.ok) {
        await fetchVettings(true);
      }
    } catch (err) {
      console.error("Failed to save vetting decision:", err);
    } finally {
      setSavingDecision(false);
    }
  };

  const handleDeleteRequest = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("Are you sure you want to delete this vetting record?")) return;
    try {
      const res = await fetch(`/api/inbound/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (selectedVetting?.id === id) {
          setSelectedVetting(null);
        }
        fetchVettings();
      }
    } catch (err) {
      console.error("Failed to delete vetting record:", err);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear ALL inbound vetting logs? This cannot be undone.")) return;
    try {
      const res = await fetch("/api/inbound", { method: "DELETE" });
      if (res.ok) {
        setSelectedVetting(null);
        fetchVettings();
      }
    } catch (err) {
      console.error("Failed to clear vettings:", err);
    }
  };

  const handleResetDemo = async () => {
    try {
      const res = await fetch("/api/inbound/reset", { method: "POST" });
      if (res.ok) {
        setSelectedVetting(null);
        await fetchVettings();
      }
    } catch (err) {
      console.error("Failed to reset to demo vettings:", err);
    }
  };

  // Sync decision notes text input when selected vetting changes
  useEffect(() => {
    if (selectedVetting) {
      setDecisionNotes(selectedVetting.notes || "");
    } else {
      setDecisionNotes("");
    }
  }, [selectedVetting?.id]);

  // Calculations for stats dashboard
  const totalInbounds = vettings.length;
  const highFitCount = vettings.filter(v => v.evaluation?.orangeHrmAlignment?.fitVerdict === "HIGH FIT").length;
  const pendingTriageCount = vettings.filter(v => v.decision === "pending" && v.status === "completed").length;
  const inProgressCount = vettings.filter(v => v.status === "processing").length;

  return (
    <div id="inbound_vetting_container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 select-none font-sans">
      
      {/* STATS OVERVIEW DECK */}
      <div className="lg:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-3xs">
          <span className="text-slate-400 font-mono text-[10px] uppercase font-bold tracking-wider">Total Inbound Forms</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-extrabold text-slate-800">{totalInbounds}</span>
            <span className="text-[10px] text-slate-500 font-mono">Self-Initiated</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-3xs">
          <span className="text-emerald-700 font-mono text-[10px] uppercase font-bold tracking-wider">High Synergy Fits</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-extrabold text-emerald-600">{highFitCount}</span>
            <span className="text-[10px] text-slate-500 font-mono">Vetted {Math.round((highFitCount / (totalInbounds || 1)) * 100)}%</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-3xs">
          <span className="text-amber-700 font-mono text-[10px] uppercase font-bold tracking-wider">Pending Alliances Triage</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-extrabold text-amber-600">{pendingTriageCount}</span>
            <span className="text-[10px] text-slate-500 font-mono">Needs Action</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-3xs">
          <span className="text-slate-400 font-mono text-[10px] uppercase font-bold tracking-wider">Real-time Analyzing</span>
          <div className="flex items-baseline gap-2 mt-2">
            {inProgressCount > 0 ? (
              <div className="flex items-center gap-1.5">
                <Loader2 className="w-5 h-5 text-[#EF6C00] animate-spin" />
                <span className="text-xl font-extrabold text-[#EF6C00]" style={{ contentVisibility: "auto" }}>{inProgressCount} active</span>
              </div>
            ) : (
              <span className="text-sm font-semibold text-slate-500">Idle / Monitoring</span>
            )}
            <span className="text-[10px] text-slate-500 font-mono ml-auto" style={{ contentVisibility: "auto" }}>Web Engine</span>
          </div>
        </div>
      </div>

      {/* LEFT COLUMN: HISTORY LEDGER */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        <div className="bg-white border border-slate-200 rounded-xl flex flex-col shadow-3xs overflow-hidden h-[680px]">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-600" />
              <h3 className="font-semibold text-xs tracking-tight text-slate-800 uppercase font-mono">Queue</h3>
            </div>
            <div className="flex items-center gap-1.5">
              {vettings.length > 0 ? (
                <button
                  onClick={handleClearAll}
                  className="px-2 py-1.5 text-red-650 hover:text-red-750 hover:bg-red-50/60 text-[10px] font-bold uppercase rounded-lg border border-red-200/50 bg-white transition-all cursor-pointer focus:outline-none flex items-center gap-1"
                  title="Clear all records"
                >
                  <Trash2 className="w-3 h-3 text-red-500 shrink-0" />
                  <span>Clear All</span>
                </button>
              ) : (
                <button
                  onClick={handleResetDemo}
                  className="px-2 py-1.5 text-slate-650 hover:text-slate-850 hover:bg-slate-50 text-[10px] font-bold uppercase rounded-lg border border-slate-200 bg-white transition-all cursor-pointer focus:outline-none flex items-center gap-1"
                  title="Restore default demo records"
                >
                  <Sparkles className="w-3 h-3 text-[#EF6C00] shrink-0" />
                  <span>Reset Demo</span>
                </button>
              )}
              <button
                onClick={() => setIsFormOpen(true)}
                className="px-2.5 py-1.5 bg-[#EF6C00] hover:bg-[#D45F00] text-white text-[10px] font-bold uppercase rounded-lg transition-colors flex items-center gap-1 shadow-2xs focus:outline-none cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Log Contact</span>
              </button>
            </div>
          </div>

          {/* Vettings List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center p-8">
                <Loader2 className="w-8 h-8 text-[#EF6C00] animate-spin" />
                <span className="text-xs text-slate-500 font-mono mt-2">Onboarding ledger...</span>
              </div>
            ) : vettings.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center gap-2">
                <Building2 className="w-10 h-10 text-slate-300 stroke-1 mb-1" />
                <div>
                  <p className="text-xs text-slate-500 font-semibold">No direct requests logged.</p>
                  <p className="text-[10px] text-slate-400 max-w-[200px] mt-1 font-mono mb-3">Log an inbound partner's email pitch or corporate website to run vetting.</p>
                </div>
                <button
                  onClick={handleResetDemo}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 text-[10px] font-mono font-bold uppercase rounded-lg transition-all cursor-pointer outline-none focus:outline-none flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#EF6C00]" />
                  <span>Load Demo Companies</span>
                </button>
              </div>
            ) : (
              vettings.map((vet) => {
                const isSelected = selectedVetting?.id === vet.id;
                const isProcessing = vet.status === "processing";
                
                // Color mapping for decision
                let decisionBadge = (
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full font-mono uppercase bg-slate-100 text-slate-500 border border-slate-200/50">
                    Draft
                  </span>
                );
                if (vet.decision === "approved") {
                  decisionBadge = (
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full font-mono uppercase bg-emerald-50 text-emerald-600 font-bold border border-emerald-200/50">
                      Approved
                    </span>
                  );
                } else if (vet.decision === "rejected") {
                  decisionBadge = (
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full font-mono uppercase bg-red-50 text-red-600 font-bold border border-red-200/40">
                      Rejected
                    </span>
                  );
                } else if (vet.decision === "contacted") {
                  decisionBadge = (
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full font-mono uppercase bg-purple-50 text-purple-600 font-bold border border-purple-200/40">
                      Contacted
                    </span>
                  );
                } else if (vet.decision === "pending") {
                  decisionBadge = (
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full font-mono uppercase bg-amber-50 text-amber-700 font-bold border border-amber-200/50">
                      Pending
                    </span>
                  );
                }

                // Color alignment verdict badge
                const alignVerdict = vet.evaluation?.orangeHrmAlignment?.fitVerdict;
                let fitBadge = null;
                if (alignVerdict === "HIGH FIT") {
                  fitBadge = <span className="text-[9px] font-mono text-emerald-600 font-bold">★ HIGH</span>;
                } else if (alignVerdict === "MODERATE FIT") {
                  fitBadge = <span className="text-[9px] font-mono text-amber-600 font-bold">☆ MODERATE</span>;
                } else if (alignVerdict === "LOW FIT / CONFLICT") {
                  fitBadge = <span className="text-[9px] font-mono text-red-500 font-bold">⚠ RIVAL CONFLICT</span>;
                }

                return (
                  <div
                    key={vet.id}
                    onClick={() => setSelectedVetting(vet)}
                    className={`p-4 transition-colors cursor-pointer text-left relative ${
                      isSelected ? "bg-[#EF6C00]/5 border-l-4 border-[#EF6C00]" : "hover:bg-slate-50/70 border-l-4 border-transparent"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs text-slate-800 truncate">{vet.companyName}</h4>
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5 truncate">
                          <Globe className="w-3 h-3 text-slate-300" />
                          {vet.website}
                        </span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteRequest(vet.id, e); }}
                        className="text-slate-350 hover:text-red-500 p-1 rounded-sm hover:bg-slate-100 transition-colors focus:outline-none"
                        title="Delete Vet Analysis"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {isProcessing ? (
                      <div className="mt-3 flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[8px] font-mono text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <Loader2 className="w-2.5 h-2.5 animate-spin text-[#EF6C00]" />
                            {vet.currentStep || "Processing..."}
                          </span>
                          <span>{vet.progress || 10}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-[3px]">
                          <div 
                            className="bg-[#EF6C00] h-[3px] rounded-full transition-all duration-300"
                            style={{ width: `${vet.progress || 10}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {decisionBadge}
                          {fitBadge}
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono">
                          {new Date(vet.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer controls */}
          {vettings.length > 0 && (
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
              <button
                onClick={handleClearAll}
                className="text-[9px] font-mono uppercase tracking-wider font-bold text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
              >
                Clear Vetting Ledger
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: DETAIL ASSESSER DASHBOARD */}
      <div className="lg:col-span-8 flex flex-col gap-4">
        {!selectedVetting ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-3xs h-[680px]">
            <Award className="w-16 h-16 text-slate-300 stroke-1 mb-4" />
            <h3 className="font-bold text-sm text-slate-800 font-mono uppercase tracking-tight">VP Vetting Terminal</h3>
            <p className="text-xs text-slate-500 max-w-[360px] mt-2 font-sans">
              Select any logged inbound partnership contact from the queue ledger. You will trigger and view instant digital evaluations verifying footprint legitimacy, scale, competitive conflicts, and qualifying pitches.
            </p>
          </div>
        ) : selectedVetting.status === "processing" ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-3xs h-[680px]">
            <Loader2 className="w-12 h-12 text-[#EF6C00] animate-spin mb-4" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#EF6C00]">Active Vetting Pipeline Live</span>
            <p className="text-sm border-t border-slate-100 pt-3 mt-3 text-slate-700 max-w-[420px] font-sans">
              Currently analyzing digital telemetry for <strong className="text-slate-800">{selectedVetting.companyName} ({selectedVetting.website})</strong>.
            </p>
            <p className="text-xs text-slate-500 font-mono mt-1 mt-2">
              Current state: "{selectedVetting.currentStep || "Connecting..."}"
            </p>
            <div className="w-full max-w-sm bg-slate-100 rounded-full h-1 mt-6">
              <div 
                className="bg-[#EF6C00] h-1 rounded-full transition-all duration-300"
                style={{ width: `${selectedVetting.progress || 10}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-2">Polled every 4 seconds. Please stand by.</span>
          </div>
        ) : selectedVetting.status === "failed" ? (
          <div className="bg-white border border-[#E53935]/20 rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-3xs h-[680px]">
            <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="font-bold text-sm text-slate-800 font-mono uppercase">Vetting Routine Aborted</h3>
            <p className="text-xs text-slate-500 mt-2 font-mono">
              The vetting worker experienced an active system exception. Please check connection and try again.
            </p>
          </div>
        ) : !selectedVetting.evaluation ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-3xs h-[680px]">
            <HelpCircle className="w-12 h-12 text-slate-300 mb-4 animate-bounce" />
            <p className="text-xs text-slate-500 font-mono">Analysis payloads missing. Select another vetting or trigger re-processing.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl flex flex-col shadow-3xs h-[680px] overflow-hidden">
            
            {/* Header detail */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
              <div>
                <span className="text-[10px] font-mono font-bold bg-[#EF6C00]/10 text-[#EF6C00] px-2 py-0.5 rounded-full border border-[#EF6C00]/20">
                  SELF-INITIATED LEAD
                </span>
                <h3 className="text-base font-extrabold text-slate-850 mt-1">{selectedVetting.companyName}</h3>
                <div className="flex items-center gap-3 text-xs text-slate-500 font-mono mt-0.5">
                  <a 
                    href={`https://${selectedVetting.website}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[#EF6C00] hover:underline"
                  >
                    <span>{selectedVetting.website}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  {selectedVetting.contactName && (
                    <span className="flex items-center gap-1 text-slate-500">
                      <User className="w-3 h-3" />
                      {selectedVetting.contactName}
                    </span>
                  )}
                  {selectedVetting.contactEmail && (
                    <span className="flex items-center gap-1 text-slate-500">
                      <Mail className="w-3 h-3" />
                      {selectedVetting.contactEmail}
                    </span>
                  )}
                </div>
              </div>

              {/* ACTION: TRIAGE CONTROL PANEL */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSaveDecision("approved")}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all focus:outline-none flex items-center gap-1 cursor-pointer ${
                    selectedVetting.decision === "approved"
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                  }`}
                >
                  <Check className="w-3 h-3" />
                  <span>Approve</span>
                </button>
                <button
                  onClick={() => handleSaveDecision("contacted")}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all focus:outline-none flex items-center gap-1 cursor-pointer ${
                    selectedVetting.decision === "contacted"
                      ? "bg-purple-600 text-white shadow-2xs"
                      : "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
                  }`}
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Contacted</span>
                </button>
                <button
                  onClick={() => handleSaveDecision("rejected")}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all focus:outline-none flex items-center gap-1 cursor-pointer ${
                    selectedVetting.decision === "rejected"
                      ? "bg-red-650 text-white shadow-2xs"
                      : "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                  }`}
                >
                  <X className="w-3 h-3" />
                  <span>Decline</span>
                </button>
              </div>
            </div>

            {/* Scrollable analysis context */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
              
              {/* SENDER MESSAGE BRIEF (IF PROVIDED) */}
              {selectedVetting.inboundMessage && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-500 block mb-1">
                    Inbound Pitch Message
                  </span>
                  <p className="text-xs text-slate-600 font-sans italic leading-relaxed">
                    "{selectedVetting.inboundMessage}"
                  </p>
                </div>
              )}

              {/* ROW 1: LEGITIMACY INDEX & COMPETITOR CONFLICT */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Legitimacy */}
                <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between col-span-2">
                      <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-500">
                        Legitimacy & Telemetry
                      </span>
                      {selectedVetting.evaluation.legitimacy.isRealCompany ? (
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full font-mono bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold">
                          VERIFIED COMPANY
                        </span>
                      ) : (
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full font-mono bg-red-50 text-red-600 border border-red-100 font-bold">
                          UNCONFIRMED REGISTRY
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-3xl font-extrabold text-slate-800">
                        {selectedVetting.evaluation.legitimacy.confidenceScore}%
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Confidence index</span>
                    </div>
                    <p className="text-xs text-slate-600 font-sans mt-3 leading-relaxed border-b border-slate-100 pb-3 mb-3">
                      {selectedVetting.evaluation.legitimacy.digitalPresenceNotes}
                    </p>

                    {/* Enhanced Real-world Telemetry Block */}
                    <div className="space-y-2.5 pt-1">
                      {selectedVetting.evaluation.legitimacy.linkedInPresence && (
                        <div className="flex items-start gap-2 text-xs text-slate-650">
                          <Linkedin className="w-4 h-4 text-[#0A66C2] shrink-0 mt-0.5" style={{ contentVisibility: "auto" }} />
                          <div>
                            <span className="font-semibold text-slate-700 block text-[9px] uppercase font-mono tracking-wide">LinkedIn Footprint</span>
                            <span className="text-[11px] leading-snug">{selectedVetting.evaluation.legitimacy.linkedInPresence}</span>
                          </div>
                        </div>
                      )}

                      {selectedVetting.evaluation.legitimacy.physicalLocation && (
                        <div className="flex items-start gap-2 text-xs text-slate-650">
                          <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" style={{ contentVisibility: "auto" }} />
                          <div>
                            <span className="font-semibold text-slate-700 block text-[9px] uppercase font-mono tracking-wide">Physical Headquarters</span>
                            <span className="text-[11px] leading-snug text-slate-600 font-sans">{selectedVetting.evaluation.legitimacy.physicalLocation}</span>
                          </div>
                        </div>
                      )}

                      {selectedVetting.evaluation.legitimacy.googleReviewsAndRating && (
                        <div className="flex items-start gap-2 text-xs text-slate-650">
                          <Star className="w-4 h-4 text-amber-550 fill-amber-400 shrink-0 mt-0.5" style={{ contentVisibility: "auto" }} />
                          <div>
                            <span className="font-semibold text-slate-700 block text-[9px] uppercase font-mono tracking-wide">Google Ratings & Reviews</span>
                            <span className="text-[11px] leading-snug font-mono text-slate-600">{selectedVetting.evaluation.legitimacy.googleReviewsAndRating}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Domain trust validation reports */}
                    <div className="mt-4 border-t border-slate-100 pt-3 space-y-3">
                      <span className="text-[9px] font-mono uppercase font-bold tracking-wider text-slate-400 block">
                        Domain Trust & Anti-Spoof Signals
                      </span>

                      <div className="grid grid-cols-2 gap-2 text-[11px] font-sans">
                        <div className="bg-slate-50 p-2 rounded-lg">
                          <span className="block text-[8px] font-mono text-slate-400 uppercase">Domain Age</span>
                          <span className="font-semibold text-slate-700">
                            {selectedVetting.evaluation.legitimacy.domainAgeEstimated || "Verified (Active)"}
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg">
                          <span className="block text-[8px] font-mono text-slate-400 uppercase">Security Score</span>
                          <span className={`font-semibold font-mono ${
                            (selectedVetting.evaluation.legitimacy.domainLegitimacyScore || selectedVetting.evaluation.legitimacy.confidenceScore || 0) < 70 
                              ? "text-rose-600" 
                              : "text-emerald-600"
                          }`}>
                            {selectedVetting.evaluation.legitimacy.domainLegitimacyScore || selectedVetting.evaluation.legitimacy.confidenceScore || "90"}/100
                          </span>
                        </div>
                      </div>

                      {selectedVetting.evaluation.legitimacy.sslAndWebServerVerifications && (
                        <div className="bg-slate-50 p-2 rounded-lg text-[11px]">
                          <span className="block text-[8px] font-mono text-slate-400 uppercase mb-0.5">SSL & Hosting Network</span>
                          <span className="text-slate-600 leading-tight block">
                            {selectedVetting.evaluation.legitimacy.sslAndWebServerVerifications}
                          </span>
                        </div>
                      )}

                      {selectedVetting.evaluation.legitimacy.domainSecurityReport && (
                        <div className="bg-slate-50 p-2 rounded-lg text-[11px]">
                          <span className="block text-[8px] font-mono text-slate-400 uppercase mb-0.5">Integrity Analysis</span>
                          <span className="text-slate-650 leading-relaxed block">
                            {selectedVetting.evaluation.legitimacy.domainSecurityReport}
                          </span>
                        </div>
                      )}

                      {selectedVetting.evaluation.legitimacy.isSpoofOrOvernightTemplate && (
                        <div className="bg-rose-50 border border-rose-200 rounded-lg p-2.5 flex items-start gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] font-bold text-rose-750 uppercase font-mono block">Spoof Risk Alert</span>
                            <span className="text-[11px] text-rose-650 leading-snug block">
                              Potential low-integrity overnight template detected. Domain was registered very recently and matches zero offline commercial registries.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rival conflicts */}
                <div className={`border rounded-xl p-4 flex flex-col justify-between ${
                  selectedVetting.evaluation.competitorConflicts.hasConflict
                    ? "border-amber-250 bg-amber-500/5"
                    : "border-slate-200"
                }`}>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-500">
                        Competitive Alignments
                      </span>
                      {selectedVetting.evaluation.competitorConflicts.hasConflict ? (
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full font-mono bg-amber-100 text-amber-800 border border-amber-200">
                          RIVAL BOUNDS DETECTED
                        </span>
                      ) : (
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full font-mono bg-emerald-50 text-emerald-600 border border-emerald-150 font-bold">
                          RIVAL-FREE INDEPENDENT
                        </span>
                      )}
                    </div>

                    <div className="mt-2.5 space-y-1.5">
                      {selectedVetting.evaluation.competitorConflicts.hasConflict ? (
                        <div className="flex flex-wrap gap-1">
                          {selectedVetting.evaluation.competitorConflicts.identifiedCompetitors.map((comp) => (
                            <span key={comp} className="bg-amber-100 text-amber-800 text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-sm">
                              {comp}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-emerald-700 font-mono block">★ Greenfield Reseller Candidate</span>
                      )}
                      
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        {selectedVetting.evaluation.competitorConflicts.conflictNotes}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* MAIN SYNERGY SCORECARD */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
                <div className="bg-[#EF6C00]/5 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-[#EF6C00]" style={{ contentVisibility: "auto" }} />
                    <span className="text-xs font-mono font-extrabold uppercase tracking-wide text-slate-800">Strategic Fit Matrix</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      selectedVetting.evaluation.orangeHrmAlignment.fitVerdict === "HIGH FIT"
                        ? "bg-emerald-100 text-emerald-800"
                        : selectedVetting.evaluation.orangeHrmAlignment.fitVerdict === "MODERATE FIT"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-red-100 text-red-800"
                    }`}>
                      {selectedVetting.evaluation.orangeHrmAlignment.fitVerdict}
                    </span>
                    <span className="text-sm font-extrabold text-slate-800 font-mono">
                      Score: {selectedVetting.evaluation.orangeHrmAlignment.fitScore}/100
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400 block mb-1">
                      Analytical Rationale
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed font-sans">
                      {selectedVetting.evaluation.orangeHrmAlignment.rationale}
                    </p>
                  </div>

                  <div className="border-t border-slate-100 pt-3">
                    <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400 block mb-1">
                      Market Sector & Staff Capacity
                    </span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-1.5">
                      {selectedVetting.evaluation.marketFocus.sector && (
                        <div className="bg-slate-50 p-2.5 rounded-lg col-span-2">
                          <span className="text-[9px] font-mono text-slate-450 uppercase block">Vertical Industry Sector</span>
                          <span className="text-xs font-bold text-slate-750 block mt-0.5 animate-pulse-once">
                            {selectedVetting.evaluation.marketFocus.sector}
                          </span>
                        </div>
                      )}
                      
                      {selectedVetting.evaluation.marketFocus.employeeCount && (
                        <div className="bg-slate-50 p-2.5 rounded-lg">
                          <span className="text-[9px] font-mono text-slate-450 uppercase block">Employee Count</span>
                          <span className="text-xs font-bold text-slate-750 block mt-0.5">
                            {selectedVetting.evaluation.marketFocus.employeeCount}
                          </span>
                        </div>
                      )}

                      <div className="bg-slate-50 p-2.5 rounded-lg col-span-2 md:col-span-1">
                        <span className="text-[9px] font-mono text-slate-450 uppercase block">Scale Sizing</span>
                        <span className="text-xs font-bold text-slate-750 block mt-0.5">
                          {selectedVetting.evaluation.marketFocus.approximateScale}
                        </span>
                      </div>
                      
                      <div className="bg-slate-50 p-2.5 rounded-lg col-span-2 md:col-span-1">
                        <span className="text-[9px] font-mono text-slate-450 uppercase block">Reach Specialty</span>
                        <span className="text-xs font-bold text-slate-750 block mt-0.5 truncate" title={selectedVetting.evaluation.marketFocus.industryReach}>
                          {selectedVetting.evaluation.marketFocus.industryReach}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Multi-country span audit */}
                  <div className="border-t border-slate-100 pt-3">
                    <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400 block mb-1">
                      Global Footprint & Regulatory Reach
                    </span>
                    <div className="bg-slate-50 p-3 rounded-lg space-y-2 mt-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-500 uppercase">Multi-Country Operations</span>
                        {selectedVetting.evaluation.marketFocus.hasMultiCountryPresence ? (
                          <span className="text-[9px] font-bold font-mono px-2 py-0.5 bg-indigo-50 border border-indigo-150 text-indigo-650 rounded-full">
                            ★ MULTI-REGIONAL ESTABLISHED
                          </span>
                        ) : (
                          <span className="text-[9px] font-medium font-mono px-2 py-0.5 bg-slate-100 text-slate-550 rounded-full">
                            SINGLE COUNTRY LOCALIZED
                          </span>
                        )}
                      </div>

                      {selectedVetting.evaluation.marketFocus.countriesSpanned && selectedVetting.evaluation.marketFocus.countriesSpanned.length > 0 ? (
                        <div>
                          <span className="block text-[8px] font-mono text-slate-400 uppercase mb-1">Identified Active Countries</span>
                          <div className="flex flex-wrap gap-1">
                            {selectedVetting.evaluation.marketFocus.countriesSpanned.map((country) => (
                              <span key={country} className="text-[11px] font-sans font-medium bg-white text-slate-700 px-2.5 py-0.5 rounded-md border border-slate-150 flex items-center gap-1">
                                <Globe className="w-3 h-3 text-slate-400 shrink-0" />
                                {country}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span className="block text-[8px] font-mono text-slate-400 uppercase mb-1">Identified Active Countries</span>
                          <span className="text-xs text-slate-500 italic">United States Hub Location</span>
                        </div>
                      )}

                      {selectedVetting.evaluation.marketFocus.regionalMarketDominance && (
                        <div className="pt-1.5 border-t border-slate-200/50">
                          <span className="block text-[8px] font-mono text-slate-400 uppercase">Representative Influence & Dominance</span>
                          <p className="text-[11px] text-slate-650 leading-relaxed font-sans mt-0.5">
                            {selectedVetting.evaluation.marketFocus.regionalMarketDominance}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3">
                    <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400 block mb-1">
                      Dynamic Target Value Pitch
                    </span>
                    <p className="text-xs text-[#EF6C00] leading-relaxed font-mono font-medium">
                      {selectedVetting.evaluation.orangeHrmAlignment.customWhyOrangeHRM}
                    </p>
                  </div>
                </div>
              </div>

              {/* GLASSDOOR EMPLOYEE SENTIMENT TRACKER */}
              {selectedVetting.evaluation.glassdoorAnalysis && (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-4xs">
                  <div className="bg-[#1F5156]/5 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[#1F5156]">
                      <Users className="w-4 h-4 text-[#1D8F85]" />
                      <span className="text-xs font-mono font-extrabold uppercase tracking-wide">Glassdoor Employee Feedback Audit</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        selectedVetting.evaluation.glassdoorAnalysis.sentiment === "positive"
                          ? "bg-emerald-50 border border-emerald-150 text-emerald-750 font-bold"
                          : selectedVetting.evaluation.glassdoorAnalysis.sentiment === "neutral"
                            ? "bg-slate-100 text-slate-600 font-bold"
                            : "bg-rose-50 border border-rose-200 text-rose-750 font-bold"
                      }`}>
                        {selectedVetting.evaluation.glassdoorAnalysis.sentiment.toUpperCase()} SENTIMENT
                      </span>
                      <div className="flex items-center gap-1 font-mono text-xs font-extrabold text-slate-700 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-md">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-400 shrink-0" />
                        <span>Rating: {selectedVetting.evaluation.glassdoorAnalysis.averageRating?.toFixed(1) || "N/A"} / 5.0</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-3.5">
                    <div>
                      <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400 block mb-1">
                        Reported Staff Satisfaction & Positives
                      </span>
                      <p className="text-xs text-slate-650 leading-relaxed font-sans bg-emerald-50/20 p-2.5 rounded-lg border border-emerald-100/50">
                        {selectedVetting.evaluation.glassdoorAnalysis.positiveFeedbackSummary}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400 block mb-1">
                        Internal Discontent & Red Flag Indicators
                      </span>
                      {selectedVetting.evaluation.glassdoorAnalysis.negativeFeedbackAndRedFlags ? (
                        <p className={`text-xs leading-relaxed font-sans p-2.5 rounded-lg border ${
                          selectedVetting.evaluation.glassdoorAnalysis.sentiment === "frictional"
                            ? "bg-rose-50/40 border-rose-150 text-rose-800"
                            : "bg-amber-50/20 border-amber-100/50 text-slate-600"
                        }`}>
                          {selectedVetting.evaluation.glassdoorAnalysis.negativeFeedbackAndRedFlags}
                        </p>
                      ) : (
                        <span className="text-xs text-slate-450 font-mono italic">No structural employee complaints or leadership friction reported.</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* DISCOVERY CALL PREPARATION KIT */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-indigo-50/50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-indigo-900">
                    <Compass className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-mono font-extrabold uppercase tracking-wide">Discovery call prep kit</span>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-600 font-bold">
                    {selectedVetting.evaluation.discoveryCallKit.agendaTitle}
                  </span>
                </div>

                <div className="p-4 space-y-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400 block mb-2">
                      Tailored Qualifying Questions
                    </span>
                    <ul className="space-y-2">
                      {selectedVetting.evaluation.discoveryCallKit.qualifyingQuestions.map((q, idx) => (
                        <li key={idx} className="flex gap-2 text-xs text-slate-600 leading-relaxed font-sans">
                          <span className="text-indigo-600 font-mono font-bold align-top">0{idx + 1}.</span>
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="border-t border-slate-100 pt-3">
                    <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400 block mb-1">
                      Dedicated Pitch Hook
                    </span>
                    <p className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-150 font-sans italic text-slate-650 leading-relaxed">
                      "{selectedVetting.evaluation.discoveryCallKit.elevatorPitch}"
                    </p>
                  </div>

                  {/* Real-time Email Customizer Wizard */}
                  <div className="border-t border-slate-150 pt-4 mt-2 bg-slate-50/75 p-3.5 rounded-xl border border-slate-150">
                    <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#EF6C00] block mb-1">
                      ✉ Live Smart Email Draft Composer
                    </span>
                    <p className="text-[11px] text-slate-500 mb-3 block font-sans">
                      Automatically optimize and tailor the response mail based on the partner's alignment.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 text-xs">
                      {/* Select Tone */}
                      <div className="flex flex-col gap-1">
                        <label className="font-mono text-[9px] font-bold uppercase text-slate-400">Tone Profile</label>
                        <select
                          value={emailTone}
                          onChange={(e: any) => setEmailTone(e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg p-2 focus:outline-none text-xs font-semibold text-slate-700 cursor-pointer"
                        >
                          <option value="semi-casual">Semi-Casual (Warm & Human)</option>
                          <option value="semi-professional">Semi-Professional (Default)</option>
                          <option value="corporate-formal">Boardroom Formal (Corporate)</option>
                        </select>
                      </div>

                      {/* Select CTA */}
                      <div className="flex flex-col gap-1">
                        <label className="font-mono text-[9px] font-bold uppercase text-slate-400">
                          Primary Call to Action (CTA)
                        </label>
                        <select
                          value={emailCTA}
                          onChange={(e: any) => setEmailCTA(e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg p-2 focus:outline-none text-xs font-semibold text-slate-700 cursor-pointer"
                        >
                          <option value="call">★ Schedule 15m Zoom Call (High Fit Suggested)</option>
                          <option value="details">✎ Request Team details over email (Moderate Fit Suggested)</option>
                          <option value="email">✉ Email dialogue only (Low Fit/Conflict Suggested)</option>
                        </select>
                      </div>
                    </div>

                    {/* Custom points input */}
                    <div className="flex flex-col gap-1 mb-3">
                      <div className="flex justify-between items-center text-[9px] font-mono font-bold">
                        <label className="uppercase text-slate-400">
                          Optional Pitch Inclusions
                        </label>
                        <span className="text-slate-400 font-normal">These points are included in the draft.</span>
                      </div>
                      <textarea
                        rows={2}
                        placeholder="e.g. 'Tell them Mateo Fernadez is in Barcelona this September' or 'mention Sinnove is Spain-certified'"
                        value={emailCustomContext}
                        onChange={(e) => setEmailCustomContext(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg p-2 focus:outline-none text-xs font-normal text-slate-600 resize-none font-sans"
                      />
                    </div>

                    {/* Regenerate Action Trigger */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleRegenerateEmail}
                        disabled={isRegeneratingEmail}
                        className={`w-full md:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold uppercase font-mono tracking-wide flex items-center justify-center gap-1.5 transition-all outline-none focus:outline-none ${
                          isRegeneratingEmail ? "opacity-75 cursor-not-allowed" : "cursor-pointer"
                        }`}
                      >
                        {isRegeneratingEmail ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                            <span>Crafting pitch...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                            <span>Re-Compose Response</span>
                          </>
                        )}
                      </button>

                      {regError && (
                        <span className="text-[10px] text-rose-600 font-semibold font-mono animate-pulse">
                          {regError}
                        </span>
                      )}
                    </div>
                  </div>

                  {selectedVetting.evaluation.discoveryCallKit.emailPitchDraft && (
                    <div className="border-t border-slate-150 pt-3 mt-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <div>
                          <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400 block">
                            Alliances VP Discovery Invitation Email Draft
                          </span>
                          <span className="text-[9px] text-slate-450 block font-sans">
                            Tailored response ready to copy & dispatch to contacts.
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopyEmail(selectedVetting.evaluation.discoveryCallKit.emailPitchDraft || "")}
                          className={`flex items-center gap-1 text-[10px] font-bold uppercase py-1 px-2.5 rounded-lg border cursor-pointer focus:outline-none transition-all ${
                            copiedEmail
                              ? "bg-emerald-50 text-emerald-750 border-emerald-250 font-mono"
                              : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                          }`}
                        >
                          {copiedEmail ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Copied Template!</span>
                            </>
                          ) : (
                            <>
                              <FileText className="w-3.5 h-3.5 text-slate-400" />
                              <span>Copy Draft</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="bg-slate-900 border border-slate-950 rounded-xl p-3.5 relative">
                        <pre className="text-[11px] font-mono text-slate-200 leading-relaxed overflow-x-auto max-h-60 whitespace-pre-wrap select-all focus:outline-none">
                          {selectedVetting.evaluation.discoveryCallKit.emailPitchDraft}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* PRIVATE WORKSPACE EVALUTION NOTES */}
              <div className="border-t border-slate-200 pt-6">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 block mb-2">
                  Alliances VP Notes & Action Logging
                </h4>
                <div className="flex flex-col gap-2">
                  <textarea
                    value={decisionNotes}
                    onChange={(e) => setDecisionNotes(e.target.value)}
                    placeholder="Log partner discovery call time, internal notes, or specific feedback..."
                    rows={3}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none placeholder-slate-400 font-sans resize-none"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {selectedVetting.decision !== "pending" ? (
                        <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Decision Saved: {selectedVetting.decision}
                        </span>
                      ) : (
                        <span>Vetting is pending triage decision.</span>
                      )}
                    </span>
                    <button
                      onClick={() => handleSaveDecision(selectedVetting.decision)}
                      disabled={savingDecision}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-colors font-sans cursor-pointer focus:outline-none"
                    >
                      {savingDecision ? "Logging..." : "Save Notes"}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* FORM MODAL Dialog for logging direct inbound requests */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-left">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#EF6C00]" />
                <h3 className="font-extrabold text-xs tracking-tight text-slate-800 uppercase font-mono">Log Direct Partner Contact</h3>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-sm focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitVetting} className="p-6 space-y-4 flex-1">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-medium rounded-lg border border-red-100 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 stroke-2" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-550">Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. sinnove consulting"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-550">Website Domain *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. sinnove.es"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-550">Sender Name</label>
                  <input
                    type="text"
                    placeholder="e.g. mateo fernandez"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-550">Sender Email</label>
                  <input
                    type="email"
                    placeholder="e.g. contact@example.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-550">Inbound Email Context / Message</label>
                <textarea
                  placeholder="Paste their inbound partnership request or brief description about their specialties..."
                  rows={4}
                  value={inboundMessage}
                  onChange={(e) => setInboundMessage(e.target.value)}
                  className="text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none font-sans resize-none"
                />
              </div>

              <span className="text-[9px] text-slate-450 font-mono block">
                * Vetting is computed asynchronously via a corporate reseller grounding dataset.
              </span>

              <div className="border-t border-slate-100 pt-4 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-[#EF6C00] hover:bg-[#D45F00] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer focus:outline-none flex items-center gap-1.5"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Transmitting...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Initiate Vetting</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
