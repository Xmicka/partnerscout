/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Sparkles, Globe, Shield, Search, ArrowLeft } from "lucide-react";
import { DiscoverRequest } from "../types.js";

interface CampaignCreatorProps {
  onStartDiscover: (request: DiscoverRequest) => void;
  isSubmitting: boolean;
  onBackToDashboard?: () => void;
}

const PREDEFINED_COUNTRIES = [
  { code: "DE", name: "Germany" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "JP", name: "Japan" },
  { code: "SG", name: "Singapore" },
  { code: "ZA", name: "South Africa" },
  { code: "FR", name: "France" }
];

const PREDEFINED_LEAD_TYPES = [
  {
    id: "hr_companies",
    label: "HR consultancy firms & organizations in [Country]",
    desc: "Active HR advisory services, recruiting firms and professional HR consulting entities perfect for reselling or sourcing enterprise HR systems to their clients."
  },
  {
    id: "payroll",
    label: "Payroll services & benefit bureaus looking for HR [Country]",
    desc: "Outsourced payroll providers and bureaus with weekly/monthly rosters of active corporate payroll accounts eager to resell/source full-scale HR systems."
  },
  {
    id: "crm_erp",
    label: "CRM & ERP (Odoo/Zoho/Dynamics/Salesforce) partners [Country]",
    desc: "Operational software consultants with active SME clients, perfect for bundling enterprise HR capabilities into generic business toolkits."
  },
  {
    id: "it_msp",
    label: "General IT service providers and cloud contractors [Country]",
    desc: "Excellent Rival-Free targets that manage business infrastructures and want to expand recurring SaaS revenue by vending HR suites."
  },
  {
    id: "digital",
    label: "Digital Transformation & SME software consultancies [Country]",
    desc: "Modern boutique consultants modernizing office tools for traditional local Mittelstand/SMEs."
  },
  {
    id: "competitor",
    label: "Competitor (Workday/Sage/BambooHR) resellers in [Country]",
    desc: "Frustrated rival resellers facing margin squeeze, ripe for switching to a higher-margin open alternative."
  }
];

export function CampaignCreator({ onStartDiscover, isSubmitting, onBackToDashboard }: CampaignCreatorProps) {
  const [country, setCountry] = useState("Germany");
  const [customCountry, setCustomCountry] = useState("");
  const [showCustomCountryInput, setShowCustomCountryInput] = useState(false);
  const [selectedLeadTypes, setSelectedLeadTypes] = useState<string[]>([
    "HR consultancy firms & organizations in [Country]",
    "Payroll services & benefit bureaus looking for HR [Country]"
  ]);
  const [depth, setDepth] = useState<"fast" | "comprehensive">("comprehensive");
  const [customTitle, setCustomTitle] = useState("");

  const handleToggleLeadType = (label: string) => {
    if (selectedLeadTypes.includes(label)) {
      if (selectedLeadTypes.length > 1) {
        setSelectedLeadTypes(selectedLeadTypes.filter(t => t !== label));
      }
    } else {
      setSelectedLeadTypes([...selectedLeadTypes, label]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCountry = showCustomCountryInput ? customCountry.trim() : country;
    if (!finalCountry) return;

    // Construct a beautiful name if empty
    const resolvedTitle = customTitle.trim() || `${finalCountry} Channel Vetting - ${new Date().toLocaleDateString("en-US", { month: 'short', year: 'numeric' })}`;

    onStartDiscover({
      country: finalCountry,
      leadTypes: selectedLeadTypes,
      depth,
      campaignName: resolvedTitle
    });
  };

  return (
    <div className="max-w-3xl mx-auto" id="campaign-creator-root">
      {onBackToDashboard && (
        <button
          onClick={onBackToDashboard}
          className="group flex items-center text-xs font-mono text-[#1A1A1B]/60 hover:text-[#EF6C00] transition-colors mb-6 uppercase tracking-wider"
          id="btn-back-dashboard"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5 transition-transform group-hover:-translate-x-1" />
          Back to Observatory Dashboard
        </button>
      )}

      <div className="bg-[#F6F3EB] rounded-2xl border border-[#EAE5DB] p-8 md:p-10 shadow-sm" id="creator-panel">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-[#EF6C00]/10 flex items-center justify-center text-[#EF6C00]">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="font-serif text-2xl md:text-3xl text-[#1A1A1B] tracking-tight">
              Initialize Discovery Campaign
            </h2>
            <p className="text-sm font-mono text-[#1A1A1B]/65 mt-0.5">
              Target prospective HRIS, ERP, and CRM channel resellers globally.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8" id="campaign-discovery-form">
          {/* Section 1: Target Location */}
          <div className="space-y-3">
            <label className="block text-xs font-mono uppercase tracking-wider text-[#1A1A1B]/75 font-semibold">
              01. Target Sovereign territory / Country
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!showCustomCountryInput ? (
                <div>
                  <select
                    value={country}
                    onChange={(e) => {
                      if (e.target.value === "__custom__") {
                        setShowCustomCountryInput(true);
                      } else {
                        setCountry(e.target.value);
                      }
                    }}
                    className="w-full h-11 px-3 bg-[#FDFBF7] border border-[#EAE5DB] rounded-lg text-[#1A1A1B] focus:outline-none focus:ring-1 focus:ring-[#EF6C00] text-sm font-sans"
                    id="select-country-dropdown"
                  >
                    {PREDEFINED_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    <option value="__custom__">Search custom country...</option>
                  </select>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Enter any global country..."
                    value={customCountry}
                    onChange={(e) => setCustomCountry(e.target.value)}
                    className="flex-1 h-11 px-3 bg-[#FDFBF7] border border-[#EAE5DB] rounded-lg text-[#1A1A1B] focus:outline-none focus:ring-1 focus:ring-[#EF6C00] text-sm"
                    id="input-custom-country"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomCountryInput(false);
                      setCountry("Germany");
                    }}
                    className="px-3 bg-[#EAE5DB] text-[#1A1A1B]/80 rounded-lg hover:bg-[#DED9CE] transition-colors text-xs font-mono"
                    id="btn-cancel-custom-country"
                  >
                    Preset list
                  </button>
                </div>
              )}

              <div>
                <input
                  type="text"
                  placeholder="Campaign Title (e.g., German Channel Vetting)"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full h-11 px-3 bg-[#FDFBF7] border border-[#EAE5DB] rounded-lg text-[#1A1A1B] focus:outline-none focus:ring-1 focus:ring-[#EF6C00] text-sm"
                  id="input-campaign-title"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Lead Sourcing Types */}
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <label className="block text-xs font-mono uppercase tracking-wider text-[#1A1A1B]/75 font-semibold">
                02. Refined Search Lead Sourcing profiles
              </label>
              <span className="text-xs font-mono text-[#EF6C00]">
                {selectedLeadTypes.length} profiles selected
              </span>
            </div>

            <div className="space-y-2.5" id="lead-types-selector-group">
              {PREDEFINED_LEAD_TYPES.map((lt) => {
                const isSelected = selectedLeadTypes.includes(lt.label);
                return (
                  <div
                    key={lt.id}
                    onClick={() => handleToggleLeadType(lt.label)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? "bg-[#EF6C00]/5 border-[#EF6C00] shadow-[0_0_12px_rgba(239,108,0,0.05)]"
                        : "bg-[#FDFBF7] border-[#EAE5DB] hover:border-[#1A1A1B]/20"
                    }`}
                    id={`lead-type-option-${lt.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Hanled by parent div click
                          className="w-4 h-4 text-[#EF6C00] border-[#EAE5DB] rounded focus:ring-0 active:ring-0 pointer-events-none"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-serif font-medium text-[#1A1A1B]">
                            {lt.label.replace("[Country]", showCustomCountryInput ? customCountry || "Country" : country)}
                          </span>
                        </div>
                        <p className="text-xs text-[#1A1A1B]/60 mt-1 font-sans">
                          {lt.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Vetting Search Depth */}
          <div className="space-y-3">
            <label className="block text-xs font-mono uppercase tracking-wider text-[#1A1A1B]/75 font-semibold">
              03. Scanning Intensity and Intelligence Depth
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                onClick={() => setDepth("fast")}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  depth === "fast"
                    ? "bg-[#EF6C00]/5 border-[#EF6C00]"
                    : "bg-[#FDFBF7] border-[#EAE5DB] hover:border-[#1A1A1B]/20"
                }`}
                id="depth-option-fast"
              >
                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#EF6C00]/50 mt-1.5" />
                  <div>
                    <h4 className="text-sm font-serif font-bold text-[#1A1A1B]">Fast Verification Scan</h4>
                    <p className="text-xs text-[#1A1A1B]/65 mt-1">
                      Immediate lead consolidation. Pulls regional SME directory partners and provides synthesis dossiers. Best for instant reviews.
                    </p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => setDepth("comprehensive")}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  depth === "comprehensive"
                    ? "bg-[#EF6C00]/5 border-[#EF6C00]"
                    : "bg-[#FDFBF7] border-[#EAE5DB] hover:border-[#1A1A1B]/20"
                }`}
                id="depth-option-comprehensive"
              >
                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#EF6C00] mt-1.5 animate-pulse" />
                  <div>
                    <h4 className="text-sm font-serif font-bold text-[#1A1A1B] flex items-center gap-1.5">
                      Comprehensive Intelligence Dossier
                      <span className="inline-block text-[10px] font-mono bg-[#EF6C00] text-white px-1.5 py-0.5 rounded tracking-normal font-sans uppercase">
                        Recommended
                      </span>
                    </h4>
                    <p className="text-xs text-[#1A1A1B]/65 mt-1">
                      Deep real-time audit. Triggers live Google Search Grounding to target and vet real corporate players, cross-reference socials, competitor partnerships, and synthesize a deep strategic pitch layout.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[#EAE5DB] pt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-mono text-[#1A1A1B]/55">
              <Globe className="w-4 h-4 text-[#EF6C00]/70" />
              <span>Real-Time Search Grounding automatically enabled.</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || (showCustomCountryInput && !customCountry)}
              className="w-full md:w-auto h-12 px-8 bg-[#EF6C00] text-white rounded-lg hover:bg-[#D84315] font-serif font-medium tracking-wide transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              id="btn-trigger-campaign"
            >
              <Search className="w-4 h-4" />
              {isSubmitting ? "Running Channel Vetting..." : "Run Discovery Campaign"}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 bg-[#FDFBF7] border border-[#EAE5DB] rounded-xl p-5 flex items-start gap-4">
        <div className="p-2 bg-[#EF6C00]/10 rounded-lg text-[#EF6C00] mt-0.5">
          <Shield className="w-4 h-4" />
        </div>
        <div>
          <h5 className="text-xs font-mono uppercase tracking-wider text-[#1A1A1B] font-semibold">
            Enterprise Security & Accuracy Guarantee
          </h5>
          <p className="text-xs text-[#1A1A1B]/60 mt-1 leading-relaxed">
            Every lead undergoes simulated corporate verification or real-time web verification with grounding via Google Search. Financial calculations are inferred on regional services GPM (Gross Profit Margin) guidelines and standard tech multiplier curves.
          </p>
        </div>
      </div>
    </div>
  );
}
