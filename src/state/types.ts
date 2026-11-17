export type SceneId = 'hospital' | 'payment' | 'escape';
export type Mode = 'before' | 'after';
export interface SensoryState {
  blur: number;
  cataract: number;
  scotoma: boolean;
  glaucoma: number;
  colorVision: 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';
  glare: boolean;
  tremorLevel: number;
  hearing: 'normal' | 'impaired';
  cognitive: boolean;
}
export interface UiState { sceneId: SceneId; mode: Mode; comfortMode: boolean; resetKey: number }
export interface Trial {
  sceneId: SceneId;
  mode: Mode;
  status: 'idle' | 'running' | 'success' | 'timeout' | 'cancelled';
  elapsed: number;
  clicks: number;
  errors: number;
  traps: number;
  offsetTotal: number;
  pointerClicks: number;
  keyboardClicks: number;
  profileName: string;
  sensory: SensoryState;
  comfort: boolean;
  timestamp: number;
}
export type MetricsStore = Partial<Record<`${SceneId}:${Mode}`, Trial>>;
export interface AppState {
  sensoryState: SensoryState;
  uiState: UiState;
  metricsStore: MetricsStore;
  liveTrial: Trial | null;
  profileName: string;
}
export type AppAction =
  | { type: 'ui/setComfortMode'; enabled: boolean }
  | { type: 'ui/scene'; sceneId: SceneId }
  | { type: 'ui/mode'; mode: Mode }
  | { type: 'sensory/change'; patch: Partial<SensoryState> }
  | { type: 'sensory/preset'; sensoryState: SensoryState; name: string }
  | { type: 'sensory/clear' }
  | { type: 'trial/live'; trial: Trial | null }
  | { type: 'trial/save'; trial: Trial };
