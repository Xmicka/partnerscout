import React, { useState } from "react";
import { 
  Calendar, 
  User, 
  Plus, 
  Trash2, 
  MessageSquare, 
  StickyNote, 
  Loader2, 
  TrendingUp,
  Clock
} from "lucide-react";
import { PartnerLead, ContactLog } from "../types.js";

interface ContactLogManagerProps {
  campaignId: string;
  lead: PartnerLead;
  onRefreshCampaigns: () => Promise<void>;
}

export function ContactLogManager({ campaignId, lead, onRefreshCampaigns }: ContactLogManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [contactPerson, setContactPerson] = useState("");
  const [discussion, setDiscussion] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [logToDeleteId, setLogToDeleteId] = useState<string | null>(null);

  const logs: ContactLog[] = lead.contactLogs || [];

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactPerson.trim() || !discussion.trim()) {
      setErrorMsg("Who you spoke to and discussion points are required.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/leads/${lead.id}/contact-logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          contactPerson: contactPerson.trim(),
          discussion: discussion.trim(),
          nextStep: nextStep.trim()
        })
      });

      if (response.ok) {
        setContactPerson("");
        setDiscussion("");
        setNextStep("");
        setIsAdding(false);
        await onRefreshCampaigns();
      } else {
        const err = await response.json();
        setErrorMsg(err.error || "Failed to add outreach entry.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Connection issue. Please retry.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (logToDeleteId !== logId) {
      setLogToDeleteId(logId);
      return;
    }

    try {
      setErrorMsg("");
      const response = await fetch(`/api/campaigns/${campaignId}/leads/${lead.id}/contact-logs/${logId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        setLogToDeleteId(null);
        await onRefreshCampaigns();
      } else {
        setErrorMsg("Failed to delete the contact log entry.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Error deleting the contact log entry.");
    }
  };

  return (
    <div className="space-y-5 bg-white border border-slate-200 dark:border-neutral-800 rounded-2xl p-5 shadow-3xs" id={`contact-log-panel-${lead.id}`}>
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#EF6C00]" />
          <h5 className="font-serif text-sm font-semibold text-slate-900 dark:text-neutral-100">
            Pipeline Outreach Contact Log
          </h5>
        </div>
        
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="text-[11px] font-bold text-white bg-[#EF6C00] hover:bg-[#D45F00] px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Log</span>
          </button>
        )}
      </div>

      {/* Add Log Form */}
      {isAdding && (
        <form onSubmit={handleAddLog} className="bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 p-4 rounded-xl space-y-3 animate-in fade-in duration-200">
          <div className="flex justify-between items-center pb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400">
              New Interaction Entry
            </span>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setErrorMsg("");
              }}
              className="text-[10px] text-slate-400 hover:text-red-500 font-semibold cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                Date Contacted
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs p-2 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-850 rounded-lg outline-none focus:border-[#EF6C00] text-slate-800 dark:text-neutral-200 font-sans"
                />
              </div>
            </div>

            <div>
              <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                Spoke To (Contact Person)
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. John Doe (Alliance Partner)"
                className="w-full text-xs p-2 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-850 rounded-lg outline-none focus:border-[#EF6C00] text-slate-800 dark:text-neutral-200"
              />
            </div>
          </div>

          <div>
            <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
              Discussion Summary
            </label>
            <textarea
              value={discussion}
              onChange={(e) => setDiscussion(e.target.value)}
              placeholder="What was discussed or presented..."
              className="w-full h-16 text-xs p-2 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-850 rounded-lg outline-none focus:border-[#EF6C00] text-slate-800 dark:text-neutral-200 font-sans resize-none"
            />
          </div>

          <div>
            <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block mb-1 col-span-2">
              Next Action Step
            </label>
            <input
              type="text"
              value={nextStep}
              onChange={(e) => setNextStep(e.target.value)}
              placeholder="e.g. Follow-up demo scheduled next Tuesday"
              className="w-full text-xs p-2 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-850 rounded-lg outline-none focus:border-[#EF6C00] text-slate-800 dark:text-neutral-200"
            />
          </div>

          {errorMsg && (
            <p className="text-[10px] font-semibold text-red-500">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-8 bg-[#EF6C00] hover:bg-[#D45F00] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-white" />
                <span>Saving entry...</span>
              </>
            ) : (
              <>
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Save Contact Log Record</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* List Existing Logs */}
      <div className="space-y-3">
        {logs.length === 0 ? (
          <div className="text-center py-6 bg-slate-50 dark:bg-neutral-900/40 border border-dashed border-slate-200 dark:border-neutral-850 rounded-xl text-xs text-slate-400 dark:text-neutral-500 font-light flex flex-col items-center gap-1.5">
            <Clock className="w-5 h-5 text-slate-350 dark:text-neutral-700" />
            <span>No communications logged yet.</span>
            <span className="text-[10px] text-slate-400">Add log entries to structured pipeline activity cards.</span>
          </div>
        ) : (
          <div className="relative border-l border-slate-200 dark:border-neutral-800 ml-2.5 pl-4 space-y-4 py-1.5 select-text">
            {logs.map((log) => (
              <div key={log.id} className="relative group animate-in fade-in duration-200" id={`log-item-${log.id}`}>
                {/* Timeline Node Dot */}
                <span className="absolute -left-[21.5px] top-1 w-3 h-3 bg-[#EF6C00] border-2 border-white dark:border-neutral-900 rounded-full" />

                <div className="bg-slate-50 dark:bg-neutral-900/80 hover:bg-slate-100/50 dark:hover:bg-neutral-900 border border-slate-200 dark:border-neutral-850 rounded-xl p-3.5 space-y-2 relative">
                  
                  {/* Delete log button */}
                  <button
                    onClick={() => handleDeleteLog(log.id)}
                    className={`absolute top-3 right-3 p-1 rounded transition-all duration-200 cursor-pointer text-xs flex items-center gap-1 ${
                      logToDeleteId === log.id
                        ? "text-red-600 bg-red-100 dark:bg-red-950/40 opacity-100 shadow-xs"
                        : "text-slate-300 dark:text-neutral-500 hover:text-red-650 opacity-0 group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-neutral-800"
                    }`}
                    title={logToDeleteId === log.id ? "Click again to confirm absolute deletion" : "Delete Entry"}
                  >
                    {logToDeleteId === log.id && <span className="text-[9px] font-mono font-bold uppercase tracking-wider animate-pulse">Confirm?</span>}
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 dark:border-neutral-800/60 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3 text-[#EF6C00]" />
                      <span className="text-xs font-bold text-slate-800 dark:text-neutral-200">
                        {log.contactPerson}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono font-bold">
                      <Calendar className="w-3 h-3 text-[#EF6C00]" />
                      <span>{new Date(log.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed font-sans">
                    {log.discussion}
                  </p>

                  {log.nextStep && (
                    <div className="bg-amber-500/10 border border-amber-500/20 dark:border-amber-500/10 rounded-lg p-2 flex items-start gap-1.5">
                      <span className="bg-[#EF6C00] text-white font-mono font-bold text-[8px] tracking-wider uppercase px-1 py-0.5 rounded shrink-0 leading-none mt-0.5">
                        NEXT
                      </span>
                      <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-normal font-sans">
                        {log.nextStep}
                      </p>
                    </div>
                  )}

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
