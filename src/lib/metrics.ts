import type { Trial } from '../state/types';

export function luminance(hex: string): number {
  const channels = hex.replace('#', '').match(/.{2}/g)!.map(v => parseInt(v, 16) / 255);
  const [r, g, b] = channels.map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrastRatio(a: string, b: string) {
  const l1 = luminance(a), l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
export function contrastGrade(ratio: number) { return ratio >= 7 ? 'AAA 通过' : ratio >= 4.5 ? 'AA 通过' : '未达 AA'; }
export function fittsIndex(distance: number, width: number) { return Math.log2(1 + Math.max(0, distance) / Math.max(1, width)); }
export function errorRate(trial?: Trial | null) { return trial?.clicks ? trial.errors / trial.clicks * 100 : 0; }
export function averageOffset(trial?: Trial | null) { return trial?.pointerClicks ? trial.offsetTotal / trial.pointerClicks : 0; }
export function frustration(trial?: Trial | null) {
  if (!trial || trial.status === 'idle') return 0;
  return Math.round(Math.min(100, errorRate(trial) * 0.5 + Math.min(1, trial.elapsed / 15) * 30 + Math.min(4, trial.traps) * 5));
}
export function comparable(a?: Trial, b?: Trial) {
  return !!a && !!b && a.comfort === b.comfort && JSON.stringify(a.sensory) === JSON.stringify(b.sensory) && a.keyboardClicks === 0 && b.keyboardClicks === 0;
}
export function sensorySummary(s: Trial['sensory']) {
  const colors = { normal: '正常色觉', protanopia: '红色盲', deuteranopia: '绿色盲', tritanopia: '蓝黄色盲', achromatopsia: '全色盲' };
  return [`失焦 ${s.blur}px`, `晶状体浑浊 ${s.cataract}%`, `管状视野 ${s.glaucoma}%`, colors[s.colorVision], `手抖 ${s.tremorLevel}/10`, s.scotoma ? '中央暗点开启' : '中央暗点关闭', s.glare ? '眩光开启' : '眩光关闭', s.hearing === 'impaired' ? '听力低通 1500Hz' : '正常听力', s.cognitive ? '认知干扰开启' : '认知干扰关闭'];
}
