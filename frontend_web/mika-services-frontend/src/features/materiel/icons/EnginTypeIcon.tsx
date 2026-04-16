/**
 * Icônes SVG pour chaque TypeEngin.
 * Silhouettes reconnaissables instantanément, monochromes,
 * stylées via className (fill-current ou stroke-current).
 */

import React from 'react';

interface Props {
  type: string;
  className?: string;
  size?: number;
}

const EnginTypeIcon: React.FC<Props> = ({ type, className = 'w-5 h-5', size }) => {
  const style = size ? { width: size, height: size } : undefined;

  switch (type) {
    case 'PELLETEUSE':
      return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 20h4l2-6h4l4-8h4v4l-3 10H2z" />
          <circle cx="5" cy="20" r="1.5" />
          <circle cx="15" cy="20" r="1.5" />
          <path d="M16 6l4-4" />
        </svg>
      );

    case 'BULLDOZER':
      return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="8" width="14" height="6" rx="1" />
          <rect x="4" y="16" width="16" height="3" rx="1.5" />
          <path d="M2 10v6h3" />
          <path d="M8 8V5h8v3" />
        </svg>
      );

    case 'NIVELEUSE':
      return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 18l5-6h6l2-4h6v4h2v6H1z" />
          <circle cx="5" cy="19" r="1.5" />
          <circle cx="19" cy="19" r="1.5" />
          <line x1="6" y1="12" x2="2" y2="16" />
        </svg>
      );

    case 'COMPACTEUR':
      return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="7" y="6" width="10" height="7" rx="1" />
          <circle cx="7" cy="18" r="3" />
          <circle cx="17" cy="18" r="3" />
          <path d="M10 13v2h4v-2" />
        </svg>
      );

    case 'CAMION_BENNE':
      return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 14V8h5v6" />
          <path d="M7 8h12l2 6H7z" />
          <line x1="2" y1="14" x2="21" y2="14" />
          <rect x="2" y="14" width="19" height="3" rx="0.5" />
          <circle cx="6" cy="19" r="1.5" />
          <circle cx="17" cy="19" r="1.5" />
        </svg>
      );

    case 'CAMION_CITERNE':
      return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 14V8h5v6" />
          <ellipse cx="14" cy="11" rx="7" ry="3" />
          <line x1="2" y1="14" x2="21" y2="14" />
          <rect x="2" y="14" width="19" height="3" rx="0.5" />
          <circle cx="6" cy="19" r="1.5" />
          <circle cx="17" cy="19" r="1.5" />
        </svg>
      );

    case 'GRUE':
      return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="22" x2="12" y2="4" />
          <line x1="12" y1="4" x2="22" y2="4" />
          <line x1="22" y1="4" x2="22" y2="8" />
          <line x1="12" y1="4" x2="4" y2="10" />
          <rect x="9" y="20" width="6" height="2" />
          <path d="M8 22h8" />
        </svg>
      );

    case 'CHARGEUSE':
      return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="8" width="12" height="6" rx="1" />
          <path d="M6 11H2v5h4" />
          <circle cx="8" cy="18" r="2" />
          <circle cx="16" cy="18" r="2" />
          <path d="M2 11V8" />
        </svg>
      );

    case 'RETROCHARGEUSE':
      return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="8" width="10" height="6" rx="1" />
          <path d="M6 11H3v4h3" />
          <path d="M16 8l3-4 2 1-2 5" />
          <circle cx="8" cy="18" r="2" />
          <circle cx="14" cy="18" r="2" />
        </svg>
      );

    case 'BETONNIERE':
      return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 14V8h5v6" />
          <ellipse cx="14" cy="10" rx="5" ry="4" transform="rotate(-15 14 10)" />
          <rect x="2" y="14" width="17" height="3" rx="0.5" />
          <circle cx="6" cy="19" r="1.5" />
          <circle cx="15" cy="19" r="1.5" />
        </svg>
      );

    case 'POMPE':
      return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="10" width="8" height="8" rx="1" />
          <path d="M12 12h6v4h-6" />
          <path d="M18 12v-4l3-2" />
          <circle cx="7" cy="20" r="1.5" />
          <circle cx="15" cy="20" r="1.5" />
        </svg>
      );

    case 'FOREUSE':
      return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="7" y="10" width="10" height="8" rx="1" />
          <line x1="12" y1="2" x2="12" y2="10" />
          <path d="M10 2h4" />
          <circle cx="9" cy="20" r="1.5" />
          <circle cx="15" cy="20" r="1.5" />
        </svg>
      );

    case 'GROUPE_ELECTROGENE':
      return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M13 9l-3 4h4l-3 4" />
          <line x1="3" y1="18" x2="3" y2="21" />
          <line x1="21" y1="18" x2="21" y2="21" />
        </svg>
      );

    case 'CONCASSEUR':
      return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6h16v4H4z" />
          <path d="M6 10l2 8h8l2-8" />
          <path d="M9 6V3h6v3" />
          <path d="M10 14h4" />
        </svg>
      );

    case 'FINISSEUR':
      return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="10" width="14" height="6" rx="1" />
          <path d="M16 12h5v4h-5" />
          <rect x="1" y="16" width="22" height="2" rx="0.5" />
          <circle cx="6" cy="20" r="1.5" />
          <circle cx="18" cy="20" r="1.5" />
        </svg>
      );

    /* AUTRE — icône générique engrenage */
    default:
      return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
        </svg>
      );
  }
};

export default EnginTypeIcon;
