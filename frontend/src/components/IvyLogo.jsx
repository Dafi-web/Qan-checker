import { Link } from 'react-router-dom';

export default function IvyLogo({ to = '/', size = 'md', showProduct = true }) {
  const markSize = size === 'lg' ? 72 : size === 'sm' ? 40 : 52;

  const inner = (
    <>
      <img
        className={`ivy-mark ivy-mark-${size}`}
        src="/ivy-logo.png"
        alt="Ivy Technology"
        width={markSize}
        height={markSize}
        decoding="async"
      />
      {showProduct && (
        <span className={`ivy-wordmark ivy-wordmark-${size}`}>
          <span className="ivy-product">QAN Checker</span>
        </span>
      )}
    </>
  );

  if (to) {
    return (
      <Link className="ivy-logo" to={to} aria-label="Ivy Technology — QAN Checker">
        {inner}
      </Link>
    );
  }

  return (
    <div className="ivy-logo" role="img" aria-label="Ivy Technology">
      {inner}
    </div>
  );
}
