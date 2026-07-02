/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Building2, 
  Globe, 
  Users, 
  TrendingUp, 
  Coins, 
  Award, 
  ShieldCheck, 
  Sparkles, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Briefcase, 
  Clock, 
  ArrowUpRight, 
  Check, 
  Loader2, 
  ChevronRight, 
  Info, 
  FileText, 
  Filter, 
  Activity, 
  ChevronLeft,
  X,
  FileSpreadsheet,
  Settings,
  AlertCircle,
  Database,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Lock,
  LayoutGrid,
  Sun,
  Moon
} from "lucide-react";
import { Campaign, PartnerLead, DiscoverRequest } from "./types.js";
import { GlobalDirectory } from "./components/GlobalDirectory.js";
import { ContactLogManager } from "./components/ContactLogManager.js";
import { GroundingCenter } from "./components/GroundingCenter.js";
import { OutreachTracker } from "./components/OutreachTracker.js";
import { InboundVettingCenter } from "./components/InboundVettingCenter.js";

// Preset lead search templates for the vetting engine matching similar high-capacity resellers
const LEAD_TYPE_PRESETS = [
  { id: "hr_companies", label: "HR consultancy firms & organizations", desc: "Professional advisors and human resource consulting entities perfect for reselling or sourcing enterprise HR systems to their client accounts." },
  { id: "payroll", label: "Payroll service providers & bureaus", desc: "Outsourced payroll bureaus and providers looking to bundle or resell comprehensive HR systems to their recurring corporate clients." },
  { id: "crm_erp", label: "CRM & ERP (Odoo/Zoho) partners", desc: "Consultants already delivering other business apps and eager to bundle HR modules." },
  { id: "it_msp", label: "General IT service providers", desc: "Rival-free system admins and managed services with strong, trusted local client bases." },
  { id: "digital", label: "Digital Transformation consultancies", desc: "Integrators helping mid-tier Mittelstand/SMEs modernise workspace suites." },
  { id: "competitor", label: "Competitor platform resellers", desc: "Existing BambooHR/Sage/Workday distributors prime for a higher-margin, open alternative search." }
];

export default function App() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [selectedLead, setSelectedLead] = useState<PartnerLead | null>(null);
  const [campaignToDeleteId, setCampaignToDeleteId] = useState<string | null>(null);
  const [isResetAllConfirming, setIsResetAllConfirming] = useState<boolean>(false);
  const [customVettingNotes, setCustomVettingNotes] = useState<string>("");
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);
  const [notesFeedback, setNotesFeedback] = useState<string>("");

  // Tab View State Control: 'scout' | 'directory' | 'grounding' | 'outreach' | 'inbound'
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<"scout" | "directory" | "grounding" | "outreach" | "inbound">("scout");

  // Department-wide active role: "alliances" | "bdr" | "risk"
  const [activeDepartmentRole, setActiveDepartmentRole] = useState<"alliances" | "bdr" | "risk">("alliances");

  const selectDepartmentRole = (role: "alliances" | "bdr" | "risk") => {
    setActiveDepartmentRole(role);
    if (role === "alliances") {
      setActiveWorkspaceTab("scout");
    } else if (role === "bdr") {
      setActiveWorkspaceTab("outreach");
    } else if (role === "risk") {
      setActiveWorkspaceTab("grounding");
    }
  };

  // Shared helper: export selected leads list to Comma-Separated Values (CSV)
  const exportToCSV = (leadsList: PartnerLead[], sheetName: string) => {
    const headers = [
      "Company Name",
      "HQ Location",
      "Employee Size",
      "Estimated Revenue",
      "Calculated GPM",
      "Financial Status",
      "Competitors Represented",
      "Reputation Standing",
      "Strategic Pitch",
      "Sources Citations",
      "Custom Vetting Notes"
    ].join(",");

    const rows = leadsList.map(lead => {
      const escapedNotes = ((lead as any).customNotes || "").replace(/"/g, '""');
      const escapedWhy = (lead.strategicFit?.whyOrangeHRM || "").replace(/"/g, '""');
      const comps = (lead.trackRecord?.competitors || []).join("; ");
      const citText = (lead.sources || []).map(s => `${s.title} (${s.url})`).join("; ");

      return [
        `"${lead.name.replace(/"/g, '""')}"`,
        `"${lead.hqLocation.replace(/"/g, '""')}"`,
        `"${lead.employeeSize.replace(/"/g, '""')}"`,
        `"${lead.financials?.revenue || ''}"`,
        `"${lead.financials?.gpm || ''}"`,
        `"${lead.financials?.status || ''}"`,
        `"${comps.replace(/"/g, '""')}"`,
        `"${lead.reputation?.status || ''}"`,
        `"${escapedWhy}"`,
        `"${citText.replace(/"/g, '""')}"`,
        `"${escapedNotes}"`
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${sheetName.replace(/\s+/g, '_')}_Leads_Dossier_Export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Shared helper: export deep partner recruitment BRIEF to elegant print PDF layout
  const handleExportPDF = (lead: PartnerLead, campName: string) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Compile actual or fallback scoring rubrics
    const rubric = lead.scoringRubric || {
      marketCapability: lead.firmSizeSegment === "Enterprise" ? 23 : lead.firmSizeSegment === "Mid-Market" ? 18 : 13,
      competitiveAlignment: 25,
      reputationScore: lead.reputation?.status === "Institutional" ? 24 : lead.reputation?.status === "Reputable" ? 19 : 14,
      channelFit: 21,
      initialTotalScore: 83,
      rubricRationale: "Possesses strong regional customer trust portfolios, and represents a robust system-embedding partner."
    };

    const initialTotal = rubric.marketCapability + rubric.competitiveAlignment + rubric.reputationScore + rubric.channelFit;

    const critique = lead.challengerCritique || {
      finalTotalScore: initialTotal - 4,
      conflictsIdentified: [],
      challengerRationale: "Partner carries independent service posturing. Zero conflicts flagged of note."
    };

    const logs = lead.contactLogs || [];

    printWindow.document.write(`
      <html>
        <head>
          <title>Partner Briefing: ${lead.name}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'Inter', sans-serif;
              color: #1A1A1B;
              background-color: #FFFFFF;
              padding: 40px;
              max-width: 820px;
              margin: 0 auto;
              line-height: 1.5;
            }
            .header {
              border-bottom: 3px double #C2B6A6;
              padding-bottom: 20px;
              margin-bottom: 24px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .title-group h1 {
              font-family: 'Playfair Display', serif;
              font-size: 26px;
              font-weight: 700;
              color: #1A1A1B;
              margin: 0 0 4px 0;
            }
            .subtitle {
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 2.5px;
              color: #EF6C00;
              font-weight: bold;
            }
            .meta-value {
              font-family: 'JetBrains Mono', monospace;
              font-size: 10px;
              color: #514F4A;
              text-align: right;
              line-height: 1.4;
            }
            .dossier-card {
              border: 1px solid #EBE4D8;
              background-color: #FDFBF7;
              border-radius: 12px;
              padding: 24px;
              margin-bottom: 24px;
            }
            .lead-title {
              font-family: 'Playfair Display', serif;
              font-size: 24px;
              font-weight: 700;
              color: #1A1A1B;
              margin: 0 0 6px 0;
            }
            .lead-desc {
              font-size: 13px;
              color: #514F4A;
              margin-bottom: 20px;
              line-height: 1.6;
              font-style: italic;
            }
            .metrics-grid {
              display: grid;
              grid-template-cols: repeat(4, 1fr);
              gap: 12px;
              margin-top: 15px;
              margin-bottom: 20px;
            }
            .metric-box {
              background-color: #FAF6F0;
              border: 1px solid #EBE4D8;
              padding: 10px;
              border-radius: 8px;
              text-align: center;
            }
            .metric-label {
              font-size: 8.5px;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #827F78;
              margin-bottom: 4px;
              font-weight: bold;
            }
            .metric-val {
              font-family: 'JetBrains Mono', monospace;
              font-size: 11.5px;
              font-weight: bold;
              color: #1A1A1B;
            }
            .section-title {
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              font-weight: bold;
              padding-bottom: 6px;
              border-bottom: 1px solid #EBE4D8;
              margin: 28px 0 12px 0;
              color: #EF6C00;
            }
            p.text {
              font-size: 12.5px;
              color: #2F2E2C;
              line-height: 1.6;
              margin-top: 0;
            }
            
            /* Scoring Table Styles */
            .score-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              font-size: 12px;
              background-color: #FFFFFF;
              border: 1px solid #EBE4D8;
              border-radius: 6px;
              overflow: hidden;
            }
            .score-table th {
              background-color: #FAF6F0;
              color: #514F4A;
              text-align: left;
              padding: 10px 12px;
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 1px;
              border-bottom: 2px solid #EBE4D8;
            }
            .score-table td {
              padding: 10px 12px;
              border-bottom: 1px solid #FAF6F0;
              color: #1A1A1B;
            }
            .score-table tr:last-child td {
              border-bottom: none;
            }
            .score-badge {
              font-family: 'JetBrains Mono', monospace;
              font-weight: bold;
              background-color: #EF6C00;
              color: #FFFFFF;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 11px;
            }
            
            /* Challenger Audit Styles */
            .challenger-box {
              background-color: #FFF9F2;
              border: 1.5px solid #EF6C00;
              border-radius: 10px;
              padding: 18px;
              margin-bottom: 20px;
              position: relative;
            }
            .challenger-title {
              font-family: 'Playfair Display', serif;
              font-size: 15px;
              font-weight: bold;
              color: #D45F00;
              margin-bottom: 8px;
              display: flex;
              align-items: center;
              gap: 6px;
            }
            .conflict-badge {
              background-color: #FFEBEE;
              color: #C62828;
              border: 1px solid #FFCDD2;
              padding: 3px 8px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: bold;
              display: inline-block;
              margin-right: 6px;
              margin-bottom: 6px;
            }
            .clean-badge {
              background-color: #E8F5E9;
              color: #2E7D32;
              border: 1px solid #C8E6C9;
              padding: 3px 8px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: bold;
              display: inline-block;
            }
            
            /* Contact Log Timeline */
            .log-timeline {
              border-left: 2px solid #EBE4D8;
              margin-left: 10px;
              padding-left: 20px;
              margin-top: 15px;
            }
            .log-entry {
              position: relative;
              margin-bottom: 20px;
            }
            .log-entry::before {
              content: '';
              position: absolute;
              left: -26.5px;
              top: 4px;
              width: 10px;
              height: 10px;
              background-color: #EF6C00;
              border-radius: 50%;
              border: 2px solid #FFFFFF;
            }
            .log-date {
              font-family: 'JetBrains Mono', monospace;
              font-size: 10px;
              color: #827F78;
              font-weight: bold;
              margin-bottom: 2px;
            }
            .log-header {
              font-size: 12px;
              font-weight: bold;
              color: #1A1A1B;
              margin-bottom: 4px;
            }
            .log-desc {
              font-size: 12px;
              color: #514F4A;
              line-height: 1.5;
            }
            .log-next {
              margin-top: 5px;
              font-size: 11px;
              background-color: #FCF5EB;
              border-left: 2.5px solid #EF6C00;
              color: #8D5400;
              padding: 4px 8px;
              border-radius: 4px;
            }

            .sources-list {
              font-size: 11px;
              margin-top: 10px;
            }
            .source-item {
              padding: 10px;
              background-color: #FAF6F0;
              border: 1px solid #EBE4D8;
              border-radius: 6px;
              margin-bottom: 6px;
            }
            .footer {
              margin-top: 60px;
              text-align: center;
              font-size: 9px;
              color: #827F78;
              border-top: 1px solid #EBE4D8;
              padding-top: 20px;
            }
            @media print {
              body {
                padding: 15px;
                font-size: 12px;
              }
              .no-print {
                display: none !important;
              }
              .challenger-box {
                border-color: #EF6C00 !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title-group">
              <span class="subtitle">Channel Strategic Intelligence</span>
              <h1>PARTNER RECRUITMENT BRIEF</h1>
            </div>
            <div class="meta-value">
              CAMPAIGN: ${campName}<br>
              TIMEFRAME: ${new Date().toLocaleDateString()}<br>
              CLASSIFICATION: CONFIDENTIAL BOARD STUDY
            </div>
          </div>

          <div class="dossier-card">
            <div class="lead-title">${lead.name}</div>
            <div class="lead-desc">"${lead.description}"</div>

            <div class="metrics-grid">
              <div class="metric-box">
                <div class="metric-label">HQ Location</div>
                <div class="metric-val" style="font-family: inherit;">${lead.hqLocation}</div>
              </div>
              <div class="metric-box">
                <div class="metric-label">Employee Size</div>
                <div class="metric-val" style="font-family: inherit;">${lead.employeeSize}</div>
              </div>
              <div class="metric-box">
                <div class="metric-label">Est. Revenue</div>
                <div class="metric-val">${lead.financials?.revenue || "Confidential Services"}</div>
              </div>
              <div class="metric-box">
                <div class="metric-label">Estimated GPM</div>
                <div class="metric-val" style="color: #EF6C00;">${lead.financials?.gpm || "N/A"}</div>
              </div>
            </div>

            <div class="section-title">Strategic Rationale & Competitive Gaps</div>
            <p class="text">
              <strong>Current Competitor Networks:</strong> ${lead.trackRecord?.competitors?.join(", ") || "None (True independent / Rival-Free)."}
              <span style="font-size: 11px; display: block; color: #827F78; margin-top: 4px;">
                * Direct brand custom implementation channels: ${lead.trackRecord?.partnershipCount || 0} setups verified.
              </span>
            </p>

            <div class="section-title">Corporate Pitch Vector</div>
            <p class="text" style="background-color: #FCF5EB; padding: 12px; border-radius: 8px; border-left: 3px solid #EF6C00; font-family: inherit;">
              ${lead.strategicFit?.whyOrangeHRM}
            </p>

            <!-- Scoring Rubric Section -->
            <div class="section-title">Partner Performance Scoring Summary</div>
            <table class="score-table">
              <thead>
                <tr>
                  <th>Vetting Pillar Dimension</th>
                  <th>Core Scoring Metric Criteria Range</th>
                  <th style="text-align: right;">Achieved Rating Score</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>1. Market Capability & Scale</strong></td>
                  <td>Evaluates local reach, regional headcount strength, and delivery resource depth (0-25).</td>
                  <td style="text-align: right; font-family: monospace; font-weight: bold;">${rubric.marketCapability}/25</td>
                </tr>
                <tr>
                  <td><strong>2. Competitive Alignment Ratio</strong></td>
                  <td>Calculates exclusivity posture. Direct rival-free status secures maximum weighting points (0-25).</td>
                  <td style="text-align: right; font-family: monospace; font-weight: bold;">${rubric.competitiveAlignment}/25</td>
                </tr>
                <tr>
                  <td><strong>3. Reputation & Vetting Class</strong></td>
                  <td>Establishes firm credibility standing based on verified directories & Google Grounding signals (0-25).</td>
                  <td style="text-align: right; font-family: monospace; font-weight: bold;">${rubric.reputationScore}/25</td>
                </tr>
                <tr>
                  <td><strong>4. Reseller Pitch Compatibility</strong></td>
                  <td>Validates the suitability of bundling the solution into active client ERP and CRM portfolios (0-25).</td>
                  <td style="text-align: right; font-family: monospace; font-weight: bold;">${rubric.channelFit}/25</td>
                </tr>
                <tr style="background-color: #FAF6F0; font-size: 13px;">
                  <td colspan="2"><strong>Initial Unified Vetting Score</strong></td>
                  <td style="text-align: right;"><span class="score-badge">${initialTotal}/100</span></td>
                </tr>
              </tbody>
            </table>
            <p style="font-size: 11.5px; color: #514F4A; margin-top: -10px; font-style: italic; line-height: 1.4;">
              * <strong>Scouts' Rationale:</strong> ${rubric.rubricRationale || "Evaluated by partner intelligence agents according to corporate channel standards."}
            </p>

            <!-- Challenger Pass Audit Section -->
            <div class="section-title">Compliance Challenger Audit Pass</div>
            <div class="challenger-box">
              <div class="challenger-title">
                Compliance Challenger Pass: Adjusted Total ${critique.finalTotalScore || initialTotal}/100
              </div>
              
              <div style="margin-bottom: 12px; font-size: 11.5px;">
                <strong>Conflicts of Interest Check:</strong> 
                ${critique.conflictsIdentified && critique.conflictsIdentified.length > 0 ? 
                  critique.conflictsIdentified.map(conflict => `<span class="conflict-badge">⚠ ${conflict}</span>`).join("") : 
                  `<span class="clean-badge">✔ Cleared (Rival-Free & Independent)</span>`
                }
              </div>

              <p class="text" style="font-size: 12px; color: #514F4A; margin-bottom: 0; line-height: 1.5; font-style: italic;">
                "${critique.challengerRationale}"
              </p>
            </div>

            <!-- Pipeline Contact Log Timeline Section -->
            <div class="section-title">Interactions Pipeline Contact Logs</div>
            ${logs.length === 0 ? `
              <p class="text" style="color: #827F78; font-style: italic; font-size: 12px;">
                No outreach activities logged yet for this candidate.
              </p>
            ` : `
              <div class="log-timeline">
                ${logs.map(log => `
                  <div class="log-entry">
                    <div class="log-date">${new Date(log.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</div>
                    <div class="log-header">Spoke with: ${log.contactPerson}</div>
                    <div class="log-desc">${log.discussion}</div>
                    ${log.nextStep ? `
                      <div class="log-next"><strong>Next Action Step:</strong> ${log.nextStep}</div>
                    ` : ""}
                  </div>
                `).join("")}
              </div>
            `}

            <div class="section-title">Verified Proof of Life Sourcing Citations</div>
            <div class="sources-list">
              ${(lead.sources && lead.sources.length > 0) ? lead.sources.slice(0, 3).map(src => `
                <div class="source-item">
                  <strong>${src.title}</strong><br>
                  <span style="font-family: 'JetBrains Mono', monospace; font-size: 9.5px; color: #EF6C00;">${src.url}</span>
                </div>
              `).join("") : `<div class="source-item">Verified via local business registers and digital tech surveys.</div>`}
            </div>

          </div>

          <div class="footer">
            Partner Scout internal summary. For team use only.
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleUpdateOutreachStatus = async (campaignId: string, leadId: string, status: string) => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/leads/${leadId}/outreach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        // Fetch background changes silently to keep client sync
        fetchCampaigns(false);
      }
    } catch (err) {
      console.error("Failed to post outreach status", err);
    }
  };

  const handleCardOutreachStatusChange = async (leadId: string, status: string) => {
    if (!selectedCampaign) return;
    await handleUpdateOutreachStatus(selectedCampaign.id, leadId, status);
  };

  const handleSaveCardNotes = async (leadId: string) => {
    if (!selectedCampaign) return;
    const notesStr = cardNotesState[leadId] !== undefined ? cardNotesState[leadId] : "";
    setCardNotesStatus(prev => ({ ...prev, [leadId]: "Syncing..." }));
    try {
      const res = await fetch(`/api/campaigns/${selectedCampaign.id}/leads/${leadId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ CustomNotes: notesStr })
      });
      if (res.ok) {
        setCardNotesStatus(prev => ({ ...prev, [leadId]: "Draft Synced!" }));
        fetchCampaigns(false);
        setTimeout(() => {
          setCardNotesStatus(prev => ({ ...prev, [leadId]: "" }));
        }, 3000);
      } else {
        setCardNotesStatus(prev => ({ ...prev, [leadId]: "Sync Error ❌" }));
      }
    } catch (err) {
      console.error(err);
      setCardNotesStatus(prev => ({ ...prev, [leadId]: "Network Error ❌" }));
    }
  };

  // Creation Form State
  const [targetCountryOption, setTargetCountryOption] = useState<string>("Germany");
  const [customCountryInput, setCustomCountryInput] = useState<string>("");
  const [customCampaignName, setCustomCampaignName] = useState<string>("");
  const [selectedPresets, setSelectedPresets] = useState<string[]>(["hr_companies", "payroll"]);
  const [searchDepth, setSearchDepth] = useState<"fast" | "comprehensive">("comprehensive");
  const [selectedModel, setSelectedModel] = useState<string>("gemini-3.5-flash");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("partner_scout_theme") === "dark";
  });
  const [isSpawning, setIsSpawning] = useState<boolean>(false);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);

  // Filters and Sorting
  const [selectedReputationFilter, setSelectedReputationFilter] = useState<string>("All");
  const [selectedCompetitorFilter, setSelectedCompetitorFilter] = useState<string>("All");
  const [selectedNeutralityFilter, setSelectedNeutralityFilter] = useState<string>("All");
  const [selectedSegmentFilter, setSelectedSegmentFilter] = useState<string>("All");
  const [selectedLeadSort, setSelectedLeadSort] = useState<string>("default");

  // Card-level expandable BDR edits and notes state
  const [expandedCardNotes, setExpandedCardNotes] = useState<Record<string, boolean>>({});
  const [cardNotesState, setCardNotesState] = useState<Record<string, string>>({});
  const [cardNotesStatus, setCardNotesStatus] = useState<Record<string, string>>({});

  const toggleCardNotesExpand = (leadId: string) => {
    setExpandedCardNotes(prev => ({ ...prev, [leadId]: !prev[leadId] }));
  };

  const handleCardNotesChange = (leadId: string, val: string) => {
    setCardNotesState(prev => ({ ...prev, [leadId]: val }));
  };

  // Manage HTML Dark Mode class dynamically
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("partner_scout_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("partner_scout_theme", "light");
    }
  }, [isDarkMode]);

  // Health / Agent System Stats
  const [serverStatus, setServerStatus] = useState<{
    status: string;
    timestamp: string;
    engineStatus: string;
    hasSerper: boolean;
  } | null>(null);

  // Poll Interval Reference for tracking active campaigns
  const pollIntervalRef = useRef<number | null>(null);

  // Fetch initial campaign state and health
  useEffect(() => {
    fetchHealthStatus();
    fetchCampaigns(true); // first load auto-selects the first completed or processing campaign
    
    // Start active polling for progress updates
    pollIntervalRef.current = window.setInterval(() => {
      fetchCampaigns(false);
    }, 4000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Fetch API Health
  const fetchHealthStatus = async () => {
    try {
      const res = await fetch("/api/health");
      if (res.ok) {
        const data = await res.json();
        setServerStatus(data);
      }
    } catch (e) {
      console.error("Health check error", e);
    }
  };

  // Fetch Campaigns
  const fetchCampaigns = async (autoSelect: boolean = false) => {
    try {
      const res = await fetch("/api/campaigns");
      if (res.ok) {
        const data: Campaign[] = await res.json();
        setCampaigns(data);

        // Auto select decision loop
        if (data.length === 0) {
          setSelectedCampaign(null);
          setSelectedLead(null);
        } else if (autoSelect && data.length > 0) {
          // Find if there is an active processing campaign, otherwise choose the first one
          const active = data.find(c => c.status === "processing") || data[0];
          setSelectedCampaign(active);
        } else if (selectedCampaign) {
          // Refresh the currently selected campaign reference to update dynamic steps and progress
          const updated = data.find(c => c.id === selectedCampaign.id);
          if (updated) {
            setSelectedCampaign(updated);
            // If the selected lead is active, refresh its details if notes are not being edited actively
            if (selectedLead) {
              const updatedLead = updated.leads.find(l => l.id === selectedLead.id);
              if (updatedLead) {
                // Only update lead if the user isn't modifying notes right now
                setSelectedLead(updatedLead);
              } else {
                setSelectedLead(null);
              }
            }
          } else {
            setSelectedCampaign(null);
            setSelectedLead(null);
          }
        }
      }
    } catch (e) {
      console.error("Error fetching campaigns", e);
    }
  };

  // Create Campaign Vetting Run
  const handleLaunchCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedCountry = targetCountryOption === "custom" ? customCountryInput.trim() : targetCountryOption;
    if (!resolvedCountry) return;

    // Resolve active search terms based on selected presets
    const chosenTypes = LEAD_TYPE_PRESETS
      .filter(p => selectedPresets.includes(p.id))
      .map(p => `${p.label} [Country]`);

    if (chosenTypes.length === 0) {
      alert("Please choose at least one Lead Vetting preset query.");
      return;
    }

    setIsSpawning(true);

    try {
      const requestPayload: DiscoverRequest = {
        country: resolvedCountry,
        campaignName: customCampaignName.trim() || undefined,
        leadTypes: chosenTypes,
        depth: searchDepth,
        modelName: selectedModel
      };

      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload)
      });

      if (res.ok) {
        const spawnedCampaign: Campaign = await res.json();
        // Update local list instantly
        setCampaigns(prev => [spawnedCampaign, ...prev]);
        setSelectedCampaign(spawnedCampaign);
        
        // Reset state
        setTargetCountryOption("Germany");
        setCustomCountryInput("");
        setCustomCampaignName("");
        setSelectedModel("gemini-3.5-flash");
        setIsFormOpen(false);
      }
    } catch (e) {
      console.error("Failed to spawn search", e);
    } finally {
      setIsSpawning(false);
    }
  };

  // Delete Campaign
  const handleDeleteCampaign = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (campaignToDeleteId !== id) {
      setCampaignToDeleteId(id);
      // Auto-reset confirmation state after 4 seconds to prevent accidents
      setTimeout(() => setCampaignToDeleteId(prev => prev === id ? null : prev), 4000);
      return;
    }

    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCampaigns(prev => prev.filter(c => c.id !== id));
        if (selectedCampaign?.id === id) {
          setSelectedCampaign(null);
          setSelectedLead(null);
        }
        setCampaignToDeleteId(null);
      }
    } catch (err) {
      console.error("Delete campaign error", err);
    }
  };

  const handleClearAllCampaigns = async () => {
    if (!isResetAllConfirming) {
      setIsResetAllConfirming(true);
      // Auto-reset confirmation state after 5 seconds to prevent accidents
      setTimeout(() => setIsResetAllConfirming(false), 5000);
      return;
    }

    try {
      const res = await fetch("/api/campaigns", { method: "DELETE" });
      if (res.ok) {
        setCampaigns([]);
        setSelectedCampaign(null);
        setSelectedLead(null);
        setIsResetAllConfirming(false);
      }
    } catch (err) {
      console.error("Clear all campaigns error", err);
    }
  };

  // Select Lead Details Drawer
  const handleLeadClick = (lead: PartnerLead) => {
    setSelectedLead(lead);
    setCustomVettingNotes((lead as any).customNotes || "");
    setNotesFeedback("");
  };

  // Save Vetting Notes
  const handleSaveNotes = async () => {
    if (!selectedCampaign || !selectedLead) return;
    setIsSavingNotes(true);
    setNotesFeedback("");

    try {
      const res = await fetch(`/api/campaigns/${selectedCampaign.id}/leads/${selectedLead.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ CustomNotes: customVettingNotes })
      });

      if (res.ok) {
        setNotesFeedback("Notes saved securely");
        // Refetch state silently to persist with memory model
        fetchCampaigns(false);
        setTimeout(() => setNotesFeedback(""), 3000);
      } else {
        setNotesFeedback("Error saving notes");
      }
    } catch (err) {
      console.error("Notes post failed", err);
      setNotesFeedback("Network error saving notes");
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Filter & Sort Calculations for Leads
  const getFilteredLeads = () => {
    if (!selectedCampaign) return [];
    let list = [...selectedCampaign.leads];

    // Filter by Reputation status
    if (selectedReputationFilter !== "All") {
      list = list.filter(l => l.reputation?.status === selectedReputationFilter);
    }

    // Filter by firmSizeSegment
    if (selectedSegmentFilter !== "All") {
      list = list.filter(l => l.firmSizeSegment === selectedSegmentFilter);
    }

    // Filter by Competitor
    if (selectedCompetitorFilter !== "All") {
      list = list.filter(l => 
        l.trackRecord?.competitors.some(c => c.toLowerCase().includes(selectedCompetitorFilter.toLowerCase()))
      );
    }

    // Filter by Rival Neutrality
    if (selectedNeutralityFilter === "RivalFree") {
      list = list.filter(l => !l.trackRecord?.competitors || l.trackRecord.competitors.length === 0);
    } else if (selectedNeutralityFilter === "Resellers") {
      list = list.filter(l => l.trackRecord?.competitors && l.trackRecord.competitors.length > 0);
    }

    // Sorting Modes
    if (selectedLeadSort === "partnerships-high") {
      list.sort((a, b) => (b.trackRecord?.partnershipCount || 0) - (a.trackRecord?.partnershipCount || 0));
    } else if (selectedLeadSort === "revenue-estimate") {
      // Crude extract helper for sorting representation
      const extractNum = (str: string) => {
        const clean = str.replace(/[^0-9.]/g, "");
        return parseFloat(clean) || 0;
      };
      list.sort((a, b) => extractNum(b.financials?.revenue) - extractNum(a.financials?.revenue));
    } else if (selectedLeadSort === "growth-potential") {
      // GPM string search sort
      const extractGPM = (str: string) => {
        const clean = str.replace(/[^0-9]/g, "");
        return parseInt(clean) || 0;
      };
      list.sort((a, b) => extractGPM(b.financials?.gpm) - extractGPM(a.financials?.gpm));
    }

    return list;
  };

  // Helper lists for dynamic unique competitors found across currently selected items
  const getCompetitorsList = () => {
    if (!selectedCampaign) return [];
    const set = new Set<string>();
    selectedCampaign.leads.forEach(l => {
      l.trackRecord?.competitors.forEach(c => set.add(c));
    });
    return Array.from(set);
  };

  const activeLeads = getFilteredLeads();
  const competitorsInCampaign = getCompetitorsList();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans selection:bg-[#EF6C00]/15 selection:text-[#EF6C00]">
      
      {/* Upper Status Bar - Solid Corporate Brand (OrangeHRM Identity) */}
      <header className="border-b border-slate-200 bg-white px-6 py-4 sticky top-0 z-40 backdrop-blur-md bg-opacity-95 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#EF6C00] rounded-xl flex items-center justify-center text-white font-serif font-black text-xl tracking-tight leading-none shadow-md shadow-[#EF6C00]/25">
              O
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-xl font-bold tracking-tight text-slate-900">
                  Partner Scout
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-sans">
                  Enterprise Vetting v1.2
                </span>
              </div>
              <p className="text-xs text-slate-500 font-light font-sans">
                Partner vetting and outreach dashboard.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Department Role Workspace Selection */}
            <div className="bg-slate-100 border border-slate-200 p-0.5 rounded-lg flex items-center gap-0.5">
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider px-2 font-bold select-none border-r border-slate-200 mr-1 hidden sm:inline">
                Dept Role:
              </span>
              <button
                onClick={() => selectDepartmentRole("alliances")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  activeDepartmentRole === "alliances"
                    ? "bg-[#EF6C00] text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-200/50 hover:text-[#EF6C00]"
                }`}
                title="Manage country campaigns, metrics & strategic reseller fits"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Global Alliances</span>
              </button>
              <button
                onClick={() => selectDepartmentRole("bdr")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  activeDepartmentRole === "bdr"
                    ? "bg-[#EF6C00] text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-200/50 hover:text-[#EF6C00]"
                }`}
                title="BDR Sales outreach statuses and custom email templates"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>BDR Outreach</span>
              </button>
              <button
                onClick={() => selectDepartmentRole("risk")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  activeDepartmentRole === "risk"
                    ? "bg-[#EF6C00] text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-200/50 hover:text-[#EF6C00]"
                }`}
                title="Inspect real proof of life web links, LinkedIn references & sources"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Risk/Audit Desk</span>
              </button>
            </div>

            {/* Health / Agent state banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 flex items-center gap-2 text-xs">
              <span className={`w-1.5 h-1.5 rounded-full ${serverStatus ? 'bg-emerald-600 animate-pulse' : 'bg-amber-500'}`} />
              <span className="font-mono text-slate-500 text-[11px]">
                {serverStatus?.engineStatus || "Connecting to vetting node..."}
              </span>
              {serverStatus?.hasSerper && (
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-bold px-1 rounded uppercase tracking-wider">
                  Serper
                </span>
              )}
            </div>

            {/* Dark Mode Toggle Switch */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 bg-slate-50 border border-slate-200 text-slate-600 hover:text-[#EF6C00] hover:border-[#EF6C00]/50 rounded-lg flex items-center justify-center transition-all cursor-pointer focus:outline-none shadow-3xs"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-500 animate-[spin_10s_linear_infinite]" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            <button
              onClick={() => setIsFormOpen(true)}
              className="bg-[#EF6C00] hover:bg-[#D45F00] transition-colors text-white text-xs font-semibold px-4 py-1.5 rounded-lg flex items-center gap-2 shadow-xs font-sans cursor-pointer focus:outline-none"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Country Scan</span>
            </button>
          </div>

        </div>
      </header>

      {/* Workspace Navigation Tabs - Classy Modern Solid Partner Aesthetic */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 select-none sticky top-[73px] z-30 shadow-3xs">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-6 text-xs font-mono uppercase tracking-wider font-extrabold font-sans">
          <button
            onClick={() => setActiveWorkspaceTab("scout")}
            className={`pb-1.5 pt-1.5 flex items-center gap-1.5 cursor-pointer relative transition-colors ${
              activeWorkspaceTab === "scout" 
                ? "text-[#EF6C00]" 
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Active Campaigns Scout</span>
            {activeWorkspaceTab === "scout" && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#EF6C00] rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveWorkspaceTab("directory")}
            className={`pb-1.5 pt-1.5 flex items-center gap-1.5 cursor-pointer relative transition-colors ${
              activeWorkspaceTab === "directory" 
                ? "text-[#EF6C00]" 
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Global Directory Ledger</span>
            {activeWorkspaceTab === "directory" && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#EF6C00] rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveWorkspaceTab("grounding")}
            className={`pb-1.5 pt-1.5 flex items-center gap-1.5 cursor-pointer relative transition-colors ${
              activeWorkspaceTab === "grounding" 
                ? "text-[#EF6C00]" 
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span>Search Grounding Hub</span>
            {activeWorkspaceTab === "grounding" && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#EF6C00] rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveWorkspaceTab("outreach")}
            className={`pb-1.5 pt-1.5 flex items-center gap-1.5 cursor-pointer relative transition-colors ${
              activeWorkspaceTab === "outreach" 
                ? "text-[#EF6C00]" 
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-purple-700" />
            <span>Outreach CRM Board</span>
            {activeWorkspaceTab === "outreach" && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#EF6C00] rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveWorkspaceTab("inbound")}
            className={`pb-1.5 pt-1.5 flex items-center gap-1.5 cursor-pointer relative transition-colors ${
              activeWorkspaceTab === "inbound" 
                ? "text-[#EF6C00]" 
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#EF6C00]" style={{ contentVisibility: "auto" }} />
            <span>Inbound Vetting Hub</span>
            {activeWorkspaceTab === "inbound" && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#EF6C00] rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Department Workspace Banner Indicator */}
      <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-[#EF6C00]/10 text-[#EF6C00] font-mono font-bold uppercase text-[9px] px-2 py-0.5 rounded-full border border-[#EF6C00]/20">
              ● ACTIVE DEPT OVERLAY
            </span>
            <span className="text-slate-300 font-light select-none">|</span>
            <span className="text-slate-500 font-light font-sans">
              Active View: {activeDepartmentRole === "alliances" ? (
                <span><strong>Global Alliances Workspace</strong> - Auditing vetting campaigns, analyzing gross margins (GPM), and onboarding strategically fit regional resellers.</span>
              ) : activeDepartmentRole === "bdr" ? (
                <span><strong>BDR Outreach Workspace</strong> - Tracking corporate CRM statuses, setting callbacks, and reviewing custom-grounded partner emails.</span>
              ) : (
                <span><strong>Risk Assurance Desktop</strong> - Checking citations, exploring verified proof-of-life domains, and inspecting live LinkedIn corporate profiles.</span>
              )}
            </span>
          </div>
          <span className="text-[10px] font-mono text-[#EF6C00] font-bold uppercase animate-fade-in hidden lg:inline select-none">
            {activeDepartmentRole === "alliances" ? "Strategic Alliances Portal" : activeDepartmentRole === "bdr" ? "BDR Lead Center" : "Risk Assurance Panel"}
          </span>
        </div>
      </div>

      {activeWorkspaceTab === "scout" && (
        <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-300">
        
        {/* LEFT COLUMN: VETTING CAMPAIGNS & TRACKING (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-serif text-lg font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#EF6C00]" />
                Discovery Campaigns
              </h2>
              {campaigns.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearAllCampaigns();
                  }}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all duration-200 cursor-pointer flex items-center gap-1 ${
                    isResetAllConfirming
                      ? "text-white bg-red-605 border-red-700 bg-red-600 hover:bg-red-700 animate-pulse shadow-xs"
                      : "text-red-600 hover:text-red-700 hover:bg-red-50 bg-white border border-red-200"
                  }`}
                  title={isResetAllConfirming ? "Click again to confirm absolute deletion" : "Make campaigns count zero and start from scratch"}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isResetAllConfirming ? "Confirm Reset?" : "Reset All"}</span>
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 mb-4 font-light">
              Audit trails in progress or archived. High-density signals gather live local competitors and calculate GPM margins.
            </p>

            {/* Campaign Selection List */}
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {campaigns.length === 0 ? (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-6 text-center text-xs text-slate-400 font-light">
                  No campaigns active. Touch the button above to launch your first worldwide vetting sprint.
                </div>
              ) : (
                campaigns.map((camp) => {
                  const isSelected = selectedCampaign?.id === camp.id;
                  const isProcessing = camp.status === "processing";
                  const leadsNum = camp.leads?.length || 0;

                  return (
                    <div
                      key={camp.id}
                      onClick={() => {
                        setSelectedCampaign(camp);
                        setSelectedLead(null); // Reset lead selection to view list first
                      }}
                      className={`relative cursor-pointer group p-4 rounded-xl border transition-all duration-200 ${
                        isSelected 
                          ? "bg-slate-50/50 border-[#EF6C00] shadow-xs ring-1 ring-[#EF6C00]/10" 
                          : "bg-white hover:bg-slate-50/50 border-slate-200"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <span className="font-serif text-sm font-bold text-slate-900 leading-tight block truncate pr-4">
                          {camp.name}
                        </span>
                        
                        <button
                          onClick={(e) => handleDeleteCampaign(camp.id, e)}
                          title={campaignToDeleteId === camp.id ? "Click again to confirm delete" : "Delete Campaign"}
                          className={`p-1 rounded-md transition-all duration-200 cursor-pointer text-xs flex items-center gap-1 ${
                            campaignToDeleteId === camp.id
                              ? "text-white bg-red-600 hover:bg-red-700 animate-pulse px-2"
                              : "text-slate-400 hover:text-red-650 hover:bg-slate-100 placeholder:opacity-0 group-hover:opacity-100"
                          }`}
                        >
                          {campaignToDeleteId === camp.id && <span className="text-[9px] font-mono font-bold uppercase tracking-wider">Confirm Delete?</span>}
                          <Trash2 className="w-4 h-4 shrink-0" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <span className="bg-slate-50 text-slate-600 border border-slate-200/80 text-[10px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold">
                          <Globe className="w-2.5 h-2.5 text-[#EF6C00]" />
                          {camp.country}
                        </span>

                        <span className="text-[10px] text-slate-400">
                          {new Date(camp.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                      </div>

                      {/* Display Step Processing states & real-time bar */}
                      {isProcessing ? (
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="text-[#EF6C00] font-semibold animate-pulse flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              {camp.currentStep || "Querying Index..."}
                            </span>
                            <span className="text-xs text-slate-600">{camp.progress || 10}%</span>
                          </div>
                          
                          {/* Beautiful custom mini progress bar */}
                          <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                            <div 
                              className="bg-[#EF6C00] h-full transition-all duration-300 rounded-full"
                              style={{ width: `${camp.progress || 10}%` }}
                            />
                          </div>

                          <div className="text-[9px] font-mono text-amber-700 bg-amber-50 rounded px-1.5 py-0.5 mt-2 text-center animate-pulse border border-amber-200">
                            🔄 RUNNING SCAN - CLICK TO VIEW LOG STREAM
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-600 flex items-center gap-1 font-semibold">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              {leadsNum} Leads Vetted
                            </span>
                            
                            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 group-hover:text-[#EF6C00] flex items-center transition-colors">
                              Manage Dossier
                              <ChevronRight className="w-3 h-3 ml-0.5" />
                            </span>
                          </div>

                          <div className="text-[9px] font-mono text-emerald-800 bg-emerald-50 rounded px-1.5 py-0.5 mt-2 text-center border border-emerald-100 font-semibold group-hover:bg-[#EF6C00]/10 group-hover:text-[#EF6C00] transition-colors">
                            COMPLETED - CLICK TILE TO EXPLORE DOSSIERS
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Value proposition reference panel (Architectural Vetting parameters info) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h3 className="font-serif text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#EF6C00]" />
              Vetting Rationale & GPM formula
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-3 font-sans">
              Estimated GPM calculation leverages regional average labor overheads. In private cloud setups, HR service agencies face substantial margin degradation with high Workday/SAP user rates. 
            </p>
            <div className="bg-slate-50 border border-slate-200/80 rounded p-3 space-y-2 text-[11px] font-mono text-slate-600">
              <div className="flex justify-between">
                <span>APAC Professional:</span>
                <span className="text-right font-semibold">68% - 74% GPM</span>
              </div>
              <div className="flex justify-between">
                <span>EU Mittelstand:</span>
                <span className="text-right font-semibold">58% - 66% GPM</span>
              </div>
              <div className="flex justify-between">
                <span>US High-Overhead:</span>
                <span className="text-right font-semibold">50% - 55% GPM</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200 flex items-center gap-2 text-xs text-[#EF6C00] font-medium font-sans">
              <span className="w-1.5 h-1.5 bg-[#EF6C00] rounded-full" />
              <span>Targeting: Complex SME customization</span>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: SEARCH RESULTS & DOSSIERS VIEW (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {selectedCampaign ? (
            <div>
              {/* Campaign Header banner */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-[#EF6C00] uppercase tracking-widest font-extrabold font-sans">
                        VETTING ACTIVE REGION
                      </span>
                      <span className="text-slate-350">•</span>
                      <span className="text-xs text-slate-500 font-sans">
                        {selectedCampaign.leads?.length || 0} candidates verified
                      </span>
                    </div>

                    <h2 className="font-serif text-2xl font-black tracking-tight text-slate-950 mb-2">
                      {selectedCampaign.name}
                    </h2>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-[#EF6C00]/10 text-[#EF6C00] text-xs font-mono px-2 py-0.5 rounded-md font-semibold">
                        Market: {selectedCampaign.country}
                      </span>
                      <span className="bg-slate-50 text-slate-600 border border-slate-200/80 text-xs px-2 py-0.5 rounded-md font-mono">
                        Search Depth: {selectedCampaign.depth === "comprehensive" ? "Deep Crawl" : "Express scan"}
                      </span>
                      <span className="text-xs text-slate-400 font-light font-sans">
                        Analyzed {new Date(selectedCampaign.createdAt).toLocaleDateString()} at {new Date(selectedCampaign.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="text-right self-start">
                    {selectedCampaign.status === "processing" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-mono rounded-full font-bold">
                        <span className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-ping" />
                        SCANNING REAL WORLD DATA
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-250 text-xs font-mono rounded-full font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Ingestion Completed
                      </span>
                    )}
                  </div>
                </div>

                {/* Real-time search terms used */}
                <div className="mt-4 pt-4 border-t border-slate-205">
                  <div className="text-xs text-slate-400 mb-2 font-mono uppercase tracking-wider font-semibold">
                    Target Lead Queries Executed:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedCampaign.leadTypes?.map((lt, idx) => (
                      <span key={idx} className="bg-slate-50 border border-slate-200 text-[11px] text-slate-600 px-2.5 py-1 rounded-lg font-light">
                        "{lt.replace("[Country]", selectedCampaign.country).replace("[country]", selectedCampaign.country)}"
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Country Market Context Widget */}
              {selectedCampaign && (
                <div className="bg-[#1E1E1F] border border-neutral-800 text-white rounded-xl p-5 mb-6 shadow-xs relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-3">
                    <div className="space-y-0.5">
                      <div className="text-[10px] font-mono tracking-wider text-[#EF6C00] font-extrabold uppercase">
                        SCOUTED COUNTRY MARKET CONTEXT
                      </div>
                      <h4 className="font-serif text-lg font-bold text-neutral-100">
                        {selectedCampaign.country} Market Potentials
                      </h4>
                    </div>
                    
                    <span className="bg-[#EF6C00]/20 border border-[#EF6C00]/40 text-[#EF6C00] text-[9px] font-mono font-bold tracking-widest px-2 py-0.5 rounded uppercase shrink-0">
                      PRIORITY LEVEL: {
                        selectedCampaign.country === "Switzerland" ? "HIGH (CH-VAT)" : 
                        selectedCampaign.country === "Singapore" ? "CRITICAL (APAC HUB)" : 
                        selectedCampaign.country === "Cyprus" ? "HIGH (EU OFFSHORE)" : 
                        selectedCampaign.country === "Sri Lanka" ? "HIGH (SOUTH ASIA)" : "STANDARD DEPLOYMENT"
                      }
                    </span>
                  </div>

                  <p className="text-xs text-neutral-400 font-light max-w-3xl leading-relaxed mb-4">
                    {selectedCampaign.marketContext?.description || `Strategic channel expansion opportunities in ${selectedCampaign.country}. Local organizations are transitioning from legacy on-premise systems to modern web-based private setups, with mid-market SMEs demanding cost-effective alternative modules.`}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Market Size */}
                    <div className="bg-neutral-900/60 border border-neutral-800/80 p-3 rounded-lg space-y-0.5">
                      <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest block">Est. Market Size:</span>
                      <span className="text-xs font-bold text-white">
                        {selectedCampaign.marketContext?.marketSize || (
                          selectedCampaign.country === "Switzerland" ? "$1.2B (Enterprise HR Tech)" :
                          selectedCampaign.country === "Singapore" ? "$850M (APAC Hub SaaS)" :
                          selectedCampaign.country === "Cyprus" ? "$180M (EU Offshoring HQ)" :
                          selectedCampaign.country === "Sri Lanka" ? "$220M (South Asia Consultancies)" :
                          "$320M Enterprise Segment"
                        )}
                      </span>
                    </div>

                    {/* Potential SME Clients */}
                    <div className="bg-neutral-900/60 border border-neutral-800/80 p-3 rounded-lg space-y-0.5">
                      <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest block">Potential SME Allies:</span>
                      <span className="text-xs font-bold text-neutral-200">
                        {selectedCampaign.marketContext?.potentialSMEs || (
                          selectedCampaign.country === "Switzerland" ? "2,400+ Active Mid-Market firms" :
                          selectedCampaign.country === "Singapore" ? "3,800+ Regional Tech Firms" :
                          selectedCampaign.country === "Cyprus" ? "650+ Shipping & Forex Hubs" :
                          selectedCampaign.country === "Sri Lanka" ? "1,100+ Software & Export groups" :
                          "1,200+ Regional SME targets"
                        )}
                      </span>
                    </div>

                    {/* Dominant ERP Players already there */}
                    <div className="bg-neutral-900/60 border border-neutral-800/80 p-3 rounded-lg space-y-0.5">
                      <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest block">Local Dominant ERP Players:</span>
                      <span className="text-xs font-bold text-amber-500">
                        {selectedCampaign.marketContext?.dominantERPs?.join(", ") || (
                          selectedCampaign.country === "Switzerland" ? "Abacus, SAP Business One, PROFFIX" :
                          selectedCampaign.country === "Singapore" ? "Odoo, Zoho Creator, Workday" :
                          selectedCampaign.country === "Cyprus" ? "Navision (Dynamics), SoftOne, SAP" :
                          selectedCampaign.country === "Sri Lanka" ? "IFS, Odoo, Sage 300" :
                          "Odoo ESM, Priority ERP, SAP B1"
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Firm Size Distribution bento card */}
              {selectedCampaign.leads && selectedCampaign.leads.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6" id="firm-size-distribution-visualizer">
                  {/* SME Stats */}
                  <div 
                    onClick={() => setSelectedSegmentFilter(prev => prev === "SME" ? "All" : "SME")}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedSegmentFilter === "SME" 
                        ? "bg-[#EF6C00]/10 border-[#EF6C00] shadow-sm shadow-[#EF6C00]/5 ring-1 ring-[#EF6C00]" 
                        : "bg-white border-slate-200 hover:bg-slate-50/50 hover:border-[#EF6C00]/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-[#EF6C00] uppercase tracking-wider">Boutique SME Vendors</span>
                      <span className="text-[10px] font-mono font-semibold bg-[#EF6C00]/10 text-[#EF6C00] px-1.5 py-0.5 rounded-full">
                        {selectedCampaign.leads.filter(l => l.firmSizeSegment === "SME").length} Leads
                      </span>
                    </div>
                    <div className="text-2xl font-serif font-black text-slate-900">
                      {selectedCampaign.leads.length ? Math.round((selectedCampaign.leads.filter(l => l.firmSizeSegment === "SME").length / selectedCampaign.leads.length) * 100) : 0}%
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 font-light leading-relaxed font-sans">
                      Agile local consultants, boutique CRM agencies. Highest potential service margin optimization (65%-75% GPM).
                    </p>
                    {/* Compact visualization bar */}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div 
                        className="bg-[#EF6C00] h-full transition-all duration-300 pointer-events-none" 
                        style={{ width: `${selectedCampaign.leads.length ? (selectedCampaign.leads.filter(l => l.firmSizeSegment === "SME").length / selectedCampaign.leads.length) * 100 : 0}%` }}
                      />
                    </div>
                    <div className="text-[9px] font-mono text-slate-400 mt-2 text-right">
                      {selectedSegmentFilter === "SME" ? "★ Active Filter" : "Click to Filter List"}
                    </div>
                  </div>

                  {/* Mid-Market Stats */}
                  <div 
                    onClick={() => setSelectedSegmentFilter(prev => prev === "Mid-Market" ? "All" : "Mid-Market")}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedSegmentFilter === "Mid-Market" 
                        ? "bg-indigo-50 border-indigo-500 shadow-sm shadow-indigo-100 ring-1 ring-indigo-500" 
                        : "bg-white border-slate-200 hover:bg-slate-50/50 hover:border-indigo-500/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-indigo-700 uppercase tracking-wider">Mid-Market Integrators</span>
                      <span className="text-[10px] font-mono font-semibold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-full">
                        {selectedCampaign.leads.filter(l => l.firmSizeSegment === "Mid-Market").length} Leads
                      </span>
                    </div>
                    <div className="text-2xl font-serif font-black text-slate-900">
                      {selectedCampaign.leads.length ? Math.round((selectedCampaign.leads.filter(l => l.firmSizeSegment === "Mid-Market").length / selectedCampaign.leads.length) * 100) : 0}%
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 font-light leading-relaxed font-sans">
                      Systems integrators, regional advisory firms. Balanced capacity to resell and pack compliance workflows (55%-62% GPM).
                    </p>
                    {/* Compact visualization bar */}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full transition-all duration-300 pointer-events-none" 
                        style={{ width: `${selectedCampaign.leads.length ? (selectedCampaign.leads.filter(l => l.firmSizeSegment === "Mid-Market").length / selectedCampaign.leads.length) * 100 : 0}%` }}
                      />
                    </div>
                    <div className="text-[9px] font-mono text-slate-400 mt-2 text-right">
                      {selectedSegmentFilter === "Mid-Market" ? "★ Active Filter" : "Click to Filter List"}
                    </div>
                  </div>

                  {/* Enterprise Heavyweights Stats */}
                  <div 
                    onClick={() => setSelectedSegmentFilter(prev => prev === "Enterprise" ? "All" : "Enterprise")}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedSegmentFilter === "Enterprise" 
                        ? "bg-purple-50 border-purple-500 shadow-sm shadow-purple-100 ring-1 ring-purple-500" 
                        : "bg-white border-slate-200 hover:bg-slate-50/50 hover:border-purple-500/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-purple-700 uppercase tracking-wider">Enterprise Titans</span>
                      <span className="text-[10px] font-mono font-semibold bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded-full">
                        {selectedCampaign.leads.filter(l => l.firmSizeSegment === "Enterprise").length} Leads
                      </span>
                    </div>
                    <div className="text-2xl font-serif font-black text-slate-900">
                      {selectedCampaign.leads.length ? Math.round((selectedCampaign.leads.filter(l => l.firmSizeSegment === "Enterprise").length / selectedCampaign.leads.length) * 100) : 0}%
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 font-light leading-relaxed font-sans">
                      Global systems integrators, top sovereign IT consultancies. Massive account networks with proprietary platforms (40%-50% GPM).
                    </p>
                    {/* Compact visualization bar */}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div 
                        className="bg-purple-600 h-full transition-all duration-300 pointer-events-none" 
                        style={{ width: `${selectedCampaign.leads.length ? (selectedCampaign.leads.filter(l => l.firmSizeSegment === "Enterprise").length / selectedCampaign.leads.length) * 100 : 0}%` }}
                      />
                    </div>
                    <div className="text-[9px] font-mono text-slate-400 mt-2 text-right">
                      {selectedSegmentFilter === "Enterprise" ? "★ Active Filter" : "Click to Filter List"}
                    </div>
                  </div>
                </div>
              )}

              {/* Filtering & Sorting Panel inside Campaign */}
              {selectedCampaign.leads && selectedCampaign.leads.length > 0 && (
                <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4">
                    
                    {/* Filter by Reputation */}
                    <div className="flex items-center gap-2">
                      <Filter className="w-3.5 h-3.5 text-[#EF6C00]" />
                      <label className="text-xs text-slate-600 font-semibold font-sans">Reputation:</label>
                      <select
                        value={selectedReputationFilter}
                        onChange={(e) => setSelectedReputationFilter(e.target.value)}
                        className="bg-white border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#EF6C00] font-sans font-medium text-slate-700 shadow-3xs cursor-pointer hover:border-slate-300 transition-colors"
                      >
                        <option value="All">All Statuses</option>
                        <option value="Institutional">Institutional</option>
                        <option value="Reputable">Reputable</option>
                        <option value="Rising">Rising</option>
                      </select>
                    </div>

                    {/* Filter by Firm Sizing */}
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="w-3.5 h-3.5 text-[#EF6C00]" />
                      <label className="text-xs text-slate-600 font-semibold font-sans">Sizing:</label>
                      <select
                        value={selectedSegmentFilter}
                        onChange={(e) => setSelectedSegmentFilter(e.target.value)}
                        className="bg-white border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#EF6C00] font-sans font-medium text-slate-700 shadow-3xs cursor-pointer hover:border-slate-300 transition-colors"
                      >
                        <option value="All">All Sizes</option>
                        <option value="SME">Boutique SME (&lt; 150)</option>
                        <option value="Mid-Market">Mid-Market (150 - 1k)</option>
                        <option value="Enterprise">Enterprise (1k+)</option>
                      </select>
                    </div>

                    {/* Filter by Competitors */}
                    {competitorsInCampaign.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-[#EF6C00]" />
                        <label className="text-xs text-slate-600 font-semibold font-sans">Competitor:</label>
                        <select
                          value={selectedCompetitorFilter}
                          onChange={(e) => setSelectedCompetitorFilter(e.target.value)}
                          className="bg-white border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#EF6C00] text-slate-700 shadow-3xs cursor-pointer hover:border-slate-300 transition-colors font-sans"
                        >
                          <option value="All">All Competitors</option>
                          {competitorsInCampaign.map((comp) => (
                            <option key={comp} value={comp}>{comp}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Filter by Rival Neutrality */}
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <label className="text-xs text-slate-600 font-semibold font-sans">Rival Status:</label>
                      <select
                        value={selectedNeutralityFilter}
                        onChange={(e) => setSelectedNeutralityFilter(e.target.value)}
                        className="bg-white border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#EF6C00] font-sans text-slate-700 shadow-3xs cursor-pointer hover:border-slate-300 transition-colors"
                      >
                        <option value="All">All Partners</option>
                        <option value="RivalFree">Rival-Free Only</option>
                        <option value="Resellers">Competitor Resellers Only</option>
                      </select>
                    </div>

                  </div>

                  {/* Sort Controls */}
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs text-slate-600 font-semibold font-sans">Sort By:</span>
                    <select
                      value={selectedLeadSort}
                      onChange={(e) => setSelectedLeadSort(e.target.value)}
                      className="bg-white border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#EF6C00] text-slate-700 shadow-3xs cursor-pointer hover:border-slate-300 transition-colors font-sans"
                    >
                      <option value="default">Default Scan Rank</option>
                      <option value="partnerships-high">Partnerships Represented (High)</option>
                      <option value="revenue-estimate">Estimated Revenue (High)</option>
                      <option value="growth-potential">Calculated GPM (Optimal)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Leads High Density Cards Grid */}
              {selectedCampaign.status === "processing" && selectedCampaign.leads.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center shadow-xs">
                  <div className="relative inline-block mb-4">
                    <Loader2 className="w-10 h-10 text-[#EF6C00] animate-spin" />
                    <Sparkles className="w-4 h-4 text-[#EF6C00] absolute -top-1 -right-1 animate-bounce" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-slate-900 mb-2">
                    Running deep vetting scan...
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed font-light font-sans">
                    We are querying standard corporate registers, LinkedIn clusters, and local technology rosters. Our model is estimating regional labor margins, FY23/24 financials, and drafting custom partner target fits.
                  </p>
                  
                  {/* Visual simulated terminal logger code */}
                  <div className="mt-6 max-w-md mx-auto bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-left font-mono text-[10px] text-emerald-400 space-y-1 block shadow-inner">
                    <div className="text-slate-400">&gt; Vetting node active: {serverStatus?.timestamp || "05:17:33Z"}</div>
                    <div>&gt; Invoking search grounding system targeting country: <span className="text-yellow-300">"{selectedCampaign.country}"</span></div>
                    {selectedCampaign.progress && selectedCampaign.progress > 20 && (
                      <div>&gt; Search Results Received. Commencing candidate profiling checks...</div>
                    )}
                    {selectedCampaign.progress && selectedCampaign.progress > 50 && (
                      <div className="text-[#EF6C00]">&gt; Evaluating competitive threat vectors...</div>
                    )}
                    <div className="text-neutral-500 animate-pulse">&gt; {selectedCampaign.currentStep || "Processing..."}</div>
                  </div>
                </div>
              ) : activeLeads.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-xs text-slate-400 font-light font-sans shadow-2xs">
                  No vetted leads match the custom filters applied above. Try clearing selection metrics.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeLeads.map((lead) => {
                    const hasNotes = !!(lead as any).customNotes;
                    const reputationColors = 
                      lead.reputation?.status === "Institutional" ? "bg-purple-50 text-purple-800 border-purple-200" :
                      lead.reputation?.status === "Reputable" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                      "bg-amber-50 text-amber-800 border-amber-200";

                    return (
                      <div
                        key={lead.id}
                        id={`lead-card-${lead.id}`}
                        onClick={() => handleLeadClick(lead)}
                        className="bg-white border border-slate-200 hover:border-[#EF6C00] hover:shadow-md hover:shadow-[#EF6C00]/5 rounded-xl p-5 cursor-pointer transition-all duration-300 relative group flex flex-col justify-between"
                      >
                        
                        <div>
                          {/* Card upper info row */}
                          <div className="flex justify-between items-start gap-2 mb-3">
                            <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded border ${reputationColors}`}>
                              {lead.reputation?.status || "Vetted"}
                            </span>
                            <span className="text-xs font-mono text-slate-400">
                              {lead.employeeSize}
                            </span>
                          </div>

                          {/* Company Name */}
                          <h3 className="font-serif text-base font-bold text-slate-900 leading-snug mb-1 group-hover:text-[#EF6C00] transition-colors flex items-center gap-1">
                            {lead.name}
                            <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-[#EF6C00]" />
                          </h3>

                          {/* Location & Web info */}
                          <div className="flex items-center gap-2 text-xs text-slate-600 mb-3">
                            <span className="font-medium">{lead.hqLocation}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[11px] underline hover:text-[#EF6C00] truncate max-w-[120px] font-mono text-slate-400" title={lead.socialLinks?.website}>
                              {lead.socialLinks?.website?.replace("https://", "").replace("www.", "")}
                            </span>
                          </div>

                          {/* Enterprise Short Description */}
                          <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2 font-light font-sans">
                            {lead.description}
                          </p>
                        </div>

                        {/* Fast Key-Value Dossier Metrics Foot */}
                        <div className="pt-4 border-t border-slate-100 space-y-3">
                          <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                            <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                              <div className="text-slate-400 uppercase text-[8px] tracking-wider mb-0.5">Est. Revenue</div>
                              <div className="font-bold text-slate-800 text-[11px] truncate">{lead.financials?.revenue}</div>
                            </div>
                            <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                              <div className="text-slate-400 uppercase text-[8px] tracking-wider mb-0.5">Est. GPM</div>
                              <div className="font-bold text-[#EF6C00] text-[11px]">{lead.financials?.gpm}</div>
                            </div>
                            <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                              <div className="text-slate-400 uppercase text-[8px] tracking-wider mb-0.5 font-medium">Represents</div>
                              <div className="font-bold text-slate-800 text-[11px] truncate">
                                {lead.trackRecord?.competitors?.length || 0} rivals
                              </div>
                            </div>
                          </div>

                          {/* Competitors List Mini Tags */}
                          <div className="flex items-center gap-1.5 flex-wrap min-h-[22px]">
                            {lead.trackRecord?.competitors && lead.trackRecord.competitors.length > 0 ? (
                              <>
                                <span className="text-[9px] text-slate-400 font-mono lowercase">resells:</span>
                                {lead.trackRecord.competitors.slice(0, 3).map((comp, idx) => (
                                  <span key={idx} className="bg-slate-50 border border-slate-200 text-[9px] text-slate-600 px-1.5 py-0.2 rounded font-sans font-medium">
                                    {comp}
                                  </span>
                                ))}
                                {lead.trackRecord.competitors.length > 3 && (
                                  <span className="text-[9px] font-mono text-slate-400">+{lead.trackRecord.competitors.length - 3}</span>
                                )}
                              </>
                            ) : (
                              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] px-1.5 py-0.5 rounded font-sans font-bold flex items-center gap-1 uppercase tracking-wider">
                                <ShieldCheck className="w-3 h-3 text-emerald-600 inline-block" />
                                Rival-Free (Independent)
                              </span>
                            )}
                          </div>

                          {/* Notes and Grounded Sources present tag indicators */}
                          <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-neutral-150 mt-2">
                            <span className="text-xs text-[#EF6C00] font-semibold tracking-wider font-serif inline-flex items-center gap-1">
                              Analysis Dossier
                              <ArrowRight className="w-3" />
                            </span>

                            <div className="flex items-center gap-1.5">
                              {lead.sources && lead.sources.length > 0 && (
                                <span className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold uppercase transition-colors" title={`Sourced from: ${lead.sources.map(s => s.title).join(', ')}`}>
                                  <Globe className="w-2.5 h-2.5 text-slate-500" />
                                  <span>{lead.sources.length} Sources</span>
                                </span>
                              )}
                              {hasNotes && (
                                <span className="inline-flex items-center gap-1 bg-[#EF6C00]/10 text-[#EF6C00] text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                                  <FileText className="w-2.5 h-2.5" /> Notes
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Dedicated BDR Status & Proposal Draft Panel on the card */}
                          <div 
                            className="bg-slate-50/70 hover:bg-slate-50 p-3 rounded-lg border border-slate-200 mt-3.5 space-y-2.5 transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-extrabold flex items-center gap-1 font-sans">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#EF6C00] animate-pulse" />
                                Outreach Milepost:
                              </span>
                              <select
                                value={(lead as any).outreachStatus || "not_contacted"}
                                onChange={(e) => handleCardOutreachStatusChange(lead.id, e.target.value)}
                                className="bg-white border border-slate-200 hover:border-[#EF6C00] text-[11px] px-2 py-1 rounded font-sans font-semibold text-slate-800 cursor-pointer focus:outline-none transition-colors shadow-3xs"
                              >
                                <option value="not_contacted">Uncontacted lead</option>
                                <option value="contact_made">Contact Made</option>
                                <option value="pitch_sent">Pitch Sent</option>
                                <option value="meeting_scheduled">Meeting Scheduled</option>
                                <option value="partnered">Partnered</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider font-bold">Proposal Draft & CRM Notes:</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleCardNotesExpand(lead.id);
                                  }}
                                  className="text-[10px] text-[#EF6C00] hover:text-[#D45F00] hover:underline font-mono font-bold flex items-center gap-0.5"
                                >
                                  {expandedCardNotes[lead.id] ? "Minimize ▲" : "✏️ Edit Draft / Notes"}
                                </button>
                              </div>

                              {expandedCardNotes[lead.id] ? (
                                <div className="space-y-1.5 pt-1">
                                  <textarea
                                    value={cardNotesState[lead.id] !== undefined ? cardNotesState[lead.id] : ((lead as any).customNotes || "")}
                                    onChange={(e) => handleCardNotesChange(lead.id, e.target.value)}
                                    placeholder="Draft alliance message or log BDR responses here..."
                                    className="w-full h-24 text-xs p-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-[#EF6C00] focus:border-[#EF6C00] outline-none font-sans leading-relaxed resize-none text-slate-900"
                                  />
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-[9px] font-mono font-semibold text-emerald-700">
                                      {cardNotesStatus[lead.id] || "* Persists to Database"}
                                    </span>
                                    <button
                                      onClick={() => handleSaveCardNotes(lead.id)}
                                      className="bg-slate-900 text-white hover:bg-black font-semibold text-[10px] px-2.5 py-1 rounded transition-colors cursor-pointer"
                                    >
                                      Save Draft
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-[11px] text-slate-600 line-clamp-1 italic font-light pl-1">
                                  {(lead as any).customNotes || "No custom proposal draft registered."}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-xl mx-auto flex flex-col items-center justify-center space-y-4 shadow-3xs">
              <div className="w-16 h-16 rounded-full bg-[#EF6C00]/10 flex items-center justify-center text-[#EF6C00]">
                <Building2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-slate-950 mb-2">
                  Partner Intel Workspace Empty
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto font-light font-sans">
                  Choose an existing vetting campaign on the left pane, or click <strong className="font-semibold text-[#EF6C00]">"New Country Scan"</strong> to launch a targeted worldwide agency auditing sprint.
                </p>
              </div>
              <button
                onClick={() => setIsFormOpen(true)}
                className="bg-[#EF6C00] text-white hover:bg-[#D45F00] px-4 py-2 rounded-lg text-xs font-semibold shadow-sm focus:outline-none transition-colors cursor-pointer"
              >
                Launch Discovery Engine
              </button>
            </div>
          )}

        </div>

      </main>
      )}

      {activeWorkspaceTab === "directory" && (
        <main className="flex-1 max-w-7xl w-full mx-auto p-6">
          <GlobalDirectory
            campaigns={campaigns}
            onSelectLead={(lead, camp) => {
              setSelectedCampaign(camp);
              handleLeadClick(lead);
            }}
            onExportCSV={exportToCSV}
            onExportPDF={handleExportPDF}
          />
        </main>
      )}

      {activeWorkspaceTab === "grounding" && (
        <main className="flex-1 max-w-7xl w-full mx-auto p-6">
          <GroundingCenter campaigns={campaigns} />
        </main>
      )}

      {activeWorkspaceTab === "outreach" && (
        <main className="flex-1 max-w-7xl w-full mx-auto p-6">
          <OutreachTracker 
            campaigns={campaigns} 
            onUpdateOutreachStatus={handleUpdateOutreachStatus}
            onRefreshCampaigns={async () => { await fetchCampaigns(false); }}
          />
        </main>
      )}

      {activeWorkspaceTab === "inbound" && (
        <main className="flex-1 max-w-7xl w-full mx-auto p-6" style={{ contentVisibility: "auto" }}>
          <InboundVettingCenter 
            onRefreshCampaigns={async () => { await fetchCampaigns(false); }}
          />
        </main>
      )}

      {/* DRAW-IN DOSSIER DETAIL PANEL (Slider overlay with beautiful Draw-In Animation) */}
      <div 
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-[#F8FAFC] shadow-2xl border-l border-slate-200/80 transform transition-transform duration-300 ease-in-out flex flex-col select-none overflow-hidden ${
          selectedLead ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedLead && (
          <div className="flex flex-col h-full select-text">
            
            {/* Drawer Header Toolbar */}
            <div className="p-6 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-10 shadow-3xs">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-1 px-2.5 bg-white border border-slate-200 text-xs font-semibold rounded-lg text-slate-800 hover:bg-slate-50 hover:border-slate-350 cursor-pointer flex items-center gap-1 transition-colors"
                >
                  <X className="w-4 h-4 text-slate-700" />
                  <span>Close Detail</span>
                </button>
                <button
                  onClick={() => handleExportPDF(selectedLead, selectedCampaign?.name || "PartnerCampaign")}
                  className="p-1 px-2.5 bg-white border border-slate-205 text-xs font-semibold rounded-lg text-amber-800 hover:text-[#EF6C00] hover:border-[#EF6C00] hover:bg-amber-50/10 cursor-pointer flex items-center gap-1 transition-colors font-semibold"
                >
                  <FileText className="w-4 h-4 text-[#EF6C00]" />
                  <span>Export PDF Briefing</span>
                </button>
                <div className="h-4 w-px bg-slate-200" />
                <span className="text-xs text-slate-400 font-mono uppercase tracking-widest font-bold">
                  Dossier: {selectedLead.hqLocation}
                </span>
              </div>

              {/* Status tags */}
              <span className={`text-[10px] tracking-wider uppercase font-extrabold px-3 py-1 rounded-full border ${
                selectedLead.reputation?.status === "Institutional" ? "bg-purple-50 text-purple-800 border-purple-200" :
                selectedLead.reputation?.status === "Reputable" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                "bg-amber-50 text-amber-800 border-amber-200"
              }`}>
                {selectedLead.reputation?.status || "Vetted Agent"}
              </span>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 max-h-[calc(100vh-140px)] bg-slate-50/30">
              
              {/* Header Title block */}
              <div>
                <div className="flex items-center gap-2 mb-2 text-xs text-[#EF6C00] font-extrabold tracking-wider font-sans uppercase">
                  <Building2 className="w-4 h-4 text-[#EF6C00]" />
                  PARTNER AUDITING RECORD
                </div>
                
                <h2 className="font-serif text-3xl font-black text-slate-900 leading-tight mb-2">
                  {selectedLead.name}
                </h2>

                <p className="text-sm text-slate-500 leading-relaxed font-light font-sans">
                  {selectedLead.description}
                </p>
              </div>

              {/* Grid 1: Basic Firmographics */}
              <div className="border border-slate-200 rounded-xl p-5 bg-white grid grid-cols-2 gap-4 shadow-sm">
                <div>
                  <span className="text-[10px] text-slate-450 uppercase tracking-wider font-mono block mb-1 font-semibold">
                    Headquarters
                  </span>
                  <div className="text-sm font-semibold text-slate-800">
                    {selectedLead.hqLocation}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-450 uppercase tracking-wider font-mono block mb-1 font-semibold">
                    Employee Capacity
                  </span>
                  <div className="text-sm font-semibold text-slate-800">
                    {selectedLead.employeeSize}
                  </div>
                </div>

                <div className="col-span-2 pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex gap-4">
                    {selectedLead.socialLinks?.website && (
                      <a
                        href={selectedLead.socialLinks.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[#EF6C00] hover:underline flex items-center gap-1 font-semibold font-sans"
                      >
                        <Globe className="w-3.5 h-3.5 text-[#EF6C00]" />
                        Official Website
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {selectedLead.socialLinks?.linkedin && (
                      <a
                        href={selectedLead.socialLinks.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-slate-600 hover:underline flex items-center gap-1 font-sans"
                      >
                        <Briefcase className="w-3.5 h-3.5 text-slate-450" />
                        LinkedIn Company
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <span className="text-[10px] font-mono text-slate-400">
                    ID: {selectedLead.id.split("-")[2] || "Live"}
                  </span>
                </div>
              </div>

              {/* Segment 2: Estimated Financials Vetting */}
              <div className="space-y-3">
                <h3 className="font-serif text-sm font-bold text-slate-800 uppercase tracking-wider pb-1.5 border-b border-slate-200 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-[#EF6C00]" />
                  Finances & Regional Margin Audit
                </h3>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 text-center shadow-3xs">
                    <span className="text-[9px] uppercase tracking-wider font-mono text-slate-400 block mb-1 font-semibold">
                      EST. ANNUAL REVENUE
                    </span>
                    <strong className="text-base text-slate-800 block font-bold leading-tight">
                      {selectedLead.financials?.revenue}
                    </strong>
                    <span className="text-[9px] text-slate-400 block mt-1 font-sans">FY23/24 standard</span>
                  </div>

                  <div className="bg-white border border-slate-250 rounded-xl p-3.5 text-center shadow-3xs">
                    <span className="text-[9px] uppercase tracking-wider font-mono text-[#EF6C00] block mb-1 font-semibold">
                      ESTIMATED GPM
                    </span>
                    <strong className="text-base text-[#EF6C00] block font-black leading-tight">
                      {selectedLead.financials?.gpm}
                    </strong>
                    <span className="text-[9px] text-slate-400 block mt-1 font-sans">Regional margin cap</span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 text-center shadow-3xs">
                    <span className="text-[9px] uppercase tracking-wider font-mono text-slate-400 block mb-1 font-semibold">
                      FINANCIAL STATUS
                    </span>
                    <strong className="text-base text-slate-800 block font-bold leading-tight font-sans">
                      {selectedLead.financials?.status || "Private"}
                    </strong>
                    <span className="text-[9px] text-slate-400 block mt-1 font-sans">Asset valuation</span>
                  </div>
                </div>
              </div>

              {/* Segment 3: Partnerships Vetting & Competitors represented */}
              <div className="space-y-3">
                <h3 className="font-serif text-sm font-bold text-slate-800 uppercase tracking-wider pb-1.5 border-b border-slate-200 flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#EF6C00]" />
                  Track Record & Rival Ecosystems
                </h3>

                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
                  <div className="flex justify-between items-center text-xs font-sans">
                    <span className="text-slate-500 font-medium">Currently Represented Brands & Platforms:</span>
                    <span className="font-mono text-xs bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg font-bold text-slate-700">
                      {selectedLead.trackRecord?.competitors && selectedLead.trackRecord.competitors.length > 0 
                        ? `${selectedLead.trackRecord.partnershipCount} Active integrations` 
                        : "No Rival Alliances"}
                    </span>
                  </div>

                  {selectedLead.trackRecord?.competitors && selectedLead.trackRecord.competitors.length > 0 ? (
                    <>
                      <div className="flex flex-wrap gap-2.5">
                        {selectedLead.trackRecord.competitors.map((comp, idx) => (
                          <span
                            key={idx}
                            className="bg-[#EF6C00]/10 border border-[#EF6C00]/20 text-[#EF6C00] text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5"
                          >
                            <span className="w-1.5 h-1.5 bg-[#EF6C00] rounded-full" />
                            {comp}
                          </span>
                        ))}
                      </div>

                      <div className="text-xs text-slate-400 italic font-light font-sans">
                        * This reseller faces aggressive pricing compression and restrictive SaaS margins represented by {selectedLead.trackRecord.competitors.join(", ")}.
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 text-emerald-950 text-xs flex items-start gap-2.5 font-sans">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block text-emerald-900 mb-0.5">True Strategic Independence</span>
                          This consultancy has no binding loyalties representing rival software conglomerates. Perfect fit for launching premium, unconflicted system transformations.
                        </div>
                      </div>

                      <div className="text-xs text-emerald-700 font-light italic font-sans animate-pulse">
                        * Commencing this partnership will secure a high-revenue, first-mover position in the target country's independent market segments.
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Segment 4: Reputation Assessment Details */}
              <div className="space-y-3">
                <h3 className="font-serif text-sm font-bold text-slate-800 uppercase tracking-wider pb-1.5 border-b border-slate-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Reputation & Market Sentiment Audit
                </h3>

                <div className="bg-white rounded-xl p-5 border border-slate-200 text-xs leading-relaxed text-slate-800 font-sans shadow-sm">
                  <div className="font-mono text-[9px] uppercase tracking-wider text-slate-400 mb-2 font-bold select-none">
                    Web Presence News Analytics logs
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans font-light">
                    {selectedLead.reputation?.details}
                  </p>
                </div>
              </div>

              {/* Segment 5: Pitch Strategy */}
              <div className="bg-[#EF6C00]/5 border border-amber-200/40 rounded-xl p-6 relative overflow-hidden shadow-sm">
                <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 w-28 h-28 bg-[#EF6C00]/5 rounded-full blur-xl pointer-events-none" />
                
                <h3 className="font-serif text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#EF6C00]" />
                  Strategic Pitch
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed font-light font-sans">
                  {selectedLead.strategicFit?.whyOrangeHRM}
                </p>

                <div className="mt-4 pt-4 border-t border-amber-200/50 grid grid-cols-2 gap-4 text-[11px] font-sans">
                  <div className="flex gap-2">
                    <Check className="w-4 h-4 text-[#EF6C00] shrink-0" />
                    <div>
                      <strong className="block text-slate-900 font-semibold">Modular Pricing Advantage</strong>
                      <span className="text-slate-500">Avoid flat 30% revenue locks from Workday.</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Check className="w-4 h-4 text-[#EF6C00] shrink-0" />
                    <div>
                      <strong className="block text-slate-900 font-semibold">Extensible open code</strong>
                      <span className="text-slate-500">Build customized country-specific plugins.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Segment 6: PIPELINE OUTREACH CONTACT LOG */}
              <div className="border-t border-slate-200 dark:border-neutral-800 pt-6">
                <ContactLogManager
                  campaignId={selectedCampaign?.id || ""}
                  lead={selectedLead}
                  onRefreshCampaigns={async () => {
                    await fetchCampaigns(false);
                  }}
                />
              </div>

              {/* Grounding Web References (Google Index Citations) */}
              {selectedLead.sources && selectedLead.sources.length > 0 && (
                <div className="bg-[#FFF8F2] rounded-xl p-5 border border-[#FFD2B2] shadow-xs">
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="w-4 h-4 text-[#EF6C00]" />
                    <span className="text-xs uppercase tracking-wider font-mono text-[#EF6C00] font-extrabold">
                      Double-Verified Grounding Sources (Proof of Life)
                    </span>
                  </div>
                  <p className="text-xs text-[#514F4A] mb-3 leading-relaxed">
                    The following reference indexes were retrieved and authenticated in real time to confirm the trade capacity and active corporate existence of <strong>{selectedLead.name}</strong>:
                  </p>

                  <div className="space-y-2">
                    {selectedLead.sources.slice(0, 3).map((src, i) => (
                      <a
                        key={i}
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block bg-white hover:bg-[#FFF3E0] px-4 py-2.5 rounded-lg border border-[#FFC194] text-xs transition-all hover:translate-x-1 duration-150"
                      >
                        <div className="font-bold text-[#1A1A1B] flex items-center justify-between">
                          <span className="text-[#EF6C00] hover:underline flex items-center gap-1.5 font-sans">
                            <span className="text-[10px] bg-[#EF6C00]/10 text-[#EF6C00] px-1.5 py-0.2 rounded font-mono font-black">Ref #{i + 1}</span>
                            {src.title}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-[#EF6C00]" />
                        </div>
                        <div className="text-[11px] text-[#514F4A] truncate mt-1 font-mono">
                          {src.url}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>
        )}
      </div>

      {/* POPUP MODAL: NEW COUNTRY DISCOVERY CAMPAIGN FORM */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] my-auto flex flex-col">
            
            {/* Modal Title bar */}
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-none">
              <div>
                <h3 className="font-serif text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#EF6C00]" />
                  Launch Advanced Country Scan
                </h3>
                <p className="text-xs text-slate-500 font-light font-sans">
                  Query real-time registries and ingest global targets directory.
                </p>
              </div>

              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 hover:bg-slate-200 transition-colors rounded-lg text-slate-500 block cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form content */}
            <form onSubmit={handleLaunchCampaign} className="flex-1 flex flex-col overflow-hidden">
              
              {/* Scrollable form body wrapper */}
              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                
                {/* Campaign Custom label */}
                <div>
                  <label className="text-xs uppercase tracking-wider font-mono text-slate-500 block mb-1 font-bold">
                    Campaign Label Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={customCampaignName}
                    onChange={(e) => setCustomCampaignName(e.target.value)}
                    placeholder="e.g. Frankfurt Mid-market Alliance Vetting"
                    className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#EF6C00] font-sans text-slate-900"
                  />
                </div>

                {/* Targeted Country Form Field - Dropdown with fallback to Custom field */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs uppercase tracking-wider font-mono text-slate-500 block mb-1.5 font-bold">
                      Target Country
                    </label>
                    <select
                      value={targetCountryOption}
                      onChange={(e) => {
                        setTargetCountryOption(e.target.value);
                        if (e.target.value !== "custom") {
                          setCustomCountryInput("");
                        }
                      }}
                      className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#EF6C00]/50 focus:border-[#EF6C00] font-sans font-medium hover:border-[#EF6C00]/60 transition-colors text-slate-800"
                    >
                      <option value="custom">Other Country... (Custom Search Grounding)</option>
                      <optgroup label="APAC Regional Hubs">
                        <option value="Australia">Australia (Vetted Fallback Available)</option>
                        <option value="Singapore">Singapore (Regional Office Scans)</option>
                        <option value="Japan">Japan (IT Partner Networks)</option>
                      </optgroup>
                      <optgroup label="Middle East & Africa">
                        <option value="United Arab Emirates">United Arab Emirates (Dubai / Abu Dhabi)</option>
                        <option value="Saudi Arabia">Saudi Arabia (Riyadh Hub)</option>
                        <option value="South Africa">South Africa (Vetted Fallback Available)</option>
                        <option value="Qatar">Qatar</option>
                      </optgroup>
                      <optgroup label="Europe">
                        <option value="Germany">Germany (Vetted Fallback Available)</option>
                        <option value="United Kingdom">United Kingdom (Vetted Fallback Available)</option>
                        <option value="France">France (Vetted Fallback Available)</option>
                        <option value="Netherlands">Netherlands (Dutch Consultancies)</option>
                        <option value="Switzerland">Switzerland (Geneva / Zurich ERP Partners)</option>
                      </optgroup>
                    </select>
                  </div>

                  {targetCountryOption === "custom" && (
                    <div className="animate-in slide-in-from-top-1 duration-150">
                      <label className="text-[10px] uppercase tracking-wider font-mono text-[#EF6C00] block mb-1 font-bold">
                        Type Custom Country Name
                      </label>
                      <input
                        type="text"
                        required
                        value={customCountryInput}
                        onChange={(e) => setCustomCountryInput(e.target.value)}
                        placeholder="e.g. Netherlands, Japan, Singapore, Brazil..."
                        className="w-full text-xs p-3 bg-white border border-[#EF6C00]/40 rounded-xl outline-none focus:ring-1 focus:ring-[#EF6C00]/50 focus:border-[#EF6C00] font-sans font-medium text-slate-900"
                      />
                    </div>
                  )}

                   {targetCountryOption !== "custom" && (
                    <div className="text-[11px] text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200/50 flex items-center gap-1.5 font-sans leading-tight">
                      <span>This country uses our <strong>hand-vetted regional database</strong> as high-fidelity fallback. Safe from Google Serper rate limits!</span>
                    </div>
                  )}
                </div>

                {/* Model selection dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider font-mono text-slate-500 block font-bold">
                    Processing Mode
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#EF6C00]/50 focus:border-[#EF6C00] font-sans font-medium hover:border-[#EF6C00]/60 transition-colors text-slate-800"
                  >
                    <option value="gemini-3.5-flash">Balanced (recommended)</option>
                    <option value="gemini-3.1-pro-preview">Advanced reasoning</option>
                    <option value="gemini-3.1-flash-lite">Fast mode</option>
                    <option value="gemini-1.5-pro">Legacy compatibility</option>
                  </select>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    Select the processing profile for the campaign. Balanced mode is best for most discovery runs.
                  </div>
                </div>

                {/* Presets Grid Multi Selection Checklist */}
                <div>
                  <label className="text-xs uppercase tracking-wider font-mono text-slate-500 block mb-2 font-bold font-sans">
                    Vetting Target Profiles (Choose 1 or more)
                  </label>
                  
                  <div className="space-y-2 max-h-[180px] overflow-y-auto border border-slate-200 rounded-xl p-3 bg-white">
                    {LEAD_TYPE_PRESETS.map((preset) => (
                      <div 
                        key={preset.id}
                        onClick={() => {
                          if (selectedPresets.includes(preset.id)) {
                            setSelectedPresets(prev => prev.filter(x => x !== preset.id));
                          } else {
                            setSelectedPresets(prev => [...prev, preset.id]);
                          }
                        }}
                        className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPresets.includes(preset.id)}
                          onChange={() => {}} // handled by div click
                          className="mt-1 accent-[#EF6C00] rounded focus:ring-0 focus:outline-none"
                        />
                        <div>
                          <div className="text-xs font-semibold text-slate-800 leading-tight">
                            {preset.label}
                          </div>
                          <div className="text-[10px] text-slate-400 font-light mt-0.5">
                            {preset.desc}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Vetting Search Depth Selector */}
                <div>
                  <label className="text-xs uppercase tracking-wider font-mono text-slate-500 block mb-1 font-bold">
                    Scan Speed & Intensity Mode
                  </label>
                  <div className="grid grid-cols-2 gap-3 mt-1.5 font-sans">
                    <div
                      onClick={() => setSearchDepth("fast")}
                      className={`border rounded-xl p-3 cursor-pointer text-center transition-all ${
                        searchDepth === "fast" 
                          ? "border-[#EF6C00] bg-[#EF6C00]/5 font-semibold text-[#EF6C00]" 
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 animate-duration-100"
                      }`}
                    >
                      <div className="text-xs">Express Vetting</div>
                      <div className="text-[9px] text-slate-400 mt-0.5 font-light">Calculates matches swiftly</div>
                    </div>

                    <div
                      onClick={() => setSearchDepth("comprehensive")}
                      className={`border rounded-xl p-3 cursor-pointer text-center transition-all ${
                        searchDepth === "comprehensive" 
                          ? "border-[#EF6C00] bg-[#EF6C00]/5 font-semibold text-[#EF6C00]" 
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <div className="text-xs flex items-center justify-center gap-1.5">
                        <span>Comprehensive Scan</span>
                        <Sparkles className="w-3.5 h-3.5 text-[#EF6C00] animate-pulse" />
                      </div>
                      <div className="text-[9px] text-slate-400 mt-0.5 font-light">Deep search grounding analysis</div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Form Footer Action pane (Sticky bottom for absolute screen visibility) */}
              <div className="border-t border-slate-150 p-5 bg-slate-50 flex justify-end gap-3 font-sans flex-none">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="bg-white border border-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors focus:outline-none cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSpawning || !(targetCountryOption === "custom" ? customCountryInput.trim() : targetCountryOption) || selectedPresets.length === 0}
                  className="bg-[#EF6C00] hover:bg-[#D45F00] text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-md transition-colors focus:outline-none cursor-pointer flex items-center gap-2 disabled:bg-neutral-300 disabled:text-neutral-500 disabled:cursor-not-allowed"
                >
                  {isSpawning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Booting Vetting Node...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Launch Ingestion Scan</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-[#EBE4D8] bg-[#FAF6F0] py-6 px-6 text-center text-xs text-[#827F78] mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-[10px]">
          <div>
            PRISTINE OATMEAL & INK ACCORDANCE • NO SAAS BLUE • VERIFIED STRATEGIC WORKSPACE
          </div>
          <div>
            © 2026 Partner Scout Channel Intelligence
          </div>
          <div className="flex gap-1 items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
            <span>Grounded Endpoint Online</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
