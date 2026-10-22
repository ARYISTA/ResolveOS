import type { Domain } from "@/lib/schemas";

export interface MockSection {
  section: string;
  title: string;
  page: number;
}

export interface MockChunk {
  chunkId: string;
  section: string;
  page: number;
  tokenCount: number;
}

const DOMAIN_SECTIONS: Record<Domain, MockSection[]> = {
  banking: [
    { section: "Section 1.0", title: "Scope and Electronic Banking Channels", page: 1 },
    { section: "Section 2.1", title: "Customer Liability in Unauthorized Electronic Transactions", page: 3 },
    { section: "Section 2.3", title: "Reporting Windows and Zero-Liability Criteria", page: 4 },
    { section: "Section 3.2", title: "Turnaround Time (TAT) for Failed UPI and Card Debits", page: 6 },
    { section: "Section 4.1", title: "Merchant Chargeback Workflows and Documentation", page: 8 },
    { section: "Section 5.0", title: "Auto-Reversal Mandates and Daily Compensation", page: 10 },
  ],
  insurance: [
    { section: "Section 1.1", title: "Free-Look Cancellation Period Terms and Conditions", page: 2 },
    { section: "Section 2.0", title: "Premium Refund Calculations and Deductions", page: 4 },
    { section: "Section 3.4", title: "Duplicate Premium Debits and Automated Reversal", page: 5 },
    { section: "Section 4.2", title: "Claim Dispute Timelines and Grievance Escalation", page: 7 },
    { section: "Section 5.3", title: "Exclusions and Inadmissible Cancellation Claims", page: 9 },
  ],
  subscriptions: [
    { section: "Section 1.2", title: "Free Trial Conversion and Advance Notification Policy", page: 1 },
    { section: "Section 2.0", title: "Cooling-Off Period and 7-Day Refund Guarantee", page: 3 },
    { section: "Section 3.1", title: "Post-Cancellation Billing and Inadvertent Renewal Protection", page: 4 },
    { section: "Section 4.0", title: "Prorated Refunds for Annual Subscription Terminations", page: 6 },
    { section: "Section 5.2", title: "Add-On and In-App Service Refund Limitations", page: 8 },
  ],
  ecommerce: [
    { section: "Section 2.0", title: "Standard 7-Day and 14-Day Return Windows by Category", page: 2 },
    { section: "Section 3.2", title: "Damaged, Defective, or Transit-Broken Items Protocol", page: 3 },
    { section: "Section 4.1", title: "Wrong Product Dispatch and Replacement Fallbacks", page: 5 },
    { section: "Section 5.0", title: "Non-Delivery SLA Breach and Automatic Refund Triggers", page: 7 },
    { section: "Section 6.3", title: "Cash on Delivery (COD) Bank Account Remittance Rules", page: 9 },
  ],
  travel: [
    { section: "Section 1.3", title: "Airline-Initiated Flight Cancellation and Schedule Changes", page: 2 },
    { section: "Section 2.1", title: "Cancellation Deduction Slabs based on Time to Departure", page: 4 },
    { section: "Section 3.0", title: "Train and Bus Ticket Auto-Refund on Chart Preparation", page: 5 },
    { section: "Section 4.2", title: "Missed Connections and Involuntary Rerouting Waivers", page: 7 },
    { section: "Section 5.1", title: "Medical Emergency and Force Majeure Full Refund Exceptions", page: 9 },
  ],
};

const DOMAIN_CHUNKS: Record<Domain, MockChunk[]> = {
  banking: [
    { chunkId: "chk-bk-01", section: "Section 1.0 Scope and Electronic Banking Channels", page: 1, tokenCount: 245 },
    { chunkId: "chk-bk-02", section: "Section 2.1 Customer Liability in Unauthorized Electronic Transactions", page: 3, tokenCount: 312 },
    { chunkId: "chk-bk-03", section: "Section 2.3 Reporting Windows and Zero-Liability Criteria", page: 4, tokenCount: 278 },
    { chunkId: "chk-bk-04", section: "Section 3.2 TAT for Failed UPI and Card Debits", page: 6, tokenCount: 195 },
    { chunkId: "chk-bk-05", section: "Section 3.4 Auto-compensation Mandates (T+1 Rules)", page: 6, tokenCount: 260 },
    { chunkId: "chk-bk-06", section: "Section 4.1 Merchant Chargeback Workflows and Documentation", page: 8, tokenCount: 340 },
    { chunkId: "chk-bk-07", section: "Section 5.0 Auto-Reversal Mandates and Daily Compensation", page: 10, tokenCount: 285 },
    { chunkId: "chk-bk-08", section: "Section 5.2 Grievance Redressal and Ombudsman Escalation", page: 12, tokenCount: 215 },
  ],
  insurance: [
    { chunkId: "chk-ins-01", section: "Section 1.1 Free-Look Cancellation Period Terms and Conditions", page: 2, tokenCount: 265 },
    { chunkId: "chk-ins-02", section: "Section 2.0 Premium Refund Calculations and Deductions", page: 4, tokenCount: 310 },
    { chunkId: "chk-ins-03", section: "Section 2.4 Medical Examination and Stamp Duty Recovery", page: 4, tokenCount: 190 },
    { chunkId: "chk-ins-04", section: "Section 3.4 Duplicate Premium Debits and Automated Reversal", page: 5, tokenCount: 220 },
    { chunkId: "chk-ins-05", section: "Section 4.2 Claim Dispute Timelines and Grievance Escalation", page: 7, tokenCount: 335 },
    { chunkId: "chk-ins-06", section: "Section 5.3 Exclusions and Inadmissible Cancellation Claims", page: 9, tokenCount: 295 },
  ],
  subscriptions: [
    { chunkId: "chk-sub-01", section: "Section 1.2 Free Trial Conversion and Advance Notification", page: 1, tokenCount: 210 },
    { chunkId: "chk-sub-02", section: "Section 2.0 Cooling-Off Period and 7-Day Refund Guarantee", page: 3, tokenCount: 285 },
    { chunkId: "chk-sub-03", section: "Section 3.1 Post-Cancellation Billing and Inadvertent Renewal", page: 4, tokenCount: 305 },
    { chunkId: "chk-sub-04", section: "Section 3.3 Account Inactivity Refund Eligibility", page: 5, tokenCount: 180 },
    { chunkId: "chk-sub-05", section: "Section 4.0 Prorated Refunds for Annual Subscriptions", page: 6, tokenCount: 350 },
    { chunkId: "chk-sub-06", section: "Section 5.2 Add-On and In-App Service Refund Limitations", page: 8, tokenCount: 240 },
  ],
  ecommerce: [
    { chunkId: "chk-ecom-01", section: "Section 2.0 Standard 7-Day and 14-Day Return Windows", page: 2, tokenCount: 290 },
    { chunkId: "chk-ecom-02", section: "Section 3.2 Damaged, Defective, or Transit-Broken Items", page: 3, tokenCount: 345 },
    { chunkId: "chk-ecom-03", section: "Section 3.5 Photographic Evidence Standards for Damaged Goods", page: 4, tokenCount: 210 },
    { chunkId: "chk-ecom-04", section: "Section 4.1 Wrong Product Dispatch and Replacement Fallbacks", page: 5, tokenCount: 275 },
    { chunkId: "chk-ecom-05", section: "Section 5.0 Non-Delivery SLA Breach and Automatic Refund", page: 7, tokenCount: 260 },
    { chunkId: "chk-ecom-06", section: "Section 6.3 COD Bank Account Remittance Rules", page: 9, tokenCount: 310 },
  ],
  travel: [
    { chunkId: "chk-trv-01", section: "Section 1.3 Airline-Initiated Flight Cancellation", page: 2, tokenCount: 280 },
    { chunkId: "chk-trv-02", section: "Section 2.1 Cancellation Deduction Slabs (Time to Departure)", page: 4, tokenCount: 360 },
    { chunkId: "chk-trv-03", section: "Section 2.3 Non-Refundable Ancillary Charges (Seats, Meals)", page: 4, tokenCount: 195 },
    { chunkId: "chk-trv-04", section: "Section 3.0 Train and Bus Ticket Auto-Refund on Chart Prep", page: 5, tokenCount: 240 },
    { chunkId: "chk-trv-05", section: "Section 4.2 Missed Connections and Involuntary Rerouting", page: 7, tokenCount: 325 },
    { chunkId: "chk-trv-06", section: "Section 5.1 Medical Emergency and Force Majeure Exceptions", page: 9, tokenCount: 300 },
  ],
};

export function getMockSections(domainId?: Domain | null): MockSection[] {
  if (!domainId || !DOMAIN_SECTIONS[domainId]) {
    return DOMAIN_SECTIONS.banking;
  }
  return DOMAIN_SECTIONS[domainId];
}

export function getMockChunks(domainId?: Domain | null): MockChunk[] {
  if (!domainId || !DOMAIN_CHUNKS[domainId]) {
    return DOMAIN_CHUNKS.banking;
  }
  return DOMAIN_CHUNKS[domainId];
}
