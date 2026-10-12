import { footer, navItems, site, socialLinks } from "../config/site";
import { scrollToSection } from "../animations/scrollAnimations";

export default function Footer() {
  const configured = socialLinks.filter((link) => link.href.trim() !== "");

  return (
    <footer className="site-footer">
      <div className="shell site-footer-inner">
        <button
          type="button"
          className="site-footer-wordmark"
          onClick={() => scrollToSection("hero")}
          aria-label={`${site.name} — back to top`}
        >
          {site.name}
          <span className="label">{site.tagline}</span>
        </button>

        <nav aria-label="Footer" className="site-footer-nav">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className="label"
              onClick={(event) => {
                event.preventDefault();
                scrollToSection(item.id);
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="site-footer-social">
          <p className="label">Channels</p>
          {configured.length > 0 ? (
            <ul>
              {configured.map((link) => (
                <li key={link.label}>
                  <a href={link.href} target="_blank" rel="noreferrer noopener" className="label">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="site-footer-placeholder">
              Not configured — add verified accounts in src/config/site.ts before publishing.
            </p>
          )}
        </div>
      </div>

      <hr className="hairline" />

      <div className="shell site-footer-base">
        <p className="label">{footer.note}</p>
        <p className="label">{footer.builtWith}</p>
      </div>
    </footer>
  );
}
