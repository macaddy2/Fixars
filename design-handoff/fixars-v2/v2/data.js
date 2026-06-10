// ====================================================================
// Fixars Prototype v2 — data layer
// ====================================================================

const STATE = {
  page: 'home',
  wallet: 284500,
  points: 1240,
  user: { name: 'Amaka Obi', initials: 'AO', fcs: 742, loc: 'Lagos' },

  feed: [
    { id: 'p1', name: 'Adaeze N.', av: 'AN', avBg: 'var(--concept)', tag: 'concept', meta: 'staked an idea · 2h', body: 'Just published "Solar lockers for market traders" on ConceptNexus — would love validators from Lagos and Onitsha. The pilot is real, the spreadsheets are spicy.', likes: 24, comments: 8, liked: false, saved: false },
    { id: 'p2', name: 'Tunde M.', av: 'TM', avBg: 'var(--invest)', tag: 'invest', meta: 'opened a campaign · 5h', body: 'vestDen — SolarShare Lagos phase 2 just hit ₦8.4M of ₦12M. 42 days left. We are running ahead of plan. Thanks to all 428 backers.', likes: 87, comments: 14, liked: false, saved: false },
    { id: 'p3', name: 'Kemi A.', av: 'KA', avBg: 'var(--skills)', tag: 'skills', meta: 'verified a skill · 1d', body: 'Got my Postgres "Expert" badge verified through 8 paid CollaBoard projects. SkillsCanvas + CollaBoard is a quietly insane combo — every skill is provable, with receipts.', likes: 41, comments: 6, liked: false, saved: false },
    { id: 'p4', name: 'Fixars Team', av: 'FX', avBg: 'var(--navy-900)', tag: 'fixars', meta: 'announcement · 1d', body: 'New: Cross-app handoffs. Validate on ConceptNexus → fund on vestDen → execute on CollaBoard → staff on SkillsCanvas — without copy-pasting anything. Available now.', likes: 312, comments: 48, liked: false, saved: false }
  ],

  ideas: [
    { id: 'i1', title: 'Offline micro-credit for informal traders', desc: 'USSD-first lending product for market traders without smartphones. Trust score from buyer reviews.', tag: 'In Validation', status: 'warning', score: 84, backers: 1240, author: 'Kunle O.' },
    { id: 'i2', title: 'Solar lockers for market sellers', desc: 'Shared phone-charging + dry storage lockers powered by rooftop panels. Pay-per-use via mobile money.', tag: 'Validated', status: 'success', score: 91, backers: 2105, author: 'Adaeze N.' },
    { id: 'i3', title: 'Last-mile cold-chain for poultry', desc: 'Battery-cooled crates rented to neighborhood butchers. Reduces spoilage by 38% in pilot.', tag: 'Validated', status: 'success', score: 88, backers: 1670, author: 'Bisi T.' },
    { id: 'i4', title: 'Voice-first bookkeeping in Yorùbá', desc: 'Trader records sales by talking to her phone. Auto-categorized, exportable for credit applications.', tag: 'In Validation', status: 'warning', score: 76, backers: 540, author: 'Femi A.' },
    { id: 'i5', title: 'Rooftop water tank monitor', desc: 'Cheap ultrasonic sensor + SMS alerts. Useful in cities with intermittent supply.', tag: 'Submitted', status: 'ink', score: 0, backers: 0, author: 'Chuka M.' }
  ],

  campaigns: [
    { id: 'c1', title: 'SolarShare Lagos · phase 2', desc: 'Clean-energy micro-grid for 240 households in Ikorodu.', funded: 8.4, target: 12, irr: 14.2, backers: 428, days: 42 },
    { id: 'c2', title: 'AgriCold rural network', desc: 'Cold-storage rentals for fish and poultry farmers across 6 states.', funded: 4.7, target: 8, irr: 11.8, backers: 312, days: 28 },
    { id: 'c3', title: 'CredKit USSD lending', desc: 'Working-capital loans for informal traders via USSD on any phone.', funded: 14.2, target: 15, irr: 18.5, backers: 1142, days: 8 },
    { id: 'c4', title: 'KejaFix housing repairs', desc: 'On-demand verified artisans for housing repairs in Nairobi & Lagos.', funded: 6.0, target: 6, irr: 12.4, backers: 519, days: 0 }
  ],

  projects: [
    { id: 'pr1', title: 'SolarShare Lagos · build sprint', desc: 'Install + commission 80kW rooftop array, 6-week sprint.', escrow: 1.84, milestones: '2/4', team: ['AO','TM','KA','+1'], status: 'Active' },
    { id: 'pr2', title: 'CredKit MVP · USSD flow', desc: 'Ship USSD service codes for 4 networks. Backed by vestDen funds.', escrow: 0.92, milestones: '1/3', team: ['JK','AO','RE'], status: 'Active' },
    { id: 'pr3', title: 'AgriCold cold-chain pilot', desc: 'Two-month pilot: 12 farms, 8 trucks, sensor reporting.', escrow: 2.40, milestones: '4/6', team: ['BT','KO','FA','+2'], status: 'In review' },
    { id: 'pr4', title: 'Market trader app · v1 launch', desc: 'Voice bookkeeping app shipped to Play Store. Final escrow released.', escrow: 1.20, milestones: '5/5', team: ['FA','AO'], status: 'Done' }
  ],

  talents: [
    { id: 't1', name: 'Tolu Okafor', role: 'Full-stack engineer', cat: 'Engineering', loc: 'Lagos', rate: '₦12k/hr', fcs: 742, skills: ['React','Postgres','Mobile money'], verified: true, projects: 14 },
    { id: 't2', name: 'Kemi Adesanya', role: 'Product designer', cat: 'Design', loc: 'Abuja', rate: '₦9k/hr', fcs: 689, skills: ['Figma','Research','Systems'], verified: true, projects: 22 },
    { id: 't3', name: 'Bisi Eze', role: 'Mobile engineer', cat: 'Engineering', loc: 'Lagos', rate: '₦14k/hr', fcs: 718, skills: ['Flutter','Swift','Kotlin'], verified: true, projects: 9 },
    { id: 't4', name: 'Femi Akande', role: 'Data analyst', cat: 'Data', loc: 'Remote', rate: '₦8k/hr', fcs: 612, skills: ['SQL','dbt','Python'], verified: false, projects: 5 },
    { id: 't5', name: 'Ngozi Udo', role: 'Operations lead', cat: 'Operations', loc: 'Port Harcourt', rate: '₦10k/hr', fcs: 701, skills: ['Logistics','Vendor mgmt','Field ops'], verified: true, projects: 11 }
  ],

  notifications: [
    { id: 'n1', av: 'TM', bg: 'var(--invest)', t: '<b>SolarShare Lagos</b> milestone 2 paid out — <b>+₦60,000</b> to your wallet.', meta: 'vestDen · 2h ago', unread: true },
    { id: 'n2', av: 'KA', bg: 'var(--skills)', t: '<b>Kemi A.</b> verified your Postgres skill. <b>+12 FCS.</b>', meta: 'SkillsCanvas · 6h ago', unread: true },
    { id: 'n3', av: 'AN', bg: 'var(--concept)', t: '<b>Adaeze N.</b> requested your review on “Solar lockers for market sellers”.', meta: 'ConceptNexus · 1d ago', unread: true },
    { id: 'n4', av: 'FX', bg: 'var(--navy-900)', t: 'Escrow released on <b>SolarShare build sprint</b> — milestone 2 of 4 complete.', meta: 'CollaBoard · 2d ago', unread: false },
    { id: 'n5', av: '₦', bg: 'var(--success)', t: 'Bank transfer of <b>₦100,000</b> arrived from GTBank.', meta: 'Wallet · 3d ago', unread: false }
  ],

  transactions: [
    { amt: 60000,  t: 'SolarShare milestone 2 paid out', app: 'vestDen', meta: '2h ago' },
    { amt: -25000, t: 'Stake · CredKit USSD lending', app: 'vestDen', meta: '5h ago' },
    { amt: 340000, t: 'Escrow released · CollaBoard', app: 'CollaBoard', meta: '1d ago' },
    { amt: -12000, t: 'Hired Tolu for 2hr code review', app: 'SkillsCanvas', meta: '2d ago' },
    { amt: 100000, t: 'Bank transfer in', app: 'GTBank', meta: '3d ago' }
  ],

  analytics: {
    gmv: [4.2, 5.1, 4.8, 6.4, 7.9, 8.6, 9.8, 11.2, 10.4, 12.8, 14.1, 16.3], // ₦M/mo
    months: ['Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun'],
    split: [
      { k: 'vestDen stakes', v: 46, color: 'var(--invest)' },
      { k: 'CollaBoard escrow', v: 31, color: 'var(--collab)' },
      { k: 'SkillsCanvas hires', v: 15, color: 'var(--skills)' },
      { k: 'ConceptNexus stakes', v: 8, color: 'var(--concept)' }
    ],
    funnel: [
      { k: 'Ideas submitted', v: 428, pct: 100, color: 'var(--concept)' },
      { k: 'Validated (score ≥ 70)', v: 89, pct: 21, color: 'var(--concept)' },
      { k: 'Funded on vestDen', v: 41, pct: 10, color: 'var(--invest)' },
      { k: 'Shipped via CollaBoard', v: 27, pct: 6, color: 'var(--collab)' },
      { k: 'Teams staffed via SkillsCanvas', v: 24, pct: 5.6, color: 'var(--skills)' }
    ]
  }
};

// Formatters
const fmtN = (n) => '₦' + Math.round(n).toLocaleString('en-NG');

window.STATE = STATE;
window.fmtN = fmtN;
