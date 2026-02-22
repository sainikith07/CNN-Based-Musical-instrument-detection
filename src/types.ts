export interface User {
  id: string;
  email: string;
  name: string;
  isPremium: boolean;
}

export interface InstrumentPrediction {
  name: string;
  confidence: number;
  intensity: number;
  health: 'Healthy' | 'Needs Tuning' | 'Damaged';
  condition: string;
  similarInstruments: { name: string; similarity: number }[];
  timelineData: { segment: string; [key: string]: string | number }[];
  timestamp: string;
}

export interface AnalysisResult {
  id: string;
  fileName: string;
  prediction: InstrumentPrediction;
  spectrogramUrl: string;
  waveformUrl: string;
}
