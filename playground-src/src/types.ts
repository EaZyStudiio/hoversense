export interface Project {
  id: string;
  code: string;
  title: string;
  client: string;
  category: 'PERSONAL' | 'TEAM';
  tags: string[];
  image: string;
  summary: string;
  year: number;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  style: string;
  specialties: string[];
  mainColor: string;
  personalityQuote: string;
  personalityQuirk: string;
  revealType: 'bold' | 'precise' | 'narrative' | 'rapid' | 'kinetic' | 'organic';
  image: string;
  status: 'ACTIVE' | 'BUSY' | 'UNAVAILABLE';
}

export type ShowcaseMode = 'mainframe' | 'collective';

export type MobileTab = 'preview' | 'tune' | 'code';

export interface VisualGuidesConfig {
  showAnchorLine: boolean;
  showBand: boolean;
  showSafeZones: boolean;
  showTelemetryHUD: boolean;
}

export interface TelemetryData {
  phase: string;
  intent: number;
  authority: number;
  activeId: string | null;
  source: string;
  strength: number;
  zoneWeight: number;
  scrollY: number;
}

export interface TuningConfig {
  anchorRatio: number;
  bandRatio: number;
  engageAt: number;
  holdMsMin: number;
  holdMsMax: number;
  scrollLockGraceMs: number;
  rowSplit: number;
  takeoverFullPx: number;
  releaseMode: 'off-screen' | 'scroll' | 'never';
}
