/**
 * Icônes SVG de l'app terrain — style identique au web :
 * stroke-based 24x24, stroke="currentColor", strokeWidth 1.5-2, round caps. Zéro emoji.
 */
import type React from 'react'

type IconProps = { size?: number; strokeWidth?: number; style?: React.CSSProperties }

function Svg({ size = 24, strokeWidth = 1.8, style, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }} aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export const IconScan = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
    <path d="M4 12h16" />
  </Svg>
)

export const IconDownload = (p: IconProps) => (
  <Svg {...p}>
    <path d="M21 15v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3" />
    <path d="M7 10l5 5 5-5M12 15V3" />
  </Svg>
)

export const IconCloudOff = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6.67 8.02A6 6 0 0 1 17.92 10a4.5 4.5 0 0 1 2.79 7.4M7 18a5 5 0 0 1-2.4-9.38" />
    <path d="M3 3l18 18" />
  </Svg>
)

export const IconUser = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-6.5 8-6.5S20 17 20 21" />
  </Svg>
)

export const IconLogout = (p: IconProps) => (
  <Svg {...p}>
    <path d="M15 4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8" />
    <path d="M11 12h9M17 8.5 20.5 12 17 15.5" />
  </Svg>
)

export const IconShield = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3l7 3v5c0 4.6-3 8.4-7 9.9C8 19.4 5 15.6 5 11V6l7-3z" />
  </Svg>
)

export const IconKey = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="8" cy="14" r="4" />
    <path d="M11 11 20 2M16.5 5.5 19 8M13.5 8.5 16 11" />
  </Svg>
)

export const IconMail = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3.5 7 12 13l8.5-6" />
  </Svg>
)

export const IconPhone = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5.5 4h3l1.5 4-2 1.5a12.5 12.5 0 0 0 6.5 6.5L16 14l4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 3.5 6.2 2 2 0 0 1 5.5 4z" />
  </Svg>
)

export const IconMonitor = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="13" rx="2" />
    <path d="M9 21h6M12 17v4" />
  </Svg>
)

export const IconBriefcase = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="8" width="18" height="12" rx="2" />
    <path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" />
  </Svg>
)

export const IconChevronLeft = (p: IconProps) => (
  <Svg {...p}><path d="M15 6l-6 6 6 6" /></Svg>
)

export const IconChevronRight = (p: IconProps) => (
  <Svg {...p}><path d="M9 6l6 6-6 6" /></Svg>
)

export const IconCheck = (p: IconProps) => (
  <Svg {...p}><path d="M5 13l4 4L19 7" /></Svg>
)

export const IconX = (p: IconProps) => (
  <Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>
)

export const IconAlert = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3.5 2.8 19.5a1 1 0 0 0 .9 1.5h16.6a1 1 0 0 0 .9-1.5L12 3.5z" />
    <path d="M12 10v4M12 17.5v.5" />
  </Svg>
)

export const IconClipboard = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 2.5h6v3H9zM9 11l2 2 4-4" />
  </Svg>
)

export const IconGauge = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4.5 19a9 9 0 1 1 15 0" />
    <path d="M12 13l3.5-4.5" />
    <circle cx="12" cy="14" r="1.6" />
  </Svg>
)

export const IconFuel = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 21V6a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v15" />
    <path d="M3 21h11M5.5 9h6M13 12h2a2 2 0 0 1 2 2v3.5a1.5 1.5 0 0 0 3 0V9.5L18.5 7" />
  </Svg>
)

export const IconTransfer = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7h13M14 3.5 17.5 7 14 10.5" />
    <path d="M20 17H7M10 13.5 6.5 17l3.5 3.5" />
  </Svg>
)

export const IconBox = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3 3.5 7.5v9L12 21l8.5-4.5v-9L12 3z" />
    <path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" />
  </Svg>
)

export const IconBell = (p: IconProps) => (
  <Svg {...p}>
    <path d="M18 16H6c1.2-1.2 1.5-2.6 1.5-5a4.5 4.5 0 0 1 9 0c0 2.4.3 3.8 1.5 5z" />
    <path d="M10 19a2 2 0 0 0 4 0" />
  </Svg>
)

export const IconPin = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </Svg>
)

export const IconCamera = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 8h3l1.5-2.5h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
    <circle cx="12" cy="13.5" r="3.5" />
  </Svg>
)

export const IconPen = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 20h4L20 8a2.1 2.1 0 0 0-3-3L5 17v3zM14.5 6.5l3 3" />
  </Svg>
)

export const IconSync = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 11a8 8 0 0 0-14.5-3.5M4 13a8 8 0 0 0 14.5 3.5" />
    <path d="M20 4v4h-4M4 20v-4h4" />
  </Svg>
)

export const IconHome = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1v-9.5z" />
  </Svg>
)

export const IconWrench = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14.5 6.5a4 4 0 0 0-5.4 4.9L3.5 17a2.1 2.1 0 0 0 3 3l5.6-5.6a4 4 0 0 0 4.9-5.4l-2.8 2.8-2.5-2.5 2.8-2.8z" />
  </Svg>
)

export const IconTruck = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.5 6h11v10h-11zM13.5 9.5H18l3 3.5v3h-7.5" />
    <circle cx="6.5" cy="17.5" r="1.8" />
    <circle cx="17" cy="17.5" r="1.8" />
  </Svg>
)

export const IconFlash = (p: IconProps) => (
  <Svg {...p}><path d="M13 2 5 13.5h5L10.5 22l8-11.5h-5L13 2z" /></Svg>
)

export const IconKeyboard = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2.5" y="7" width="19" height="11" rx="2" />
    <path d="M6 10.5h.01M9.5 10.5h.01M13 10.5h.01M16.5 10.5h.01M7 14.5h10" />
  </Svg>
)

export const IconDroplet = (p: IconProps) => (
  <Svg {...p}><path d="M12 3s6 6.3 6 11a6 6 0 0 1-12 0c0-4.7 6-11 6-11z" /></Svg>
)

export const IconCog = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2.8v2.4M12 18.8v2.4M4.1 7.4l2.1 1.2M17.8 15.4l2.1 1.2M4.1 16.6l2.1-1.2M17.8 8.6l2.1-1.2M12 2.8v2.4" />
  </Svg>
)

export const IconSearch = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M15.8 15.8 21 21" />
  </Svg>
)

export const IconMore = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="5.5" r="1" fill="currentColor" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
    <circle cx="12" cy="18.5" r="1" fill="currentColor" />
  </Svg>
)

export const IconPlus = (p: IconProps) => (
  <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>
)

export const IconEye = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
)

export const IconEyeOff = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4.5 8.2A16 16 0 0 0 2.5 12S6 18.5 12 18.5c1.5 0 2.85-.4 4.03-1M9.5 5.9A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16.4 16.4 0 0 1-2.1 2.9" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    <path d="M3 3l18 18" />
  </Svg>
)

export const IconClock = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
)
