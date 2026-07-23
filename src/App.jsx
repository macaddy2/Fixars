import { useEffect, useMemo, useRef, useState } from "react";

const FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSfphC9GZD2uJR6Ezv7IgX8_R7g6_JC7wOA7qeGBBVAzxBU_Dg/viewform?usp=publish-editor";
const EMBED_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSfphC9GZD2uJR6Ezv7IgX8_R7g6_JC7wOA7qeGBBVAzxBU_Dg/viewform?embedded=true";

const disciplines = {
  Economics: ["Financial modelling", "Data analysis", "Policy writing", "Market research"],
  "Computer Science": ["Frontend development", "API integration", "Testing", "Data structures"],
  "Mass Communication": ["Copywriting", "Interviewing", "Video editing", "Campaign planning"],
  "Mechanical Engineering": ["CAD modelling", "Technical drawing", "Materials testing", "Maintenance planning"],
  Law: ["Legal research", "Case briefing", "Contract review", "Policy analysis"],
  Microbiology: ["Lab safety", "Sample preparation", "Microscopy", "Culture techniques"],
};

function skillsFor(value) {
  const exact = disciplines[value];
  if (exact) return exact;

  const term = value.toLowerCase();
  if (/(comput|software|data|cyber|tech)/.test(term)) {
    return ["Problem decomposition", "Data analysis", "Technical documentation", "Testing"];
  }
  if (/(business|econom|finance|account|market)/.test(term)) {
    return ["Spreadsheet modelling", "Market research", "Presentation", "Commercial analysis"];
  }
  if (/(engineer|mechan|civil|electr|build)/.test(term)) {
    return ["Technical drawing", "Requirements analysis", "Quality checks", "Project delivery"];
  }
  if (/(media|communicat|journal|design|creative)/.test(term)) {
    return ["Story development", "Audience research", "Content production", "Campaign planning"];
  }
  if (/(law|legal|politic|policy)/.test(term)) {
    return ["Evidence review", "Structured writing", "Case research", "Stakeholder analysis"];
  }
  if (/(bio|chem|science|medical|health)/.test(term)) {
    return ["Lab practice", "Data recording", "Research review", "Technical reporting"];
  }
  return ["Research", "Structured problem-solving", "Technical writing", "Project delivery"];
}

function WaitlistModal({ onClose }) {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="waitlist-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="waitlist-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-heading">
          <div>
            <span className="eyebrow">FIXARS EARLY ACCESS</span>
            <h2 id="waitlist-title">Join the waitlist</h2>
          </div>
          <button
            ref={closeButtonRef}
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close waitlist form"
          >
            ×
          </button>
        </div>
        <iframe
          className="waitlist-frame"
          src={EMBED_URL}
          title="Fixars early access waitlist"
          loading="eager"
        />
        <p className="form-fallback">
          Form not displaying?{" "}
          <a href={FORM_URL} target="_blank" rel="noreferrer">
            Open the secure sign-up form
          </a>
          .
        </p>
      </section>
    </div>
  );
}

function App() {
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [qualification, setQualification] = useState("");
  const [profile, setProfile] = useState(null);

  const profileSkills = useMemo(() => (profile ? skillsFor(profile) : []), [profile]);

  function openWaitlist() {
    setWaitlistOpen(true);
  }

  function buildProfile(event) {
    event.preventDefault();
    const clean = qualification.trim();
    if (!clean) return;
    setProfile(clean);
  }

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Fixars home">
          <img src="/fixars-mark.png" alt="" width="38" height="38" />
          <span>Fixars</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#taster">Taster</a>
        </nav>
        <button className="header-cta" type="button" onClick={openWaitlist}>
          Join waitlist
        </button>
      </header>

      <main id="main">
        <section className="hero" id="top">
          <div className="hero-copy">
            <span className="launch-pill">
              <span aria-hidden="true" />
              Launching soon at a uni near you
            </span>
            <h1>
              Turn your degree into <em>verified skills</em> employers can check.
            </h1>
            <p className="hero-intro">
              A degree says what you studied. Fixars shows what you can actually do — verified micro-skills,
              real projects, and a reputation that travels with you. Earn before you graduate. Walk into the
              job market with receipts, not just results.
            </p>
            <div className="proof-list" id="how-it-works">
              <div>
                <span>S</span>
                <p>List micro-skills you can prove — not buzzwords</p>
              </div>
              <div>
                <span>P</span>
                <p>Earn from real paid projects while you study</p>
              </div>
              <div>
                <span>R</span>
                <p>One reputation score across everything you do</p>
              </div>
            </div>
            <div className="score-note">
              <strong>Emerging</strong>
              <span>Your score starts honest and grows with every verified skill.</span>
            </div>
          </div>

          <aside className="signup-card" aria-labelledby="signup-heading">
            <div className="card-orbit orbit-one" aria-hidden="true" />
            <div className="card-orbit orbit-two" aria-hidden="true" />
            <span className="eyebrow">EARLY ACCESS</span>
            <h2 id="signup-heading">Get early access</h2>
            <p>Be first in when the pilot opens on your campus.</p>
            <div className="field-preview" aria-hidden="true">
              <div><span>First name</span><i /></div>
              <div><span>Email or phone</span><i /></div>
              <div><span>University</span><i /></div>
              <div><span>Discipline</span><i /></div>
            </div>
            <button className="primary-button" type="button" onClick={openWaitlist}>
              Join the waitlist <span aria-hidden="true">→</span>
            </button>
            <p className="privacy-note">No spam. One message when your campus goes live.</p>
          </aside>
        </section>

        <section className="taster-section" id="taster">
          <div className="section-heading">
            <span className="eyebrow">THE 20-SECOND TASTER</span>
            <h2>See your profile before it exists</h2>
            <p>
              This is the real first step of Fixars onboarding. Pick what you study, pick what you can
              actually do — and watch a verifiable profile appear.
            </p>
          </div>

          <div className="taster-shell">
            <form className="taster-form" onSubmit={buildProfile}>
              <label htmlFor="qualification">What are you studying?</label>
              <div className="qualification-row">
                <input
                  id="qualification"
                  value={qualification}
                  onChange={(event) => setQualification(event.target.value)}
                  placeholder="e.g. Economics"
                  autoComplete="off"
                />
                <button type="submit">Break it down</button>
              </div>
              <div className="preset-list" aria-label="Example disciplines">
                {Object.keys(disciplines).map((discipline) => (
                  <button
                    key={discipline}
                    type="button"
                    className={qualification === discipline ? "selected" : ""}
                    onClick={() => {
                      setQualification(discipline);
                      setProfile(discipline);
                    }}
                  >
                    {discipline}
                  </button>
                ))}
              </div>
            </form>

            <div className={`profile-preview ${profile ? "is-ready" : ""}`} aria-live="polite">
              {!profile ? (
                <div className="empty-profile">
                  <div className="profile-spark" aria-hidden="true">✦</div>
                  <h3>Your micro-skill map starts here.</h3>
                  <p>Type your qualification or pick a discipline to see a grounded profile preview.</p>
                </div>
              ) : (
                <>
                  <div className="preview-topline">
                    <div>
                      <span className="eyebrow">PROFILE PREVIEW</span>
                      <h3>{profile}</h3>
                    </div>
                    <span className="emerging-tag">Emerging</span>
                  </div>
                  <p className="preview-label">Micro-skills to verify</p>
                  <div className="skill-grid">
                    {profileSkills.map((skill, index) => (
                      <div key={skill} style={{ "--delay": `${index * 70}ms` }}>
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        {skill}
                      </div>
                    ))}
                  </div>
                  <p className="preview-footnote">A preview only — your real profile grows through evidence and verification.</p>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="closing-section">
          <div>
            <span className="eyebrow">YOUR NEXT MOVE</span>
            <h2>Get in before your campus does.</h2>
            <p>Launching soon at a uni near you. No placement promises — just receipts.</p>
          </div>
          <button className="light-button" type="button" onClick={openWaitlist}>
            Join the waitlist <span aria-hidden="true">→</span>
          </button>
        </section>
      </main>

      <footer>
        <a className="brand footer-brand" href="#top" aria-label="Fixars home">
          <img src="/fixars-mark.png" alt="" width="30" height="30" />
          <span>Fixars</span>
        </a>
        <p>One account. One wallet. One reputation.</p>
        <button type="button" onClick={openWaitlist}>Early access</button>
      </footer>

      {waitlistOpen && <WaitlistModal onClose={() => setWaitlistOpen(false)} />}
    </>
  );
}

export default App;
