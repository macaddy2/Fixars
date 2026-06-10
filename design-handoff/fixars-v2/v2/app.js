// ====================================================================
// Fixars Prototype v2 — app logic
// routing · live filters · command palette · notifications · modals
// ====================================================================

// ===== Routing =====
const validPages = ['home','apps','feed','wallet','analytics','profile','concept','invest','collab','skills','settings'];

function navigate(page) {
  if (!PAGES[page]) page = 'home';
  STATE.page = page;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));
  document.querySelectorAll('.tab-btn').forEach(n => n.classList.toggle('active', n.dataset.page === page));
  const root = document.getElementById('page-root');
  root.setAttribute('data-screen-label', page);
  root.innerHTML = PAGES[page]();
  root.classList.remove('page-anim');
  void root.offsetWidth;
  root.classList.add('page-anim');
  document.querySelector('.main').scrollTo?.({ top: 0 });
  window.scrollTo(0, 0);
  bindPage(root);
  try { history.replaceState(null, '', '#' + page); } catch (e) {}
}

// ===== Page wiring =====
function bindPage(root) {
  root.querySelectorAll('[data-page]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); navigate(el.dataset.page); }));
  root.querySelectorAll('[data-modal]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); openModal(el.dataset.modal, el.dataset.id); }));
  root.querySelectorAll('[data-toast]').forEach(el => el.addEventListener('click', () => toast(el.dataset.toast)));
  root.querySelectorAll('.chip[data-toggle]').forEach(c => c.addEventListener('click', () => c.classList.toggle('active')));
  root.querySelectorAll('[data-switch]').forEach(s => s.addEventListener('click', () => {
    s.classList.toggle('on');
    toast(s.classList.contains('on') ? 'Enabled' : 'Disabled');
  }));

  wireListFiltering(root);
  wireFeed(root);
}

// --- Live list filtering (sub-app pages) ---
function wireListFiltering(root) {
  const wrap = root.querySelector('#list-wrap');
  if (!wrap) return;
  const key = wrap.dataset.key;
  const src = LIST_SOURCES[key];
  const seg = root.querySelector('#list-filters');
  const search = root.querySelector('#list-search');
  let activeFilter = 'All';

  function renderList() {
    const q = (search?.value || '').trim().toLowerCase();
    let items = src.items().filter(i => src.filter(i, activeFilter));
    if (q) items = items.filter(i => src.match(i, q));
    wrap.innerHTML = items.length
      ? items.map(src.render).join('')
      : emptyState('Nothing matches', q ? `No results for “${q}” under “${activeFilter}”.` : `Nothing under “${activeFilter}” yet.`);
    wrap.querySelectorAll('[data-modal]').forEach(el => el.addEventListener('click', () => openModal(el.dataset.modal, el.dataset.id)));
    wrap.querySelector('[data-clear-filters]')?.addEventListener('click', () => {
      if (search) search.value = '';
      activeFilter = 'All';
      seg?.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.filter === 'All'));
      renderList();
    });
  }

  seg?.addEventListener('click', e => {
    const btn = e.target.closest('button[data-filter]');
    if (!btn) return;
    activeFilter = btn.dataset.filter;
    seg.querySelectorAll('button').forEach(b => b.classList.toggle('active', b === btn));
    renderList();
  });
  search?.addEventListener('input', renderList);
  wrap._render = renderList;
}

// --- Feed interactions ---
function wireFeed(root) {
  const wrap = root.querySelector('#feed-wrap');
  if (!wrap) return;

  function rebindFeed() {
    wrap.querySelectorAll('[data-like]').forEach(el => el.addEventListener('click', () => {
      const p = STATE.feed.find(f => f.id === el.dataset.like);
      p.liked = !p.liked;
      p.likes += p.liked ? 1 : -1;
      renderFeed();
    }));
    wrap.querySelectorAll('[data-save]').forEach(el => el.addEventListener('click', () => {
      const p = STATE.feed.find(f => f.id === el.dataset.save);
      p.saved = !p.saved;
      renderFeed();
      toast(p.saved ? 'Saved to your library' : 'Removed from library');
    }));
    wrap.querySelectorAll('[data-toast]').forEach(el => el.addEventListener('click', () => toast(el.dataset.toast)));
  }
  function renderFeed(filter) {
    let items = STATE.feed;
    if (filter === 'Following') items = items.filter(p => ['p1','p3'].includes(p.id));
    if (filter === 'Trending') items = [...items].sort((a, b) => b.likes - a.likes);
    wrap.innerHTML = items.map(feedCard).join('');
    rebindFeed();
  }
  let feedFilter = 'All';
  root.querySelector('#feed-filters')?.addEventListener('click', e => {
    const btn = e.target.closest('button[data-feed-filter]');
    if (!btn) return;
    feedFilter = btn.dataset.feedFilter;
    btn.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('active', b === btn));
    renderFeed(feedFilter);
  });
  root.querySelector('#composer-post')?.addEventListener('click', () => {
    const ta = root.querySelector('#composer-input');
    const txt = ta.value.trim();
    if (!txt) { toast('Write something first'); ta.focus(); return; }
    const activeChip = root.querySelector('.chip.active');
    const tag = activeChip ? ['concept','invest','collab','skills'].find(k => activeChip.classList.contains(k)) : 'fixars';
    STATE.feed.unshift({ id: 'p' + Date.now(), name: STATE.user.name, av: STATE.user.initials, avBg: 'linear-gradient(135deg,var(--blue-600),var(--concept))', tag, meta: 'just now', body: txt.replace(/</g, '&lt;'), likes: 0, comments: 0, liked: false, saved: false });
    ta.value = '';
    renderFeed(feedFilter);
    toast('Posted to the feed');
  });
  renderFeed('All');
}

// ===== Toast =====
let toastTimer;
function toast(msg) {
  const t = document.getElementById('toast');
  t.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6EE7B7" stroke-width="2.5" stroke-linecap="round"><path d="M5 12l5 5 9-10"/></svg> ${msg}`;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

// ===== Wallet sync =====
function syncWallet() {
  document.querySelectorAll('[data-wallet-balance]').forEach(el => { el.textContent = fmtN(STATE.wallet); });
  if (STATE.page === 'wallet') navigate('wallet');
}

// ===== Modals =====
const MODALS = {};

MODALS.newIdea = () => `
  <div class="modal-accent concept"></div>
  <div class="modal-head"><h3>Submit an idea to ConceptNexus</h3>
    <div class="modal-lede">Peer + AI validation begins immediately. Score ≥ 70 graduates to vestDen.</div>
    <button class="x" data-close>✕</button></div>
  <div class="modal-body">
    <div class="field"><label>Title <span class="req">*</span></label><input id="idea-title" placeholder="One sentence describing the idea"/></div>
    <div class="field"><label>Problem · 200 words max</label><textarea id="idea-desc" placeholder="Who has this problem? How painful is it? What exists today?"></textarea></div>
    <div class="field-row" style="margin-bottom:14px">
      <div class="field"><label>Primary pathway</label><select><option>ConceptNexus → vestDen</option><option>ConceptNexus → CollaBoard</option><option>Standalone</option></select></div>
      <div class="field"><label>Stake to attach</label><input value="₦5,000" class="mono"/></div>
    </div>
    <div class="help-banner">Attaching a stake signals conviction and boosts review priority by ~3×.</div>
  </div>
  <div class="modal-foot">
    <button class="btn btn-ghost" data-close>Cancel</button>
    <button class="btn btn-app-concept" id="idea-submit">Submit for validation</button>
  </div>
`;

MODALS.newStake = (id) => {
  const c = STATE.campaigns.find(x => x.id === id && x.funded < x.target) || STATE.campaigns[0];
  return `
  <div class="modal-accent invest"></div>
  <div class="modal-head"><h3>Stake on ${c.title}</h3>
    <div class="modal-lede">Funds are escrowed and released to the operator per milestone. Returns paid in proportion.</div>
    <button class="x" data-close>✕</button></div>
  <div class="modal-body">
    <div class="rate-banner">
      <div>
        <div class="micro-k" style="color:var(--invest)">Target IRR</div>
        <div class="display mono" style="font-size:28px;font-weight:500;color:var(--invest)">${c.irr}%</div>
      </div>
      <div style="text-align:right;font-size:12px;color:var(--ink-700)">
        Funded ₦${c.funded.toFixed(1)}M / ₦${c.target}M<br/>${c.days} days left · ${c.backers} backers
      </div>
    </div>
    <div class="field"><label>Stake amount</label><input class="mono" id="stake-amt" value="25,000" inputmode="numeric"/></div>
    <div class="quick-amts" id="quick-amts">
      ${[10000, 25000, 50000, 100000].map(a => `<button class="chip ${a === 25000 ? 'active invest' : ''}" data-amt="${a}">₦${(a / 1000)}k</button>`).join('')}
    </div>
    <div class="field" style="margin-top:14px"><label>From</label><select><option>Wallet · ${fmtN(STATE.wallet)}</option><option>GTBank · linked</option></select></div>
    <div class="proj-return" id="proj-return"></div>
  </div>
  <div class="modal-foot">
    <button class="btn btn-ghost" data-close>Cancel</button>
    <button class="btn btn-app-invest" id="stake-confirm" data-cid="${c.id}">Confirm stake</button>
  </div>
`;};

MODALS.newBoard = () => `
  <div class="modal-accent collab"></div>
  <div class="modal-head"><h3>Create a CollaBoard</h3>
    <div class="modal-lede">Escrow locks on creation. Each milestone releases its share on approval.</div>
    <button class="x" data-close>✕</button></div>
  <div class="modal-body">
    <div class="field"><label>Project name <span class="req">*</span></label><input placeholder="e.g. SolarShare build sprint"/></div>
    <div class="field"><label>Total escrow</label><input class="mono" value="₦1,840,000"/></div>
    <div class="field"><label>Milestones · one per line</label><textarea>1. Site survey — ₦120k
2. Inverter install — ₦340k
3. Panels commissioned — ₦600k
4. Grid handoff + docs — ₦780k</textarea></div>
  </div>
  <div class="modal-foot">
    <button class="btn btn-ghost" data-close>Cancel</button>
    <button class="btn btn-app-collab" data-submit="Board created — invite your team">Create board</button>
  </div>
`;

MODALS.newSkill = () => `
  <div class="modal-accent skills"></div>
  <div class="modal-head"><h3>List a skill</h3>
    <div class="modal-lede">Verification happens automatically as you complete CollaBoard milestones using it.</div>
    <button class="x" data-close>✕</button></div>
  <div class="modal-body">
    <div class="field"><label>Skill <span class="req">*</span></label><input placeholder="e.g. TypeScript"/></div>
    <div class="field-row" style="margin-bottom:14px">
      <div class="field"><label>Self-rated level</label><select><option>Intermediate</option><option>Advanced</option><option>Expert</option></select></div>
      <div class="field"><label>Hourly rate</label><input class="mono" value="₦12,000/hr"/></div>
    </div>
  </div>
  <div class="modal-foot">
    <button class="btn btn-ghost" data-close>Cancel</button>
    <button class="btn btn-app-skills" data-submit="Skill listed — pending verification">List skill</button>
  </div>
`;

MODALS.ideaDetail = (id) => {
  const i = STATE.ideas.find(x => x.id === id) || STATE.ideas[0];
  const ready = i.score >= 85;
  return `
  <div class="modal-accent concept"></div>
  <div class="modal-head"><h3>${i.title}</h3>
    <div class="modal-lede">by ${i.author} · ${i.backers.toLocaleString()} reviewers · ${i.tag}</div>
    <button class="x" data-close>✕</button></div>
  <div class="modal-body">
    ${i.score ? `
    <div style="text-align:center;padding:8px 0 16px">
      <div class="score-circle">
        <svg viewBox="0 0 36 36" style="width:100%;height:100%;transform:rotate(-90deg)">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--ink-100)" stroke-width="3"></circle>
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--concept)" stroke-width="3" stroke-dasharray="${i.score} ${100 - i.score}" stroke-linecap="round"></circle>
        </svg>
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
          <div class="display" style="font-size:32px;font-weight:500">${i.score}</div>
          <div style="font-size:11px;color:var(--ink-400)">/ 100 · Validation</div>
        </div>
      </div>
      <div style="margin-top:8px;font-size:13px;font-weight:600;color:${ready ? 'var(--success)' : 'var(--warning)'}">${ready ? 'Ready for vestDen' : 'Needs ' + (85 - i.score) + ' more points to graduate'}</div>
    </div>
    <div class="ai-banner"><b style="color:var(--ink-900)">AI feedback:</b> Strong market fit and a clear business model. Consider adding competitor analysis to strengthen differentiation before graduating.</div>
    ` : `
    <div class="ai-banner">This idea was submitted and is awaiting its first peer reviews. AI scoring kicks in after 5 reviews.</div>
    `}
  </div>
  <div class="modal-foot">
    <button class="btn btn-ghost" data-close>Close</button>
    ${ready
      ? '<button class="btn btn-app-invest" data-submit="Graduated to vestDen — campaign drafted">Graduate to vestDen →</button>'
      : '<button class="btn btn-app-concept" data-submit="Review submitted · +5 pts">Review this idea</button>'}
  </div>
`;};

MODALS.stakeDetail = (id) => {
  const c = STATE.campaigns.find(x => x.id === id) || STATE.campaigns[0];
  const pct = Math.min(100, Math.round(c.funded / c.target * 100));
  return `
  <div class="modal-accent invest"></div>
  <div class="modal-head"><h3>${c.title}</h3>
    <div class="modal-lede">${c.desc}</div>
    <button class="x" data-close>✕</button></div>
  <div class="modal-body">
    <div class="progress" style="margin-bottom:8px"><div style="width:${pct}%;background:var(--invest)"></div></div>
    <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--ink-500);margin-bottom:12px"><span>₦${c.funded.toFixed(1)}M of ₦${c.target}M</span><span>${pct}% funded</span></div>
    <div class="kv"><span class="k">Backers</span><span class="v">${c.backers.toLocaleString()}</span></div>
    <div class="kv"><span class="k">Target IRR</span><span class="v" style="color:var(--success)">${c.irr}%</span></div>
    <div class="kv"><span class="k">Days left</span><span class="v">${c.days}</span></div>
    <div class="kv"><span class="k">FCS · operator</span><span class="v">742</span></div>
    <div class="micro-k" style="margin:14px 0 8px">Milestones</div>
    ${[['Site survey','complete','success'],['Panels installed','complete','success'],['Grid connection','in review','warning'],['First revenue','upcoming','ink']].map(([m, s, cl]) => `
      <div class="ms-row">
        <span class="ms-dot ms-${cl}">${cl === 'success' ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><path d="M5 12l5 5 9-10"/></svg>' : ''}</span>
        <span style="flex:1">${m}</span><span style="color:var(--ink-400);font-size:11px">${s}</span>
      </div>`).join('')}
  </div>
  <div class="modal-foot">
    <button class="btn btn-ghost" data-close>Close</button>
    ${pct >= 100 ? '<button class="btn btn-ghost" data-submit="You\'ll be notified when phase 2 opens">Watch for phase 2</button>' : `<button class="btn btn-app-invest" data-chain-modal="newStake" data-id="${c.id}">Stake now</button>`}
  </div>
`;};

MODALS.projectDetail = (id) => {
  const p = STATE.projects.find(x => x.id === id) || STATE.projects[0];
  const [done, total] = p.milestones.split('/').map(Number);
  const pct = Math.round(done / total * 100);
  return `
  <div class="modal-accent collab"></div>
  <div class="modal-head"><h3>${p.title}</h3>
    <div class="modal-lede">${p.desc}</div>
    <button class="x" data-close>✕</button></div>
  <div class="modal-body">
    <div class="rate-banner" style="background:var(--collab-bg)">
      <div>
        <div class="micro-k" style="color:var(--collab)">Escrow held</div>
        <div class="display mono" style="font-size:24px;font-weight:500">₦${(p.escrow * 1000).toLocaleString()}k</div>
      </div>
      <div style="text-align:right;font-size:12px;color:var(--ink-700)">${done} of ${total} milestones<br/>${pct}% released</div>
    </div>
    <div class="progress" style="margin:4px 0 16px"><div style="width:${pct}%;background:var(--collab)"></div></div>
    <div class="micro-k" style="margin-bottom:8px">Tasks this week</div>
    ${[['Site survey · Adaeze','done','120k'],['Inverter install · Tunde','active','340k'],['Grid handoff docs · Kemi','upcoming','180k']].map(([t, s, a]) => `
      <div class="ms-row">
        <span class="task-dot task-${s}"></span>
        <span style="flex:1;${s === 'done' ? 'text-decoration:line-through;color:var(--ink-400);' : ''}">${t}</span>
        <span class="mono" style="color:var(--ink-500);font-size:11px">₦${a}</span>
      </div>`).join('')}
  </div>
  <div class="modal-foot">
    <button class="btn btn-ghost" data-close>Close</button>
    <button class="btn btn-app-collab" data-submit="Milestone marked — escrow releasing to team">Mark milestone done</button>
  </div>
`;};

MODALS.talentDetail = (id) => {
  const t = STATE.talents.find(x => x.id === id) || STATE.talents[0];
  return `
  <div class="modal-accent skills"></div>
  <div class="modal-head"><h3>${t.name}</h3>
    <div class="modal-lede">${t.role} · ${t.loc}</div>
    <button class="x" data-close>✕</button></div>
  <div class="modal-body">
    <div style="display:flex;gap:14px;align-items:center;margin-bottom:14px">
      <div class="avatar" style="width:64px;height:64px;font-size:22px;background:linear-gradient(135deg,var(--skills),var(--blue-500))">${t.name.split(' ').map(n => n[0]).join('')}</div>
      <div style="display:flex;gap:6px">
        ${t.verified ? '<span class="tag tag-success">✓ Verified</span>' : '<span class="tag tag-ink">Unverified</span>'}
        <span class="tag tag-ink">FCS ${t.fcs}</span>
      </div>
    </div>
    <div class="kv"><span class="k">Hourly rate</span><span class="v">${t.rate}</span></div>
    <div class="kv"><span class="k">Projects done</span><span class="v">${t.projects}</span></div>
    <div class="kv"><span class="k">Avg delivery</span><span class="v" style="color:var(--success)">+2 days early</span></div>
    <div class="kv"><span class="k">Response time</span><span class="v">Within 4h</span></div>
    <div class="micro-k" style="margin:14px 0 8px">Skills</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px">${t.skills.map(s => `<span class="tag tag-skills">${s}</span>`).join('')}</div>
  </div>
  <div class="modal-foot">
    <button class="btn btn-ghost" data-submit="Message thread opened">Message</button>
    <button class="btn btn-app-collab" data-submit="Invite sent — pending reply">Hire to a board</button>
  </div>
`;};

function openModal(kind, id) {
  const mask = document.getElementById('modal-mask');
  const modal = document.getElementById('modal');
  if (!MODALS[kind]) return;
  modal.innerHTML = MODALS[kind](id);
  mask.classList.add('open');
  modal.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeModal));
  modal.querySelectorAll('[data-submit]').forEach(b => b.addEventListener('click', () => { closeModal(); toast(b.dataset.submit); }));
  modal.querySelectorAll('[data-chain-modal]').forEach(b => b.addEventListener('click', () => openModal(b.dataset.chainModal, b.dataset.id)));

  // Idea submission → adds to list
  modal.querySelector('#idea-submit')?.addEventListener('click', () => {
    const title = modal.querySelector('#idea-title').value.trim();
    if (!title) { modal.querySelector('#idea-title').focus(); toast('Give your idea a title'); return; }
    const desc = modal.querySelector('#idea-desc').value.trim() || 'Awaiting full problem statement.';
    STATE.ideas.unshift({ id: 'i' + Date.now(), title, desc, tag: 'Submitted', status: 'ink', score: 0, backers: 0, author: STATE.user.name });
    closeModal();
    toast('Idea submitted — validation begins');
    if (STATE.page === 'concept') navigate('concept'); else navigate('concept');
  });

  // Stake flow → live projection + wallet update
  const amtInput = modal.querySelector('#stake-amt');
  if (amtInput) {
    const proj = modal.querySelector('#proj-return');
    const cid = modal.querySelector('#stake-confirm').dataset.cid;
    const c = STATE.campaigns.find(x => x.id === cid);
    const parseAmt = () => parseInt(amtInput.value.replace(/[^\d]/g, ''), 10) || 0;
    const updateProj = () => {
      const amt = parseAmt();
      const ret = amt * (1 + c.irr / 100);
      proj.innerHTML = amt
        ? `Projected return: <b class="mono">${fmtN(ret)}</b> over 12 months <span style="color:var(--ink-400)">(at ${c.irr}% target IRR — not guaranteed)</span>`
        : 'Enter an amount to see your projected return.';
    };
    amtInput.addEventListener('input', updateProj);
    modal.querySelector('#quick-amts').addEventListener('click', e => {
      const chip = e.target.closest('[data-amt]');
      if (!chip) return;
      amtInput.value = parseInt(chip.dataset.amt, 10).toLocaleString();
      modal.querySelectorAll('#quick-amts .chip').forEach(ch => ch.classList.toggle('active', ch === chip));
      modal.querySelectorAll('#quick-amts .chip').forEach(ch => ch.classList.toggle('invest', ch === chip));
      updateProj();
    });
    updateProj();
    modal.querySelector('#stake-confirm').addEventListener('click', () => {
      const amt = parseAmt();
      if (!amt) { amtInput.focus(); toast('Enter a stake amount'); return; }
      if (amt > STATE.wallet) { toast('Insufficient wallet balance — add money first'); return; }
      STATE.wallet -= amt;
      c.funded = Math.min(c.target, c.funded + amt / 1e6);
      c.backers += 1;
      closeModal();
      toast(`${fmtN(amt)} staked on ${c.title.split('·')[0].trim()}`);
      syncWallet();
      if (STATE.page === 'invest') navigate('invest');
      if (STATE.page === 'home') navigate('home');
    });
  }
}
function closeModal() { document.getElementById('modal-mask').classList.remove('open'); }
document.getElementById('modal-mask').addEventListener('click', e => { if (e.target.id === 'modal-mask') closeModal(); });

// ===== Notifications panel =====
const notifPop = document.getElementById('notif-pop');
function renderNotifs() {
  const unread = STATE.notifications.filter(n => n.unread).length;
  document.querySelectorAll('.dot-notif').forEach(d => d.style.display = unread ? '' : 'none');
  notifPop.innerHTML = `
    <div class="notif-head">
      <b>Notifications</b>
      ${unread ? `<button class="link-btn" id="notif-clear">Mark all read</button>` : '<span style="font-size:11px;color:var(--ink-400)">All caught up</span>'}
    </div>
    ${STATE.notifications.map(n => `
      <div class="notif-item ${n.unread ? 'unread' : ''}" data-nid="${n.id}">
        <div class="av" style="background:${n.bg}">${n.av}</div>
        <div class="body"><div class="t">${n.t}</div><div class="meta">${n.meta}</div></div>
        ${n.unread ? '<span class="u-dot"></span>' : ''}
      </div>`).join('')}
  `;
  notifPop.querySelector('#notif-clear')?.addEventListener('click', () => {
    STATE.notifications.forEach(n => n.unread = false);
    renderNotifs();
  });
  notifPop.querySelectorAll('.notif-item').forEach(el => el.addEventListener('click', () => {
    const n = STATE.notifications.find(x => x.id === el.dataset.nid);
    if (n) n.unread = false;
    renderNotifs();
  }));
}
function toggleNotifs(show) {
  const open = show ?? !notifPop.classList.contains('open');
  notifPop.classList.toggle('open', open);
  if (open) renderNotifs();
}

// ===== Create menu =====
const createPop = document.getElementById('create-pop');
function toggleCreate(show) {
  createPop.classList.toggle('open', show ?? !createPop.classList.contains('open'));
}
createPop.querySelectorAll('[data-modal]').forEach(el => el.addEventListener('click', () => { toggleCreate(false); openModal(el.dataset.modal, el.dataset.id); }));

// Close popovers on outside click
document.addEventListener('click', e => {
  if (!e.target.closest('#notif-pop') && !e.target.closest('[data-action="notif"]')) notifPop.classList.remove('open');
  if (!e.target.closest('#create-pop') && !e.target.closest('[data-action="create"]')) createPop.classList.remove('open');
});

// ===== Command palette =====
const paletteMask = document.getElementById('palette-mask');
const paletteInput = document.getElementById('palette-input');
const paletteResults = document.getElementById('palette-results');
let palItems = [], palIndex = 0;

const PAGE_ENTRIES = [
  ['home','Home','Dashboard overview'], ['apps','Apps','All four sub-apps'], ['feed','Feed','Community activity'],
  ['wallet','Wallet','Balance, transactions, FCS'], ['analytics','Analytics','Ecosystem metrics'],
  ['concept','ConceptNexus','Idea validation'], ['invest','vestDen','Stake on campaigns'],
  ['collab','CollaBoard','Escrowed projects'], ['skills','SkillsCanvas','Verified talent'],
  ['profile','Profile','Your public profile'], ['settings','Settings','Account & security']
];

function paletteSources(q) {
  const out = [];
  const push = (group, label, sub, glyphBg, glyph, act) => out.push({ group, label, sub, glyphBg, glyph, act });
  const m = s => s.toLowerCase().includes(q);
  PAGE_ENTRIES.forEach(([pg, label, sub]) => { if (!q || m(label) || m(sub)) push('Go to', label, sub, 'var(--navy-900)', '→', () => navigate(pg)); });
  if (q) {
    STATE.ideas.forEach(i => { if (m(i.title) || m(i.desc)) push('Ideas', i.title, `Score ${i.score || '—'} · ${i.tag}`, 'var(--concept)', 'C', () => openModal('ideaDetail', i.id)); });
    STATE.campaigns.forEach(c => { if (m(c.title) || m(c.desc)) push('Campaigns', c.title, `₦${c.funded.toFixed(1)}M of ₦${c.target}M`, 'var(--invest)', 'V', () => openModal('stakeDetail', c.id)); });
    STATE.projects.forEach(p => { if (m(p.title) || m(p.desc)) push('Projects', p.title, `${p.milestones} milestones · ${p.status}`, 'var(--collab)', 'B', () => openModal('projectDetail', p.id)); });
    STATE.talents.forEach(t => { if (m(t.name) || m(t.role) || m(t.skills.join(' '))) push('Talent', t.name, `${t.role} · ${t.loc}`, 'var(--skills)', 'S', () => openModal('talentDetail', t.id)); });
  }
  return out.slice(0, 9);
}

function renderPalette() {
  const q = paletteInput.value.trim().toLowerCase();
  palItems = paletteSources(q);
  palIndex = Math.min(palIndex, Math.max(0, palItems.length - 1));
  let lastGroup = '';
  paletteResults.innerHTML = palItems.length ? palItems.map((it, i) => {
    const head = it.group !== lastGroup ? `<div class="p-group">${it.group}</div>` : '';
    lastGroup = it.group;
    return `${head}<div class="p-item ${i === palIndex ? 'sel' : ''}" data-pi="${i}">
      <span class="p-glyph" style="background:${it.glyphBg}">${it.glyph}</span>
      <span class="p-label">${it.label}</span>
      <span class="p-sub">${it.sub}</span>
    </div>`;
  }).join('') : `<div class="p-none">No matches for “${paletteInput.value}”. Try an idea, campaign or person.</div>`;
  paletteResults.querySelectorAll('.p-item').forEach(el => {
    el.addEventListener('click', () => pickPalette(parseInt(el.dataset.pi, 10)));
    el.addEventListener('mousemove', () => { palIndex = parseInt(el.dataset.pi, 10); paletteResults.querySelectorAll('.p-item').forEach(x => x.classList.toggle('sel', x === el)); });
  });
}
function pickPalette(i) {
  const it = palItems[i];
  if (!it) return;
  closePalette();
  it.act();
}
function openPalette() { paletteMask.classList.add('open'); paletteInput.value = ''; palIndex = 0; renderPalette(); setTimeout(() => paletteInput.focus(), 30); }
function closePalette() { paletteMask.classList.remove('open'); }
paletteInput.addEventListener('input', () => { palIndex = 0; renderPalette(); });
paletteInput.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown') { e.preventDefault(); palIndex = Math.min(palIndex + 1, palItems.length - 1); renderPalette(); }
  if (e.key === 'ArrowUp') { e.preventDefault(); palIndex = Math.max(palIndex - 1, 0); renderPalette(); }
  if (e.key === 'Enter') pickPalette(palIndex);
});
paletteMask.addEventListener('click', e => { if (e.target === paletteMask) closePalette(); });
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); paletteMask.classList.contains('open') ? closePalette() : openPalette(); }
  if (e.key === 'Escape') { closePalette(); closeModal(); notifPop.classList.remove('open'); createPop.classList.remove('open'); }
});

// ===== Global wiring =====
document.querySelectorAll('[data-page]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); navigate(el.dataset.page); }));
document.querySelectorAll('[data-action="search"]').forEach(el => el.addEventListener('click', openPalette));
document.querySelectorAll('[data-action="notif"]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); toggleNotifs(); }));
document.querySelectorAll('[data-action="create"]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); toggleCreate(); }));
document.querySelectorAll('[data-action="messages"]').forEach(el => el.addEventListener('click', () => toast('Messages: 2 unread from Tunde and Kemi')));

// init
function pageFromHash() {
  const h = (location.hash || '').replace('#', '');
  return validPages.includes(h) ? h : 'home';
}
window.addEventListener('hashchange', () => { if (pageFromHash() !== STATE.page) navigate(pageFromHash()); });
renderNotifs();
navigate(pageFromHash());
