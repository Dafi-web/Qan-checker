import IvyLogo from './IvyLogo';

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <IvyLogo to="/" size="sm" showProduct={false} />
        <div className="site-footer-text">
          <p className="site-footer-brand">Ivy Technology</p>
          <p className="site-footer-copy">
            © {year} Ivy Technology. Serial verification for shipping teams.
          </p>
        </div>
      </div>
    </footer>
  );
}
