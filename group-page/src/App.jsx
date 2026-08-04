const ventures = [
  {
    name: "SkillsCanvas",
    tag: "Talent & proof",
    description: "A skills-first passport for credentials, projects and work people can prove.",
    tone: "blue",
  },
  {
    name: "CollaBoard",
    tag: "Teams & delivery",
    description: "A collaboration layer for finding the right people and moving work forward together.",
    tone: "ink",
  },
  {
    name: "ConceptsNexus",
    tag: "Ideas & briefs",
    description: "An idea refinement layer that turns raw sparks into clear, actionable opportunities.",
    tone: "violet",
  },
  {
    name: "VestDen",
    tag: "Capital & conviction",
    description: "A capital and conviction layer for backing ideas with better signals and shared upside.",
    tone: "coral",
  },
];

function App() {
  return (
    <div className="group-site">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="group-header">
        <a className="group-brand" href="#top" aria-label="Fixars Group home">
          <img src="/fixars-mark.png" alt="" width="34" height="34" />
          <span>Fixars<span className="brand-suffix">Group</span></span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#ecosystem">The structure</a>
          <a href="https://fixars.ai/">Fixars.ai</a>
          <a href="#contact">Contact</a>
        </nav>
        <a className="header-link" href="https://fixars.ai/">Open Fixars.ai <span aria-hidden="true">↗</span></a>
      </header>

      <main id="main">
        <section className="group-hero" id="top">
          <div className="hero-copy">
            <p className="overline"><span className="signal-dot" /> Corporate structure · Fixars Group</p>
            <h1>The structure behind <em>Fixars.ai</em>.</h1>
            <p className="hero-lede">Fixars Group is the internal corporate and governance umbrella. Fixars.ai is the external-facing engine room that connects the group’s products, people and intelligence.</p>
            <div className="hero-actions">
              <a className="primary-cta" href="https://fixars.ai/">Go to Fixars.ai <span aria-hidden="true">↗</span></a>
              <a className="text-cta" href="#ecosystem">See the group structure <span aria-hidden="true">↓</span></a>
            </div>
          </div>
          <div className="orbit-stage" aria-label="Fixars Group ecosystem overview">
            <div className="orbit orbit-large" />
            <div className="orbit orbit-small" />
            <div className="orbit-core"><img src="/fixars-mark.png" alt="" /><span>FIXARS<br /><small>GROUP</small></span></div>
            <div className="orbit-node node-top">Ideas</div>
            <div className="orbit-node node-right">Teams</div>
            <div className="orbit-node node-bottom">Capital</div>
            <div className="orbit-node node-left">Proof</div>
          </div>
        </section>

        <section className="ecosystem-section" id="ecosystem">
          <div className="section-intro">
            <p className="overline">THE GROUP STRUCTURE · CONNECTED THROUGH FIXARS.AI</p>
            <h2>Distinct entities. One clear route into the ecosystem.</h2>
            <p>These entities sit within the wider Fixars structure. Fixars.ai is the product-facing connector; this page explains the group, not a consumer product.</p>
          </div>
          <div className="venture-grid">
            {ventures.map((venture, index) => (
              <article className={`venture-card ${venture.tone}`} key={venture.name}>
                <div className="card-index">0{index + 1}</div>
                <p className="card-tag">{venture.tag}</p>
                <h3>{venture.name}</h3>
                <p>{venture.description}</p>
                <span className="card-arrow" aria-hidden="true">↗</span>
              </article>
            ))}
          </div>
        </section>

        <section className="labs-section" id="labs">
          <div className="labs-mark" aria-hidden="true"><span>F</span><i /><i /><i /></div>
          <div>
            <p className="overline">INTELLIGENCE LAYER · FIXARS LABS</p>
            <h2>Research that strengthens the route through Fixars.ai.</h2>
            <p>Fixars Labs is the group’s research-to-industry arm. It turns academic and market signals into practical intelligence that can strengthen the ecosystem over time.</p>
            <div className="labs-points"><span>Research</span><span>Pattern recognition</span><span>Applied models</span></div>
          </div>
        </section>

        <section className="closing-section" id="contact">
          <p className="overline">EXTERNAL-FACING ENGINE ROOM</p>
          <h2>Explore the work at Fixars.ai.</h2>
          <p className="closing-copy">Fixars.ai is where the group’s ecosystem becomes tangible for users, collaborators and partners.</p>
          <a className="primary-cta light" href="https://fixars.ai/">Visit Fixars.ai <span aria-hidden="true">↗</span></a>
        </section>
      </main>

      <footer className="group-footer">
        <a className="group-brand" href="#top"><img src="/fixars-mark.png" alt="" width="28" height="28" /><span>Fixars<span className="brand-suffix">Group</span></span></a>
        <p>One group. Many ways to make progress.</p>
        <span>© 2026 Fixars Group</span>
      </footer>
    </div>
  );
}

export default App;
