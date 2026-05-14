// ====================================================================
// Fixars Prototype — single-page app
// ====================================================================

const STATE = {
  page: 'home',
  feed: [
    { id: 'p1', name: 'Adaeze N.', av: 'AN', avBg: 'var(--concept)', tag: 'concept', meta: 'staked an idea · 2h', body: 'Just published "Solar lockers for market traders" on ConceptNexus — would love validators from Lagos and Onitsha. The pilot is real, the spreadsheets are spicy. 🌞', likes: 24, comments: 8 },
    { id: 'p2', name: 'Tunde M.', av: 'TM', avBg: 'var(--invest)', tag: 'invest', meta: 'opened a campaign · 5h', body: 'vestDen — SolarShare Lagos phase 2 just hit ₦8.4M of ₦12M. 42 days left. We are running ahead of plan. Thanks to all 428 backers.', likes: 87, comments: 14 },
    { id: 'p3', name: 'Kemi A.', av: 'KA', avBg: 'var(--skills)', tag: 'skills', meta: 'verified a skill · 1d', body: 'Got my Postgres "Expert" badge verified through 8 paid CollaBoard projects. SkillsCanvas + CollaBoard is a quietly insane combo — every skill is provable, with receipts.', likes: 41, comments: 6 },
    { id: 'p4', name: 'Fixars Team', av: 'FX', avBg: 'var(--navy-900)', tag: 'fixars', meta: 'announcement · 1d', body: 'New: Cross-app handoffs. Validate on ConceptNexus → fund on vestDen → execute on CollaBoard → staff on SkillsCanvas — without copy-pasting anything. Available now.', likes: 312, comments: 48 }
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
    { id: 'c3', title: 'CredKit USSD lending', desc: 'Working-capital loans for informal traders via USSD on any phone.', funded: 14.2, target: 15, irr: 18.5, backers: 1142, days: 8 }
  ],
  projects: [
    { id: 'pr1', title: 'SolarShare Lagos · build sprint', desc: 'Install + commission 80kW rooftop array, 6-week sprint.', escrow: 1.84, milestones: '2/4', team: ['AO','TM','KA','+1'], status: 'Active' },
    { id: 'pr2', title: 'CredKit MVP · USSD flow', desc: 'Ship USSD service codes for 4 networks. Backed by vestDen funds.', escrow: 0.92, milestones: '1/3', team: ['JK','AO','RE'], status: 'Active' },
    { id: 'pr3', title: 'AgriCold cold-chain pilot', desc: 'Two-month pilot: 12 farms, 8 trucks, sensor reporting.', escrow: 2.40, milestones: '4/6', team: ['BT','KO','FA','+2'], status: 'In review' }
  ],
  talents: [
    { id: 't1', name: 'Tolu Okafor', role: 'Full-stack engineer', loc: 'Lagos', rate: '₦12k/hr', fcs: 742, skills: ['React','Postgres','Mobile money'], verified: true, projects: 14 },
    { id: 't2', name: 'Kemi Adesanya', role: 'Product designer', loc: 'Abuja', rate: '₦9k/hr', fcs: 689, skills: ['Figma','Research','Systems'], verified: true, projects: 22 },
    { id: 't3', name: 'Bisi Eze', role: 'Mobile engineer', loc: 'Lagos', rate: '₦14k/hr', fcs: 718, skills: ['Flutter','Swift','Kotlin'], verified: true, projects: 9 },
    { id: 't4', name: 'Femi Akande', role: 'Data analyst', loc: 'Remote', rate: '₦8k/hr', fcs: 612, skills: ['SQL','dbt','Python'], verified: false, projects: 5 }
  ]
};

// ===== Routing =====
function navigate(page){
  STATE.page = page;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));
  document.querySelectorAll('.tab-btn').forEach(n => n.classList.toggle('active', n.dataset.page === page));
  const root = document.getElementById('page-root');
  root.innerHTML = (PAGES[page] || PAGES.home)();
  // scroll to top
  document.querySelector('.main').scrollTo?.({top:0});
  window.scrollTo(0,0);
  // Wire any clickables
  bindPage(root);
}

function bindPage(root){
  root.querySelectorAll('[data-page]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); navigate(el.dataset.page); }));
  root.querySelectorAll('[data-modal]').forEach(el => el.addEventListener('click', () => openModal(el.dataset.modal)));
  root.querySelectorAll('[data-toast]').forEach(el => el.addEventListener('click', () => toast(el.dataset.toast)));
  root.querySelectorAll('.segment button').forEach(b => b.addEventListener('click', e => {
    e.currentTarget.parentElement.querySelectorAll('button').forEach(x => x.classList.remove('active'));
    e.currentTarget.classList.add('active');
  }));
  root.querySelectorAll('.chip[data-toggle]').forEach(c => c.addEventListener('click', () => c.classList.toggle('active')));
}

// ===== Toast =====
let toastTimer;
function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

// ===== Modal =====
function openModal(kind){
  const mask = document.getElementById('modal-mask');
  const modal = document.getElementById('modal');
  modal.innerHTML = MODALS[kind] ? MODALS[kind]() : '';
  mask.classList.add('open');
  modal.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeModal));
  modal.querySelectorAll('[data-submit]').forEach(b => b.addEventListener('click', () => {
    closeModal();
    toast(b.dataset.submit);
  }));
}
function closeModal(){ document.getElementById('modal-mask').classList.remove('open'); }
document.getElementById('modal-mask').addEventListener('click', e => { if (e.target.id === 'modal-mask') closeModal(); });

// ===================================================================
// PAGES
// ===================================================================
const PAGES = {};

// ----- HOME -----
PAGES.home = () => `
  <div class="page-head">
    <div>
      <div class="page-eyebrow"><span class="page-tag">Good morning, Amaka</span></div>
      <h1 class="page-title">Your operating system<br/>for African innovation.</h1>
      <p class="page-sub">Validate ideas, fund what matters, ship with verified teams. Today across the ecosystem: <b>1,240 ideas</b> in motion, <b>₦142M</b> staked.</p>
    </div>
    <button class="btn btn-primary" data-modal="newIdea">+ Submit idea</button>
  </div>

  <div class="stats">
    <div class="stat"><div class="k">FCS · Fixars credit score</div><div class="v">742</div><div class="t up">↑ 18 this month</div></div>
    <div class="stat"><div class="k">Wallet</div><div class="v mono">₦284,500</div><div class="t up">↑ ₦12,400 / wk</div></div>
    <div class="stat"><div class="k">Active stakes</div><div class="v">14</div><div class="t" style="color:var(--ink-500)">across 9 campaigns</div></div>
    <div class="stat"><div class="k">Verified skills</div><div class="v">3</div><div class="t" style="color:var(--ink-500)">React · Postgres · API</div></div>
  </div>

  <div class="split">
    <div>
      <h3 class="display" style="font-size:18px;font-weight:500;margin:0 0 12px;letter-spacing:-0.015em">Your apps</h3>
      <div class="subapp-grid">
        ${subAppTile('concept','C','ConceptNexus','Validate. Refine. Get backed.','3 reviews ready','428 ideas')}
        ${subAppTile('invest','V','vestDen','Fund the future of Africa.','14 stakes active','₦68M deployed')}
        ${subAppTile('collab','B','CollaBoard','Ship work in escrowed sprints.','2 projects live','₦1.84M in escrow')}
        ${subAppTile('skills','S','SkillsCanvas','Provable skills, paid receipts.','Profile 78%','3 verified')}
      </div>

      <h3 class="display" style="font-size:18px;font-weight:500;margin:28px 0 12px;letter-spacing:-0.015em">Continue where you left off</h3>
      <div class="list-grid">
        ${ideaCard(STATE.ideas[0])}
        ${campaignCard(STATE.campaigns[0])}
      </div>
    </div>

    <aside>
      <div class="wallet-card" style="margin-bottom:16px">
        <div class="k">Wallet balance</div>
        <div class="v mono">₦284,500</div>
        <div class="delta">↑ ₦12,400 this week</div>
        <div class="wallet-actions">
          <div class="wallet-action primary" data-toast="Stake created">Stake</div>
          <div class="wallet-action" data-toast="Sent">Send</div>
          <div class="wallet-action" data-toast="Received">Add</div>
          <div class="wallet-action" data-page="wallet">More</div>
        </div>
      </div>

      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <h3 class="display" style="font-size:16px;font-weight:500;margin:0;letter-spacing:-0.015em">Activity</h3>
          <span class="page-tag" data-page="feed" style="cursor:pointer">View all →</span>
        </div>
        ${activityRow('TM','var(--invest)','<b>Tunde</b> opened a vestDen campaign','SolarShare Lagos · phase 2 · 2h ago')}
        ${activityRow('AN','var(--concept)','<b>Adaeze</b> submitted a new idea','Solar lockers for market sellers · 4h')}
        ${activityRow('KA','var(--skills)','<b>Kemi</b> verified your Postgres skill','+12 FCS · 1d')}
        ${activityRow('FX','var(--navy-900)','<b>Fixars</b> paid escrow on milestone 2','SolarShare build sprint · 2d')}
      </div>
    </aside>
  </div>
`;

const subAppTile = (key, glyph, name, tagline, status, count) => `
  <div class="subapp-tile ${key}" data-page="${key}">
    <div class="acc-bar"></div>
    <div class="head">
      <div class="icon">${glyph}</div>
      <div class="name">${name}</div>
    </div>
    <div class="desc">${tagline}</div>
    <div class="foot">
      <span class="meta-num">${status} · ${count}</span>
      <span class="arrow">→</span>
    </div>
  </div>
`;

const activityRow = (av, bg, body, meta) => `
  <div class="activity-row">
    <div class="av" style="background:${bg}">${av}</div>
    <div class="body"><div class="t">${body}</div><div class="meta">${meta}</div></div>
  </div>
`;

// ----- APPS GRID -----
PAGES.apps = () => `
  <div class="page-head">
    <div>
      <div class="page-eyebrow"><span class="page-tag">Ecosystem</span></div>
      <h1 class="page-title">Four apps, one fabric.</h1>
      <p class="page-sub">Validate on ConceptNexus → fund on vestDen → ship on CollaBoard → staff with SkillsCanvas. Identity, wallet and reputation flow across all four.</p>
    </div>
  </div>

  <div class="subapp-grid" style="grid-template-columns:repeat(2,minmax(0,1fr))">
    ${largeSubappCard('concept','C','ConceptNexus','Validate. Refine. Get backed.','Submit ideas, get peer + AI scoring, graduate to vestDen with proof.', '428 ideas · 89 validated')}
    ${largeSubappCard('invest','V','vestDen','Fund the future of Africa.','Back validated ideas with as little as ₦5,000. Track milestones, get paid in proportion.', '₦142M deployed · 14% avg IRR')}
    ${largeSubappCard('collab','B','CollaBoard','Ship work in escrowed sprints.','Project boards with milestone-based escrow. Money releases on delivery.', '208 projects · ₦68M in escrow')}
    ${largeSubappCard('skills','S','SkillsCanvas','Provable skills, paid receipts.','Build a skill profile verified by completed CollaBoard milestones. Get hired.', '4,820 talents · 76% verified')}
  </div>
`;

const largeSubappCard = (key, glyph, name, tagline, blurb, meta) => `
  <div class="subapp-tile ${key}" data-page="${key}" style="min-height:220px">
    <div class="acc-bar"></div>
    <div class="head">
      <div class="icon" style="width:44px;height:44px;font-size:20px">${glyph}</div>
      <div>
        <div class="name" style="font-size:18px">${name}</div>
        <div class="meta-num" style="font-size:12px;margin-top:2px">${tagline}</div>
      </div>
    </div>
    <div class="desc" style="font-size:13px">${blurb}</div>
    <div class="foot">
      <span class="meta-num">${meta}</span>
      <span class="arrow">Open →</span>
    </div>
  </div>
`;

// ----- CONCEPT NEXUS -----
PAGES.concept = () => subAppPage({
  key:'concept', glyph:'C', name:'ConceptNexus',
  tagline:'Idea validation', mission:'Where African innovation gets stress-tested before it gets funded.',
  cta:'+ Submit idea', ctaModal:'newIdea',
  stats:[
    {k:'Total ideas',v:'428',t:'in the system'},
    {k:'Validated',v:'89',t:'ready for vestDen', tColor:'var(--success)'},
    {k:'In validation',v:'214',t:'reviewing now'},
    {k:'Avg score',v:'72',t:'/ 100'}
  ],
  filters:['All','Submitted','In Validation','Validated'],
  list: STATE.ideas.map(ideaCard).join('')
});

const ideaCard = (i) => `
  <div class="list-card" data-modal="ideaDetail">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
      <span class="tag tag-${i.status === 'success' ? 'success' : i.status === 'warning' ? 'warning' : 'ink'}">
        <span style="width:5px;height:5px;border-radius:50%;background:currentColor"></span>${i.tag}
      </span>
      ${i.score ? `<span class="mono" style="font-size:11px;color:var(--ink-400)">Score <b style="color:var(--navy-900)">${i.score}</b>/100</span>` : ''}
    </div>
    <div class="title">${i.title}</div>
    <div class="desc">${i.desc}</div>
    <div class="meta">
      <span>by <b style="color:var(--navy-900)">${i.author}</b></span>
      <span>${i.backers} <span class="stat-num">reviewers</span></span>
    </div>
  </div>
`;

// ----- VESTDEN -----
PAGES.invest = () => subAppPage({
  key:'invest', glyph:'V', name:'vestDen',
  tagline:'Capital · Den of investors', mission:'Fund the validated future. From ₦5,000 to ₦5M, every stake is tracked, escrowed, and milestone-paid.',
  cta:'+ Browse campaigns', ctaModal:'newStake',
  stats:[
    {k:'Total deployed',v:'₦142M',t:'across 89 campaigns'},
    {k:'Avg IRR',v:'14.2%',t:'last 12 mo', tColor:'var(--success)'},
    {k:'Active backers',v:'4,820',t:'across the den'},
    {k:'Active campaigns',v:'27',t:'open now'}
  ],
  filters:['All','Funding now','Closing soon','Funded'],
  list: STATE.campaigns.map(campaignCard).join('')
});

const campaignCard = (c) => {
  const pct = Math.round(c.funded / c.target * 100);
  return `
  <div class="list-card" data-modal="stakeDetail">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
      <span class="tag tag-invest"><span style="width:5px;height:5px;border-radius:50%;background:currentColor"></span>Funding now</span>
      <span class="mono" style="font-size:11px;color:var(--ink-400)">${c.days} days left</span>
    </div>
    <div class="title">${c.title}</div>
    <div class="desc">${c.desc}</div>
    <div>
      <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--ink-500);margin-bottom:6px">
        <span>Funded</span>
        <span><b class="stat-num">₦${c.funded}M</b> / ₦${c.target}M · ${pct}%</span>
      </div>
      <div class="progress"><div style="width:${pct}%;background:var(--invest)"></div></div>
    </div>
    <div class="meta">
      <span><b style="color:var(--invest)">${c.irr}%</b> target IRR</span>
      <span>${c.backers} backers</span>
    </div>
  </div>`;
};

// ----- COLLABOARD -----
PAGES.collab = () => subAppPage({
  key:'collab', glyph:'B', name:'CollaBoard',
  tagline:'Execution · Escrowed sprints', mission:'Where validated ideas become shipped products. Milestone-based escrow keeps money safe and teams paid.',
  cta:'+ Create board', ctaModal:'newBoard',
  stats:[
    {k:'Active projects',v:'208',t:'across 4 sub-apps'},
    {k:'In escrow',v:'₦68M',t:'milestone-locked'},
    {k:'Released',v:'₦142M',t:'on delivery', tColor:'var(--success)'},
    {k:'Avg delivery',v:'94%',t:'on-time rate'}
  ],
  filters:['All','Active','In review','Done'],
  list: STATE.projects.map(projectCard).join('')
});

const projectCard = (p) => `
  <div class="list-card" data-modal="projectDetail">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
      <span class="tag tag-collab"><span style="width:5px;height:5px;border-radius:50%;background:currentColor"></span>${p.status}</span>
      <span class="mono" style="font-size:11px;color:var(--ink-400)">${p.milestones} milestones</span>
    </div>
    <div class="title">${p.title}</div>
    <div class="desc">${p.desc}</div>
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div style="display:flex">
        ${p.team.map((t,i) => `<div class="av" style="width:26px;height:26px;font-size:10px;background:${['var(--collab)','var(--navy-900)','var(--skills)','var(--ink-300)'][i%4]};border:2px solid white;margin-left:${i?-8:0}px">${t}</div>`).join('')}
      </div>
      <div style="text-align:right">
        <div style="font-size:10px;color:var(--ink-400);text-transform:uppercase;letter-spacing:0.08em;font-weight:600">In escrow</div>
        <div class="mono" style="font-size:14px;font-weight:600">₦${p.escrow}M</div>
      </div>
    </div>
  </div>
`;

// ----- SKILLSCANVAS -----
PAGES.skills = () => subAppPage({
  key:'skills', glyph:'S', name:'SkillsCanvas',
  tagline:'Talent · Verified by work', mission:'Skills aren\'t self-claimed — they\'re verified by completed CollaBoard milestones with money attached.',
  cta:'+ List your skills', ctaModal:'newSkill',
  stats:[
    {k:'Total talents',v:'4,820',t:'across 18 cities'},
    {k:'Avg hourly',v:'₦9,400',t:'last 90 days'},
    {k:'Verified skills',v:'76%',t:'of profiles', tColor:'var(--success)'},
    {k:'Projects done',v:'2,140',t:'completed via CollaBoard'}
  ],
  filters:['All','Engineering','Design','Data','Operations'],
  list: STATE.talents.map(talentCard).join('')
});

const talentCard = (t) => `
  <div class="list-card" data-modal="talentDetail">
    <div style="display:flex;align-items:flex-start;gap:12px">
      <div class="av" style="width:48px;height:48px;background:linear-gradient(135deg,var(--skills),var(--blue-500));font-size:14px">${t.name.split(' ').map(n=>n[0]).join('')}</div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
          <div>
            <div class="title" style="font-size:16px">${t.name}</div>
            <div class="desc" style="margin-top:2px">${t.role} · ${t.loc}</div>
          </div>
          ${t.verified ? '<span class="tag tag-success"><span style="width:5px;height:5px;border-radius:50%;background:currentColor"></span>Verified</span>' : '<span class="tag tag-ink">Unverified</span>'}
        </div>
      </div>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:6px">
      ${t.skills.map(s => `<span class="tag tag-skills">${s}</span>`).join('')}
    </div>
    <div class="meta">
      <span class="mono"><b style="color:var(--navy-900)">${t.rate}</b> · FCS ${t.fcs}</span>
      <span>${t.projects} projects done</span>
    </div>
  </div>
`;

// Generic sub-app page wrapper
function subAppPage({key, glyph, name, tagline, mission, cta, ctaModal, stats, filters, list}){
  return `
    <div class="page-head">
      <div>
        <div class="page-eyebrow">
          <div class="page-icon ${key}">${glyph}</div>
          <span class="page-tag">${tagline}</span>
        </div>
        <h1 class="page-title">${name}</h1>
        <p class="page-sub">${mission}</p>
      </div>
      <button class="btn btn-app-${key}" data-modal="${ctaModal}">${cta}</button>
    </div>

    <div class="stats">
      ${stats.map(s => `<div class="stat"><div class="k">${s.k}</div><div class="v ${typeof s.v === 'string' && s.v.includes('₦') ? 'mono' : ''}">${s.v}</div><div class="t" style="${s.tColor?`color:${s.tColor}`:'color:var(--ink-500)'}">${s.t}</div></div>`).join('')}
    </div>

    <div class="toolbar">
      <div class="toolbar-search">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-400)" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
        <input placeholder="Search ${name.toLowerCase()}…"/>
      </div>
      <div class="segment">${filters.map((f,i) => `<button class="${i===0?'active':''}">${f}</button>`).join('')}</div>
    </div>

    <div class="list-grid">${list}</div>
  `;
}

// ----- FEED -----
PAGES.feed = () => `
  <div class="page-head">
    <div>
      <div class="page-eyebrow"><span class="page-tag">Activity feed</span></div>
      <h1 class="page-title">What's moving across Fixars.</h1>
      <p class="page-sub">Stay updated with activity across the ecosystem. Filter by sub-app, follow people you trust.</p>
    </div>
  </div>

  <div class="composer">
    <div class="composer-row">
      <div class="avatar">AO</div>
      <textarea placeholder="Share something with the Fixars community…"></textarea>
    </div>
    <div class="composer-actions">
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <span class="chip concept" data-toggle><span class="dot"></span>ConceptNexus</span>
        <span class="chip invest" data-toggle><span class="dot"></span>vestDen</span>
        <span class="chip collab" data-toggle><span class="dot"></span>CollaBoard</span>
        <span class="chip skills" data-toggle><span class="dot"></span>SkillsCanvas</span>
      </div>
      <button class="btn btn-primary btn-sm" data-toast="Posted to feed">Post</button>
    </div>
  </div>

  <div class="toolbar" style="margin-top:18px">
    <div class="segment">
      <button class="active">All</button>
      <button>Following</button>
      <button>Trending</button>
    </div>
  </div>

  ${STATE.feed.map(feedCard).join('')}
`;

const feedCard = (p) => `
  <div class="feed-card">
    <div class="feed-head">
      <div class="av" style="width:36px;height:36px;border-radius:50%;background:${p.avBg};color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600">${p.av}</div>
      <div>
        <div class="feed-name">${p.name} <span class="tag tag-${p.tag === 'fixars' ? 'ink' : p.tag}" style="margin-left:6px;font-size:9px">${p.tag === 'fixars' ? 'TEAM' : p.tag.toUpperCase()}</span></div>
        <div class="feed-meta">${p.meta}</div>
      </div>
    </div>
    <div class="feed-body">${p.body}</div>
    <div class="feed-actions">
      <span class="feed-action" data-toast="Liked">♥ ${p.likes}</span>
      <span class="feed-action" data-toast="Comment thread opened">💬 ${p.comments}</span>
      <span class="feed-action" data-toast="Saved">🔖 Save</span>
      <span class="feed-action" data-toast="Link copied" style="margin-left:auto">↗ Share</span>
    </div>
  </div>
`;

// ----- WALLET -----
PAGES.wallet = () => `
  <div class="page-head">
    <div>
      <div class="page-eyebrow"><span class="page-tag">Wallet · Identity-linked</span></div>
      <h1 class="page-title">₦284,500 ready to move.</h1>
      <p class="page-sub">Stake on vestDen, escrow on CollaBoard, withdraw to bank or mobile money — your wallet is one credential across the ecosystem.</p>
    </div>
    <button class="btn btn-primary" data-toast="Top-up modal opens">+ Add money</button>
  </div>

  <div class="split">
    <div>
      <div class="wallet-card" style="margin-bottom:16px">
        <div class="k">Wallet balance</div>
        <div class="v mono">₦284,500</div>
        <div class="delta">↑ ₦12,400 this week</div>
        <div class="wallet-actions">
          <div class="wallet-action primary" data-toast="Stake">Stake</div>
          <div class="wallet-action" data-toast="Sent">Send</div>
          <div class="wallet-action" data-toast="Received">Add</div>
          <div class="wallet-action" data-toast="Withdrawn">Withdraw</div>
        </div>
      </div>

      <div class="card">
        <h3 class="display" style="font-size:16px;font-weight:500;margin:0 0 12px;letter-spacing:-0.015em">Recent transactions</h3>
        ${[
          ['+₦60,000','SolarShare milestone 2 paid out','var(--success)','vestDen · 2h ago'],
          ['-₦25,000','Stake · CredKit USSD lending','var(--invest)','vestDen · 5h ago'],
          ['+₦340,000','Escrow released · CollaBoard','var(--success)','CollaBoard · 1d'],
          ['-₦12,000','Hired Tolu for 2hr code review','var(--collab)','SkillsCanvas · 2d'],
          ['+₦100,000','Bank transfer in','var(--success)','GTBank · 3d']
        ].map(([amt,t,c,m]) => `
          <div class="activity-row" style="border-bottom-color:var(--ink-100)">
            <div class="av" style="background:${c}">${amt[0]}</div>
            <div class="body">
              <div class="t" style="display:flex;justify-content:space-between;gap:8px"><span><b>${t}</b></span><span class="mono" style="color:${c.includes('success')?'var(--success)':'var(--ink-700)'}">${amt}</span></div>
              <div class="meta">${m}</div>
            </div>
          </div>`).join('')}
      </div>
    </div>

    <aside>
      <div class="card" style="margin-bottom:16px">
        <h3 class="display" style="font-size:16px;font-weight:500;margin:0 0 12px;letter-spacing:-0.015em">FCS · Fixars credit score</h3>
        <div style="text-align:center;padding:8px 0">
          <div style="position:relative;width:120px;height:120px;margin:0 auto">
            <svg viewBox="0 0 36 36" style="width:100%;height:100%;transform:rotate(-90deg)">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--ink-100)" stroke-width="3"/>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--success)" stroke-width="3" stroke-dasharray="74 26" stroke-linecap="round"/>
            </svg>
            <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
              <div class="display" style="font-size:32px;font-weight:500">742</div>
              <div style="font-size:11px;color:var(--ink-400)">Excellent</div>
            </div>
          </div>
        </div>
        <div class="kv"><span class="k">Repayment history</span><span class="v" style="color:var(--success)">A+</span></div>
        <div class="kv"><span class="k">Verified skills</span><span class="v">3</span></div>
        <div class="kv"><span class="k">Projects delivered</span><span class="v">14</span></div>
        <div class="kv"><span class="k">Trust radius</span><span class="v">₦1.2M</span></div>
      </div>

      <div class="card-dark card">
        <div style="font-size:11px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:0.1em;font-weight:600">Fixars Pro</div>
        <div class="display" style="font-size:18px;font-weight:500;margin:6px 0 8px;letter-spacing:-0.015em">Unlock instant withdrawals</div>
        <div style="font-size:13px;color:rgba(255,255,255,.7);line-height:1.5">Get instant settlement, priority support, and 0% fees on the first ₦500k each month.</div>
        <button class="btn btn-sm" style="background:white;color:var(--navy-900);margin-top:12px" data-toast="Upgrade flow opens">Upgrade · ₦2,500/mo</button>
      </div>
    </aside>
  </div>
`;

// ----- PROFILE -----
PAGES.profile = () => `
  <div class="page-head">
    <div>
      <div class="page-eyebrow"><span class="page-tag">Profile</span></div>
      <h1 class="page-title">Amaka Obi.</h1>
      <p class="page-sub">Operator · Lagos. FCS 742. 14 projects shipped, 9 active stakes, 3 verified skills.</p>
    </div>
    <button class="btn btn-ghost" data-toast="Edit profile">Edit profile</button>
  </div>

  <div class="split">
    <div>
      <div class="card" style="margin-bottom:16px">
        <h3 class="display" style="font-size:16px;font-weight:500;margin:0 0 12px;letter-spacing:-0.015em">Skills · verified</h3>
        ${[
          ['React','Advanced','94','Verified by 12 projects'],
          ['Postgres','Expert','89','Verified by 8 projects'],
          ['Mobile money APIs','Intermediate','76','Flutterwave · Paystack']
        ].map(([s,l,sc,m]) => `
          <div class="kv">
            <div>
              <div style="font-weight:600;font-size:14px">${s} · <span style="color:var(--ink-500);font-weight:500">${l}</span></div>
              <div style="font-size:11px;color:var(--ink-400);margin-top:2px">${m}</div>
            </div>
            <span class="mono" style="color:var(--success);font-weight:600">${sc}</span>
          </div>`).join('')}
      </div>

      <div class="card">
        <h3 class="display" style="font-size:16px;font-weight:500;margin:0 0 12px;letter-spacing:-0.015em">Recent shipped</h3>
        ${STATE.projects.slice(0,3).map(projectCard).join('')}
      </div>
    </div>

    <aside>
      <div class="card" style="margin-bottom:16px;text-align:center">
        <div class="avatar" style="width:88px;height:88px;font-size:28px;margin:8px auto 12px">AO</div>
        <div class="display" style="font-size:20px;font-weight:500;letter-spacing:-0.015em">Amaka Obi</div>
        <div style="font-size:13px;color:var(--ink-500);margin-top:4px">Lagos · Operator</div>
        <div style="display:flex;justify-content:center;gap:6px;margin-top:10px">
          <span class="tag tag-success">✓ Verified</span>
          <span class="tag tag-ink">FCS 742</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px;padding-top:14px;border-top:1px solid var(--ink-100)">
          <div><div class="display" style="font-size:18px;font-weight:500">14</div><div style="font-size:10px;color:var(--ink-400);text-transform:uppercase;letter-spacing:0.08em;font-weight:600">Shipped</div></div>
          <div><div class="display" style="font-size:18px;font-weight:500">9</div><div style="font-size:10px;color:var(--ink-400);text-transform:uppercase;letter-spacing:0.08em;font-weight:600">Stakes</div></div>
          <div><div class="display" style="font-size:18px;font-weight:500">2.1k</div><div style="font-size:10px;color:var(--ink-400);text-transform:uppercase;letter-spacing:0.08em;font-weight:600">Followers</div></div>
        </div>
      </div>

      <div class="card">
        <h3 class="display" style="font-size:14px;font-weight:500;margin:0 0 10px;letter-spacing:-0.015em">AI suggestion</h3>
        <div style="font-size:13px;color:var(--ink-700);line-height:1.5">Add <b>TypeScript</b> to your skills — 64% of CollaBoard projects matching your rate require it. Estimated +₦85k/mo earning potential.</div>
        <button class="btn btn-sm btn-primary" style="margin-top:10px" data-toast="Skill added · pending verification">+ Add skill</button>
      </div>
    </aside>
  </div>
`;

PAGES.settings = PAGES.profile; // alias

// ===================================================================
// MODALS
// ===================================================================
const MODALS = {
  newIdea: () => `
    <div class="modal-head"><h3>+ Submit an idea to ConceptNexus</h3><button class="icon-btn" data-close>✕</button></div>
    <div class="modal-body">
      <div class="field"><label>Title</label><input placeholder="One sentence describing the idea" value="Voice-first bookkeeping in Yorùbá"/></div>
      <div class="field"><label>Problem · 200 words max</label><textarea>Informal traders keep paper books. They lose them, get robbed, can't access credit because there's no transaction history…</textarea></div>
      <div class="field"><label>Sub-app · primary fit</label><select><option>ConceptNexus → vestDen</option><option>ConceptNexus → CollaBoard</option><option>Standalone</option></select></div>
      <div class="field"><label>Stake to attach (optional)</label><input value="₦5,000" class="mono"/></div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" data-close>Cancel</button>
      <button class="btn btn-app-concept" data-submit="Idea submitted to ConceptNexus · validation begins">Submit for validation</button>
    </div>
  `,
  newStake: () => `
    <div class="modal-head"><h3>Stake on SolarShare Lagos</h3><button class="icon-btn" data-close>✕</button></div>
    <div class="modal-body">
      <div style="background:var(--invest-bg);padding:14px;border-radius:10px;margin-bottom:14px">
        <div style="font-size:11px;color:var(--invest);font-weight:600;text-transform:uppercase;letter-spacing:0.1em">Target IRR</div>
        <div class="display mono" style="font-size:28px;font-weight:500;color:var(--invest)">14.2%</div>
        <div style="font-size:12px;color:var(--ink-700);margin-top:2px">Funded ₦8.4M / ₦12M · 42 days left</div>
      </div>
      <div class="field"><label>Stake amount</label><input class="mono" value="₦25,000"/></div>
      <div class="field"><label>From</label><select><option>Wallet · ₦284,500</option><option>GTBank · linked</option></select></div>
      <div style="font-size:12px;color:var(--ink-500);line-height:1.5">Released to you in proportion as milestones complete. First payout estimated in 6 weeks.</div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" data-close>Cancel</button>
      <button class="btn btn-app-invest" data-submit="₦25,000 staked on SolarShare Lagos">Confirm stake</button>
    </div>
  `,
  newBoard: () => `
    <div class="modal-head"><h3>+ Create a CollaBoard</h3><button class="icon-btn" data-close>✕</button></div>
    <div class="modal-body">
      <div class="field"><label>Project name</label><input placeholder="e.g. SolarShare build sprint"/></div>
      <div class="field"><label>Total escrow</label><input class="mono" value="₦1,840,000"/></div>
      <div class="field"><label>Milestones</label><textarea>1. Site survey — ₦120k
2. Inverter install — ₦340k
3. Panels commissioned — ₦600k
4. Grid handoff + docs — ₦780k</textarea></div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" data-close>Cancel</button>
      <button class="btn btn-app-collab" data-submit="Board created · invite team">Create board</button>
    </div>
  `,
  newSkill: () => `
    <div class="modal-head"><h3>+ List a skill</h3><button class="icon-btn" data-close>✕</button></div>
    <div class="modal-body">
      <div class="field"><label>Skill</label><input placeholder="e.g. TypeScript"/></div>
      <div class="field"><label>Self-rated level</label><select><option>Intermediate</option><option>Advanced</option><option>Expert</option></select></div>
      <div class="field"><label>Hourly rate</label><input class="mono" value="₦12,000/hr"/></div>
      <div style="font-size:12px;color:var(--ink-500);line-height:1.5">Verification happens automatically as you complete CollaBoard milestones using this skill.</div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" data-close>Cancel</button>
      <button class="btn btn-app-skills" data-submit="Skill listed · pending verification">List skill</button>
    </div>
  `,
  ideaDetail: () => `
    <div class="modal-head"><h3>Offline micro-credit for informal traders</h3><button class="icon-btn" data-close>✕</button></div>
    <div class="modal-body">
      <div style="text-align:center;padding:8px 0 16px">
        <div style="position:relative;width:120px;height:120px;margin:0 auto">
          <svg viewBox="0 0 36 36" style="width:100%;height:100%;transform:rotate(-90deg)">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--ink-100)" stroke-width="3"/>
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--concept)" stroke-width="3" stroke-dasharray="84 16" stroke-linecap="round"/>
          </svg>
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
            <div class="display" style="font-size:32px;font-weight:500">84</div>
            <div style="font-size:11px;color:var(--ink-400)">/ 100 · Validation</div>
          </div>
        </div>
        <div style="margin-top:8px;font-size:13px;font-weight:600;color:var(--success)">Ready for vestDen</div>
      </div>
      <div style="background:var(--ink-50);padding:14px;border-radius:10px;font-size:13px;line-height:1.55;color:var(--ink-700)">
        <b style="color:var(--navy-900)">AI feedback:</b> Strong market fit (92) and clear business model (88). Consider adding competitor analysis vs Piggyvest's offerings to strengthen differentiation.
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" data-close>Close</button>
      <button class="btn btn-app-invest" data-submit="Graduated to vestDen — campaign drafted">Graduate to vestDen →</button>
    </div>
  `,
  stakeDetail: () => `
    <div class="modal-head"><h3>SolarShare Lagos · phase 2</h3><button class="icon-btn" data-close>✕</button></div>
    <div class="modal-body">
      <div class="kv"><span class="k">Funded</span><span class="v">₦8.4M / ₦12M</span></div>
      <div class="kv"><span class="k">Backers</span><span class="v">428</span></div>
      <div class="kv"><span class="k">Target IRR</span><span class="v" style="color:var(--success)">14.2%</span></div>
      <div class="kv"><span class="k">Days left</span><span class="v">42</span></div>
      <div class="kv"><span class="k">FCS · operator</span><span class="v">742</span></div>
      <div style="margin-top:14px;font-size:11px;color:var(--ink-400);text-transform:uppercase;letter-spacing:0.1em;font-weight:600;margin-bottom:8px">Milestones</div>
      ${[
        ['Site survey','complete','success'],
        ['Panels installed','complete','success'],
        ['Grid connection','in review','warning'],
        ['First revenue','upcoming','ink']
      ].map(([m,s,c]) => `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;font-size:13px"><span style="width:18px;height:18px;border-radius:50%;background:var(--${c==='success'?'success':c==='warning'?'warning-bg':'ink-100'});${c==='warning'?'border:1.5px solid var(--warning);':''}display:flex;align-items:center;justify-content:center">${c==='success'?'<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><path d="M5 12l5 5 9-10"/></svg>':''}</span><span style="flex:1">${m}</span><span style="color:var(--ink-400);font-size:11px">${s}</span></div>`).join('')}
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" data-close>Close</button>
      <button class="btn btn-app-invest" data-submit="₦25,000 staked">Stake ₦25,000</button>
    </div>
  `,
  projectDetail: () => `
    <div class="modal-head"><h3>SolarShare build sprint</h3><button class="icon-btn" data-close>✕</button></div>
    <div class="modal-body">
      <div style="background:var(--collab-bg);padding:14px;border-radius:10px;margin-bottom:14px">
        <div style="font-size:11px;color:var(--collab);font-weight:600;text-transform:uppercase;letter-spacing:0.1em">Escrow held</div>
        <div class="display mono" style="font-size:24px;font-weight:500;color:var(--navy-900)">₦1,840,000</div>
        <div class="progress" style="margin-top:10px"><div style="width:50%;background:var(--collab)"></div></div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--ink-500);margin-top:6px"><span>₦920k released</span><span>2 of 4 milestones</span></div>
      </div>
      <div style="font-size:11px;color:var(--ink-400);text-transform:uppercase;letter-spacing:0.1em;font-weight:600;margin-bottom:8px">Tasks this week</div>
      ${[
        ['Site survey · Adaeze','done','120k'],
        ['Inverter install · Tunde','active','340k'],
        ['Grid handoff docs · Kemi','upcoming','180k']
      ].map(([t,s,a]) => `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;font-size:13px"><span style="width:16px;height:16px;border-radius:5px;background:var(--${s==='done'?'success':s==='active'?'collab':'ink-100'})"></span><span style="flex:1;${s==='done'?'text-decoration:line-through;color:var(--ink-400);':''}">${t}</span><span class="mono" style="color:var(--ink-500);font-size:11px">₦${a}</span></div>`).join('')}
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" data-close>Close</button>
      <button class="btn btn-app-collab" data-submit="Milestone marked · escrow releasing">Mark milestone done</button>
    </div>
  `,
  talentDetail: () => `
    <div class="modal-head"><h3>Tolu Okafor</h3><button class="icon-btn" data-close>✕</button></div>
    <div class="modal-body">
      <div style="display:flex;gap:14px;align-items:center;margin-bottom:14px">
        <div class="avatar" style="width:64px;height:64px;font-size:22px;background:linear-gradient(135deg,var(--skills),var(--blue-500))">TO</div>
        <div>
          <div class="display" style="font-size:18px;font-weight:500">Tolu Okafor</div>
          <div style="font-size:13px;color:var(--ink-500)">Full-stack engineer · Lagos</div>
          <div style="display:flex;gap:6px;margin-top:6px">
            <span class="tag tag-success">✓ Verified</span>
            <span class="tag tag-ink">FCS 742</span>
          </div>
        </div>
      </div>
      <div class="kv"><span class="k">Hourly rate</span><span class="v">₦12,000</span></div>
      <div class="kv"><span class="k">Projects done</span><span class="v">14</span></div>
      <div class="kv"><span class="k">Avg delivery</span><span class="v" style="color:var(--success)">+2 days early</span></div>
      <div class="kv"><span class="k">Response time</span><span class="v">Within 4h</span></div>
      <div style="margin-top:14px;font-size:11px;color:var(--ink-400);text-transform:uppercase;letter-spacing:0.1em;font-weight:600;margin-bottom:8px">Skills</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px"><span class="tag tag-skills">React · 94</span><span class="tag tag-skills">Postgres · 89</span><span class="tag tag-skills">Mobile money · 76</span></div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" data-close>Message</button>
      <button class="btn btn-app-collab" data-submit="Invite sent — pending Tolu's reply">Hire to a board</button>
    </div>
  `
};

// ===== Wire global nav =====
document.querySelectorAll('[data-page]').forEach(el => el.addEventListener('click', e => {
  e.preventDefault();
  navigate(el.dataset.page);
}));
document.querySelectorAll('[data-action]').forEach(el => el.addEventListener('click', () => {
  toast(el.dataset.action === 'search' ? 'Search opens (⌘K)' : el.dataset.action === 'notif' ? '3 unread notifications' : el.dataset.action === 'messages' ? 'Messages: 2 new' : '');
}));

// init
const validPages = ['home','apps','feed','wallet','profile','concept','invest','collab','skills','settings'];
function pageFromHash(){
  const h = (location.hash || '').replace('#','');
  return validPages.includes(h) ? h : 'home';
}
window.addEventListener('hashchange', () => navigate(pageFromHash()));
const _origNavigate = navigate;
navigate = function(page){ _origNavigate(page); try{ history.replaceState(null,'','#'+page); }catch(e){} };
navigate(pageFromHash());
