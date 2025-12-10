// Supported accents and their language codes
export interface AccentConfig {
  code: string;
  name: string;
  country: string;
  flag: string;
}

export const SUPPORTED_ACCENTS: AccentConfig[] = [
  // English Variants
  { code: 'en-US', name: 'American English', country: 'United States', flag: '🇺🇸' },
  { code: 'en-GB', name: 'British English', country: 'United Kingdom', flag: '🇬🇧' },
  { code: 'en-NG', name: 'Nigerian English', country: 'Nigeria', flag: '🇳🇬' },
  { code: 'en-CA', name: 'Canadian English', country: 'Canada', flag: '🇨🇦' },
  { code: 'en-AU', name: 'Australian English', country: 'Australia', flag: '🇦🇺' },
  { code: 'en-NZ', name: 'New Zealand English', country: 'New Zealand', flag: '🇳🇿' },
  { code: 'en-IN', name: 'Indian English', country: 'India', flag: '🇮🇳' },
  { code: 'en-PK', name: 'Pakistani English', country: 'Pakistan', flag: '🇵🇰' },
  { code: 'en-ZA', name: 'South African English', country: 'South Africa', flag: '🇿🇦' },
  { code: 'en-IE', name: 'Irish English', country: 'Ireland', flag: '🇮🇪' },
  { code: 'en-SG', name: 'Singapore English', country: 'Singapore', flag: '🇸🇬' },
  { code: 'en-PH', name: 'Philippine English', country: 'Philippines', flag: '🇵🇭' },
  
  // Spanish Variants
  { code: 'es-ES', name: 'Spanish (Spain)', country: 'Spain', flag: '🇪🇸' },
  { code: 'es-MX', name: 'Spanish (Mexico)', country: 'Mexico', flag: '🇲🇽' },
  { code: 'es-AR', name: 'Spanish (Argentina)', country: 'Argentina', flag: '🇦🇷' },
  { code: 'es-CO', name: 'Spanish (Colombia)', country: 'Colombia', flag: '🇨🇴' },
  
  // Portuguese Variants
  { code: 'pt-PT', name: 'Portuguese (Portugal)', country: 'Portugal', flag: '🇵🇹' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', country: 'Brazil', flag: '🇧🇷' },
  
  // Other European Languages
  { code: 'fr-FR', name: 'French (France)', country: 'France', flag: '🇫🇷' },
  { code: 'de-DE', name: 'German', country: 'Germany', flag: '🇩🇪' },
  { code: 'it-IT', name: 'Italian', country: 'Italy', flag: '🇮🇹' },
  { code: 'nl-NL', name: 'Dutch', country: 'Netherlands', flag: '🇳🇱' },
  { code: 'pl-PL', name: 'Polish', country: 'Poland', flag: '🇵🇱' },
  { code: 'ru-RU', name: 'Russian', country: 'Russia', flag: '🇷🇺' },
];

// Default accent (fallback)
export const DEFAULT_ACCENT = 'en-US';

// Auto-detect accent based on browser language
export function detectAccent(): string {
  if (typeof window === 'undefined') return DEFAULT_ACCENT;
  
  const browserLang = navigator.language || (navigator as any).userLanguage || 'en-US';
  
  // Try exact match first
  const exactMatch = SUPPORTED_ACCENTS.find(accent => accent.code === browserLang);
  if (exactMatch) return exactMatch.code;
  
  // Try language match (e.g., 'en' matches 'en-US', 'en-GB', etc.)
  const langCode = browserLang.split('-')[0];
  const langMatch = SUPPORTED_ACCENTS.find(accent => accent.code.startsWith(langCode));
  if (langMatch) return langMatch.code;
  
  // Default to US English
  return DEFAULT_ACCENT;
}

// Get accent config by code
export function getAccentConfig(code: string): AccentConfig {
  return SUPPORTED_ACCENTS.find(a => a.code === code) || SUPPORTED_ACCENTS[0];
}

// Store selected accent in localStorage
export function saveAccentPreference(code: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('sammy_accent', code);
  }
}

// Get saved accent preference
export function getAccentPreference(): string {
  if (typeof window === 'undefined') return DEFAULT_ACCENT;
  
  const saved = localStorage.getItem('sammy_accent');
  if (saved && SUPPORTED_ACCENTS.find(a => a.code === saved)) {
    return saved;
  }
  
  return detectAccent();
}

