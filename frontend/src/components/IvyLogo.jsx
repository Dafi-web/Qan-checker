import { Link } from 'react-router-dom';
import { useId } from 'react';

export default function IvyLogo({ to = '/', size = 'md', showText = true }) {
  const gradId = useId().replace(/:/g, '');
  const markSize = size === 'lg' ? 42 : size === 'sm' ? 28 : 34;

  const inner = (
    <>
      <svg
        className="ivy-mark"
        width={markSize}
        height={markSize}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <rect width="48" height="48" rx="12" fill={`url(#${gradId})`} />
        <path
          d="M24 10c-2.8 5.2-4.2 9.4-4.2 14.2 0 4.4 1.6 7.8 4.2 10.8 2.6-3 4.2-6.4 4.2-10.8C28.2 19.4 26.8 15.2 24 10Z"
          fill="#062015"
          fillOpacity="0.92"
        />
        <path
          d="M24 18.5c1.4 2.4 2.1 4.4 2.1 6.6 0 2.1-.7 3.7-2.1 5.2-1.4-1.5-2.1-3.1-2.1-5.2 0-2.2.7-4.2 2.1-6.6Z"
          fill="#8ef0bf"
        />
        <defs>
          <linearGradient id={gradId} x1="8" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3DD68C" />
            <stop offset="1" stopColor="#1F9B63" />
          </linearGradient>
        </defs>
      </svg>
      {showText && (
        <span className={`ivy-wordmark ivy-wordmark-${size}`}>
          <span className="ivy-name">Ivy Technology</span>
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

  return <div className="ivy-logo">{inner}</div>;
}
