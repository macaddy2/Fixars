// ====================================================================
// Fixars Prototype v2 — page renderers
// ====================================================================

const PAGES = {};
const ICONS = {
  heart: (fill) => `<svg width="15" height="15" viewBox="0 0 24 24" fill="${fill ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.5-1.5 3-3.3 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3.4 1-4.5 2.5C10.9 4 9.3 3 7.5 3A5.5 5.5 0 0 0 2 8.5c0 2.2 1.5 4 3 5.5l7 7z"/></svg>`,
  comment: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  save: (fill) => `<svg width="15" height="15" viewBox="0 0 24 24" fill="${fill ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
  share: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"/><path d="M9 7h8v8"/></svg>`
};

// ===== Shared card helpers =====
const sparkline = (data, color) => {
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1) * 100).toFixed(1)},${(28 - ((v - min) / (max - min || 1)) * 24).toFixed(1)}`).join(' ');
  return `<svg class="spark" viewBox="0 0 100 30" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;
};

const ideaCard = (i) => `
  <div class="list-card" data-modal="ideaDetail" data-id="${i.id}">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
      <span class="tag tag-${i.status === 'success' ? 'success' : i.status === 'warning' ? 'warning' : 'ink'}"><span class="tag-dot"></span>${i.tag}</span>
      ${i.score ? `<span class="mono" style="font-size:11px;color:var(--ink-400)">Score <b style="color:var(--ink-900)">${i.score}</b>/100</span>` : '<span class="mono" style="font-size:11px;color:var(--ink-400)">Awaiting review</span>'}
    </div>
    <div class="title">${i.title}</div>
    <div class="desc">${i.desc}</div>
    <div class="meta">
      <span>by <b style="color:var(--ink-900)">${i.author}</b></span>
      <span><span class="stat-num">${i.backers.toLocaleString()}</span> reviewers</span>
    </div>
  </div>
`;

const campaignCard = (c) => {
  const pct = Math.min(100, Math.round(c.funded / c.target * 100));
  const closed = pct >= 100;
  return `
  <div class="list-card" data-modal="stakeDetail" data-id="${c.id}">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
      <span class="tag ${closed ? 'tag-success' : 'tag-invest'}"><span class="tag-dot"></span>${closed ? 'Fully funded' : 'Funding now'}</span>
      <span class="mono" style="font-size:11px;color:var(--ink-400)">${closed ? 'Closed' : c.days + ' days left'}</span>
    </div>
    <div class="title">${c.title}</div>
    <div class="desc">${c.desc}</div>
    <div>
      <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--ink-500);margin-bottom:6px">
        <span>Funded</span>
        <span><b class="stat-num">₦${c.funded.toFixed(1)}M</b> / ₦${c.target}M · ${pct}%</span>
      </div>
      <div class="progress"><div style="width:${pct}%;background:var(--invest)"></div></div>
    </div>
    <div class="meta">
      <span><b style="color:var(--invest)">${c.irr}%</b> target IRR</span>
      <span>${c.backers.toLocaleString()} backers</span>
    </div>
  </div>`;
};

const projectCard = (p) => `
  <div class="list-card" data-modal="projectDetail" data-id="${p.id}">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
      <span class="tag ${p.status === 'Done' ? 'tag-success' : p.status === 'In review' ? 'tag-warning' : 'tag-collab'}"><span class="tag-dot"></span>${p.status}</span>
      <span class="mono" style="font-size:11px;color:var(--ink-400)">${p.milestones} milestones</span>
    </div>
    <div class="title">${p.title}</div>
    <div class="desc">${p.desc}</div>
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div style="display:flex">
        ${p.team.map((t, i) => `<div class="av team-av" style="background:${['var(--collab)','var(--navy-900)','var(--skills)','var(--ink-300)'][i % 4]};margin-left:${i ? -8 : 0}px">${t}</div>`).join('')}
      </div>
      <div style="text-align:right">
        <div class="micro-k">In escrow</div>
        <div class="mono" style="font-size:14px;font-weight:600">₦${p.escrow.toFixed(2)}M</div>
      </div>
    </div>
  </div>
`;

const talentCard = (t) => `
  <div class="list-card" data-modal="talentDetail" data-id="${t.id}">
    <div style="display:flex;align-items:flex-start;gap:12px">
      <div class="av" style="width:48px;height:48px;background:linear-gradient(135deg,var(--skills),var(--blue-500));font-size:14px">${t.name.split(' ').map(n => n[0]).join('')}</div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
          <div>
            <div class="title" style="font-size:16px">${t.name}</div>
            <div class="desc" style="margin-top:2px">${t.role} · ${t.loc}</div>
          </div>
          ${t.verified ? '<span class="tag tag-success"><span class="tag-dot"></span>Verified</span>' : '<span class="tag tag-ink">Unverified</span>'}
        </div>
      </div>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:6px">
      ${t.skills.map(s => `<span class="tag tag-skills">${s}</span>`).join('')}
    </div>
    <div class="meta">
      <span class="mono"><b style="color:var(--ink-900)">${t.rate}</b> · FCS ${t.fcs}</span>
      <span>${t.projects} projects done</span>
    </div>
  </div>
`;

const activityRow = (av, bg, body, meta) => `
  <div class="activity-row">
    <div class="av" style="background:${bg}">${av}</div>
    <div class="body"><div class="t">${body}</div><div class="meta">${meta}</div></div>
  </div>
`;

const emptyState = (title, sub) => `
  <div class="empty" style="grid-column:1/-1">
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
    <h4>${title}</h4>
    <p>${sub}</p>
    <button class="btn btn-ghost btn-sm" data-clear-filters>Clear filters</button>
  </div>
`;

// ===== List sources (powers live filtering) =====
const LIST_SOURCES = {
  concept: {
    items: () => STATE.ideas, render: ideaCard,
    filter: (i, f) => f === 'All' || i.tag === f,
    match: (i, q) => (i.title + ' ' + i.desc + ' ' + i.author).toLowerCase().includes(q)
  },
  invest: {
    items: () => STATE.campaigns, render: campaignCard,
    filter: (c, f) => {
      const pct = c.funded / c.target * 100;
      if (f === 'Funding now') return pct < 100;
      if (f === 'Closing soon') return pct < 100 && c.days <= 14;
      if (f === 'Funded') return pct >= 100;
      return true;
    },
    match: (c, q) => (c.title + ' ' + c.desc).toLowerCase().includes(q)
  },
  collab: {
    items: () => STATE.projects, render: projectCard,
    filter: (p, f) => f === 'All' || p.status === f,
    match: (p, q) => (p.title + ' ' + p.desc).toLowerCase().includes(q)
  },
  skills: {
    items: () => STATE.talents, render: talentCard,
    filter: (t, f) => f === 'All' || t.cat === f,
    match: (t, q) => (t.name + ' ' + t.role + ' ' + t.skills.join(' ')).toLowerCase().includes(q)
  }
};

// Generic sub-app page
function subAppPage({ key, glyph, name, tagline, mission, cta, ctaModal, stats, filters }) {
  const src = LIST_SOURCES[key];
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
      ${stats.map(s => `<div class="stat"><div class="k">${s.k}</div><div class="v ${String(s.v).includes('₦') ? 'mono' : ''}">${s.v}</div><div class="t" style="${s.tColor ? `color:${s.tColor}` : 'color:var(--ink-500)'}">${s.t}</div></div>`).join('')}
    </div>

    <div class="toolbar">
      <div class="toolbar-search">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-400)" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
        <input id="list-search" placeholder="Search ${name.toLowerCase()}…"/>
      </div>
      <div class="segment" id="list-filters">${filters.map((f, i) => `<button class="${i === 0 ? 'active' : ''}" data-filter="${f}">${f}</button>`).join('')}</div>
    </div>

    <div class="list-grid" id="list-wrap" data-key="${key}">${src.items().map(src.render).join('')}</div>
  `;
}

// ----- HOME -----
PAGES.home = () => {
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return `
  <div class="page-head">
    <div>
      <div class="page-eyebrow"><span class="page-tag">${greet}, ${STATE.user.name.split(' ')[0]}</span></div>
      <h1 class="page-title">Your operating system<br/>for African innovation.</h1>
      <p class="page-sub">Validate ideas, fund what matters, ship with verified teams. Today across the ecosystem: <b>1,240 ideas</b> in motion, <b>₦142M</b> staked.</p>
    </div>
    <button class="btn btn-primary" data-modal="newIdea">+ Submit idea</button>
  </div>

  <div class="stats">
    <div class="stat"><div class="k">FCS · Fixars credit score</div><div class="v">${STATE.user.fcs}</div><div class="t up">↑ 18 this month</div>${sparkline([690,702,698,711,724,720,742], 'var(--success)')}</div>
    <div class="stat"><div class="k">Wallet</div><div class="v mono">${fmtN(STATE.wallet)}</div><div class="t up">↑ ₦12,400 / wk</div>${sparkline([180,205,196,228,241,272,284], 'var(--blue-500)')}</div>
    <div class="stat"><div class="k">Active stakes</div><div class="v">14</div><div class="t" style="color:var(--ink-500)">across 9 campaigns</div>${sparkline([6,8,8,10,11,13,14], 'var(--invest)')}</div>
    <div class="stat"><div class="k">Verified skills</div><div class="v">3</div><div class="t" style="color:var(--ink-500)">React · Postgres · API</div>${sparkline([1,1,2,2,2,3,3], 'var(--skills)')}</div>
  </div>

  <div class="split">
    <div>
      <h3 class="sec-h">Your apps</h3>
      <div class="subapp-grid">
        ${subAppTile('concept','C','ConceptNexus','Validate. Refine. Get backed.','3 reviews ready','428 ideas')}
        ${subAppTile('invest','V','vestDen','Fund the future of Africa.','14 stakes active','₦68M deployed')}
        ${subAppTile('collab','B','CollaBoard','Ship work in escrowed sprints.','2 projects live','₦1.84M in escrow')}
        ${subAppTile('skills','S','SkillsCanvas','Provable skills, paid receipts.','Profile 78%','3 verified')}
      </div>

      <h3 class="sec-h" style="margin-top:28px">Continue where you left off</h3>
      <div class="list-grid">
        ${ideaCard(STATE.ideas[0])}
        ${campaignCard(STATE.campaigns[0])}
      </div>
    </div>

    <aside>
      <div class="wallet-card" style="margin-bottom:16px">
        <div class="k">Wallet balance</div>
        <div class="v mono" data-wallet-balance>${fmtN(STATE.wallet)}</div>
        <div class="delta">↑ ₦12,400 this week</div>
        <div class="wallet-actions">
          <div class="wallet-action primary" data-modal="newStake" data-id="c1">Stake</div>
          <div class="wallet-action" data-toast="Transfer flow opens — pick a recipient">Send</div>
          <div class="wallet-action" data-toast="Top-up via card, bank or USSD">Add</div>
          <div class="wallet-action" data-page="wallet">More</div>
        </div>
      </div>

      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <h3 class="sec-h" style="margin:0">Activity</h3>
          <span class="page-tag" data-page="feed" style="cursor:pointer">View all →</span>
        </div>
        ${activityRow('TM','var(--invest)','<b>Tunde</b> opened a vestDen campaign','SolarShare Lagos · phase 2 · 2h ago')}
        ${activityRow('AN','var(--concept)','<b>Adaeze</b> submitted a new idea','Solar lockers for market sellers · 4h')}
        ${activityRow('KA','var(--skills)','<b>Kemi</b> verified your Postgres skill','+12 FCS · 1d')}
        ${activityRow('FX','var(--navy-900)','<b>Fixars</b> paid escrow on milestone 2','SolarShare build sprint · 2d')}
      </div>
    </aside>
  </div>
`;};

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

// ----- APPS GRID -----
PAGES.apps = () => `
  <div class="page-head">
    <div>
      <div class="page-eyebrow"><span class="page-tag">Ecosystem</span></div>
      <h1 class="page-title">Four apps, one fabric.</h1>
      <p class="page-sub">Validate on ConceptNexus → fund on vestDen → ship on CollaBoard → staff with SkillsCanvas. Identity, wallet and reputation flow across all four.</p>
    </div>
  </div>

  <div class="subapp-grid">
    ${largeSubappCard('concept','C','ConceptNexus','Validate. Refine. Get backed.','Submit ideas, get peer + AI scoring, graduate to vestDen with proof.','428 ideas · 89 validated')}
    ${largeSubappCard('invest','V','vestDen','Fund the future of Africa.','Back validated ideas with as little as ₦5,000. Track milestones, get paid in proportion.','₦142M deployed · 14% avg IRR')}
    ${largeSubappCard('collab','B','CollaBoard','Ship work in escrowed sprints.','Project boards with milestone-based escrow. Money releases on delivery.','208 projects · ₦68M in escrow')}
    ${largeSubappCard('skills','S','SkillsCanvas','Provable skills, paid receipts.','Build a skill profile verified by completed CollaBoard milestones. Get hired.','4,820 talents · 76% verified')}
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

// ----- SUB-APPS -----
PAGES.concept = () => subAppPage({
  key: 'concept', glyph: 'C', name: 'ConceptNexus',
  tagline: 'Idea validation', mission: 'Where African innovation gets stress-tested before it gets funded.',
  cta: '+ Submit idea', ctaModal: 'newIdea',
  stats: [
    { k: 'Total ideas', v: '428', t: 'in the system' },
    { k: 'Validated', v: '89', t: 'ready for vestDen', tColor: 'var(--success)' },
    { k: 'In validation', v: '214', t: 'reviewing now' },
    { k: 'Avg score', v: '72', t: '/ 100' }
  ],
  filters: ['All','Submitted','In Validation','Validated']
});

PAGES.invest = () => subAppPage({
  key: 'invest', glyph: 'V', name: 'vestDen',
  tagline: 'Capital · Den of investors', mission: 'Fund the validated future. From ₦5,000 to ₦5M, every stake is tracked, escrowed, and milestone-paid.',
  cta: '+ Create stake', ctaModal: 'newStake',
  stats: [
    { k: 'Total deployed', v: '₦142M', t: 'across 89 campaigns' },
    { k: 'Avg IRR', v: '14.2%', t: 'last 12 mo', tColor: 'var(--success)' },
    { k: 'Active backers', v: '4,820', t: 'across the den' },
    { k: 'Active campaigns', v: '27', t: 'open now' }
  ],
  filters: ['All','Funding now','Closing soon','Funded']
});

PAGES.collab = () => subAppPage({
  key: 'collab', glyph: 'B', name: 'CollaBoard',
  tagline: 'Execution · Escrowed sprints', mission: 'Where validated ideas become shipped products. Milestone-based escrow keeps money safe and teams paid.',
  cta: '+ Create board', ctaModal: 'newBoard',
  stats: [
    { k: 'Active projects', v: '208', t: 'across 4 sub-apps' },
    { k: 'In escrow', v: '₦68M', t: 'milestone-locked' },
    { k: 'Released', v: '₦142M', t: 'on delivery', tColor: 'var(--success)' },
    { k: 'Avg delivery', v: '94%', t: 'on-time rate' }
  ],
  filters: ['All','Active','In review','Done']
});

PAGES.skills = () => subAppPage({
  key: 'skills', glyph: 'S', name: 'SkillsCanvas',
  tagline: 'Talent · Verified by work', mission: 'Skills aren\'t self-claimed — they\'re verified by completed CollaBoard milestones with money attached.',
  cta: '+ List your skills', ctaModal: 'newSkill',
  stats: [
    { k: 'Total talents', v: '4,820', t: 'across 18 cities' },
    { k: 'Avg hourly', v: '₦9,400', t: 'last 90 days' },
    { k: 'Verified skills', v: '76%', t: 'of profiles', tColor: 'var(--success)' },
    { k: 'Projects done', v: '2,140', t: 'completed via CollaBoard' }
  ],
  filters: ['All','Engineering','Design','Data','Operations']
});

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
      <div class="avatar">${STATE.user.initials}</div>
      <textarea id="composer-input" placeholder="Share something with the Fixars community…"></textarea>
    </div>
    <div class="composer-actions">
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <span class="chip concept" data-toggle><span class="dot"></span>ConceptNexus</span>
        <span class="chip invest" data-toggle><span class="dot"></span>vestDen</span>
        <span class="chip collab" data-toggle><span class="dot"></span>CollaBoard</span>
        <span class="chip skills" data-toggle><span class="dot"></span>SkillsCanvas</span>
      </div>
      <button class="btn btn-primary btn-sm" id="composer-post">Post</button>
    </div>
  </div>

  <div class="toolbar" style="margin-top:18px;margin-bottom:0">
    <div class="segment" id="feed-filters">
      <button class="active" data-feed-filter="All">All</button>
      <button data-feed-filter="Following">Following</button>
      <button data-feed-filter="Trending">Trending</button>
    </div>
  </div>

  <div id="feed-wrap">${STATE.feed.map(feedCard).join('')}</div>
`;

const feedCard = (p) => `
  <div class="feed-card" data-feed-id="${p.id}">
    <div class="feed-head">
      <div class="av" style="width:36px;height:36px;font-size:12px;background:${p.avBg}">${p.av}</div>
      <div>
        <div class="feed-name">${p.name} <span class="tag tag-${p.tag === 'fixars' ? 'ink' : p.tag}" style="margin-left:6px;font-size:9px">${p.tag === 'fixars' ? 'TEAM' : p.tag.toUpperCase()}</span></div>
        <div class="feed-meta">${p.meta}</div>
      </div>
    </div>
    <div class="feed-body">${p.body}</div>
    <div class="feed-actions">
      <span class="feed-action ${p.liked ? 'on-like' : ''}" data-like="${p.id}">${ICONS.heart(p.liked)} ${p.likes}</span>
      <span class="feed-action" data-toast="Comment thread opens">${ICONS.comment} ${p.comments}</span>
      <span class="feed-action ${p.saved ? 'on-save' : ''}" data-save="${p.id}">${ICONS.save(p.saved)} ${p.saved ? 'Saved' : 'Save'}</span>
      <span class="feed-action" data-toast="Link copied to clipboard" style="margin-left:auto">${ICONS.share} Share</span>
    </div>
  </div>
`;

// ----- ANALYTICS -----
PAGES.analytics = () => {
  const a = STATE.analytics;
  const maxG = Math.max(...a.gmv);
  // donut
  let acc = 0;
  const segs = a.split.map(s => {
    const off = -acc; acc += s.v;
    return `<circle cx="18" cy="18" r="15.9" fill="none" stroke="${s.color}" stroke-width="3.4" stroke-dasharray="${s.v - 1} ${100 - s.v + 1}" stroke-dashoffset="${off}"></circle>`;
  }).join('');
  return `
  <div class="page-head">
    <div>
      <div class="page-eyebrow"><span class="page-tag">Analytics · Last 12 months</span></div>
      <h1 class="page-title">The ecosystem, measured.</h1>
      <p class="page-sub">Volume, conversion and cross-app flow across ConceptNexus, vestDen, CollaBoard and SkillsCanvas.</p>
    </div>
    <button class="btn btn-ghost" data-toast="Report exported as CSV">↓ Export</button>
  </div>

  <div class="stats">
    <div class="stat"><div class="k">GMV this month</div><div class="v mono">₦16.3M</div><div class="t up">↑ 15.6% vs May</div></div>
    <div class="stat"><div class="k">Monthly active users</div><div class="v">38,420</div><div class="t up">↑ 2,114 this month</div></div>
    <div class="stat"><div class="k">Cross-app users</div><div class="v">41%</div><div class="t up">target: 40% · met</div></div>
    <div class="stat"><div class="k">Avg FCS issued</div><div class="v">612</div><div class="t" style="color:var(--ink-500)">50,180 scores live</div></div>
  </div>

  <div class="split" style="margin-bottom:20px">
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <h3 class="sec-h" style="margin:0">Monthly volume</h3>
        <span class="mono" style="font-size:11px;color:var(--ink-400)">₦M, all apps</span>
      </div>
      <div class="chart-bars">
        ${a.gmv.map((v, i) => `<div class="bar" style="height:${(v / maxG * 100).toFixed(0)}%" title="₦${v}M"><span class="lbl">${a.months[i]}</span></div>`).join('')}
      </div>
    </div>
    <div class="card">
      <h3 class="sec-h">Volume by sub-app</h3>
      <div class="donut-row">
        <svg viewBox="0 0 36 36" style="width:120px;height:120px;transform:rotate(-90deg)">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--ink-100)" stroke-width="3.4"></circle>
          ${segs}
        </svg>
        <div>
          ${a.split.map(s => `
            <div class="legend-row">
              <span class="legend-dot" style="background:${s.color}"></span>
              <span style="flex:1">${s.k}</span>
              <b class="mono" style="font-size:12px">${s.v}%</b>
            </div>`).join('')}
        </div>
      </div>
    </div>
  </div>

  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:14px">
      <h3 class="sec-h" style="margin:0">Idea → impact funnel</h3>
      <span class="mono" style="font-size:11px;color:var(--ink-400)">last 12 months</span>
    </div>
    ${a.funnel.map(f => `
      <div class="funnel-row">
        <span class="funnel-k">${f.k}</span>
        <div class="funnel-track"><div class="funnel-bar" style="width:${f.pct}%;background:${f.color}"></div></div>
        <b class="mono funnel-v">${f.v}</b>
      </div>`).join('')}
    <p style="font-size:12px;color:var(--ink-500);margin:14px 0 0;line-height:1.5">27 of 41 funded ideas shipped — a <b style="color:var(--ink-900)">66% execution rate</b>. The handoff from vestDen to CollaBoard is the strongest link in the chain.</p>
  </div>
`;};

// ----- WALLET -----
PAGES.wallet = () => `
  <div class="page-head">
    <div>
      <div class="page-eyebrow"><span class="page-tag">Wallet · Identity-linked</span></div>
      <h1 class="page-title">${fmtN(STATE.wallet)} ready to move.</h1>
      <p class="page-sub">Stake on vestDen, escrow on CollaBoard, withdraw to bank or mobile money — your wallet is one credential across the ecosystem.</p>
    </div>
    <button class="btn btn-primary" data-toast="Top-up via card, bank transfer or USSD">+ Add money</button>
  </div>

  <div class="split">
    <div>
      <div class="wallet-card" style="margin-bottom:16px">
        <div class="k">Wallet balance</div>
        <div class="v mono" data-wallet-balance>${fmtN(STATE.wallet)}</div>
        <div class="delta">↑ ₦12,400 this week</div>
        <div class="wallet-actions">
          <div class="wallet-action primary" data-modal="newStake" data-id="c1">Stake</div>
          <div class="wallet-action" data-toast="Transfer flow opens — pick a recipient">Send</div>
          <div class="wallet-action" data-toast="Top-up via card, bank or USSD">Add</div>
          <div class="wallet-action" data-toast="Withdrawal to GTBank ····2048 in ~30s">Withdraw</div>
        </div>
      </div>

      <div class="card">
        <h3 class="sec-h">Recent transactions</h3>
        ${STATE.transactions.map(tx => `
          <div class="activity-row">
            <div class="av" style="background:${tx.amt > 0 ? 'var(--success)' : 'var(--navy-600)'}">${tx.amt > 0 ? '+' : '−'}</div>
            <div class="body">
              <div class="t" style="display:flex;justify-content:space-between;gap:8px"><span><b>${tx.t}</b></span><span class="mono" style="color:${tx.amt > 0 ? 'var(--success)' : 'var(--ink-700)'}">${tx.amt > 0 ? '+' : '−'}${fmtN(Math.abs(tx.amt))}</span></div>
              <div class="meta">${tx.app} · ${tx.meta}</div>
            </div>
          </div>`).join('')}
      </div>
    </div>

    <aside>
      <div class="card" style="margin-bottom:16px">
        <h3 class="sec-h">FCS · Fixars credit score</h3>
        <div style="text-align:center;padding:8px 0">
          <div class="score-circle">
            <svg viewBox="0 0 36 36" style="width:100%;height:100%;transform:rotate(-90deg)">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--ink-100)" stroke-width="3"></circle>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--success)" stroke-width="3" stroke-dasharray="74 26" stroke-linecap="round"></circle>
            </svg>
            <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
              <div class="display" style="font-size:32px;font-weight:500">742</div>
              <div style="font-size:11px;color:var(--ink-400)">Excellent · 300–850</div>
            </div>
          </div>
        </div>
        <div class="kv"><span class="k">Payment history <span class="kv-w">30%</span></span><span class="v" style="color:var(--success)">A+</span></div>
        <div class="kv"><span class="k">Project performance <span class="kv-w">25%</span></span><span class="v">A</span></div>
        <div class="kv"><span class="k">Activity depth <span class="kv-w">20%</span></span><span class="v">B+</span></div>
        <div class="kv"><span class="k">Tenure &amp; stability <span class="kv-w">15%</span></span><span class="v">A</span></div>
        <div class="kv"><span class="k">Network quality <span class="kv-w">10%</span></span><span class="v">A−</span></div>
        <div class="kv"><span class="k">Trust radius</span><span class="v">₦1.2M</span></div>
      </div>

      <div class="card-dark card">
        <div class="micro-k" style="color:rgba(255,255,255,.5)">Fixars Pro</div>
        <div class="display" style="font-size:18px;font-weight:500;margin:6px 0 8px;letter-spacing:-0.015em">Unlock instant withdrawals</div>
        <div style="font-size:13px;color:rgba(255,255,255,.7);line-height:1.5">Get instant settlement, priority support, and 0% fees on the first ₦500k each month.</div>
        <button class="btn btn-sm" style="background:white;color:var(--navy-900);margin-top:12px" data-toast="Upgrade flow opens — ₦2,500/mo">Upgrade · ₦2,500/mo</button>
      </div>
    </aside>
  </div>
`;

// ----- PROFILE -----
PAGES.profile = () => `
  <div class="page-head">
    <div>
      <div class="page-eyebrow"><span class="page-tag">Profile</span></div>
      <h1 class="page-title">${STATE.user.name}.</h1>
      <p class="page-sub">Operator · ${STATE.user.loc}. FCS ${STATE.user.fcs}. 14 projects shipped, 9 active stakes, 3 verified skills.</p>
    </div>
    <button class="btn btn-ghost" data-toast="Profile editor opens">Edit profile</button>
  </div>

  <div class="split">
    <div>
      <div class="card" style="margin-bottom:16px">
        <h3 class="sec-h">Skills · verified</h3>
        ${[
          ['React','Advanced','94','Verified by 12 projects'],
          ['Postgres','Expert','89','Verified by 8 projects'],
          ['Mobile money APIs','Intermediate','76','Flutterwave · Paystack']
        ].map(([s, l, sc, m]) => `
          <div class="kv">
            <div>
              <div style="font-weight:600;font-size:14px">${s} · <span style="color:var(--ink-500);font-weight:500">${l}</span></div>
              <div style="font-size:11px;color:var(--ink-400);margin-top:2px">${m}</div>
            </div>
            <span class="mono" style="color:var(--success);font-weight:600">${sc}</span>
          </div>`).join('')}
      </div>

      <div class="card">
        <h3 class="sec-h">Recent shipped</h3>
        <div class="list-grid" style="grid-template-columns:1fr">
          ${STATE.projects.slice(0, 3).map(projectCard).join('')}
        </div>
      </div>
    </div>

    <aside>
      <div class="card" style="margin-bottom:16px;text-align:center">
        <div class="avatar" style="width:88px;height:88px;font-size:28px;margin:8px auto 12px">${STATE.user.initials}</div>
        <div class="display" style="font-size:20px;font-weight:500;letter-spacing:-0.015em">${STATE.user.name}</div>
        <div style="font-size:13px;color:var(--ink-500);margin-top:4px">${STATE.user.loc} · Operator</div>
        <div style="display:flex;justify-content:center;gap:6px;margin-top:10px">
          <span class="tag tag-success">✓ Verified</span>
          <span class="tag tag-ink">FCS ${STATE.user.fcs}</span>
        </div>
        <div class="profile-counts">
          <div><div class="display pc-v">14</div><div class="micro-k">Shipped</div></div>
          <div><div class="display pc-v">9</div><div class="micro-k">Stakes</div></div>
          <div><div class="display pc-v">2.1k</div><div class="micro-k">Followers</div></div>
        </div>
      </div>

      <div class="card">
        <h3 class="sec-h" style="font-size:14px">AI suggestion</h3>
        <div style="font-size:13px;color:var(--ink-700);line-height:1.5">Add <b>TypeScript</b> to your skills — 64% of CollaBoard projects matching your rate require it. Estimated +₦85k/mo earning potential.</div>
        <button class="btn btn-sm btn-primary" style="margin-top:10px" data-modal="newSkill">+ Add skill</button>
      </div>
    </aside>
  </div>
`;

// ----- SETTINGS -----
PAGES.settings = () => `
  <div class="page-head">
    <div>
      <div class="page-eyebrow"><span class="page-tag">Settings</span></div>
      <h1 class="page-title">Account &amp; preferences.</h1>
      <p class="page-sub">One identity across ConceptNexus, vestDen, CollaBoard and SkillsCanvas.</p>
    </div>
  </div>

  <div class="split">
    <div>
      <div class="card" style="margin-bottom:16px">
        <h3 class="sec-h">Account</h3>
        <div class="kv"><span class="k">Name</span><span class="v" style="font-family:'Inter',sans-serif">${STATE.user.name}</span></div>
        <div class="kv"><span class="k">Phone</span><span class="v">+234 803 ··· 4821</span></div>
        <div class="kv"><span class="k">Email</span><span class="v" style="font-family:'Inter',sans-serif">amaka@obi.ng</span></div>
        <div class="kv"><span class="k">KYC level</span><span class="v" style="color:var(--success)">Tier 3 · Full</span></div>
        <div class="kv"><span class="k">Payout account</span><span class="v">GTBank ····2048</span></div>
      </div>

      <div class="card">
        <h3 class="sec-h">Security</h3>
        <div class="setting-row"><div><b>Two-factor authentication</b><span>SMS + authenticator app</span></div><button class="switch on" data-switch></button></div>
        <div class="setting-row"><div><b>Biometric sign-in</b><span>Face / fingerprint on mobile</span></div><button class="switch on" data-switch></button></div>
        <div class="setting-row"><div><b>Transaction PIN for stakes &gt; ₦50k</b><span>Extra confirmation on large moves</span></div><button class="switch on" data-switch></button></div>
        <div class="setting-row"><div><b>New-device alerts</b><span>Email + push when a new device signs in</span></div><button class="switch" data-switch></button></div>
      </div>
    </div>

    <aside>
      <div class="card" style="margin-bottom:16px">
        <h3 class="sec-h">Notifications</h3>
        <div class="setting-row"><div><b>Stake &amp; payout events</b><span>Milestones, releases, returns</span></div><button class="switch on" data-switch></button></div>
        <div class="setting-row"><div><b>Idea review requests</b><span>When someone asks you to validate</span></div><button class="switch on" data-switch></button></div>
        <div class="setting-row"><div><b>Project mentions</b><span>CollaBoard comments &amp; assignments</span></div><button class="switch on" data-switch></button></div>
        <div class="setting-row"><div><b>Community digest</b><span>Weekly summary email</span></div><button class="switch" data-switch></button></div>
      </div>

      <div class="card">
        <h3 class="sec-h">Preferences</h3>
        <div class="kv"><span class="k">Language</span><span class="v" style="font-family:'Inter',sans-serif">English · Yorùbá soon</span></div>
        <div class="kv"><span class="k">Currency</span><span class="v">NGN ₦</span></div>
        <p style="font-size:12px;color:var(--ink-500);margin:12px 0 0;line-height:1.5">Theme, density and vibe live in the <b>Tweaks</b> panel — toggle it from the toolbar.</p>
      </div>
    </aside>
  </div>
`;

Object.assign(window, { PAGES, LIST_SOURCES, ideaCard, campaignCard, projectCard, talentCard, feedCard, emptyState });
