import { COLOR_MATRICES, mapSensoryFilters } from '../lib/filters';
import { useAppState } from '../state/AppStateContext';

export function FilterDefinitions() {
  const { sensoryState: s } = useAppState();
  const mapped = mapSensoryFilters(s);
  const c = mapped.contrast, b = (1 - c) / 2;
  return <svg className="filter-definitions" aria-hidden="true" width="0" height="0"><defs>
    <filter id="sensory-optics" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="linearRGB">
      {s.colorVision !== 'normal' && <feColorMatrix type="matrix" values={COLOR_MATRICES[s.colorVision].join(' ')} />}
      <feColorMatrix type="matrix" colorInterpolationFilters="sRGB" values={`${c} 0 0 0 ${b} 0 ${c} 0 0 ${b} 0 0 ${c} 0 ${b} 0 0 0 1 0`} />
      <feGaussianBlur stdDeviation={mapped.totalBlur} />
    </filter>
    <filter id="glare-diffusion" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="3" seed="7" />
      <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.97 0 0 0 0 0.85 0 0 0 0.22 0" />
      <feGaussianBlur stdDeviation="3" />
    </filter>
  </defs></svg>;
}
