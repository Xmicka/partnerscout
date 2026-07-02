/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SocialLinks {
  linkedin?: string;
  x?: string;
  website?: string;
}

export interface Financials {
  revenue: string; // e.g. "$12.4M USD (FY23)"
  gpm: string; // e.g. "62%" (Estimated GPM based on regional service margins)
  status: "Listed" | "Private";
}

export interface TrackRecord {
  partnershipCount: number;
  competitors: string[]; // e.g. ["Workday", "BambooHR"]
}

export interface Reputation {
  status: "Reputable" | "Rising" | "Institutional";
  details: string; // e.g. "Over 15 years as a premier digital transformation boutique..."
}

export interface StrategicFit {
  whyOrangeHRM: string; // Tailored value proposition
}

export interface GroundingSource {
  title: string;
  url: string;
}

export interface ContactLog {
  id: string;
  date: string;
  contactPerson: string;
  discussion: string;
  nextStep: string;
}

export interface MarketContext {
  marketSize: string;
  potentialSMEs: string;
  dominantERPs: string[];
  strategicPriority?: string;
  description?: string;
}

export interface ScoringRubric {
  marketCapability: number; // 0-25
  competitiveAlignment: number; // 0-25
  reputationScore: number; // 0-25
  channelFit: number; // 0-25
  initialTotalScore: number; // 0-100
  rubricRationale?: string;
}

export interface ChallengerCritique {
  finalTotalScore: number; // 0-100 revised
  conflictsIdentified: string[];
  challengerRationale: string;
}

export interface PartnerLead {
  id: string;
  name: string;
  hqLocation: string;
  employeeSize: string;
  firmSizeSegment: "SME" | "Mid-Market" | "Enterprise";
  description: string;
  socialLinks: SocialLinks;
  financials: Financials;
  trackRecord: TrackRecord;
  reputation: Reputation;
  strategicFit: StrategicFit;
  sources: GroundingSource[];
  createdAt: string;
  customNotes?: string;
  contactLogs?: ContactLog[];
  scoringRubric?: ScoringRubric;
  challengerCritique?: ChallengerCritique;
}

export interface Campaign {
  id: string;
  name: string;
  country: string;
  leadTypes: string[];
  depth: "fast" | "comprehensive";
  status: "pending" | "processing" | "completed" | "failed";
  currentStep?: string;
  progress?: number; // 0 to 100
  leads: PartnerLead[];
  createdAt: string;
  modelName?: string;
  marketContext?: MarketContext;
}

export interface DiscoverRequest {
  country: string;
  leadTypes: string[];
  depth: "fast" | "comprehensive";
  campaignName?: string;
  targetSegments?: string[];
  modelName?: string;
}

export interface InboundLegitimacy {
  isRealCompany: boolean;
  confidenceScore: number;
  digitalPresenceNotes: string;
  linkedInPresence?: string;
  googleReviewsAndRating?: string;
  physicalLocation?: string;
  domainAgeEstimated?: string;
  sslAndWebServerVerifications?: string;
  isSpoofOrOvernightTemplate?: boolean;
  domainLegitimacyScore?: number;
  domainSecurityReport?: string;
}

export interface InboundMarketFocus {
  sector?: string;
  employeeCount?: string;
  primarySpecialties: string[];
  approximateScale: string;
  industryReach: string;
  hasMultiCountryPresence?: boolean;
  countriesSpanned?: string[];
  regionalMarketDominance?: string;
}

export interface InboundCompetitorConflicts {
  hasConflict: boolean;
  identifiedCompetitors: string[];
  conflictNotes: string;
}

export interface InboundOrangeHrmAlignment {
  fitScore: number;
  fitVerdict: "HIGH FIT" | "MODERATE FIT" | "LOW FIT / CONFLICT";
  rationale: string;
  customWhyOrangeHRM: string;
}

export interface InboundDiscoveryCallKit {
  agendaTitle: string;
  qualifyingQuestions: string[];
  elevatorPitch: string;
  emailPitchDraft?: string;
}

export interface GlassdoorAnalysis {
  averageRating: number;
  positiveFeedbackSummary: string;
  negativeFeedbackAndRedFlags: string;
  sentiment: "positive" | "neutral" | "frictional";
}

export interface InboundEvaluation {
  legitimacy: InboundLegitimacy;
  marketFocus: InboundMarketFocus;
  competitorConflicts: InboundCompetitorConflicts;
  orangeHrmAlignment: InboundOrangeHrmAlignment;
  discoveryCallKit: InboundDiscoveryCallKit;
  glassdoorAnalysis?: GlassdoorAnalysis;
}

export interface InboundPartnerVetting {
  id: string;
  companyName: string;
  website: string;
  contactName?: string;
  contactEmail?: string;
  inboundMessage?: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress?: number;
  currentStep?: string;
  evaluation?: InboundEvaluation;
  createdAt: string;
  decision: "pending" | "approved" | "rejected" | "contacted";
  notes?: string;
}
