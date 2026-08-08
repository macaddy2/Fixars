import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const products = {
  conceptnexus: {
    key: "conceptnexus",
    name: "ConceptsNexus",
    mark: "C",
    accent: "violet",
    domain: "Planned route · concepts.fixars.ai",
    eyebrow: "Idea refinement & certification",
    headline: "Every certified idea started as a hunch",
    description:
      "Submit in plain words. AI triage sharpens it and flags the gaps, the community validates it, experts certify it with an IIVS score. What comes out the other end is fund-ready — with receipts, not vibes.",
    primary: "Submit an idea",
    secondary: "Become a validator",
    stats: [
      ["~2 hrs", "to an AI triage report — free"],
      ["IIVS", "innovation · impact · viability · scalability"],
      ["512", "supporters on the top concept this month"],
    ],
    preview: [
      "Smart waste sorting micro-commission",
      "Certified · CN-2044 · quorum 100%",
      "IIVS breakdown",
      "Handed off to CollaBoard with legal pack + skill brief",
    ],
    features: [
      [
        "AI triage & synthesis",
        "A structured brief, a draft IIVS and named gaps before human review.",
      ],
      [
        "Community + validator quorum",
        "Support signals and independent validation make demand visible.",
      ],
      [
        "Certification that carries over",
        "The concept receipt and skill brief travel into a CollaBoard capsule.",
      ],
    ],
    steps: [
      "Submit plainly",
      "AI triage",
      "Community validation",
      "Certified & handed off",
    ],
    dashboardTitle: "Every certified idea started here",
    dashboardSub:
      "Explore an idea, shape its evidence and prepare a usable build brief.",
  },
  skillscanvas: {
    key: "skillscanvas",
    name: "SkillsCanvas",
    mark: "S",
    accent: "cyan",
    domain: "Planned route · skills.fixars.ai",
    eyebrow: "Verified skills marketplace",
    headline: "Prove it. Get paid for it.",
    description:
      "Your CV says “detail-oriented”. Your SkillsCanvas passport says 1,240 labeled datasets at 99.1% accuracy — and every claim comes with receipts. Do paid micro-work, level real skills, apply to full work with one tap.",
    primary: "Create your canvas",
    secondary: "See how it works",
    stats: [
      ["₦900–2,900", "per micro-task, paid same day"],
      ["4 tiers", "self-reported → ecosystem-proven"],
      ["94%", "top job fit, computed from receipts"],
    ],
    preview: [
      "Attention to detail — Lv 8",
      "Ecosystem-proven",
      "Identify UI bugs (mobile)",
      "Junior QA engineer · TechFlow",
    ],
    features: [
      [
        "Micro-work that pays same day",
        "Short tasks matched to the skills you are levelling.",
      ],
      [
        "Four tiers, no shortcuts",
        "Top-tier proof comes from assessed and shipped work.",
      ],
      [
        "The passport is the application",
        "Fit is based on verified levels, not keyword bingo.",
      ],
    ],
    steps: [
      "Claim your skills",
      "Do micro-work",
      "Get assessed",
      "Ship real work",
    ],
    dashboardTitle: "Good afternoon, Adaeze",
    dashboardSub: "Every skill on your canvas is provable, with receipts.",
  },
  collaboard: {
    key: "collaboard",
    name: "CollaBoard",
    mark: "B",
    accent: "coral",
    domain: "Planned route · collab.fixars.ai",
    eyebrow: "Escrowed project execution",
    headline: "Build with strangers, safely",
    description:
      "A capsule is a sealed workspace: team, tasks, artifacts and a signed legal pack travel together. Ownership, licensing and data consent are settled before the first task — while everyone still likes each other.",
    primary: "Start a capsule",
    secondary: "See how it works",
    stats: [
      ["Day 0", "legal pack signed before work starts"],
      ["5 gates", "product · legal · team · market · safety"],
      ["Receipts", "approved artifacts are traceable"],
    ],
    preview: [
      "Smart Irrigation Bundle",
      "AgriTech-NGR-2024 · week 3 · capsule health",
      "JDA signed · iCLA · NDPA",
      "System architecture diagram v1.2",
    ],
    features: [
      [
        "Legal engine, not legal fees",
        "A clear collaboration pack from the first day of work.",
      ],
      [
        "Teams from passports",
        "Recruit against verified SkillsCanvas evidence, not promises.",
      ],
      [
        "Artifacts become receipts",
        "Approved work becomes clear project evidence.",
      ],
    ],
    steps: [
      "Open a capsule",
      "Sign the pack",
      "Build in sprints",
      "Ship receipts",
    ],
    dashboardTitle: "Smart Irrigation Bundle",
    dashboardSub:
      "A shared project capsule with people, work, evidence and clear handoffs.",
  },
  vestden: {
    key: "vestden",
    name: "VestDen",
    mark: "V",
    accent: "green",
    domain: "Planned route · vest.fixars.ai",
    eyebrow: "Demo project diligence",
    headline: "Watch the work, not the pitch",
    description:
      "Explore how a project’s concept, team evidence and delivery receipts can be understood together. This temporary workspace uses a dummy profile and simulated data only — no funds are held and no financial actions are available.",
    primary: "Explore the pipeline",
    secondary: "See how it works",
    stats: [
      ["Demo only", "simulated project information"],
      ["3 signals", "concept · skills · delivery"],
      ["No funds", "financial actions are disabled"],
    ],
    preview: [
      "Community water monitoring pilot",
      "Simulated project brief · Stage 2",
      "Concept · skills · delivery signals",
      "Escrow available at regulated launch",
    ],
    features: [
      [
        "Structured project diligence",
        "See the signals that would support a transparent project brief.",
      ],
      [
        "Evidence from the ecosystem",
        "Concept, skills and delivery information remain traceable.",
      ],
      [
        "Demo-first by design",
        "Learn the workflow without deposits, payouts or investment actions.",
      ],
    ],
    steps: [
      "Review a brief",
      "Inspect evidence",
      "Follow milestones",
      "Regulated launch later",
    ],
    dashboardTitle: "Community water monitoring pilot",
    dashboardSub:
      "Simulated project record for exploration and evaluation only.",
  },
};

const productList = Object.values(products);
// Host detection supports local previews and direct canonical deployments. In production,
// *.fixars.ai and fixars.ai/<product> are redirect connectors, not duplicate app origins.
const productForHost = () => {
  const host = location.hostname.toLowerCase().replace(/^www\./, "");
  if (["skillscanvas.co", "skills.fixars.ai"].includes(host))
    return "skillscanvas";
  if (["collaboard.co", "collab.fixars.ai"].includes(host)) return "collaboard";
  if (["vestden.co", "vest.fixars.ai"].includes(host)) return "vestden";
  if (["conceptsnexus.co", "concepts.fixars.ai"].includes(host))
    return "conceptnexus";
  const configuredProduct = import.meta.env.VITE_DEFAULT_PRODUCT;
  return products[configuredProduct] ? configuredProduct : "conceptnexus";
};
const routeFromHash = () => {
  const [product = productForHost(), view = "home"] = location.hash
    .replace(/^#\/?/, "")
    .split("/");
  return {
    product: products[product] ? product : productForHost(),
    view: view === "app" ? "app" : "home",
  };
};
const go = (product, view = "home") => {
  location.hash = `#/${product}/${view}`;
};

function Ecosystem({ active }) {
  return (
    <div className="ecosystem">
      <a
        className="fixars-link"
        href="https://fixars.ai"
        target="_blank"
        rel="noreferrer"
      >
        ✦ <span>fixars.ai ecosystem</span>
      </a>
      <span className="ecosystem-note">
        one account, one profile, connected evidence
      </span>
      <nav aria-label="Fixars products">
        {productList.map((p) => (
          <button
            key={p.key}
            className={p.key === active ? "active" : ""}
            onClick={() => go(p.key)}
          >
            <i className={`mark ${p.accent}`}>{p.mark}</i>
            <span>{p.name}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
function ProductNav({ product, app }) {
  return (
    <header className="product-nav">
      <button className="wordmark" onClick={() => go(product.key)}>
        <i className={`mark ${product.accent}`}>{product.mark}</i>
        {product.name}
      </button>
      <span className="domain">{product.domain}</span>
      <nav>
        <button
          onClick={() => go(product.key)}
          className={!app ? "selected" : ""}
        >
          How it works
        </button>
        <button
          onClick={() =>
            document
              .getElementById("ecosystem")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          Ecosystem
        </button>
        <button
          onClick={() => go(product.key, "app")}
          className={app ? "selected" : ""}
        >
          {app ? "Dashboard" : "Open the app"}
        </button>
      </nav>
    </header>
  );
}
function ProductPreview({ product }) {
  return (
    <div className="product-preview" aria-label={`${product.name} example`}>
      <div className="preview-card">
        <strong>{product.preview[0]}</strong>
        <span>{product.preview[1]}</span>
      </div>
      <div className="preview-card">
        <strong>{product.preview[2]}</strong>
        <span>
          {product.key === "skillscanvas"
            ? "3 min · +15 XP · Technical ops"
            : product.key === "vestden"
              ? "No financial actions"
              : "Evidence attached"}
        </span>
      </div>
      <div className="preview-card compact">
        <span>{product.preview[3]}</span>
        <b>{product.key === "vestden" ? "Locked" : "Ready"}</b>
      </div>
    </div>
  );
}
function Landing({ product }) {
  return (
    <div className={product.accent}>
      <Ecosystem active={product.key} />
      <ProductNav product={product} />
      <main>
        <section className="hero">
          <div>
            <p className="eyebrow">{product.eyebrow}</p>
            <h1>{product.headline}</h1>
            <p className="lede">{product.description}</p>
            <div className="actions">
              <button
                className="primary"
                onClick={() => go(product.key, "app")}
              >
                {product.primary}
              </button>
              <button
                className="secondary"
                onClick={() =>
                  document
                    .getElementById("how")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                {product.secondary}
              </button>
            </div>
            <div className="proof">
              {product.stats.map(([value, label]) => (
                <div key={value}>
                  <b>{value}</b>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <ProductPreview product={product} />
        </section>
        <FeatureSection product={product} />
        <Steps product={product} />
        <EcosystemSection product={product} />
        <section className="closing">
          <div>
            <h2>
              {product.key === "vestden"
                ? "Explore the demo workspace"
                : `Open ${product.name}`}
            </h2>
            <p>
              {product.key === "vestden"
                ? "Use the dummy profile to follow simulated project evidence. Financial actions stay disabled."
                : "Start with the source workflow, then let the connected ecosystem carry the evidence forward."}
            </p>
          </div>
          <button onClick={() => go(product.key, "app")}>
            {product.primary}
          </button>
        </section>
      </main>
      <Footer product={product} />
    </div>
  );
}
function FeatureSection({ product }) {
  return (
    <section className="section">
      <p className="eyebrow">Why this product exists</p>
      <h2>
        {product.key === "skillscanvas"
          ? "Skills that carry their own evidence"
          : product.key === "conceptnexus"
            ? "An idea with a score travels further"
            : product.key === "collaboard"
              ? "Handshakes don’t scale. Receipts do."
              : "A clear view of project evidence."}
      </h2>
      <div className="feature-grid">
        {product.features.map(([title, copy], index) => (
          <article key={title}>
            <i>{String(index + 1).padStart(2, "0")}</i>
            <h3>{title}</h3>
            <p>{copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
function Steps({ product }) {
  return (
    <section className="section steps" id="how">
      <p className="eyebrow">How it works</p>
      <h2>
        {product.key === "conceptnexus"
          ? "One pipeline, four gates"
          : product.key === "skillscanvas"
            ? "From claim to proof in four moves"
            : product.key === "collaboard"
              ? "From certified idea to shipped milestone"
              : "A demo trail, not a financial service"}
      </h2>
      <div>
        {product.steps.map((step, i) => (
          <article key={step}>
            <span>{String(i + 1).padStart(2, "0")}</span>
            <h3>{step}</h3>
            <p>
              {i === 0
                ? "Start with clear context and a shared record."
                : i === 3
                  ? "The next state becomes a transparent handoff."
                  : "Progress through a focused, evidence-led step."}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
function EcosystemSection({ product }) {
  return (
    <section className="section ecosystem-section" id="ecosystem">
      <p className="eyebrow">Part of fixars.ai</p>
      <h2>
        {product.key === "skillscanvas"
          ? "Your passport works everywhere"
          : product.key === "conceptnexus"
            ? "Certification is the first receipt"
            : product.key === "collaboard"
              ? "The capsule is the source of truth"
              : "Every signal has a source"}
      </h2>
      <div className="product-grid">
        {productList
          .filter((p) => p.key !== product.key)
          .map((p) => (
            <button key={p.key} onClick={() => go(p.key)}>
              <i className={`mark ${p.accent}`}>{p.mark}</i>
              <strong>{p.name}</strong>
              <span>
                {p.key === "conceptnexus"
                  ? "Ideas and certified briefs"
                  : p.key === "skillscanvas"
                    ? "Verified capability evidence"
                    : p.key === "collaboard"
                      ? "People, projects and receipts"
                      : "Demo project diligence"}
              </span>
            </button>
          ))}
      </div>
    </section>
  );
}
function Dashboard({ product }) {
  const workflowTabs = {
    conceptnexus: ["Discover", "Submit", "Validator desk"],
    skillscanvas: ["Dashboard", "Skill passport", "Full work"],
    collaboard: ["Overview", "Tasks", "Artifacts", "Legal"],
    vestden: ["Ideas", "Teams", "Projects"],
  };
  const [tab, setTab] = useState(workflowTabs[product.key][0]);
  const [notice, setNotice] = useState("");
  const [tasks, setTasks] = useState([false, false, false]);
  const action = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };
  return (
    <div className={product.accent}>
      <Ecosystem active={product.key} />
      <ProductNav product={product} app />
      <main className="app-page">
        {product.key === "vestden" && (
          <div className="demo-banner">
            <b>Demo workspace</b>
            <span>
              Simulated data. No funds, deposits, payouts or financial actions.
            </span>
          </div>
        )}
        <div className="app-heading">
          <div>
            <p className="eyebrow">
              {product.key === "vestden"
                ? "Dummy profile · demo mode"
                : `${product.name} workspace`}
            </p>
            <h1>{product.dashboardTitle}</h1>
            <p>{product.dashboardSub}</p>
          </div>
          <button className="secondary" onClick={() => go(product.key)}>
            Back to product
          </button>
        </div>
        <div
          className="tabs"
          role="tablist"
          aria-label={`${product.name} workflow`}
        >
          {workflowTabs[product.key].map((item) => (
            <button
              key={item}
              role="tab"
              aria-selected={tab === item}
              className={tab === item ? "selected" : ""}
              onClick={() => setTab(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <ProductWorkflow
          product={product}
          tab={tab}
          action={action}
          tasks={tasks}
          setTasks={setTasks}
        />
      </main>
      <div className={`toast ${notice ? "show" : ""}`} role="status">
        {notice}
      </div>
      <Footer product={product} />
    </div>
  );
}
function ProductWorkflow({ product, tab, action, tasks, setTasks }) {
  if (product.key === "conceptnexus")
    return <ConceptNexusWorkflow tab={tab} action={action} />;
  if (product.key === "skillscanvas")
    return (
      <SkillsCanvasWorkflow
        tab={tab}
        action={action}
        tasks={tasks}
        setTasks={setTasks}
      />
    );
  if (product.key === "collaboard")
    return <CollaBoardWorkflow tab={tab} action={action} />;
  return <VestDenWorkflow tab={tab} action={action} />;
}

function ConceptNexusWorkflow({ tab, action }) {
  const [idea, setIdea] = useState({ title: "", problem: "", proposal: "" });
  const [submitted, setSubmitted] = useState(false);
  const submit = (event) => {
    event.preventDefault();
    if (!idea.title.trim()) return action("Give the concept a title first.");
    setSubmitted(true);
    action("Local concept queued for simulated AI triage.");
  };
  if (tab === "Submit")
    return (
      <section className="workflow-panel">
        <p className="eyebrow">Stage 01 · submit plainly</p>
        <h2>Submit an idea</h2>
        <p className="muted">
          Title, problem and proposal. This preview keeps the submission in this
          browser only.
        </p>
        <form className="stack-form" onSubmit={submit}>
          <label>
            Title
            <input
              value={idea.title}
              onChange={(event) =>
                setIdea({ ...idea, title: event.target.value })
              }
              placeholder="What are you proposing?"
            />
          </label>
          <label>
            Problem
            <textarea
              value={idea.problem}
              onChange={(event) =>
                setIdea({ ...idea, problem: event.target.value })
              }
              placeholder="What needs to change?"
            />
          </label>
          <label>
            Proposal
            <textarea
              value={idea.proposal}
              onChange={(event) =>
                setIdea({ ...idea, proposal: event.target.value })
              }
              placeholder="How could it work?"
            />
          </label>
          <div className="workflow-action">
            <button className="primary">Send to demo AI triage</button>
            <span>Free · feedback in ~2 hours in the intended flow</span>
          </div>
        </form>
        {submitted && (
          <p className="inline-result">
            <b>Local triage record ready:</b> “{idea.title}” is visible only in
            this preview; nothing was submitted externally.
          </p>
        )}
      </section>
    );
  if (tab === "Validator desk")
    return (
      <section className="workflow-panel">
        <p className="eyebrow">Stage 03 · community validation</p>
        <h2>Validator desk</h2>
        <div className="concept-row">
          <div>
            <b>Solar cold-storage co-op</b>
            <small>Draft IIVS · impact strong · viability needs evidence</small>
          </div>
          <span className="tag">Awaiting quorum</span>
        </div>
        <div className="concept-row">
          <div>
            <b>Neighbourhood refill points</b>
            <small>
              Community signal is visible; reviewer feedback is still open.
            </small>
          </div>
          <button
            className="secondary"
            onClick={() => action("Demo validator feedback opened.")}
          >
            Review gaps
          </button>
        </div>
        <p className="muted">
          The prototype’s intended sequence remains: triage, community
          validation, expert certification, then a CollaBoard handoff.
        </p>
      </section>
    );
  return (
    <section className="workflow-panel">
      <p className="eyebrow">One pipeline · four gates</p>
      <h2>Concept discovery</h2>
      <div className="source-grid">
        <article>
          <span>01</span>
          <b>AI triage</b>
          <p>Sharper framing and a named gap list before a human review.</p>
        </article>
        <article>
          <span>02</span>
          <b>Community quorum</b>
          <p>Support signals and validator decisions make demand legible.</p>
        </article>
        <article>
          <span>03</span>
          <b>IIVS certification</b>
          <p>A portable concept receipt, ready to seed a project capsule.</p>
        </article>
      </div>
      <div className="handoff-card">
        <i className="mark coral">B</i>
        <div>
          <b>Next: CollaBoard capsule</b>
          <p>
            A certified concept carries a legal pack and skills brief into
            execution.
          </p>
        </div>
        <button className="secondary" onClick={() => go("collaboard", "app")}>
          Open capsule preview
        </button>
      </div>
    </section>
  );
}

function SkillsCanvasWorkflow({ tab, action, tasks, setTasks }) {
  const taskNames = [
    "Label 12 street-sign images",
    "Identify UI bugs (mobile)",
    "Review & correct short copy",
  ];
  if (tab === "Skill passport")
    return (
      <section className="workflow-panel">
        <p className="eyebrow">skillscanvas.ai/p/adaeze</p>
        <h2>Skill passport</h2>
        <div className="passport-card">
          <b>Attention to detail — Lv 8</b>
          <p>
            1,240 labelled datasets · 99.1% verified accuracy · assessed this
            month.
          </p>
          <div className="tier-list">
            <span>Self-reported</span>
            <span>Peer</span>
            <span>Assessed</span>
            <span className="earned">Ecosystem-proven</span>
          </div>
        </div>
        <div className="passport-card">
          <b>Collaboration — Lv 7</b>
          <p>
            8 CollaBoard sprints · 2 capsules shipped · 100% attendance
            cohesion.
          </p>
          <div className="tier-list">
            <span>Self-reported</span>
            <span>Peer</span>
            <span className="earned">Assessed</span>
            <span className="earned">Ecosystem-proven</span>
          </div>
        </div>
        <button
          className="secondary"
          onClick={() => action("Passport link copied in this local preview.")}
        >
          Copy passport link
        </button>
      </section>
    );
  if (tab === "Full work")
    return (
      <section className="workflow-panel">
        <p className="eyebrow">Matched from verified evidence</p>
        <h2>Full work</h2>
        {[
          ["Junior QA engineer", "TechFlow · Lagos, hybrid", "94%"],
          ["Content operations associate", "CivicStack · Remote", "88%"],
        ].map(([role, company, fit]) => (
          <div className="job-row" key={role}>
            <strong>
              {fit}
              <small> fit</small>
            </strong>
            <div>
              <b>{role}</b>
              <p>{company}</p>
            </div>
            <button
              className="primary"
              onClick={() => action("Local passport application prepared.")}
            >
              Apply with passport
            </button>
          </div>
        ))}
      </section>
    );
  return (
    <section className="workflow-panel">
      <p className="eyebrow">Your canvas · evidence first</p>
      <h2>Micro-work feed</h2>
      <p className="muted">
        The original flow levels a claimed skill through paid tasks, assessment
        and shipped work.
      </p>
      <div className="task-list">
        {taskNames.map((task, index) => (
          <div key={task}>
            <span>
              <b>{task}</b>
              <small>{index + 2} min · Attention to detail · +15 XP</small>
            </span>
            <button
              disabled={tasks[index]}
              onClick={() => {
                setTasks((old) =>
                  old.map((item, itemIndex) =>
                    itemIndex === index ? true : item,
                  ),
                );
                action("Demo task recorded on this dummy canvas.");
              }}
            >
              {tasks[index] ? "Recorded ✓" : "Do task"}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function CollaBoardWorkflow({ tab, action }) {
  const [tasks, setTasks] = useState([
    { name: "Update mobile dashboard offline mode", state: "Done" },
    { name: "Finalise hardware specification", state: "In review" },
    { name: "Prepare pilot onboarding guide", state: "To do" },
  ]);
  const [newTask, setNewTask] = useState("");
  const addTask = (event) => {
    event.preventDefault();
    if (!newTask.trim()) return;
    setTasks((current) => [...current, { name: newTask, state: "To do" }]);
    setNewTask("");
    action("Task added to the local capsule.");
  };
  if (tab === "Tasks")
    return (
      <section className="workflow-panel">
        <p className="eyebrow">Capsule workboard</p>
        <h2>Tasks</h2>
        <div className="task-list">
          {tasks.map((task, index) => (
            <div key={`${task.name}-${index}`}>
              <span>
                <b>{task.name}</b>
                <small>
                  Smart Irrigation Bundle · assigned from the capsule
                </small>
              </span>
              <button
                onClick={() =>
                  setTasks((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index
                        ? {
                            ...item,
                            state: item.state === "Done" ? "To do" : "Done",
                          }
                        : item,
                    ),
                  )
                }
              >
                {task.state}
              </button>
            </div>
          ))}
        </div>
        <form className="add-task" onSubmit={addTask}>
          <input
            value={newTask}
            onChange={(event) => setNewTask(event.target.value)}
            placeholder="Add a local capsule task"
          />
          <button className="secondary">Add task</button>
        </form>
      </section>
    );
  if (tab === "Artifacts")
    return (
      <section className="workflow-panel">
        <p className="eyebrow">Approved work becomes a receipt</p>
        <h2>Artifacts</h2>
        {[
          "System architecture diagram v1.2",
          "Pilot research brief",
          "Hardware specification · pending review",
        ].map((artifact, index) => (
          <div className="artifact-row" key={artifact}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <b>{artifact}</b>
            <small>{index < 2 ? "Approved receipt" : "In review"}</small>
          </div>
        ))}
      </section>
    );
  if (tab === "Legal")
    return (
      <section className="workflow-panel">
        <p className="eyebrow">Signed before the first task</p>
        <h2>Legal pack</h2>
        <div className="source-grid">
          <article>
            <b>Joint development agreement</b>
            <p>Scope, authorship and contribution terms recorded.</p>
            <span className="tag">Signed</span>
          </article>
          <article>
            <b>IP & confidentiality</b>
            <p>
              Project knowledge and approved artifacts are clearly attributed.
            </p>
            <span className="tag">Signed</span>
          </article>
          <article>
            <b>Data consent</b>
            <p>Access and use have a readable consent record.</p>
            <span className="tag">Signed</span>
          </article>
        </div>
      </section>
    );
  return (
    <section className="workflow-panel">
      <p className="eyebrow">Project capsule · escrowed execution</p>
      <h2>Smart Irrigation Bundle</h2>
      <div className="capsule-stats">
        <div>
          <b>84</b>
          <span>capsule health</span>
        </div>
        <div>
          <b>12/15</b>
          <span>tasks complete</span>
        </div>
        <div>
          <b>Week 3</b>
          <span>delivery tempo</span>
        </div>
      </div>
      <div className="handoff-card">
        <i className="mark cyan">S</i>
        <div>
          <b>Team evidence from SkillsCanvas</b>
          <p>
            Roles are matched against verified passports, not only profiles.
          </p>
        </div>
        <button className="secondary" onClick={() => go("skillscanvas", "app")}>
          View skills
        </button>
      </div>
    </section>
  );
}

function VestDenWorkflow({ tab, action }) {
  const [simulation, setSimulation] = useState("");
  const preview = (label) => {
    setSimulation(label);
    action(`${label} previewed in sandbox mode — no funds move.`);
  };
  if (tab === "Ideas")
    return (
      <section className="workflow-panel vest-workflow">
        <p className="eyebrow">Layer 1 · certified ideas</p>
        <h2>Ideas</h2>
        <p className="muted">
          Certified ConceptsNexus ideas before their teams form. The original
          screen compares possible Growth and Protection outcomes; these are
          display-only sandbox previews.
        </p>
        {[
          ["Solar cold-storage co-op", "IIVS 78 · community signal building"],
          [
            "Community water monitoring pilot",
            "IIVS 84 · delivery brief attached",
          ],
        ].map(([name, detail]) => (
          <div className="position-card" key={name}>
            <div>
              <b>{name}</b>
              <p>{detail}</p>
              <div className="source-links">
                <span>ConceptsNexus receipt</span>
                <span>Skills brief</span>
              </div>
            </div>
            <div className="simulated-choices">
              <button
                className="secondary"
                onClick={() => preview("Growth position")}
              >
                Preview Growth
              </button>
              <button
                className="secondary"
                onClick={() => preview("Protection position")}
              >
                Preview Protection
              </button>
            </div>
          </div>
        ))}
        <p className="sandbox-note">
          Simulation only. No position, payment instruction, wallet, or
          investment record is created.
        </p>
        {simulation && (
          <p className="inline-result">
            {simulation} is shown locally as a product-flow state.
          </p>
        )}
      </section>
    );
  if (tab === "Teams")
    return (
      <section className="workflow-panel vest-workflow">
        <p className="eyebrow">Layer 2 · teams forming</p>
        <h2>Teams</h2>
        <p className="muted">
          The intended screen joins the team’s SkillsCanvas audit and CollaBoard
          tempo into a single diligence view.
        </p>
        {[
          [
            "Water systems field team",
            "SkillsCanvas audit 96",
            "CollaBoard tempo 87",
          ],
          [
            "Cold-chain operations team",
            "SkillsCanvas audit 88",
            "CollaBoard tempo 79",
          ],
        ].map(([name, audit, tempo]) => (
          <div className="team-card" key={name}>
            <div>
              <b>{name}</b>
              <p>
                Simulated team record · no individual identity or financial
                information.
              </p>
            </div>
            <div>
              <span>{audit}</span>
              <span>{tempo}</span>
            </div>
            <button
              className="secondary"
              onClick={() => preview("Team diligence")}
            >
              View diligence
            </button>
          </div>
        ))}
        {simulation && (
          <p className="inline-result">
            {simulation} is available only in this local sandbox.
          </p>
        )}
      </section>
    );
  return (
    <section className="workflow-panel vest-workflow">
      <p className="eyebrow">Layer 3 · active projects · milestone escrow</p>
      <h2>Projects</h2>
      <p className="muted">
        This restores the supplied project/milestone structure while keeping
        every amount and action simulated.
      </p>
      <div className="project-card">
        <div>
          <b>Community water monitoring pilot</b>
          <p>
            Simulated project record · concept, team audit and delivery evidence
            linked.
          </p>
        </div>
        <span className="tag">Sandbox</span>
      </div>
      <div className="milestone-list">
        <div>
          <span>✓</span>
          <b>SkillsCanvas team audit &amp; MVP</b>
          <small>30% · simulated verified state</small>
        </div>
        <div>
          <span>2</span>
          <b>500 test deliveries</b>
          <small>30% · in progress · 342 of 500 simulated</small>
        </div>
        <div>
          <span>3</span>
          <b>Independent field review</b>
          <small>20% · upcoming simulation</small>
        </div>
        <div>
          <span>4</span>
          <b>Scale handoff</b>
          <small>20% · upcoming simulation</small>
        </div>
      </div>
      <div className="position-preview">
        <div>
          <b>Position preview</b>
          <p>
            Choose a simulated outcome to test the interaction design. This
            never creates a financial position.
          </p>
        </div>
        <button className="primary" onClick={() => preview("Project position")}>
          Preview simulated position
        </button>
      </div>
      <div className="handoff-card">
        <i className="mark coral">B</i>
        <div>
          <b>Watch the work, not the pitch</b>
          <p>
            Stage progress is represented by CollaBoard artifacts and delivery
            receipts.
          </p>
        </div>
        <button className="secondary" onClick={() => go("collaboard", "app")}>
          Open capsule preview
        </button>
      </div>
      {simulation && (
        <p className="inline-result">
          {simulation} interaction completed locally. No money, escrow release
          or payout is possible here.
        </p>
      )}
    </section>
  );
}

function ConceptDraft({ action }) {
  const [idea, setIdea] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const submit = (event) => {
    event.preventDefault();
    if (!idea.trim()) return;
    setSubmitted(true);
    action("Local concept draft saved for review.");
  };
  return (
    <form className="demo-form" onSubmit={submit}>
      <label htmlFor="idea-title">Working idea</label>
      <div>
        <input
          id="idea-title"
          value={idea}
          onChange={(event) => setIdea(event.target.value)}
          placeholder="e.g. Neighbourhood refill points"
        />
        <button className="primary">Run demo triage</button>
      </div>
      {submitted && (
        <p className="inline-result">
          <b>Draft ready:</b> “{idea}” has a local review record. No idea has
          been submitted externally.
        </p>
      )}
    </form>
  );
}
function CapsuleChecklist({ action }) {
  const [checked, setChecked] = useState([true, true, false]);
  const rows = ["Scope agreed", "Roles visible", "First artifact reviewed"];
  return (
    <div className="checklist">
      {rows.map((row, index) => (
        <label key={row}>
          <input
            type="checkbox"
            checked={checked[index]}
            onChange={() =>
              setChecked((current) =>
                current.map((item, itemIndex) =>
                  itemIndex === index ? !item : item,
                ),
              )
            }
          />
          <span>{row}</span>
        </label>
      ))}
      <button
        className="secondary"
        type="button"
        onClick={() => action("Demo capsule checklist updated locally.")}
      >
        Save demo checklist
      </button>
    </div>
  );
}
function DashboardOverview({ product, action, tasks, setTasks }) {
  const isSkills = product.key === "skillscanvas";
  return (
    <div className="dashboard-grid">
      <section className="workspace-card main">
        <h2>
          {isSkills
            ? "Skill canvas"
            : product.key === "conceptnexus"
              ? "Active concept"
              : product.key === "collaboard"
                ? "Capsule pulse"
                : "Simulated project brief"}
        </h2>
        <p className="muted">{product.preview[1]}</p>
        {isSkills ? (
          <div className="task-list">
            {[
              "Data labelling: street signs",
              "Identify UI bugs (mobile)",
              "Review & correct short copy",
            ].map((task, i) => (
              <div key={task}>
                <span>
                  <b>{task}</b>
                  <small>{i + 2} min · verified skill practice</small>
                </span>
                <button
                  disabled={tasks[i]}
                  onClick={() => {
                    setTasks((old) =>
                      old.map((item, index) => (index === i ? true : item)),
                    );
                    action("Demo task recorded on this dummy canvas.");
                  }}
                >
                  {tasks[i] ? "Recorded ✓" : "Do task"}
                </button>
              </div>
            ))}
          </div>
        ) : product.key === "conceptnexus" ? (
          <ConceptDraft action={action} />
        ) : product.key === "collaboard" ? (
          <CapsuleChecklist action={action} />
        ) : (
          <div className="record-list">
            {product.preview.map((item, i) => (
              <div key={item}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <b>{item}</b>
                <small>
                  {i < 3
                    ? "Evidence available"
                    : "Available at regulated launch"}
                </small>
              </div>
            ))}
          </div>
        )}
      </section>
      <aside className="workspace-card side">
        <p className="eyebrow">Connected next step</p>
        <h3>
          {product.key === "conceptnexus"
            ? "Prepare a CollaBoard capsule"
            : product.key === "skillscanvas"
              ? "Find work that fits your proof"
              : product.key === "collaboard"
                ? "Review the project evidence"
                : "Explore the milestone trail"}
        </h3>
        <p className="muted">
          This is a local product preview. The connection is shown as a safe
          demo, not a live cross-app transfer.
        </p>
        <button
          className="primary"
          onClick={() =>
            action(
              product.key === "vestden"
                ? "Demo trail opened — no financial action is available."
                : "Preview handoff prepared.",
            )
          }
        >
          {product.key === "vestden" ? "View simulated trail" : "Open handoff"}
        </button>
      </aside>
    </div>
  );
}
function Evidence({ product, action }) {
  return (
    <section className="workspace-card evidence">
      <h2>Evidence trail</h2>
      {[
        "Context captured",
        "Evidence reviewed",
        "Record updated",
        "Handoff ready",
      ].map((step, i) => (
        <div className="trail" key={step}>
          <i>{i < 3 ? "✓" : "→"}</i>
          <div>
            <b>{step}</b>
            <p>
              {product.key === "vestden" && i === 3
                ? "Locked until regulated launch; shown here as a demo state."
                : "A clear, local record that can be understood by the next product."}
            </p>
          </div>
        </div>
      ))}
      <button
        className="secondary"
        onClick={() => action("Evidence view refreshed.")}
      >
        Refresh demo record
      </button>
    </section>
  );
}
function Milestones({ product, action }) {
  return (
    <section className="workspace-card evidence">
      <h2>
        {product.key === "vestden"
          ? "Simulated milestone trail"
          : "Matched opportunities"}
      </h2>
      {[
        "Concept context",
        "Skills aligned",
        "Collaboration evidence",
        "Next review",
      ].map((step, i) => (
        <div className="trail" key={step}>
          <i>{i < 3 ? "✓" : "○"}</i>
          <div>
            <b>{step}</b>
            <p>
              {product.key === "vestden"
                ? "Simulated for the dummy profile. No funds are held or released."
                : "Preview data based on the connected product context."}
            </p>
          </div>
        </div>
      ))}
      <button
        className="primary"
        onClick={() =>
          action(
            product.key === "vestden"
              ? "Simulation note saved locally."
              : "Opportunity interest recorded in this preview.",
          )
        }
      >
        {product.key === "vestden" ? "Add simulation note" : "Save interest"}
      </button>
    </section>
  );
}
function Footer({ product }) {
  return (
    <footer>
      <span>{product.name} is a Fixars product preview.</span>
      <button onClick={() => go(product.key)}>Product home</button>
      <a href="https://fixars.ai" target="_blank" rel="noreferrer">
        Fixars.ai ↗
      </a>
    </footer>
  );
}
function App() {
  const [route, setRoute] = useState(routeFromHash());
  useEffect(() => {
    const update = () => setRoute(routeFromHash());
    addEventListener("hashchange", update);
    if (!location.hash) go(productForHost());
    return () => removeEventListener("hashchange", update);
  }, []);
  const product = useMemo(() => products[route.product], [route.product]);
  return route.view === "app" ? (
    <Dashboard product={product} />
  ) : (
    <Landing product={product} />
  );
}

createRoot(document.getElementById("root")).render(<App />);
