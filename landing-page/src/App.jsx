import { useRef, useState } from "react";
import {
  COURSE_FAMILIES,
  POPULAR_COURSES,
  classifyCourse,
  profileForFamily,
} from "./courseClassifier.js";

const FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSfphC9GZD2uJR6Ezv7IgX8_R7g6_JC7wOA7qeGBBVAzxBU_Dg/viewform?usp=publish-editor";

const emptyWaitlistForm = {
  firstName: "",
  email: "",
  whatsapp: "",
  university: "",
  course: "",
  microskills: "",
  consent: false,
  website: "",
};

function validateForm(details) {
  const errors = {};
  if (!details.firstName.trim()) errors.firstName = "Enter your first name.";
  if (!/^\S+@\S+\.\S+$/.test(details.email.trim())) errors.email = "Enter a valid email address.";
  if (details.whatsapp && details.whatsapp.replace(/\D/g, "").length < 7) {
    errors.whatsapp = "Enter a complete WhatsApp number or leave it blank.";
  }
  if (details.university.trim().length < 2) errors.university = "Enter your university or campus.";
  if (details.course.trim().length < 2) errors.course = "Enter your course of study.";
  if (!details.consent) errors.consent = "Please agree to the early-access data notice.";
  return errors;
}

function WaitlistForm({ details, onChange, onCourseEdit, firstInputRef }) {
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");

  function updateDetail(field, value) {
    onChange((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    if (field === "course") onCourseEdit();
  }

  async function submitWaitlist(event) {
    event.preventDefault();
    const nextErrors = validateForm(details);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      setStatus("invalid");
      return;
    }

    setStatus("submitting");
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(details),
      });
      const result = await response.json();
      if (!response.ok) {
        setErrors(result.errors || {});
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="waitlist-success" role="status">
        <span>Early access requested</span>
        <h3>You are on the list, {details.firstName.trim()}.</h3>
        <p>We will use your email to share the next pilot step when it is relevant to your campus.</p>
      </div>
    );
  }

  const errorCount = Object.values(errors).filter(Boolean).length;
  return (
    <form className="waitlist-form" onSubmit={submitWaitlist} noValidate>
      {errorCount > 0 && (
        <div className="error-summary" role="alert">
          Please check {errorCount === 1 ? "the highlighted field" : `${errorCount} highlighted fields`}.
        </div>
      )}
      <label>
        <span>First name</span>
        <input
          ref={firstInputRef}
          value={details.firstName}
          onChange={(event) => updateDetail("firstName", event.target.value)}
          autoComplete="given-name"
          aria-invalid={Boolean(errors.firstName)}
          aria-describedby={errors.firstName ? "first-name-error" : undefined}
          required
        />
        {errors.firstName && <small id="first-name-error">{errors.firstName}</small>}
      </label>
      <label>
        <span>Email</span>
        <input
          type="email"
          value={details.email}
          onChange={(event) => updateDetail("email", event.target.value)}
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          required
        />
        {errors.email && <small id="email-error">{errors.email}</small>}
      </label>
      <label>
        <span>WhatsApp <i>optional</i></span>
        <input
          type="tel"
          inputMode="tel"
          value={details.whatsapp}
          onChange={(event) => updateDetail("whatsapp", event.target.value)}
          autoComplete="tel"
          placeholder="e.g. +234 801 234 5678"
          aria-invalid={Boolean(errors.whatsapp)}
          aria-describedby={errors.whatsapp ? "whatsapp-error" : undefined}
        />
        {errors.whatsapp && <small id="whatsapp-error">{errors.whatsapp}</small>}
      </label>
      <label>
        <span>University or campus</span>
        <input
          value={details.university}
          onChange={(event) => updateDetail("university", event.target.value)}
          autoComplete="organization"
          aria-invalid={Boolean(errors.university)}
          aria-describedby={errors.university ? "university-error" : undefined}
          required
        />
        {errors.university && <small id="university-error">{errors.university}</small>}
      </label>
      <label>
        <span>Course of study</span>
        <input
          value={details.course}
          onChange={(event) => updateDetail("course", event.target.value)}
          placeholder="e.g. Computer Science"
          aria-invalid={Boolean(errors.course)}
          aria-describedby={errors.course ? "course-error" : undefined}
          required
        />
        {errors.course && <small id="course-error">{errors.course}</small>}
      </label>
      <label>
        <span>Microskills to explore <i>optional</i></span>
        <input
          value={details.microskills}
          onChange={(event) => updateDetail("microskills", event.target.value)}
          placeholder="e.g. Problem decomposition, Data reasoning"
        />
      </label>
      <label className="honeypot" aria-hidden="true">
        Website
        <input
          value={details.website}
          onChange={(event) => updateDetail("website", event.target.value)}
          tabIndex="-1"
          autoComplete="off"
        />
      </label>
      <label className="consent-field">
        <input
          type="checkbox"
          checked={details.consent}
          onChange={(event) => updateDetail("consent", event.target.checked)}
          aria-invalid={Boolean(errors.consent)}
          aria-describedby={errors.consent ? "consent-error" : "privacy-summary"}
          required
        />
        <span>I agree that Fixars may use these details to manage early access and contact me about the pilot.</span>
      </label>
      {errors.consent && <small id="consent-error" className="standalone-error">{errors.consent}</small>}
      <p id="privacy-summary" className="privacy-summary">
        We keep waitlist data for no more than 12 months, or delete it earlier when the pilot closes or you ask us to.
        Contact <a href="mailto:privacy@fixars.ai">privacy@fixars.ai</a> to withdraw.
      </p>
      <button className="submit-button" type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Confirming your place…" : "Join early access"}
      </button>
      {status === "error" && (
        <p className="form-status error" role="alert">
          We could not confirm your place. Try again, or use the{" "}
          <a href={FORM_URL} target="_blank" rel="noreferrer">secure back-up form</a>.
        </p>
      )}
    </form>
  );
}

function SkillProfile({ result, selectedSkills, onSelect, onToggleSkill, onPrefill }) {
  if (!result) {
    return (
      <div className="empty-profile">
        <img src="/fixars-mark.png" alt="" width="52" height="52" />
        <h3>Your potential skill map starts here.</h3>
        <p>Enter a course title or choose an example to see a grounded preview.</p>
      </div>
    );
  }

  if (result.status === "ambiguous") {
    return (
      <div className="match-help">
        <span className="eyebrow">A QUICK CHECK</span>
        <h3>Which area is closest?</h3>
        <p>We found more than one sensible match for “{result.course}”.</p>
        <div className="choice-list">
          {result.suggestions.map((suggestion) => (
            <button key={suggestion.id} type="button" onClick={() => onSelect(suggestion.id)}>
              {suggestion.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (result.status === "unknown") {
    return (
      <div className="match-help">
        <span className="eyebrow">HELP US PLACE IT</span>
        <h3>Choose the nearest course family</h3>
        <p>Your course remains exactly as you entered it; this choice only improves the skill preview.</p>
        <div className="family-list">
          {COURSE_FAMILIES.map((family) => (
            <button key={family.id} type="button" onClick={() => onSelect(family.id)}>{family.label}</button>
          ))}
        </div>
      </div>
    );
  }

  const groups = [
    ["Course-derived", result.skills.courseDerived],
    ["Applied", result.skills.applied],
    ["Transferable", result.skills.transferable],
  ];
  return (
    <div className="profile-result">
      <div className="preview-topline">
        <div>
          <span className="eyebrow">PROFILE PREVIEW</span>
          <h3>{result.course}</h3>
          <p>{result.families.map((family) => family.label).join(" + ")}</p>
        </div>
        <span className="emerging-tag">To verify</span>
      </div>
      <p className="preview-label">Potential skill areas to verify</p>
      <div className="skill-groups">
        {groups.map(([label, skills]) => (
          <section key={label}>
            <h4>{label}</h4>
            <div className="skill-grid">
              {skills.map((skill) => (
                <label className="microskill-card" key={skill}>
                  <input
                    type="checkbox"
                    checked={selectedSkills.includes(skill)}
                    onChange={() => onToggleSkill(skill)}
                  />
                  <span>
                    <strong>{skill}</strong>
                  </span>
                </label>
              ))}
            </div>
          </section>
        ))}
      </div>
      <p className="preview-footnote">{result.basis}</p>
      <div className="profile-actions">
        <button className="profile-join" type="button" onClick={onPrefill}>
          Prefill my profile
        </button>
        <button className="profile-secondary" type="button" onClick={onPrefill}>
          Use in waitlist form
        </button>
      </div>
    </div>
  );
}

function App() {
  const [qualification, setQualification] = useState("");
  const [result, setResult] = useState(null);
  const [details, setDetails] = useState(emptyWaitlistForm);
  const [courseEdited, setCourseEdited] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const firstInputRef = useRef(null);

  function focusJoin() {
    const joinSection = document.getElementById("join");
    joinSection?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      const firstIncomplete = [...(joinSection?.querySelectorAll("input[required]") || [])].find((input) =>
        input.type === "checkbox" ? !input.checked : !input.value.trim(),
      );
      (firstIncomplete || firstInputRef.current)?.focus();
    }, 350);
  }

  function buildProfile(event) {
    event.preventDefault();
    const nextResult = classifyCourse(qualification);
    if (nextResult.status === "empty") return;
    setResult(nextResult);
    setSelectedSkills(nextResult.status === "matched" ? Object.values(nextResult.skills).flat() : []);
    if (!courseEdited) setDetails((current) => ({ ...current, course: qualification.trim() }));
  }

  function selectFamily(familyId) {
    const nextResult = profileForFamily(familyId, qualification);
    setResult(nextResult);
    setSelectedSkills(Object.values(nextResult.skills).flat());
    if (!courseEdited) setDetails((current) => ({ ...current, course: qualification.trim() }));
  }

  function chooseCourse(course) {
    setQualification(course);
    const nextResult = classifyCourse(course);
    setResult(nextResult);
    setSelectedSkills(nextResult.status === "matched" ? Object.values(nextResult.skills).flat() : []);
    if (!courseEdited) setDetails((current) => ({ ...current, course }));
  }

  function prefillWithSkills() {
    const skillText = selectedSkills.join(", ");
    setDetails((current) => ({
      ...current,
      course: courseEdited ? current.course : qualification.trim(),
      microskills: skillText,
    }));
    focusJoin();
  }

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Fixars home">
          <img src="/fixars-mark.png" alt="" width="38" height="38" />
          <span>Fixars</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#taster">Course taster</a>
          <a href="#early-access">Early access</a>
        </nav>
        <button className="header-cta" type="button" onClick={focusJoin}>Join waitlist</button>
      </header>

      <main id="main">
        <section className="hero" id="top">
          <div className="hero-copy">
            <span className="launch-pill"><span aria-hidden="true" />Student pilot in development</span>
            <h1>Turn what you study into <em>skills you can prove.</em></h1>
            <p className="hero-intro">
              Fixars helps students translate a course of study into potential skills, gather evidence, and discover
              connected pathways across SkillsCanvas, ConceptsNexus and CollaBoard.
            </p>
            <div className="proof-list" id="how-it-works">
              <div><span>01</span><p>Map your course into skill areas worth investigating</p></div>
              <div><span>02</span><p>Add evidence that shows what you can actually do</p></div>
              <div><span>03</span><p>Explore relevant people, ideas and project pathways</p></div>
            </div>
            <div className="score-note">
              <strong>Evidence first</strong>
              <span>A suggestion is never treated as a verified skill until you support it.</span>
            </div>
          </div>

          <aside className="signup-card" id="join" aria-labelledby="signup-heading">
            <div className="signup-card-copy">
              <span className="eyebrow">EARLY ACCESS</span>
              <h2 id="signup-heading">Join the student pilot</h2>
              <p>Tell us where and what you study. We will contact you when there is a relevant next step.</p>
            </div>
            <div className="waitlist-panel">
              <WaitlistForm
                details={details}
                onChange={setDetails}
                onCourseEdit={() => setCourseEdited(true)}
                firstInputRef={firstInputRef}
              />
            </div>
          </aside>
        </section>

        <section className="taster-section" id="taster">
          <div className="section-heading">
            <span className="eyebrow">THE COURSE TASTER</span>
            <h2>See the skill areas your course could open up</h2>
            <p>Start with a course title. We will suggest areas to explore, then you decide what your evidence can support.</p>
          </div>
          <div className="taster-shell">
            <form className="taster-form" onSubmit={buildProfile}>
              <label htmlFor="qualification">What are you studying?</label>
              <div className="qualification-row">
                <input
                  id="qualification"
                  value={qualification}
                  onChange={(event) => setQualification(event.target.value)}
                  placeholder="e.g. BSc Computer Science"
                  autoComplete="off"
                />
                <button type="submit">Build preview</button>
              </div>
              <p className="field-hint">Degree awards and abbreviations are ignored when matching your course.</p>
              <div className="preset-list" aria-label="Example courses">
                {POPULAR_COURSES.map((course) => (
                  <button key={course} type="button" className={qualification === course ? "selected" : ""} onClick={() => chooseCourse(course)}>
                    {course}
                  </button>
                ))}
              </div>
            </form>
            <div className={`profile-preview ${result ? "is-ready" : ""}`} aria-live="polite">
              <SkillProfile
                result={result}
                selectedSkills={selectedSkills}
                onSelect={selectFamily}
                onToggleSkill={(skill) => setSelectedSkills((current) => current.includes(skill) ? current.filter((entry) => entry !== skill) : [...current, skill])}
                onPrefill={prefillWithSkills}
              />
            </div>
          </div>
        </section>

        <section className="early-access-section" id="early-access">
          <div>
            <span className="eyebrow">WHAT EARLY ACCESS MEANS</span>
            <h2>A focused student pilot, not a promise of a job.</h2>
          </div>
          <div className="faq-list">
            <details open>
              <summary>Who is this first pilot for?</summary>
              <p>We are starting with university students and recent graduates who want a clearer way to express and evidence their capabilities.</p>
            </details>
            <details>
              <summary>What happens after I join?</summary>
              <p>We record your campus and course, then contact you when onboarding, research or testing is relevant. Joining does not guarantee access, placement or earnings.</p>
            </details>
            <details>
              <summary>How is my waitlist data handled?</summary>
              <p>It is used for pilot planning and contact, kept for no more than 12 months, and removed earlier when the pilot closes or you withdraw through privacy@fixars.ai.</p>
            </details>
          </div>
        </section>

        <section className="closing-section">
          <div>
            <span className="eyebrow">HELP SHAPE THE PILOT</span>
            <h2>Start with the course you already know.</h2>
            <p>Join the research and early-access list for your campus.</p>
          </div>
          <button className="light-button" type="button" onClick={focusJoin}>Join early access</button>
        </section>
      </main>

      <footer>
        <a className="brand footer-brand" href="#top" aria-label="Fixars home">
          <img src="/fixars-mark.png" alt="" width="30" height="30" />
          <span>Fixars</span>
        </a>
        <p>Skills, evidence and opportunities — connected.</p>
        <button type="button" onClick={focusJoin}>Early access</button>
      </footer>
    </>
  );
}

export default App;
