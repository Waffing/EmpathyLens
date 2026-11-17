import type { SensoryState } from '../state/types';
import { initialSensoryState } from '../state/reducer';

interface Preset {
  name: string;
  sensoryState: SensoryState;
}

export const PRESETS = {
  zhang: {
    name: '张奶奶',
    sensoryState: { ...initialSensoryState, blur: 3, cataract: 55, tremorLevel: 3 },
  },
  lin: {
    name: '小林',
    sensoryState: { ...initialSensoryState, colorVision: 'protanopia', glare: true },
  },
  li: {
    name: '李叔',
    sensoryState: { ...initialSensoryState, blur: 1, cataract: 15, tremorLevel: 7, hearing: 'impaired' },
  },
} satisfies Record<'zhang' | 'lin' | 'li', Preset>;
