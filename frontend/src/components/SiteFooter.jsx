import IvyLogo from './IvyLogo';

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <IvyLogo to="/" size="sm" />
        <p className="site-footer-copy">
          © {year} Ivy Technology. Serial verification for shipping teams.
        </p>
      </div>
    </footer>
  );
}
