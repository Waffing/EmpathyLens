import type { AppAction, AppState, SensoryState } from './types';

export const initialSensoryState: SensoryState = {
  blur: 0, cataract: 0, scotoma: false, glaucoma: 0, colorVision: 'normal',
  glare: false, tremorLevel: 0, hearing: 'normal', cognitive: false,
};
export const initialState: AppState = {
  sensoryState: initialSensoryState,
  uiState: { sceneId: 'hospital', mode: 'before', comfortMode: false, resetKey: 0 },
  metricsStore: {}, liveTrial: null, profileName: '未开启模拟',
};
export function appReducer(state: AppState, action: AppAction): AppState {
  const reset = { ...state.uiState, resetKey: state.uiState.resetKey + 1 };
  switch (action.type) {
    case 'ui/setComfortMode':
      return { ...state, liveTrial: null, uiState: { ...reset, comfortMode: action.enabled }, sensoryState: { ...state.sensoryState, cognitive: action.enabled ? false : state.sensoryState.cognitive } };
    case 'ui/scene':
      return { ...state, liveTrial: null, uiState: { ...reset, sceneId: action.sceneId } };
    case 'ui/mode':
      return { ...state, liveTrial: null, uiState: { ...reset, mode: action.mode } };
    case 'sensory/change':
      return { ...state, liveTrial: null, uiState: reset, profileName: '自定义画像', sensoryState: { ...state.sensoryState, ...action.patch, cognitive: state.uiState.comfortMode ? false : action.patch.cognitive ?? state.sensoryState.cognitive } };
    case 'sensory/preset':
      return { ...state, liveTrial: null, uiState: reset, profileName: action.name, sensoryState: { ...action.sensoryState, cognitive: state.uiState.comfortMode ? false : action.sensoryState.cognitive } };
    case 'sensory/clear':
      return { ...state, liveTrial: null, uiState: reset, profileName: '未开启模拟', sensoryState: { ...initialSensoryState } };
    case 'trial/live':
      return { ...state, liveTrial: action.trial };
    case 'trial/save':
      return { ...state, liveTrial: action.trial, metricsStore: { ...state.metricsStore, [`${action.trial.sceneId}:${action.trial.mode}`]: action.trial } };
  }
}
