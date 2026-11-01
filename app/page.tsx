import ContactForm from "@/app/components/contact-form";

const coachingPoints = [
  {
    number: "01",
    title: "A plan that fits you",
    copy: "Training built around your experience, your schedule, and the strength goals you care about.",
  },
  {
    number: "02",
    title: "Coaching that stays personal",
    copy: "Clear guidance, thoughtful adjustments, and support that meets you where you are.",
  },
  {
    number: "03",
    title: "Progress you can own",
    copy: "Build consistency, learn good movement, and get stronger one focused session at a time.",
  },
];

export default function Home() {
  return (
    <main>
      <header className="topbar">
        <a className="wordmark" href="#home" aria-label="Coached by Dre home">
          <span className="wordmark-icon" aria-hidden="true">D</span>
          <span>COACHED <span className="wordmark-muted">BY</span> DRE</span>
        </a>
        <nav className="nav-links" aria-label="Main navigation">
          <a href="#coaching">The approach</a>
          <a className="nav-cta" href="#contact">Let&apos;s talk <span aria-hidden="true">↗</span></a>
        </nav>
      </header>

      <section className="hero" id="home">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-mark" /> STRENGTH COACHING, MADE PERSONAL</p>
          <h1>Stronger is<br />built <span>together.</span></h1>
          <p className="hero-description">
            Real coaching. A plan that makes sense for your life. Progress you
            can feel in and out of the gym.
          </p>
          <a className="primary-button" href="#contact">Start a conversation <span aria-hidden="true">↗</span></a>
          <div className="hero-note">
            <span className="note-line" />
            <p>YOUR GOALS. YOUR PACE. YOUR STRONGER.</p>
          </div>
        </div>

        <div className="hero-art" role="img" aria-label="Strength begins with showing up">
          <div className="art-grain" />
          <div className="art-outline art-outline-one" />
          <div className="art-outline art-outline-two" />
          <div className="art-label">THE WORK<br />IS YOURS.</div>
          <div className="art-index">CB / DRE&nbsp;&nbsp;—&nbsp;&nbsp;01</div>
          <div className="art-bottom">
            <span>SHOW UP</span>
            <span className="art-bottom-mark">✳</span>
            <span>GET STRONGER</span>
          </div>
        </div>
      </section>

      <section className="approach" id="coaching">
        <div className="section-heading">
          <p className="eyebrow">HOW WE GET THERE</p>
          <h2>Good coaching<br />changes <span>everything.</span></h2>
        </div>
        <div className="coaching-points">
          {coachingPoints.map((point) => (
            <article className="coaching-point" key={point.number}>
              <span className="point-number">{point.number}</span>
              <div>
                <h3>{point.title}</h3>
                <p>{point.copy}</p>
              </div>
              <span className="point-arrow" aria-hidden="true">↗</span>
            </article>
          ))}
        </div>
      </section>

      <section className="contact-section" id="contact">
        <div className="contact-copy">
          <p className="eyebrow"><span className="eyebrow-mark" /> YOUR NEXT REP STARTS HERE</p>
          <h2>Tell me what<br />you&apos;re working <span>toward.</span></h2>
          <p className="contact-description">
            Share a little about your goals. I&apos;ll get back to you personally
            and we can figure out the right next step.
          </p>
          <a className="email-link" href="mailto:dre.miller3489@gmail.com">
            dre.miller3489@gmail.com <span aria-hidden="true">↗</span>
          </a>
        </div>
        <ContactForm />
      </section>

      <footer className="footer">
        <a className="wordmark footer-mark" href="#home">
          <span className="wordmark-icon" aria-hidden="true">D</span>
          <span>COACHED <span className="wordmark-muted">BY</span> DRE</span>
        </a>
        <p>STRONGER, ONE SESSION AT A TIME.</p>
        <span>© {new Date().getFullYear()} COACHED BY DRE</span>
      </footer>
    </main>
  );
}
