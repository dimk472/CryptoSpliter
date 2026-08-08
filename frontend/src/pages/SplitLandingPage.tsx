import { Link, Navigate, useParams } from "react-router-dom";
import SeoHead from "../components/seo/SeoHead";
import { getSplitPage, getSplitPageSeo, SPLIT_PAGES } from "../seo/splitPages";
import logo from "../assets/logo.png";
import "../components/styles/SplitLanding.css";

export default function SplitLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const page = slug ? getSplitPage(slug) : undefined;
  const seo = slug ? getSplitPageSeo(slug) : undefined;

  if (!page || !seo) {
    return <Navigate to="/" replace />;
  }

  const relatedPages = page.relatedSlugs
    .map((relatedSlug) => SPLIT_PAGES[relatedSlug])
    .filter(Boolean);

  return (
    <>
      <SeoHead {...seo} />

      <div className="split-landing">
        <header className="split-landing-header">
          <Link to="/" className="split-landing-logo">
            <img src={logo} alt="CryptoSplitter" />
          </Link>
          <Link to="/" className="split-landing-cta-header">
            Open app
          </Link>
        </header>

        <main className="split-landing-main">
          <nav className="split-landing-breadcrumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Split {page.label}</span>
          </nav>

          <section className="split-landing-hero">
            <span className="split-landing-badge">
              {page.kind === "chain" ? "Network" : page.kind === "token" ? "Token" : "Use Case"} · {page.label}
            </span>
            <h1 className="split-landing-title">{page.headline}</h1>
            <p className="split-landing-subtitle">{page.subheadline}</p>
            <p className="split-landing-intro">{page.intro}</p>
            <Link to="/" className="split-landing-cta">
              Start splitting on {page.label}
            </Link>
          </section>

          <section className="split-landing-section">
            <h2 className="split-landing-heading">Why use CryptoSplitter for {page.label}?</h2>
            <ul className="split-landing-benefits">
              {page.benefits.map((benefit) => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>
          </section>

          <section className="split-landing-section">
            <h2 className="split-landing-heading">How it works</h2>
            <ol className="split-landing-steps">
              {page.steps.map((step, index) => (
                <li key={step}>
                  <span className="split-landing-step-num">{index + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="split-landing-section">
            <h2 className="split-landing-heading">Frequently asked questions</h2>
            <dl className="split-landing-faq">
              {page.faqs.map((faq) => (
                <div key={faq.question} className="split-landing-faq-item">
                  <dt>{faq.question}</dt>
                  <dd>{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </section>

          {relatedPages.length > 0 && (
            <section className="split-landing-section">
              <h2 className="split-landing-heading">Related</h2>
              <nav className="split-landing-related" aria-label="Related split pages">
                {relatedPages.map((related) => (
                  <Link
                    key={related.slug}
                    to={`/split-${related.slug}`}
                    className="split-landing-related-link"
                  >
                    {related.kind === "chain"
                      ? `Split on ${related.label}`
                      : `Split ${related.label}`}
                  </Link>
                ))}
              </nav>
            </section>
          )}
        </main>

        <footer className="split-landing-footer">
          <p>© {new Date().getFullYear()} CryptoSplitter</p>
          <nav className="split-landing-footer-nav">
            <Link to="/">Home</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
          </nav>
        </footer>
      </div>
    </>
  );
}
