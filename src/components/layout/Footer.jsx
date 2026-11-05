import { Link } from "react-router-dom";
import { BRAND, footer as footerCopy } from "../../lib/copy";

export default function Footer() {
  return (
    <footer className="bg-kijiji-mid border-t border-white/10 py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
        <div>
          <h3 className="font-serif text-2xl text-kijiji-text mb-2">{BRAND.name}</h3>
          <p className="text-sm text-muted">{footerCopy.tagline}</p>
        </div>
        <div>
          <h4 className="font-medium text-kijiji-text mb-3">{footerCopy.discover}</h4>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link to="/discover">{footerCopy.links.findExperiences}</Link></li>
            <li><Link to="/results">{footerCopy.links.forYou}</Link></li>
            <li><Link to="/favorites">{footerCopy.links.collection}</Link></li>
            <li><Link to="/itineraries">{footerCopy.links.dayPlans}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-medium text-kijiji-text mb-3">{footerCopy.about}</h4>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link to="/onboarding">{footerCopy.ourStory}</Link></li>
            <li><Link to="/auth">Sign in</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-medium text-kijiji-text mb-3">{footerCopy.newsletterTitle}</h4>
          <div className="flex gap-2">
            <input placeholder={footerCopy.newsletterPlaceholder} className="flex-1 text-sm" />
            <button type="button" className="btn-primary text-sm px-4">{footerCopy.newsletterCta}</button>
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-muted mt-8">{BRAND.copyright(new Date().getFullYear())}</p>
    </footer>
  );
}
