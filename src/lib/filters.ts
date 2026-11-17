import type { SensoryState } from '../state/types';

// Machado et al. (2009), severity 1.0 matrices in linear RGB; educational approximation.
export const COLOR_MATRICES = {
  protanopia: [0.152286, 1.052583, -0.204868, 0, 0, 0.114503, 0.786281, 0.099216, 0, 0, -0.003882, -0.048116, 1.051998, 0, 0, 0, 0, 0, 1, 0],
  deuteranopia: [0.367322, 0.860646, -0.227968, 0, 0, 0.280085, 0.672501, 0.047413, 0, 0, -0.011820, 0.042940, 0.968881, 0, 0, 0, 0, 0, 1, 0],
  tritanopia: [1.255528, -0.076749, -0.178779, 0, 0, -0.078411, 0.930809, 0.147602, 0, 0, 0.004733, 0.691367, 0.303900, 0, 0, 0, 0, 0, 1, 0],
  achromatopsia: [0.2126, 0.7152, 0.0722, 0, 0, 0.2126, 0.7152, 0.0722, 0, 0, 0.2126, 0.7152, 0.0722, 0, 0, 0, 0, 0, 1, 0],
} as const;
export function mapSensoryFilters(state: SensoryState) {
  const c = state.cataract / 100;
  return { totalBlur: state.blur + c * 0.6, contrast: 1 - c * 0.45, hazeOpacity: c * 0.28, clearRadius: (1 - state.glaucoma / 100 * 0.75) * 50 };
}
