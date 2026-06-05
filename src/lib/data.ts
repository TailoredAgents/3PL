import {
  BarChart3,
  Bot,
  Building2,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Headphones,
  LineChart,
  MapPinned,
  MessageSquareText,
  Radar,
  ReceiptText,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react";

export const platformName = "Atlanta Freight OS";

export const navItems = [
  { label: "Savings Audit", href: "#audit" },
  { label: "Instant Quote", href: "#quote" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Dashboard", href: "/dashboard" },
];

export const internalNavItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Intake", href: "/intake" },
  { label: "Leads", href: "/leads" },
  { label: "Shippers", href: "/shippers" },
  { label: "Quote Requests", href: "/quote-requests" },
  { label: "Loads", href: "/loads" },
  { label: "Carriers", href: "/carriers" },
  { label: "AI Command Center", href: "/dashboard#ai" },
  { label: "Settings", href: "/dashboard#settings" },
];

export const stats = [
  { label: "Target AI-assisted workflows", value: "95%" },
  { label: "Primary workflow", value: "Audit -> Quote" },
  { label: "Launch market", value: "Atlanta" },
];

export const valueProps = [
  {
    icon: Radar,
    title: "AI freight savings audits",
    body: "Shippers upload invoices, Grok extracts lane and charge patterns, and the CRM creates the follow-up path.",
  },
  {
    icon: Truck,
    title: "Non-asset brokerage execution",
    body: "Post, price, match, track, document, invoice, and analyze loads without owning trucks or warehouse space.",
  },
  {
    icon: Bot,
    title: "Grok-native operations",
    body: "Agent logs, approvals, prompts, confidence scores, and task recommendations are first-class system objects.",
  },
];

export const workflow = [
  "Capture shipper demand through audit, quote, referral, or outbound lead.",
  "Structure the opportunity into companies, contacts, lanes, and quote requests.",
  "Use Grok to draft the next best email, call script, quote summary, and risk notes.",
  "Match carriers through DAT and Truckstop integrations once API keys are connected.",
  "Track delivery, collect POD, invoice the customer, and report lane performance.",
];

export const dashboardCards = [
  {
    icon: MessageSquareText,
    label: "Leads needing follow-up",
    value: "18",
    note: "6 are audit-driven and should be called first.",
  },
  {
    icon: FileText,
    label: "Open quote requests",
    value: "11",
    note: "4 need rate intelligence before noon.",
  },
  {
    icon: MapPinned,
    label: "Active loads",
    value: "7",
    note: "2 require pickup confirmation.",
  },
  {
    icon: ReceiptText,
    label: "Projected margin",
    value: "$14.8k",
    note: "Monitor revenue, carrier cost, and operating risk.",
  },
];

export const pipeline = [
  { stage: "New", count: 22, amount: "$84k" },
  { stage: "Contacted", count: 14, amount: "$56k" },
  { stage: "Qualified", count: 9, amount: "$42k" },
  { stage: "Quoted", count: 5, amount: "$19k" },
  { stage: "Won", count: 3, amount: "$12k" },
];

export const agentBriefs = [
  {
    icon: ClipboardCheck,
    title: "Savings Audit Agent",
    body: "Prioritize audits with invoice totals above $2,500 and recurring lanes.",
  },
  {
    icon: LineChart,
    title: "Rate Intelligence Agent",
    body: "Flag Atlanta to Dallas dry van as volatile. Keep quotes short-validity.",
  },
  {
    icon: Headphones,
    title: "Sales Follow-Up Agent",
    body: "Draft a direct call script around savings, service recovery, and lane consistency.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance Agent",
    body: "Hold carrier tendering until MC, authority, and insurance checks are complete.",
  },
];

export const operationsModules = [
  {
    icon: BarChart3,
    title: "CRM",
    items: ["Lead pipeline", "Contact history", "Follow-up tasks", "Warm contact import"],
  },
  {
    icon: Truck,
    title: "TMS",
    items: ["Quote requests", "Carrier matching", "Load tracking", "POD handling"],
  },
  {
    icon: Bot,
    title: "AI Command",
    items: ["Prompt templates", "Agent logs", "Human approvals", "Daily briefs"],
  },
];

export const crmMetrics = [
  {
    icon: Users,
    label: "Active prospects",
    value: "46",
    note: "12 have known recurring lanes.",
  },
  {
    icon: ClipboardList,
    label: "Follow-ups due",
    value: "9",
    note: "Start with qualified leads and audit submissions.",
  },
  {
    icon: Building2,
    label: "Target shippers",
    value: "31",
    note: "Manufacturing, food, retail, and building materials.",
  },
  {
    icon: FileText,
    label: "Quotes in motion",
    value: "11",
    note: "4 need pricing before close of business.",
  },
];

export const leads = [
  {
    id: "peachtree-building-supply",
    company: "Peachtree Building Supply",
    contact: "Mason Keller",
    title: "Logistics Manager",
    phone: "(404) 555-0148",
    email: "mason@peachtree.example",
    stage: "New",
    source: "Savings Audit",
    priority: "High",
    lanes: "Atlanta, GA -> Dallas, TX; Marietta, GA -> Charlotte, NC",
    equipment: "Dry van",
    volume: "18-24 loads/mo",
    nextFollowUp: "Today, 10:30 AM",
    pain: "Spot rates swing weekly and PODs are slow from current provider.",
    aiNextAction:
      "Lead with the audit angle, ask about their Dallas lane frequency, then offer a same-day benchmark quote.",
  },
  {
    id: "southline-foods",
    company: "Southline Foods",
    contact: "Erica Walsh",
    title: "Transportation Coordinator",
    phone: "(678) 555-0182",
    email: "erica@southline.example",
    stage: "Contacted",
    source: "Instant Quote",
    priority: "High",
    lanes: "Savannah, GA -> Nashville, TN",
    equipment: "Reefer",
    volume: "8-12 loads/mo",
    nextFollowUp: "Today, 1:00 PM",
    pain: "Needs appointment discipline and proactive temperature updates.",
    aiNextAction:
      "Ask for pickup windows, temperature settings, and any detention history before pricing.",
  },
  {
    id: "north-metro-packaging",
    company: "North Metro Packaging",
    contact: "Chris Duarte",
    title: "Operations Director",
    phone: "(770) 555-0160",
    email: "chris@northmetro.example",
    stage: "Qualified",
    source: "Outbound",
    priority: "Medium",
    lanes: "Atlanta, GA -> Orlando, FL",
    equipment: "Dry van",
    volume: "10 loads/mo",
    nextFollowUp: "Tomorrow, 9:00 AM",
    pain: "Wants fewer missed pickups during end-of-month surges.",
    aiNextAction:
      "Position coverage reliability and ask whether they can tender recurring Friday freight earlier.",
  },
  {
    id: "cobb-industrial-supply",
    company: "Cobb Industrial Supply",
    contact: "Dana Price",
    title: "Purchasing Lead",
    phone: "(470) 555-0122",
    email: "dana@cobbindustrial.example",
    stage: "Quoted",
    source: "Referral",
    priority: "Medium",
    lanes: "Kennesaw, GA -> Memphis, TN",
    equipment: "Flatbed",
    volume: "Project-based",
    nextFollowUp: "Jun 04, 2:00 PM",
    pain: "Needs securement confidence and quick quote turnaround.",
    aiNextAction:
      "Follow up with a concise recap of securement requirements and quote validity window.",
  },
];

export const leadStages = [
  "New",
  "Contacted",
  "Qualified",
  "Quoted",
  "Won",
  "Lost",
];

export const activities = [
  {
    company: "Peachtree Building Supply",
    type: "AI Touch",
    detail: "Generated savings audit call script for Atlanta to Dallas lane.",
    time: "8:12 AM",
  },
  {
    company: "Southline Foods",
    type: "Call",
    detail: "Left voicemail asking for reefer temperature and appointment windows.",
    time: "Yesterday",
  },
  {
    company: "North Metro Packaging",
    type: "Note",
    detail: "Decision maker cares more about pickup reliability than cheapest spot rate.",
    time: "Yesterday",
  },
  {
    company: "Cobb Industrial Supply",
    type: "Email",
    detail: "Sent flatbed quote recap and requested securement photo examples.",
    time: "Jun 01",
  },
];

export const shippers = [
  {
    id: "peachtree-building-supply",
    company: "Peachtree Building Supply",
    status: "Lead",
    industry: "Building materials",
    primaryContact: "Mason Keller",
    email: "mason@peachtree.example",
    phone: "(404) 555-0148",
    lanes: ["Atlanta -> Dallas", "Marietta -> Charlotte"],
    notes: "Strong recurring dry van opportunity. Wants freight savings review.",
  },
  {
    id: "southline-foods",
    company: "Southline Foods",
    status: "Lead",
    industry: "Food distribution",
    primaryContact: "Erica Walsh",
    email: "erica@southline.example",
    phone: "(678) 555-0182",
    lanes: ["Savannah -> Nashville"],
    notes: "Reefer prospect. High service sensitivity.",
  },
  {
    id: "north-metro-packaging",
    company: "North Metro Packaging",
    status: "Lead",
    industry: "Packaging",
    primaryContact: "Chris Duarte",
    email: "chris@northmetro.example",
    phone: "(770) 555-0160",
    lanes: ["Atlanta -> Orlando"],
    notes: "Qualified. Needs surge coverage plan.",
  },
  {
    id: "cobb-industrial-supply",
    company: "Cobb Industrial Supply",
    status: "Lead",
    industry: "Industrial supply",
    primaryContact: "Dana Price",
    email: "dana@cobbindustrial.example",
    phone: "(470) 555-0122",
    lanes: ["Kennesaw -> Memphis"],
    notes: "Flatbed project work. Follow quote before Thursday.",
  },
];

export const quoteRequests = [
  {
    id: "quote-southline-sav-nas",
    company: "Southline Foods",
    lane: "Savannah, GA -> Nashville, TN",
    equipment: "Reefer",
    pickup: "Jun 05",
    weight: "38,000 lbs",
    status: "Pricing",
    details: "Frozen product, appointment pickup, strict delivery window.",
    aiSummary:
      "Confirm temperature, pallet count, and whether detention has been an issue before quoting.",
  },
  {
    id: "quote-peachtree-atl-dal",
    company: "Peachtree Building Supply",
    lane: "Atlanta, GA -> Dallas, TX",
    equipment: "Dry van",
    pickup: "Jun 06",
    weight: "42,000 lbs",
    status: "New",
    details: "Recurring building materials lane. Wants comparison against old invoices.",
    aiSummary:
      "Good candidate for savings audit follow-up and recurring-lane pricing conversation.",
  },
  {
    id: "quote-cobb-ken-mem",
    company: "Cobb Industrial Supply",
    lane: "Kennesaw, GA -> Memphis, TN",
    equipment: "Flatbed",
    pickup: "Jun 07",
    weight: "31,500 lbs",
    status: "Quoted",
    details: "Strapped industrial equipment. Customer asked for securement confidence.",
    aiSummary:
      "Send securement checklist with quote recap and ask for acceptance before noon tomorrow.",
  },
];

export const carriers = [
  {
    id: "blue-ridge-transport",
    company: "Blue Ridge Transport",
    mcNumber: "MC-482913",
    dotNumber: "DOT-1849201",
    contact: "Ray Collins",
    phone: "(404) 555-0190",
    email: "dispatch@blueridge.example",
    complianceStatus: "Approved",
    preferredLanes: ["Atlanta -> Dallas", "Atlanta -> Orlando"],
    notes: "Strong dry van option for Southeast lanes. Good communication.",
    loadCount: 8,
  },
  {
    id: "magnolia-reefer-lines",
    company: "Magnolia Reefer Lines",
    mcNumber: "MC-771204",
    dotNumber: "DOT-2091844",
    contact: "Tina Morales",
    phone: "(678) 555-0177",
    email: "ops@magnoliareefer.example",
    complianceStatus: "Pending",
    preferredLanes: ["Savannah -> Nashville", "Atlanta -> Tampa"],
    notes: "Good reefer candidate. Verify insurance before tendering.",
    loadCount: 2,
  },
  {
    id: "cumberland-flatbed",
    company: "Cumberland Flatbed",
    mcNumber: "MC-640118",
    dotNumber: "DOT-3301944",
    contact: "Derek Shaw",
    phone: "(770) 555-0139",
    email: "derek@cumberlandflatbed.example",
    complianceStatus: "Approved",
    preferredLanes: ["Kennesaw -> Memphis", "Atlanta -> Birmingham"],
    notes: "Flatbed option with securement experience.",
    loadCount: 4,
  },
];

export const loads = [
  {
    id: "load-atl-dal-001",
    shipper: "Peachtree Building Supply",
    carrier: "Blue Ridge Transport",
    lane: "Atlanta, GA -> Dallas, TX",
    equipment: "Dry van",
    status: "Booked",
    pickup: "Jun 06",
    delivery: "Jun 08",
    customerRate: 2450,
    carrierRate: 1980,
    margin: 470,
    marginPercent: 19.2,
    risk: "Needs pickup confirmation by 2:00 PM.",
    events: [
      {
        type: "Location Update",
        message: "Load booked with Blue Ridge Transport.",
        location: "Atlanta, GA",
        time: "Today, 9:15 AM",
      },
    ],
    documents: [],
  },
  {
    id: "load-sav-nas-002",
    shipper: "Southline Foods",
    carrier: "Magnolia Reefer Lines",
    lane: "Savannah, GA -> Nashville, TN",
    equipment: "Reefer",
    status: "Tendered",
    pickup: "Jun 05",
    delivery: "Jun 06",
    customerRate: 1850,
    carrierRate: 0,
    margin: 0,
    marginPercent: 0,
    risk: "Carrier compliance pending. Confirm temperature requirements.",
    events: [
      {
        type: "Location Update",
        message: "Load created from quote request.",
        location: "Savannah, GA",
        time: "Today, 8:40 AM",
      },
    ],
    documents: [],
  },
];
