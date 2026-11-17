import type { AppState } from '../state/types';
import { averageOffset, comparable, contrastRatio, errorRate, fittsIndex, frustration, sensorySummary } from './metrics';
import { ETHICS, PRESCRIPTIONS, SCENES } from './scenes';

export function drawReport(state: AppState): HTMLCanvasElement {
  const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 1600;
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Canvas unavailable');
  const scene = SCENES[state.uiState.sceneId];
  const trials = [state.metricsStore[`${scene.id}:before`], state.metricsStore[`${scene.id}:after`]];
  const text = (value: string, x: number, y: number, size = 22, color = '#0f172a', weight = '400') => { ctx.font = `${weight} ${size}px "Segoe UI", "Microsoft YaHei", sans-serif`; ctx.fillStyle = color; ctx.fillText(value, x, y); };
  const line = (y: number) => { ctx.fillStyle = '#e2e8f0'; ctx.fillRect(64, y, 1072, 1); };
  const wrap = (value: string, x: number, y: number, maxWidth: number, size = 18, color = '#64748b', height = 29) => {
    ctx.font = `400 ${size}px "Segoe UI", "Microsoft YaHei", sans-serif`; let chunk = '', baseline = y;
    for (const char of value) { if (ctx.measureText(chunk + char).width > maxWidth) { text(chunk, x, baseline, size, color); chunk = char; baseline += height; } else chunk += char; }
    if (chunk) text(chunk, x, baseline, size, color); return baseline + height;
  };
  ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, 1200, 1600);
  ctx.fillStyle = '#2563eb'; ctx.fillRect(0, 0, 1200, 10);
  text('EmpathyLens', 64, 91, 35, '#0f172a', '700'); text('共情之镜 / 数字无障碍实验室', 330, 89, 22, '#64748b');
  text('PERSONAL EMPATHY REPORT', 64, 136, 16, '#2563eb'); text(new Date().toLocaleDateString('zh-CN'), 980, 89, 18, '#64748b');
  text('无障碍共情体检报告', 64, 204, 44, '#0f172a', '650'); text(`${scene.title}  /  ${state.profileName}`, 64, 249, 24, '#475569');
  text('教学体验记录 · 非医学诊断 · 非整站合规认证', 64, 282, 18, '#64748b'); line(310);
  text('01  当前模拟参数', 64, 353, 22, '#0f172a', '600');
  const lines = sensorySummary(state.sensoryState);
  lines.forEach((item, i) => text(item, 64 + i % 3 * 360, 395 + Math.floor(i / 3) * 35, 19, '#475569'));
  text(`舒适模式：${state.uiState.comfortMode ? '开启（不限时）' : '关闭（15秒）'}  ·  数据仅保存在当前页面内存`, 64, 511, 17, '#64748b');
  ctx.fillStyle = '#0f172a'; ctx.fillRect(64, 544, 1072, 176);
  text('02  界面设计指标', 88, 581, 20, '#cbd5e1', '600');
  for (const [i, mode] of (['before', 'after'] as const).entries()) {
    const x = 88 + i * 535, design = scene[mode];
    text(mode.toUpperCase(), x, 618, 16, '#94a3b8'); text(`${contrastRatio(design.foreground, design.background).toFixed(2)} : 1`, x, 668, 35, i ? '#6ee7b7' : '#fbbf24', '600');
    text(`Fitts ${fittsIndex(240, design.target).toFixed(2)} bit · 目标 ${design.target}px`, x + 233, 661, 18, '#e2e8f0');
    text(`改造覆盖 ${i ? '5 / 5' : '0 / 5'}（教学清单，非WCAG评分）`, x, 700, 15, '#94a3b8');
  }
  text('关键文本原始配色；Fitts 假设距离为240px，不是实测移动距离。', 64, 750, 16, '#64748b');
  text('03  您的实测记录', 64, 799, 22, '#0f172a', '600');
  for (const [i, trial] of trials.entries()) {
    const x = 64 + i * 548;
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x, 822, 524, 255);
    text(i ? 'AFTER / 无障碍重构' : 'BEFORE / 传统界面', x + 20, 858, 18, i ? '#047857' : '#b45309', '600');
    if (!trial) { text('尚未完成体验', x + 20, 911, 26, '#64748b'); text('不生成虚构数据；完成挑战后重新导出。', x + 20, 953, 17, '#94a3b8'); continue; }
    text(`${trial.elapsed.toFixed(2)} 秒  /  误触 ${errorRate(trial).toFixed(1)}%`, x + 20, 904, 27, '#0f172a', '600');
    text(`${trial.status === 'success' ? '任务完成' : '15秒超时'} · ${trial.clicks}次操作 · ${trial.traps}次陷阱`, x + 20, 944, 18, '#475569');
    text(`平均偏移 ${averageOffset(trial).toFixed(1)}px · 挫败指数 ${frustration(trial)}/100`, x + 20, 980, 18, '#475569');
    text(`${trial.profileName} · 键盘${trial.keyboardClicks}次 · 舒适${trial.comfort ? '开' : '关'}`, x + 20, 1013, 16, '#64748b');
    wrap(`当轮：${sensorySummary(trial.sensory).join(' / ')}`, x + 20, 1040, 484, 12, '#64748b', 17);
  }
  text(trials[0] && trials[1] ? comparable(trials[0], trials[1]) ? '两轮模拟参数相同；结果仍受学习顺序影响，不构成临床或因果结论。' : '两轮参数或输入方式不同，不属于受控对照。' : '完成两态体验后，可生成更完整的对比记录。', 64, 1108, 17, '#64748b');
  text('04  把共情变成改造', 64, 1153, 22, '#0f172a', '600');
  PRESCRIPTIONS.forEach((item, i) => { text(`${String(i + 1).padStart(2, '0')}  ${item.title}`, 64, 1193 + i * 35, 20, '#334155'); text(`WCAG ${item.standard}`, 770, 1193 + i * 35, 17, '#64748b'); });
  line(1360); text('障碍不应该成为人与数字世界之间的距离。', 64, 1409, 27, '#2563eb', '600');
  wrap(ETHICS, 64, 1452, 1072, 16, '#64748b', 26);
  text('挫败指数：50×误触比例 +30×min(耗时/15,1) +5×min(陷阱次数,4)，上限100。', 64, 1535, 13, '#94a3b8');
  text('2026 QODER · HACK4GOOD', 64, 1570, 14, '#94a3b8'); text('LOCAL FIRST / 1200 × 1600', 881, 1570, 14, '#94a3b8');
  return canvas;
}
export async function exportReport(state: AppState): Promise<void> {
  const canvas = drawReport(state);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('PNG encoding failed')), 'image/png'));
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = `EmpathyLens-${state.uiState.sceneId}-${new Date().toISOString().slice(0, 10)}.png`;
  document.body.append(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 10000);
}
