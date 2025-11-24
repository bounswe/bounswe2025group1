import React from 'react';

// Welcome & Onboarding
export const TinySprout = ({ size = 80, earned = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: earned ? 1 : 0.3, filter: earned ? 'none' : 'grayscale(100%)' }}>
    <circle cx="50" cy="50" r="45" fill="#E8F5E9" stroke="#66BB6A" strokeWidth="2"/>
    <path d="M50 65 Q45 55 45 45 Q45 35 50 30 Q55 35 55 45 Q55 55 50 65Z" fill="#81C784"/>
    <path d="M50 60 Q52 55 54 50 Q56 45 60 42" stroke="#66BB6A" strokeWidth="2" fill="none"/>
    <circle cx="50" cy="68" r="8" fill="#5D4037"/>
  </svg>
);

// Garden Creation
export const SeedPlanter = ({ size = 80, earned = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: earned ? 1 : 0.3, filter: earned ? 'none' : 'grayscale(100%)' }}>
    <circle cx="50" cy="50" r="45" fill="#F1F8E9" stroke="#9CCC65" strokeWidth="2"/>
    <circle cx="50" cy="50" r="6" fill="#6D4C41"/>
    <path d="M45 50 L40 55 L35 52" stroke="#8D6E63" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M55 50 L60 55 L65 52" stroke="#8D6E63" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M50 44 Q48 38 46 35" stroke="#7CB342" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
  </svg>
);

export const UrbanGardener = ({ size = 80, earned = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: earned ? 1 : 0.3, filter: earned ? 'none' : 'grayscale(100%)' }}>
    <circle cx="50" cy="50" r="45" fill="#DCEDC8" stroke="#7CB342" strokeWidth="2"/>
    <rect x="35" y="55" width="12" height="18" fill="#8D6E63" rx="1"/>
    <rect x="53" y="55" width="12" height="18" fill="#8D6E63" rx="1"/>
    <circle cx="41" cy="48" r="8" fill="#66BB6A"/>
    <circle cx="59" cy="48" r="8" fill="#66BB6A"/>
    <path d="M41 40 Q41 35 43 32" stroke="#558B2F" strokeWidth="2" fill="none"/>
    <path d="M59 40 Q59 35 57 32" stroke="#558B2F" strokeWidth="2" fill="none"/>
    <rect x="25" y="25" width="50" height="3" fill="#90A4AE"/>
  </svg>
);

// Forum Posts
export const TalkativeTulip = ({ size = 80, earned = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: earned ? 1 : 0.3, filter: earned ? 'none' : 'grayscale(100%)' }}>
    <circle cx="50" cy="50" r="45" fill="#FCE4EC" stroke="#EC407A" strokeWidth="2"/>
    <ellipse cx="50" cy="35" rx="8" ry="12" fill="#F06292"/>
    <ellipse cx="42" cy="38" rx="6" ry="10" fill="#EC407A"/>
    <ellipse cx="58" cy="38" rx="6" ry="10" fill="#EC407A"/>
    <path d="M50 48 Q48 65 48 70" stroke="#558B2F" strokeWidth="3" fill="none"/>
  </svg>
);

export const FriendlyFern = ({ size = 80, earned = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: earned ? 1 : 0.3, filter: earned ? 'none' : 'grayscale(100%)' }}>
    <circle cx="50" cy="50" r="45" fill="#E0F2F1" stroke="#26A69A" strokeWidth="2"/>
    <path d="M50 70 Q50 50 50 30" stroke="#00897B" strokeWidth="3" fill="none"/>
    <path d="M50 35 Q45 38 42 36" stroke="#26A69A" strokeWidth="2" fill="none"/>
    <path d="M50 35 Q55 38 58 36" stroke="#26A69A" strokeWidth="2" fill="none"/>
    <path d="M50 45 Q45 48 42 46" stroke="#26A69A" strokeWidth="2" fill="none"/>
    <path d="M50 45 Q55 48 58 46" stroke="#26A69A" strokeWidth="2" fill="none"/>
    <path d="M50 55 Q45 58 42 56" stroke="#26A69A" strokeWidth="2" fill="none"/>
    <path d="M50 55 Q55 58 58 56" stroke="#26A69A" strokeWidth="2" fill="none"/>
  </svg>
);

export const VoiceOfTheGarden = ({ size = 80, earned = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: earned ? 1 : 0.3, filter: earned ? 'none' : 'grayscale(100%)' }}>
    <circle cx="50" cy="50" r="45" fill="#E1F5FE" stroke="#0288D1" strokeWidth="3"/>
    <path d="M50 70 Q48 55 48 40" stroke="#00796B" strokeWidth="4" fill="none"/>
    <circle cx="50" cy="32" r="10" fill="#26A69A"/>
    <circle cx="42" cy="36" r="8" fill="#4DB6AC"/>
    <circle cx="58" cy="36" r="8" fill="#4DB6AC"/>
    <circle cx="36" cy="42" r="6" fill="#80CBC4"/>
    <circle cx="64" cy="42" r="6" fill="#80CBC4"/>
    <path d="M30 20 Q35 25 40 22" stroke="#FFD54F" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M70 20 Q65 25 60 22" stroke="#FFD54F" strokeWidth="2" fill="none" strokeLinecap="round"/>
  </svg>
);

// Forum Answers
export const HelpfulSeedling = ({ size = 80, earned = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: earned ? 1 : 0.3, filter: earned ? 'none' : 'grayscale(100%)' }}>
    <circle cx="50" cy="50" r="45" fill="#FFF3E0" stroke="#FF9800" strokeWidth="2"/>
    <path d="M50 65 Q48 55 48 50 Q48 45 50 40" stroke="#689F38" strokeWidth="2.5" fill="none"/>
    <ellipse cx="48" cy="38" rx="5" ry="7" fill="#8BC34A"/>
    <ellipse cx="52" cy="36" rx="4" ry="6" fill="#7CB342"/>
    <circle cx="50" cy="68" r="6" fill="#5D4037"/>
  </svg>
);

export const SupportiveStem = ({ size = 80, earned = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: earned ? 1 : 0.3, filter: earned ? 'none' : 'grayscale(100%)' }}>
    <circle cx="50" cy="50" r="45" fill="#FFF8E1" stroke="#FFA726" strokeWidth="2"/>
    <path d="M50 70 L50 30" stroke="#558B2F" strokeWidth="4" fill="none"/>
    <ellipse cx="50" cy="28" rx="8" ry="4" fill="#7CB342"/>
    <path d="M50 50 Q60 48 65 50" stroke="#558B2F" strokeWidth="3" fill="none"/>
    <ellipse cx="67" cy="50" rx="5" ry="3" fill="#8BC34A"/>
    <path d="M50 40 Q40 38 35 40" stroke="#558B2F" strokeWidth="3" fill="none"/>
    <ellipse cx="33" cy="40" rx="5" ry="3" fill="#8BC34A"/>
  </svg>
);

export const WiseWillow = ({ size = 80, earned = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: earned ? 1 : 0.3, filter: earned ? 'none' : 'grayscale(100%)' }}>
    <circle cx="50" cy="50" r="45" fill="#E8EAF6" stroke="#5C6BC0" strokeWidth="3"/>
    <path d="M50 70 L50 35" stroke="#4E342E" strokeWidth="5" fill="none"/>
    <path d="M40 40 Q35 50 38 60" stroke="#7CB342" strokeWidth="2.5" fill="none"/>
    <path d="M60 40 Q65 50 62 60" stroke="#7CB342" strokeWidth="2.5" fill="none"/>
    <path d="M45 35 Q40 45 42 55" stroke="#689F38" strokeWidth="2.5" fill="none"/>
    <path d="M55 35 Q60 45 58 55" stroke="#689F38" strokeWidth="2.5" fill="none"/>
    <path d="M50 30 Q45 40 46 50" stroke="#558B2F" strokeWidth="2.5" fill="none"/>
    <path d="M50 30 Q55 40 54 50" stroke="#558B2F" strokeWidth="2.5" fill="none"/>
  </svg>
);

// Task Creation
export const TinyToolbelt = ({ size = 80, earned = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: earned ? 1 : 0.3, filter: earned ? 'none' : 'grayscale(100%)' }}>
    <circle cx="50" cy="50" r="45" fill="#EFEBE9" stroke="#8D6E63" strokeWidth="2"/>
    <rect x="42" y="45" width="16" height="20" fill="#A1887F" rx="1"/>
    <rect x="44" y="42" width="12" height="4" fill="#6D4C41"/>
    <path d="M46 50 L46 60" stroke="#5D4037" strokeWidth="2"/>
    <path d="M50 50 L50 60" stroke="#5D4037" strokeWidth="2"/>
    <path d="M54 50 L54 60" stroke="#5D4037" strokeWidth="2"/>
  </svg>
);

export const GardenGuardian = ({ size = 80, earned = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: earned ? 1 : 0.3, filter: earned ? 'none' : 'grayscale(100%)' }}>
    <circle cx="50" cy="50" r="45" fill="#E0F7FA" stroke="#00ACC1" strokeWidth="2"/>
    <path d="M50 25 L45 35 L50 33 L55 35 Z" fill="#FFB74D" stroke="#F57C00" strokeWidth="1.5"/>
    <rect x="48" y="35" width="4" height="30" fill="#8D6E63"/>
    <circle cx="38" cy="45" r="8" fill="#66BB6A"/>
    <circle cx="62" cy="45" r="8" fill="#66BB6A"/>
    <path d="M35 30 L32 35" stroke="#558B2F" strokeWidth="2" strokeLinecap="round"/>
    <path d="M65 30 L68 35" stroke="#558B2F" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const GardenDeputy = ({ size = 80, earned = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: earned ? 1 : 0.3, filter: earned ? 'none' : 'grayscale(100%)' }}>
    <circle cx="50" cy="50" r="45" fill="#FFF9C4" stroke="#F9A825" strokeWidth="3"/>
    <path d="M50 28 L53 38 L63 38 L55 44 L58 54 L50 48 L42 54 L45 44 L37 38 L47 38 Z" fill="#FDD835" stroke="#F57F17" strokeWidth="2"/>
    <rect x="47" y="52" width="6" height="20" fill="#8D6E63"/>
    <circle cx="35" cy="62" r="6" fill="#66BB6A"/>
    <circle cx="65" cy="62" r="6" fill="#66BB6A"/>
  </svg>
);

// Task Completion
export const TaskTiller = ({ size = 80, earned = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: earned ? 1 : 0.3, filter: earned ? 'none' : 'grayscale(100%)' }}>
    <circle cx="50" cy="50" r="45" fill="#F3E5F5" stroke="#AB47BC" strokeWidth="2"/>
    <path d="M35 50 L45 60 L65 35" stroke="#7CB342" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="50" cy="48" r="25" stroke="#CE93D8" strokeWidth="2" fill="none"/>
  </svg>
);

export const BusyBee = ({ size = 80, earned = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: earned ? 1 : 0.3, filter: earned ? 'none' : 'grayscale(100%)' }}>
    <circle cx="50" cy="50" r="45" fill="#FFFDE7" stroke="#FBC02D" strokeWidth="2"/>
    <ellipse cx="50" cy="50" rx="12" ry="16" fill="#FFD54F"/>
    <path d="M50 38 L50 34" stroke="#212121" strokeWidth="3"/>
    <path d="M50 42 L50 38" stroke="#212121" strokeWidth="3"/>
    <path d="M50 50 L50 46" stroke="#212121" strokeWidth="3"/>
    <path d="M50 58 L50 54" stroke="#212121" strokeWidth="3"/>
    <ellipse cx="38" cy="45" rx="10" ry="6" fill="#90CAF9" opacity="0.6"/>
    <ellipse cx="62" cy="45" rx="10" ry="6" fill="#90CAF9" opacity="0.6"/>
    <circle cx="47" cy="48" r="2" fill="#212121"/>
    <circle cx="53" cy="48" r="2" fill="#212121"/>
  </svg>
);

export const BloomKeeper = ({ size = 80, earned = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: earned ? 1 : 0.3, filter: earned ? 'none' : 'grayscale(100%)' }}>
    <circle cx="50" cy="50" r="45" fill="#F8BBD0" stroke="#C2185B" strokeWidth="3"/>
    <circle cx="50" cy="50" r="8" fill="#FDD835"/>
    <ellipse cx="50" cy="35" rx="7" ry="12" fill="#EC407A"/>
    <ellipse cx="65" cy="50" rx="12" ry="7" fill="#EC407A"/>
    <ellipse cx="50" cy="65" rx="7" ry="12" fill="#EC407A"/>
    <ellipse cx="35" cy="50" rx="12" ry="7" fill="#EC407A"/>
    <ellipse cx="60" cy="40" rx="6" ry="10" fill="#F06292" transform="rotate(45 60 40)"/>
    <ellipse cx="60" cy="60" rx="6" ry="10" fill="#F06292" transform="rotate(-45 60 60)"/>
    <ellipse cx="40" cy="60" rx="6" ry="10" fill="#F06292" transform="rotate(45 40 60)"/>
    <ellipse cx="40" cy="40" rx="6" ry="10" fill="#F06292" transform="rotate(-45 40 40)"/>
  </svg>
);

// Garden Joining
export const NewSeedling = ({ size = 80, earned = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: earned ? 1 : 0.3, filter: earned ? 'none' : 'grayscale(100%)' }}>
    <circle cx="50" cy="50" r="45" fill="#E8F5E9" stroke="#4CAF50" strokeWidth="2"/>
    <path d="M50 68 Q49 58 49 48" stroke="#558B2F" strokeWidth="2.5" fill="none"/>
    <ellipse cx="47" cy="42" rx="6" ry="9" fill="#66BB6A"/>
    <ellipse cx="53" cy="44" rx="5" ry="8" fill="#81C784"/>
    <ellipse cx="50" cy="70" rx="8" ry="4" fill="#5D4037"/>
  </svg>
);

export const GardenHopper = ({ size = 80, earned = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: earned ? 1 : 0.3, filter: earned ? 'none' : 'grayscale(100%)' }}>
    <circle cx="50" cy="50" r="45" fill="#C8E6C9" stroke="#388E3C" strokeWidth="2"/>
    <circle cx="35" cy="45" r="10" fill="#66BB6A"/>
    <circle cx="50" cy="38" r="10" fill="#66BB6A"/>
    <circle cx="65" cy="45" r="10" fill="#66BB6A"/>
    <path d="M35 38 L32 32" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round"/>
    <path d="M50 30 L50 24" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round"/>
    <path d="M65 38 L68 32" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round"/>
    <path d="M30 55 Q40 60 50 58 Q60 56 70 60" stroke="#8D6E63" strokeWidth="2" fill="none"/>
  </svg>
);

// People Followed
export const CuriousSprout = ({ size = 80, earned = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: earned ? 1 : 0.3, filter: earned ? 'none' : 'grayscale(100%)' }}>
    <circle cx="50" cy="50" r="45" fill="#E1F5FE" stroke="#0288D1" strokeWidth="2"/>
    <path d="M50 65 Q49 55 49 48" stroke="#558B2F" strokeWidth="2.5" fill="none"/>
    <ellipse cx="48" cy="42" rx="7" ry="10" fill="#4FC3F7"/>
    <circle cx="48" cy="40" r="3" fill="#212121"/>
    <circle cx="50" cy="68" r="6" fill="#5D4037"/>
  </svg>
);

export const FriendlyVine = ({ size = 80, earned = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: earned ? 1 : 0.3, filter: earned ? 'none' : 'grayscale(100%)' }}>
    <circle cx="50" cy="50" r="45" fill="#E8F5E9" stroke="#43A047" strokeWidth="2"/>
    <path d="M30 60 Q40 50 50 55 Q60 60 70 50" stroke="#2E7D32" strokeWidth="3" fill="none"/>
    <circle cx="35" cy="58" r="6" fill="#66BB6A"/>
    <circle cx="50" cy="56" r="6" fill="#66BB6A"/>
    <circle cx="65" cy="52" r="6" fill="#66BB6A"/>
    <circle cx="43" cy="50" r="5" fill="#81C784"/>
    <circle cx="58" cy="58" r="5" fill="#81C784"/>
  </svg>
);

export const SocialSunflower = ({ size = 80, earned = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: earned ? 1 : 0.3, filter: earned ? 'none' : 'grayscale(100%)' }}>
    <circle cx="50" cy="50" r="45" fill="#FFF9C4" stroke="#F57F17" strokeWidth="3"/>
    <circle cx="50" cy="45" r="12" fill="#8D6E63"/>
    <ellipse cx="50" cy="30" rx="6" ry="10" fill="#FFEB3B"/>
    <ellipse cx="65" cy="35" rx="10" ry="6" fill="#FFEB3B" transform="rotate(45 65 35)"/>
    <ellipse cx="70" cy="45" rx="6" ry="10" fill="#FFEB3B" transform="rotate(90 70 45)"/>
    <ellipse cx="65" cy="55" rx="10" ry="6" fill="#FFEB3B" transform="rotate(135 65 55)"/>
    <ellipse cx="50" cy="60" rx="6" ry="10" fill="#FFEB3B"/>
    <ellipse cx="35" cy="55" rx="10" ry="6" fill="#FFEB3B" transform="rotate(-135 35 55)"/>
    <ellipse cx="30" cy="45" rx="6" ry="10" fill="#FFEB3B" transform="rotate(-90 30 45)"/>
    <ellipse cx="35" cy="35" rx="10" ry="6" fill="#FFEB3B" transform="rotate(-45 35 35)"/>
    <path d="M50 58 Q49 68 49 75" stroke="#558B2F" strokeWidth="3" fill="none"/>
  </svg>
);

// Followers Gained
export const SpottedSeed = ({ size = 80, earned = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: earned ? 1 : 0.3, filter: earned ? 'none' : 'grayscale(100%)' }}>
    <circle cx="50" cy="50" r="45" fill="#FBE9E7" stroke="#FF5722" strokeWidth="2"/>
    <ellipse cx="50" cy="50" rx="10" ry="14" fill="#8D6E63"/>
    <circle cx="48" cy="45" r="2" fill="#D7CCC8"/>
    <circle cx="52" cy="52" r="2" fill="#D7CCC8"/>
    <circle cx="50" cy="57" r="1.5" fill="#D7CCC8"/>
    <path d="M50 38 Q48 32 47 28" stroke="#7CB342" strokeWidth="2" fill="none"/>
  </svg>
);

export const BloomingBuddy = ({ size = 80, earned = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: earned ? 1 : 0.3, filter: earned ? 'none' : 'grayscale(100%)' }}>
    <circle cx="50" cy="50" r="45" fill="#FCE4EC" stroke="#E91E63" strokeWidth="2"/>
    <circle cx="50" cy="45" r="8" fill="#FDD835"/>
    <ellipse cx="50" cy="32" rx="6" ry="10" fill="#F48FB1"/>
    <ellipse cx="62" cy="45" rx="10" ry="6" fill="#F48FB1"/>
    <ellipse cx="50" cy="58" rx="6" ry="10" fill="#F48FB1"/>
    <ellipse cx="38" cy="45" rx="10" ry="6" fill="#F48FB1"/>
    <path d="M50 60 Q49 68 49 72" stroke="#558B2F" strokeWidth="2.5" fill="none"/>
  </svg>
);

export const GardenStar = ({ size = 80, earned = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: earned ? 1 : 0.3, filter: earned ? 'none' : 'grayscale(100%)' }}>
    <circle cx="50" cy="50" r="45" fill="#FFF3E0" stroke="#FF6F00" strokeWidth="3"/>
    <path d="M50 25 L54 39 L68 41 L58 50 L61 64 L50 57 L39 64 L42 50 L32 41 L46 39 Z" fill="#FFB74D" stroke="#E65100" strokeWidth="2"/>
    <circle cx="50" cy="47" r="6" fill="#FDD835"/>
    <path d="M45 30 L43 26" stroke="#FFF176" strokeWidth="2" strokeLinecap="round"/>
    <path d="M55 30 L57 26" stroke="#FFF176" strokeWidth="2" strokeLinecap="round"/>
    <path d="M65 45 L69 43" stroke="#FFF176" strokeWidth="2" strokeLinecap="round"/>
    <path d="M35 45 L31 43" stroke="#FFF176" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Event Participation
export const FestivalSprout = ({ size = 80, earned = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: earned ? 1 : 0.3, filter: earned ? 'none' : 'grayscale(100%)' }}>
    <circle cx="50" cy="50" r="45" fill="#F3E5F5" stroke="#9C27B0" strokeWidth="2"/>
    <path d="M50 65 Q49 55 49 48" stroke="#558B2F" strokeWidth="2.5" fill="none"/>
    <ellipse cx="48" cy="42" rx="6" ry="9" fill="#BA68C8"/>
    <ellipse cx="53" cy="44" rx="5" ry="8" fill="#CE93D8"/>
    <path d="M35 25 L40 35 L30 35 Z" fill="#FF6B6B"/>
    <path d="M50 20 L55 30 L45 30 Z" fill="#4ECDC4"/>
    <path d="M65 25 L70 35 L60 35 Z" fill="#FFE66D"/>
  </svg>
);

export const GatheringSpirit = ({ size = 80, earned = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: earned ? 1 : 0.3, filter: earned ? 'none' : 'grayscale(100%)' }}>
    <circle cx="50" cy="50" r="45" fill="#E1BEE7" stroke="#8E24AA" strokeWidth="2"/>
    <circle cx="38" cy="45" r="8" fill="#AB47BC"/>
    <circle cx="50" cy="42" r="8" fill="#AB47BC"/>
    <circle cx="62" cy="45" r="8" fill="#AB47BC"/>
    <path d="M38 38 L35 32" stroke="#6A1B9A" strokeWidth="2" strokeLinecap="round"/>
    <path d="M50 35 L50 29" stroke="#6A1B9A" strokeWidth="2" strokeLinecap="round"/>
    <path d="M62 38 L65 32" stroke="#6A1B9A" strokeWidth="2" strokeLinecap="round"/>
    <path d="M30 58 Q50 62 70 58" stroke="#8D6E63" strokeWidth="2" fill="none"/>
    <rect x="45" y="22" width="3" height="8" fill="#FF6B6B"/>
    <rect x="52" y="22" width="3" height="8" fill="#4ECDC4"/>
  </svg>
);

export const HeartOfTheGarden = ({ size = 80, earned = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: earned ? 1 : 0.3, filter: earned ? 'none' : 'grayscale(100%)' }}>
    <circle cx="50" cy="50" r="45" fill="#FCE4EC" stroke="#AD1457" strokeWidth="3"/>
    <path d="M50 65 C50 65 30 50 30 38 C30 30 35 25 42 28 C46 30 50 35 50 35 C50 35 54 30 58 28 C65 25 70 30 70 38 C70 50 50 65 50 65 Z" fill="#EC407A"/>
    <circle cx="35" cy="35" r="3" fill="#F48FB1" opacity="0.7"/>
    <circle cx="65" cy="35" r="3" fill="#F48FB1" opacity="0.7"/>
    <path d="M42 42 Q46 46 50 45 Q54 44 58 48" stroke="#C2185B" strokeWidth="1.5" fill="none"/>
  </svg>
);

// Seasonal Badges
export const PinkBlossom = ({ size = 80, earned = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: earned ? 1 : 0.3, filter: earned ? 'none' : 'grayscale(100%)' }}>
    <circle cx="50" cy="50" r="45" fill="#F8BBD0" stroke="#E91E63" strokeWidth="2"/>
    <circle cx="50" cy="45" r="6" fill="#FFF176"/>
    <ellipse cx="50" cy="33" rx="5" ry="9" fill="#F48FB1"/>
    <ellipse cx="61" cy="45" rx="9" ry="5" fill="#F48FB1"/>
    <ellipse cx="50" cy="57" rx="5" ry="9" fill="#F48FB1"/>
    <ellipse cx="39" cy="45" rx="9" ry="5" fill="#F48FB1"/>
    <ellipse cx="57" cy="37" rx="4" ry="7" fill="#FCE4EC" transform="rotate(45 57 37)"/>
    <ellipse cx="57" cy="53" rx="4" ry="7" fill="#FCE4EC" transform="rotate(-45 57 53)"/>
    <ellipse cx="43" cy="53" rx="4" ry="7" fill="#FCE4EC" transform="rotate(45 43 53)"/>
    <ellipse cx="43" cy="37" rx="4" ry="7" fill="#FCE4EC" transform="rotate(-45 43 37)"/>
  </svg>
);

export const SunnyPetal = ({ size = 80, earned = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: earned ? 1 : 0.3, filter: earned ? 'none' : 'grayscale(100%)' }}>
    <circle cx="50" cy="50" r="45" fill="#FFF9C4" stroke="#F57F17" strokeWidth="2"/>
    <circle cx="50" cy="50" r="14" fill="#FFA726"/>
    <path d="M50 25 L52 38 L50 36 L48 38 Z" fill="#FFD54F"/>
    <path d="M68 32 L60 42 L61 40 L58 40 Z" fill="#FFD54F"/>
    <path d="M75 50 L62 52 L64 50 L62 48 Z" fill="#FFD54F"/>
    <path d="M68 68 L60 58 L61 60 L58 60 Z" fill="#FFD54F"/>
    <path d="M50 75 L52 62 L50 64 L48 62 Z" fill="#FFD54F"/>
    <path d="M32 68 L40 58 L39 60 L42 60 Z" fill="#FFD54F"/>
    <path d="M25 50 L38 52 L36 50 L38 48 Z" fill="#FFD54F"/>
    <path d="M32 32 L40 42 L39 40 L42 40 Z" fill="#FFD54F"/>
  </svg>
);

export const HarvestSpirit = ({ size = 80, earned = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: earned ? 1 : 0.3, filter: earned ? 'none' : 'grayscale(100%)' }}>
    <circle cx="50" cy="50" r="45" fill="#FFF3E0" stroke="#E65100" strokeWidth="2"/>
    <path d="M50 30 Q48 40 48 50" stroke="#8D6E63" strokeWidth="2.5" fill="none"/>
    <ellipse cx="46" cy="25" rx="4" ry="6" fill="#FF9800"/>
    <ellipse cx="52" cy="27" rx="3" ry="5" fill="#FFB74D"/>
    <circle cx="38" cy="48" r="8" fill="#FF6F00"/>
    <circle cx="50" cy="52" r="9" fill="#FF8F00"/>
    <circle cx="62" cy="50" r="8" fill="#FFA726"/>
    <circle cx="44" cy="58" r="7" fill="#FFB74D"/>
    <circle cx="56" cy="60" r="7" fill="#FFCC80"/>
  </svg>
);

export const FrostGuardian = ({ size = 80, earned = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: earned ? 1 : 0.3, filter: earned ? 'none' : 'grayscale(100%)' }}>
    <circle cx="50" cy="50" r="45" fill="#E1F5FE" stroke="#0277BD" strokeWidth="2"/>
    <path d="M50 30 L50 70" stroke="#4FC3F7" strokeWidth="2"/>
    <path d="M30 50 L70 50" stroke="#4FC3F7" strokeWidth="2"/>
    <path d="M37 37 L63 63" stroke="#4FC3F7" strokeWidth="2"/>
    <path d="M63 37 L37 63" stroke="#4FC3F7" strokeWidth="2"/>
    <circle cx="50" cy="30" r="3" fill="#81D4FA"/>
    <circle cx="50" cy="70" r="3" fill="#81D4FA"/>
    <circle cx="30" cy="50" r="3" fill="#81D4FA"/>
    <circle cx="70" cy="50" r="3" fill="#81D4FA"/>
    <circle cx="37" cy="37" r="3" fill="#B3E5FC"/>
    <circle cx="63" cy="63" r="3" fill="#B3E5FC"/>
    <circle cx="63" cy="37" r="3" fill="#B3E5FC"/>
    <circle cx="37" cy="63" r="3" fill="#B3E5FC"/>
    <circle cx="50" cy="50" r="5" fill="#E1F5FE" stroke="#29B6F6" strokeWidth="2"/>
  </svg>
);

// Time-Based
export const DawnDewdrop = ({ size = 80, earned = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: earned ? 1 : 0.3, filter: earned ? 'none' : 'grayscale(100%)' }}>
    <circle cx="50" cy="50" r="45" fill="#FFF8E1" stroke="#FFA000" strokeWidth="2"/>
    <circle cx="35" cy="35" r="12" fill="#FFD54F" opacity="0.8"/>
    <path d="M28 30 L26 26" stroke="#FF6F00" strokeWidth="2" strokeLinecap="round"/>
    <path d="M35 26 L35 22" stroke="#FF6F00" strokeWidth="2" strokeLinecap="round"/>
    <path d="M42 30 L44 26" stroke="#FF6F00" strokeWidth="2" strokeLinecap="round"/>
    <ellipse cx="55" cy="55" rx="8" ry="12" fill="#4FC3F7" opacity="0.7"/>
    <ellipse cx="65" cy="60" rx="6" ry="9" fill="#4FC3F7" opacity="0.6"/>
    <ellipse cx="58" cy="65" rx="5" ry="8" fill="#4FC3F7" opacity="0.5"/>
  </svg>
);

export const MoonlitGardener = ({ size = 80, earned = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: earned ? 1 : 0.3, filter: earned ? 'none' : 'grayscale(100%)' }}>
    <circle cx="50" cy="50" r="45" fill="#1A237E" stroke="#3949AB" strokeWidth="2"/>
    <circle cx="48" cy="42" r="14" fill="#FFF9C4"/>
    <circle cx="54" cy="42" r="14" fill="#1A237E"/>
    <circle cx="65" cy="60" r="2" fill="#FFF9C4" opacity="0.8"/>
    <circle cx="35" cy="55" r="1.5" fill="#FFF9C4" opacity="0.6"/>
    <circle cx="40" cy="65" r="1.5" fill="#FFF9C4" opacity="0.7"/>
    <circle cx="70" cy="50" r="1" fill="#FFF9C4" opacity="0.5"/>
    <circle cx="30" cy="40" r="1.5" fill="#FFF9C4" opacity="0.6"/>
  </svg>
);

export const PuddleSpirit = ({ size = 80, earned = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: earned ? 1 : 0.3, filter: earned ? 'none' : 'grayscale(100%)' }}>
    <circle cx="50" cy="50" r="45" fill="#B3E5FC" stroke="#0288D1" strokeWidth="2"/>
    <ellipse cx="50" cy="60" rx="18" ry="8" fill="#4FC3F7" opacity="0.6"/>
    <path d="M35 25 L37 35" stroke="#0277BD" strokeWidth="2" strokeLinecap="round"/>
    <path d="M50 20 L52 30" stroke="#0277BD" strokeWidth="2" strokeLinecap="round"/>
    <path d="M65 25 L67 35" stroke="#0277BD" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="35" cy="36" r="2" fill="#4FC3F7"/>
    <circle cx="50" cy="31" r="2" fill="#4FC3F7"/>
    <circle cx="65" cy="36" r="2" fill="#4FC3F7"/>
    <path d="M42 45 Q45 42 48 45" stroke="#0288D1" strokeWidth="1.5" fill="none"/>
    <path d="M52 48 Q55 45 58 48" stroke="#0288D1" strokeWidth="1.5" fill="none"/>
  </svg>
);

export const SunbeamSpirit = ({ size = 80, earned = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: earned ? 1 : 0.3, filter: earned ? 'none' : 'grayscale(100%)' }}>
    <circle cx="50" cy="50" r="45" fill="#FFFDE7" stroke="#F9A825" strokeWidth="2"/>
    <circle cx="50" cy="45" r="12" fill="#FFEB3B"/>
    <path d="M50 25 L50 20" stroke="#FF6F00" strokeWidth="3" strokeLinecap="round"/>
    <path d="M68 33 L72 29" stroke="#FF6F00" strokeWidth="3" strokeLinecap="round"/>
    <path d="M75 45 L80 45" stroke="#FF6F00" strokeWidth="3" strokeLinecap="round"/>
    <path d="M68 57 L72 61" stroke="#FF6F00" strokeWidth="3" strokeLinecap="round"/>
    <path d="M32 33 L28 29" stroke="#FF6F00" strokeWidth="3" strokeLinecap="round"/>
    <path d="M25 45 L20 45" stroke="#FF6F00" strokeWidth="3" strokeLinecap="round"/>
    <path d="M32 57 L28 61" stroke="#FF6F00" strokeWidth="3" strokeLinecap="round"/>
    <path d="M45 62 Q50 70 55 62" stroke="#66BB6A" strokeWidth="2.5" fill="none"/>
  </svg>
);

// Sign-in Streaks
export const Evergreen = ({ size = 80, earned = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: earned ? 1 : 0.3, filter: earned ? 'none' : 'grayscale(100%)' }}>
    <circle cx="50" cy="50" r="45" fill="#E8F5E9" stroke="#2E7D32" strokeWidth="3"/>
    <path d="M50 75 L50 40" stroke="#4E342E" strokeWidth="4" fill="none"/>
    <path d="M35 55 L50 40 L65 55 L35 55 Z" fill="#43A047"/>
    <path d="M38 65 L50 50 L62 65 L38 65 Z" fill="#4CAF50"/>
    <path d="M40 75 L50 60 L60 75 L40 75 Z" fill="#66BB6A"/>
    <rect x="48" y="75" width="4" height="8" fill="#5D4037"/>
  </svg>
);

// All badges list for easy access
export const ALL_BADGES = [
  { name: 'Tiny Sprout', nameKey: 'badges.names.tinySprout', component: TinySprout, category: 'Welcome & Onboarding', categoryKey: 'badges.categories.welcomeOnboarding', descriptionKey: 'badges.tinySprout' },
  { name: 'Seed Planter', nameKey: 'badges.names.seedPlanter', component: SeedPlanter, category: 'Garden Creation', categoryKey: 'badges.categories.gardenCreation', descriptionKey: 'badges.seedPlanter' },
  { name: 'Urban Gardener', nameKey: 'badges.names.urbanGardener', component: UrbanGardener, category: 'Garden Creation', categoryKey: 'badges.categories.gardenCreation', descriptionKey: 'badges.urbanGardener' },
  { name: 'Talkative Tulip', nameKey: 'badges.names.talkativeTulip', component: TalkativeTulip, category: 'Forum Posts', categoryKey: 'badges.categories.forumPosts', descriptionKey: 'badges.talkativeTulip' },
  { name: 'Friendly Fern', nameKey: 'badges.names.friendlyFern', component: FriendlyFern, category: 'Forum Posts', categoryKey: 'badges.categories.forumPosts', descriptionKey: 'badges.friendlyFern' },
  { name: 'Voice of the Garden', nameKey: 'badges.names.voiceOfTheGarden', component: VoiceOfTheGarden, category: 'Forum Posts', categoryKey: 'badges.categories.forumPosts', descriptionKey: 'badges.voiceOfTheGarden' },
  { name: 'Helpful Seedling', nameKey: 'badges.names.helpfulSeedling', component: HelpfulSeedling, category: 'Forum Answers', categoryKey: 'badges.categories.forumAnswers', descriptionKey: 'badges.helpfulSeedling' },
  { name: 'Supportive Stem', nameKey: 'badges.names.supportiveStem', component: SupportiveStem, category: 'Forum Answers', categoryKey: 'badges.categories.forumAnswers', descriptionKey: 'badges.supportiveStem' },
  { name: 'Wise Willow', nameKey: 'badges.names.wiseWillow', component: WiseWillow, category: 'Forum Answers', categoryKey: 'badges.categories.forumAnswers', descriptionKey: 'badges.wiseWillow' },
  { name: 'Tiny Toolbelt', nameKey: 'badges.names.tinyToolbelt', component: TinyToolbelt, category: 'Task Creation', categoryKey: 'badges.categories.taskCreation', descriptionKey: 'badges.tinyToolbelt' },
  { name: 'Garden Guardian', nameKey: 'badges.names.gardenGuardian', component: GardenGuardian, category: 'Task Creation', categoryKey: 'badges.categories.taskCreation', descriptionKey: 'badges.gardenGuardian' },
  { name: 'Garden Deputy', nameKey: 'badges.names.gardenDeputy', component: GardenDeputy, category: 'Task Creation', categoryKey: 'badges.categories.taskCreation', descriptionKey: 'badges.gardenDeputy' },
  { name: 'Task Tiller', nameKey: 'badges.names.taskTiller', component: TaskTiller, category: 'Task Completion', categoryKey: 'badges.categories.taskCompletion', descriptionKey: 'badges.taskTiller' },
  { name: 'Busy Bee', nameKey: 'badges.names.busyBee', component: BusyBee, category: 'Task Completion', categoryKey: 'badges.categories.taskCompletion', descriptionKey: 'badges.busyBee' },
  { name: 'Bloom Keeper', nameKey: 'badges.names.bloomKeeper', component: BloomKeeper, category: 'Task Completion', categoryKey: 'badges.categories.taskCompletion', descriptionKey: 'badges.bloomKeeper' },
  { name: 'New Seedling', nameKey: 'badges.names.newSeedling', component: NewSeedling, category: 'Garden Joining', categoryKey: 'badges.categories.gardenJoining', descriptionKey: 'badges.newSeedling' },
  { name: 'Garden Hopper', nameKey: 'badges.names.gardenHopper', component: GardenHopper, category: 'Garden Joining', categoryKey: 'badges.categories.gardenJoining', descriptionKey: 'badges.gardenHopper' },
  { name: 'Curious Sprout', nameKey: 'badges.names.curiousSprout', component: CuriousSprout, category: 'People Followed', categoryKey: 'badges.categories.peopleFollowed', descriptionKey: 'badges.curiousSprout' },
  { name: 'Friendly Vine', nameKey: 'badges.names.friendlyVine', component: FriendlyVine, category: 'People Followed', categoryKey: 'badges.categories.peopleFollowed', descriptionKey: 'badges.friendlyVine' },
  { name: 'Social Sunflower', nameKey: 'badges.names.socialSunflower', component: SocialSunflower, category: 'People Followed', categoryKey: 'badges.categories.peopleFollowed', descriptionKey: 'badges.socialSunflower' },
  { name: 'Spotted Seed', nameKey: 'badges.names.spottedSeed', component: SpottedSeed, category: 'Followers Gained', categoryKey: 'badges.categories.followersGained', descriptionKey: 'badges.spottedSeed' },
  { name: 'Blooming Buddy', nameKey: 'badges.names.bloomingBuddy', component: BloomingBuddy, category: 'Followers Gained', categoryKey: 'badges.categories.followersGained', descriptionKey: 'badges.bloomingBuddy' },
  { name: 'Garden Star', nameKey: 'badges.names.gardenStar', component: GardenStar, category: 'Followers Gained', categoryKey: 'badges.categories.followersGained', descriptionKey: 'badges.gardenStar' },
  { name: 'Festival Sprout', nameKey: 'badges.names.festivalSprout', component: FestivalSprout, category: 'Event Participation', categoryKey: 'badges.categories.eventParticipation', descriptionKey: 'badges.festivalSprout' },
  { name: 'Gathering Spirit', nameKey: 'badges.names.gatheringSpirit', component: GatheringSpirit, category: 'Event Participation', categoryKey: 'badges.categories.eventParticipation', descriptionKey: 'badges.gatheringSpirit' },
  { name: 'Heart of the Garden', nameKey: 'badges.names.heartOfTheGarden', component: HeartOfTheGarden, category: 'Event Participation', categoryKey: 'badges.categories.eventParticipation', descriptionKey: 'badges.heartOfTheGarden' },
  { name: 'Pink Blossom', nameKey: 'badges.names.pinkBlossom', component: PinkBlossom, category: 'Seasonal Badges', categoryKey: 'badges.categories.seasonalBadges', descriptionKey: 'badges.pinkBlossom' },
  { name: 'Sunny Petal', nameKey: 'badges.names.sunnyPetal', component: SunnyPetal, category: 'Seasonal Badges', categoryKey: 'badges.categories.seasonalBadges', descriptionKey: 'badges.sunnyPetal' },
  { name: 'Harvest Spirit', nameKey: 'badges.names.harvestSpirit', component: HarvestSpirit, category: 'Seasonal Badges', categoryKey: 'badges.categories.seasonalBadges', descriptionKey: 'badges.harvestSpirit' },
  { name: 'Frost Guardian', nameKey: 'badges.names.frostGuardian', component: FrostGuardian, category: 'Seasonal Badges', categoryKey: 'badges.categories.seasonalBadges', descriptionKey: 'badges.frostGuardian' },
  { name: 'Dawn Dewdrop', nameKey: 'badges.names.dawnDewdrop', component: DawnDewdrop, category: 'Time-Based', categoryKey: 'badges.categories.timeBased', descriptionKey: 'badges.dawnDewdrop' },
  { name: 'Moonlit Gardener', nameKey: 'badges.names.moonlitGardener', component: MoonlitGardener, category: 'Time-Based', categoryKey: 'badges.categories.timeBased', descriptionKey: 'badges.moonlitGardener' },
  { name: 'Puddle Spirit', nameKey: 'badges.names.puddleSpirit', component: PuddleSpirit, category: 'Time-Based', categoryKey: 'badges.categories.timeBased', descriptionKey: 'badges.puddleSpirit' },
  { name: 'Sunbeam Spirit', nameKey: 'badges.names.sunbeamSpirit', component: SunbeamSpirit, category: 'Time-Based', categoryKey: 'badges.categories.timeBased', descriptionKey: 'badges.sunbeamSpirit' },
  { name: 'Evergreen', nameKey: 'badges.names.evergreen', component: Evergreen, category: 'Sign-in Streaks', categoryKey: 'badges.categories.signInStreaks', descriptionKey: 'badges.evergreen' },
];

