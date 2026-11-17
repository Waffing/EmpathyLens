import { useState } from 'react';
import { ArrowRight, CheckCircle2, Download, Activity } from 'lucide-react';
import { useAppState } from '../state/AppStateContext';
import { contrastRatio, contrastGrade, fittsIndex, errorRate, comparable } from '../lib/metrics';
import { PRESCRIPTIONS, SCENES } from '../lib/scenes';
import type { Trial } from '../state/types';

export function Diagnostics() {
  const state = useAppState();
  const scene = SCENES[state.uiState.sceneId];
  const before = state.metricsStore[`${scene.id}:before`], after = state.metricsStore[`${scene.id}:after`];
  const [status, setStatus] = useState(''), [busy, setBusy] = useState(false);
  const ratios = [scene.before, scene.after].map(c => contrastRatio(c.foreground, c.background));
  async function download() { setBusy(true); try { const { exportReport } = await import('../lib/report'); await exportReport(state); setStatus('1200 × 1600 PNG 已生成并开始下载。'); } catch { setStatus('导出未成功，请重试；当前数据仍保留在页面内。'); } finally { setBusy(false); } }
  return <div className="diagnostic-content"><div className="diagnostic-readout"><div className="readout-heading"><span>文字对比度 / WCAG 2.2</span><span><Activity size={10} />LIVE</span></div><div className="readout-values">{ratios.map((r, i) => <div key={i}><small>{i === 0 ? 'BEFORE' : 'AFTER'}</small><strong>{r.toFixed(2)}<small>:1</small></strong><em>{contrastGrade(r)}</em></div>)}</div><div className="contrast-track" /><p className="readout-note">选定关键文本原始配色 · 非整站合规认证<br />{scene.before.foreground} → {scene.after.foreground} / 白底</p></div>
    <div className="diagnosis-stats"><div><span>Fitts 点击难度</span><strong>{fittsIndex(240, scene.before.target).toFixed(2)} <span className="inline-arrow">→</span> {fittsIndex(240, scene.after.target).toFixed(2)}</strong><small>bit · 假设 D = 240px</small></div><div><span>触控目标高度</span><strong>{scene.before.target} <span className="inline-arrow">→</span> {scene.after.target}<small>px</small></strong><small>重构态 ≥44×44px</small></div></div>
    <section className="diagnostic-section"><h3>您的实测对比<span>最近一次 / 本场景</span></h3><div className="comparison-chart"><Chart label="任务耗时" a={before} b={after} metric="time" /><Chart label="误触率" a={before} b={after} metric="error" /></div>{before && after && !comparable(before, after) && <p className="comparison-warning">两次参数、舒适模式或输入方式不同，仅展示记录，不作受控因果比较。</p>}<p className="control-note">{before ? `Before：${before.status === 'success' ? '已完成' : '超时'} · ${before.profileName}` : '先完成一次传统界面挑战。'}<br />{after ? `After：${after.status === 'success' ? '已完成' : '超时'} · ${after.profileName}` : '再保留相同参数体验重构界面。'}</p></section>
    <section className="diagnostic-section"><h3>五项工程改造处方<span>展开查看代码</span></h3><div className="prescription-list">{PRESCRIPTIONS.map((item, index) => <details className="prescription" key={item.title}><summary><CheckCircle2 size={14} />{item.title}<span>{String(index + 1).padStart(2, '0')}</span></summary><p>WCAG {item.standard} · {item.note}</p><pre>{index === 0 ? `font-size: ${scene.before.font}px; color: ${scene.before.foreground};` : index === 1 ? `height: ${scene.before.target}px; gap: 4px;` : item.before}</pre><pre className="after-code">{item.after}</pre></details>)}</div></section>
    <button type="button" className="export-button" onClick={() => void download()} disabled={busy}><Download size={16} />{busy ? '正在绘制体检报告…' : '导出无障碍共情体检报告'}<ArrowRight size={13} /></button><p className="export-meta">PNG · 1200 × 1600 · 完全本地生成</p><p role="status" className="control-note">{status}</p>
    <details className="diagnostic-method"><summary>指标是如何计算的？</summary><p>对比度 = (较亮相对亮度 + 0.05) / (较暗相对亮度 + 0.05)，基于 sRGB 线性化。普通文本 AA ≥4.5，AAA ≥7。滤镜后的视觉体验不用于伪造合规值。</p><p>Fitts ID = log₂(1 + 240 / 目标高度)。误触率 = 失效或错误目标次数 / 全部操作次数。点击偏移仅统计指针，键盘单独计数。</p><p>挫败指数 = 50×误触比例 + 30×min(耗时/15, 1) + 5×min(陷阱次数, 4)，最高100；这是教学启发式，并非心理量表。</p></details>
  </div>;
}
function Chart({ label, a, b, metric }: { label: string; a?: Trial; b?: Trial; metric: 'time' | 'error' }) {
  const value = (t: Trial) => metric === 'time' ? t.elapsed : errorRate(t);
  const max = metric === 'time' ? Math.max(15, a ? a.elapsed : 0, b ? b.elapsed : 0) : 100;
  return <><div className="comparison-title"><span>{label}</span><span>{metric === 'time' ? '越短越好 · 超时为15s' : '越低越好'}</span></div>{[a, b].map((t, i) => <div className={`comparison-row ${i ? 'after' : 'before'}`} key={i}><span>{i ? 'After' : 'Before'}</span><div className="bar-track"><span style={{ width: t ? `${value(t) / max * 100}%` : '0%' }} /></div><b>{t ? `${value(t).toFixed(1)}${metric === 'time' ? 's' : '%'}` : '未体验'}</b></div>)}</>;
}
