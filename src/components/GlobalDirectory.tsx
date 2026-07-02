/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Search, 
  Building2, 
  Globe, 
  ShieldCheck, 
  ArrowUpRight, 
  FileSpreadsheet, 
  FileText,
  Filter,
  Users,
  Award,
  BookOpen,
  ChevronRight
} from "lucide-react";
import { Campaign, PartnerLead } from "../types.js";

interface GlobalDirectoryProps {
  campaigns: Campaign[];
  onSelectLead: (lead: PartnerLead, campaign: Campaign) => void;
  onExportCSV: (leads: PartnerLead[], title: string) => void;
  onExportPDF: (lead: PartnerLead, campaignName: string) => void;
}

export function GlobalDirectory({ campaigns, onSelectLead, onExportCSV, onExportPDF }: GlobalDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("All");
  const [selectedReputation, setSelectedReputation] = useState("All");
  const [selectedCompetitor, setSelectedCompetitor] = useState("All");
  const [selectedNeutrality, setSelectedNeutrality] = useState("All");

  // Aggregate all leads from completed campaigns
  const compiledLeads = campaigns.flatMap(camp => {
    return (camp.leads || []).map(lead => ({
      ...lead,
      campaign: camp
    }));
  });

  // Extract unique filter lists dynamically
  const uniqueCountries = Array.from(new Set(campaigns.map(c => c.country))).filter(Boolean);
  
  const allCompetitorsSet = new Set<string>();
  compiledLeads.forEach(lead => {
    lead.trackRecord?.competitors?.forEach(c => allCompetitorsSet.add(c));
  });
  const uniqueCompetitors = Array.from(allCompetitorsSet);

  // Filter logic
  const filteredLeads = compiledLeads.filter(item => {
    // Search overlap check
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.hqLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCountry = selectedCountry === "All" || item.campaign.country === selectedCountry;
    const matchesReputation = selectedReputation === "All" || item.reputation?.status === selectedReputation;
    
    const matchesCompetitor = 
      selectedCompetitor === "All" || 
      item.trackRecord?.competitors?.some(c => c.toLowerCase().includes(selectedCompetitor.toLowerCase()));

    const isRivalFree = !item.trackRecord?.competitors || item.trackRecord.competitors.length === 0;
    const matchesNeutrality = 
      selectedNeutrality === "All" ||
      (selectedNeutrality === "RivalFree" && isRivalFree) ||
      (selectedNeutrality === "Resellers" && !isRivalFree);

    return matchesSearch && matchesCountry && matchesReputation && matchesCompetitor && matchesNeutrality;
  });

  return (
    <div className="space-y-6" id="global-directory-root">
      
      {/* Top Ledger Overview Grid in elegant Cream Slate styling */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#FAF6F0] border border-[#EBE4D8] rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-[#EF6C00]/10 text-[#EF6C00] rounded-lg flex items-center justify-center font-bold">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-[#827F78] uppercase font-mono tracking-wider">Total Vetted Partners</div>
            <div className="text-xl font-serif font-bold text-[#1A1A1B]">{compiledLeads.length}</div>
          </div>
        </div>

        <div className="bg-[#FAF6F0] border border-[#EBE4D8] rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-50 text-emerald-800 rounded-lg flex items-center justify-center font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-[10px] text-[#827F78] uppercase font-mono tracking-wider">Rival-Free Assets</div>
            <div className="text-xl font-serif font-bold text-emerald-800">
              {compiledLeads.filter(l => !l.trackRecord?.competitors || l.trackRecord.competitors.length === 0).length}
            </div>
          </div>
        </div>

        <div className="bg-[#FAF6F0] border border-[#EBE4D8] rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-purple-50 text-purple-800 rounded-lg flex items-center justify-center font-bold">
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <div className="text-[10px] text-[#827F78] uppercase font-mono tracking-wider">Institutional Standing</div>
            <div className="text-xl font-serif font-bold text-purple-900">
              {compiledLeads.filter(l => l.reputation?.status === "Institutional").length}
            </div>
          </div>
        </div>

        <div className="bg-[#FAF6F0] border border-[#EBE4D8] rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-50 text-amber-800 rounded-lg flex items-center justify-center font-bold">
            <Globe className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <div className="text-[10px] text-[#827F78] uppercase font-mono tracking-wider">Scanned Countries</div>
            <div className="text-xl font-serif font-bold text-amber-900">{uniqueCountries.length}</div>
          </div>
        </div>
      </div>

      {/* Control Panel: Filters, Searches & Actions */}
      <div className="bg-[#FAF6F0] border border-[#EBE4D8] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#1A1A1B]">Global Intelligence Matrix</h3>
            <p className="text-xs text-[#514F4A] font-light">
              Full-spectrum search index aggregating target consultancies, payroll bureaus, and digital integration partners across all boundaries.
            </p>
          </div>

          <button
            onClick={() => onExportCSV(filteredLeads, "Global_Partners_Roster")}
            disabled={filteredLeads.length === 0}
            className="bg-[#EF6C00] hover:bg-[#D45F00] text-white text-xs font-semibold px-4, py-2.5 rounded-lg flex items-center gap-2 transition-colors duration-200 cursor-pointer disabled:opacity-50 inline-flex items-center justify-center px-4"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Roster to CSV</span>
          </button>
        </div>

        {/* Triple Row Dense Filter Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
          
          {/* Text Search Input */}
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Fuzzy search name/details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-[#EBE4D8] text-xs rounded-lg focus:outline-none focus:border-[#EF6C00]"
            />
          </div>

          {/* Country Filter selection */}
          <div className="flex items-center gap-1 bg-white border border-[#EBE4D8] rounded-lg px-2.5 py-1.5 focus-within:border-[#EF6C00]">
            <Globe className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full bg-transparent text-xs outline-none border-none py-0.5 cursor-pointer text-[#514F4A] font-medium"
            >
              <option value="All">All Regions</option>
              {uniqueCountries.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Reputation select */}
          <div className="flex items-center gap-1 bg-white border border-[#EBE4D8] rounded-lg px-2.5 py-1.5 focus-within:border-[#EF6C00]">
            <Award className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <select
              value={selectedReputation}
              onChange={(e) => setSelectedReputation(e.target.value)}
              className="w-full bg-transparent text-xs outline-none border-none py-0.5 cursor-pointer text-[#514F4A] font-medium"
            >
              <option value="All">All Reputations</option>
              <option value="Institutional">Institutional</option>
              <option value="Reputable">Reputable</option>
              <option value="Rising">Rising</option>
            </select>
          </div>

          {/* Competitors filter select */}
          <div className="flex items-center gap-1 bg-white border border-[#EBE4D8] rounded-lg px-2.5 py-1.5 focus-within:border-[#EF6C00]">
            <Building2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <select
              value={selectedCompetitor}
              onChange={(e) => setSelectedCompetitor(e.target.value)}
              className="w-full bg-transparent text-xs outline-none border-none py-0.5 cursor-pointer text-[#514F4A] font-medium"
            >
              <option value="All">All Competitors</option>
              {uniqueCompetitors.map(comp => (
                <option key={comp} value={comp}>{comp}</option>
              ))}
            </select>
          </div>

          {/* Rival Neutrality filter select */}
          <div className="flex items-center gap-1 bg-white border border-[#EBE4D8] rounded-lg px-2.5 py-1.5 focus-within:border-[#EF6C00]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <select
              value={selectedNeutrality}
              onChange={(e) => setSelectedNeutrality(e.target.value)}
              className="w-full bg-transparent text-xs outline-none border-none py-0.5 cursor-pointer text-[#514F4A] font-medium"
            >
              <option value="All">All Rival Statuses</option>
              <option value="RivalFree">Rival-Free Only</option>
              <option value="Resellers">Competitor Resellers Only</option>
            </select>
          </div>

        </div>
      </div>

      {/* Spreadsheet / Grid Output Table */}
      <div className="bg-white border border-[#EBE4D8] rounded-xl overflow-hidden shadow-xs">
        {filteredLeads.length === 0 ? (
          <div className="p-16 text-center text-xs text-neutral-400 font-light bg-[#FAF6F0]/20">
            No vetted strategic partners match the consolidated filters. Try clearing some selections.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAF6F0] border-b border-[#EBE4D8] text-[#514F4A] font-mono uppercase text-[10px] tracking-wider select-none">
                  <th className="px-6 py-4 font-bold">Company / Head Office</th>
                  <th className="px-6 py-4 font-bold">Region</th>
                  <th className="px-6 py-4 font-bold">Employee Size</th>
                  <th className="px-6 py-4 font-bold">Financials / GPM</th>
                  <th className="px-6 py-4 font-bold">Rival Alliances</th>
                  <th className="px-6 py-4 font-bold">Reputation</th>
                  <th className="px-6 py-4 text-right pr-6">Dossier Docs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FAF6F0]">
                {filteredLeads.map((item) => {
                  const isRivalFree = !item.trackRecord?.competitors || item.trackRecord.competitors.length === 0;
                  const repColors = 
                    item.reputation?.status === "Institutional" ? "bg-purple-50 text-purple-800 border-purple-200" :
                    item.reputation?.status === "Reputable" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                    "bg-amber-50 text-amber-800 border-amber-200";

                  return (
                    <tr 
                      key={item.id}
                      className="hover:bg-[#FAF6F0]/30 transition-colors group cursor-pointer"
                      onClick={() => onSelectLead(item, item.campaign)}
                    >
                      <td className="px-6 py-4.5">
                        <div className="font-serif text-sm font-bold text-[#1A1A1B] group-hover:text-[#EF6C00] transition-colors">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-[#827F78] mt-0.5 font-light max-w-sm truncate" title={item.description}>
                          {item.description}
                        </div>
                      </td>

                      <td className="px-6 py-4.5 font-medium text-neutral-700 whitespace-nowrap">
                        {item.hqLocation}
                      </td>

                      <td className="px-6 py-4.5 font-mono text-neutral-500 whitespace-nowrap">
                        {item.employeeSize}
                      </td>

                      <td className="px-6 py-4.5">
                        <div className="font-mono font-bold text-[#1A1A1B]">
                          {item.financials?.revenue}
                        </div>
                        <div className="font-mono text-[10px] text-[#EF6C00]">
                          {item.financials?.gpm} Est. GPM
                        </div>
                      </td>

                      <td className="px-6 py-4.5">
                        {isRivalFree ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                            <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                            Rival-Free
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-[150px]">
                            {item.trackRecord?.competitors?.slice(0, 2).map((c, i) => (
                              <span key={i} className="bg-neutral-50 border border-[#EBE4D8] text-[9px] text-[#514F4A] px-1.5 py-0.2 rounded font-sans">
                                {c}
                              </span>
                            ))}
                            {item.trackRecord?.competitors && item.trackRecord.competitors.length > 2 && (
                              <span className="text-[9px] text-neutral-400 font-mono">+{item.trackRecord.competitors.length - 2}</span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4.5">
                        <span className={`inline-block text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded border ${repColors}`}>
                          {item.reputation?.status || "Vetted"}
                        </span>
                      </td>

                      <td className="px-6 py-4.5 text-right whitespace-nowrap pr-6">
                        <div className="flex justify-end gap-2" id={`directory-actions-${item.id}`}>
                          {/* Export single PDF */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onExportPDF(item, item.campaign.name);
                            }}
                            title="Export Corporate Briefing PDF"
                            className="p-1 px-2 border border-[#EBE4D8] hover:border-[#EF6C00] bg-white text-[#514F4A] hover:text-[#EF6C00] transition-colors rounded-lg flex items-center gap-1 cursor-pointer font-sans"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-semibold">PDF</span>
                          </button>
                          
                          <button
                            className="bg-[#FAF6F0] hover:bg-[#EBE4D8] p-1.5 rounded-lg text-neutral-500 hover:text-[#EF6C00] transition-colors cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectLead(item, item.campaign);
                            }}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
