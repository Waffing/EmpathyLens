import { Eye, Hand, Brain, UserRound, ChevronDown } from 'lucide-react';
import { PRESETS } from '../lib/presets';
import { hearingAudio } from '../lib/audio';
import { useAppDispatch, useAppState } from '../state/AppStateContext';
import type { SensoryState } from '../state/types';
import { HearingPreview } from './HearingPreview';

const descriptions = { zhang: ['74 岁 · 独居长辈', '白内障 / 老花 / 轻微手抖'], lin: ['21 岁 · 在校大学生', '红绿色觉障碍 / 强光眩目'], li: ['68 岁 · 退休工人', '高频听力下降 / 帕金森手抖'] };
export function SensoryConsole() {
  const { sensoryState: s, profileName, uiState } = useAppState();
  const dispatch = useAppDispatch();
  const change = (patch: Partial<SensoryState>) => { hearingAudio.stop(); dispatch({ type: 'sensory/change', patch }); };
  return <div className="sensory-console">
    <div className="control-section profile-section"><div className="section-caption">选择一个视角 <span>PERSONAS</span></div>
      <div className="preset-buttons">{Object.entries(PRESETS).map(([key, preset]) => <button className={`preset-card ${profileName === preset.name ? 'selected' : ''}`} type="button" key={key} aria-pressed={profileName === preset.name} onClick={() => { hearingAudio.stop(); dispatch({ type: 'sensory/preset', name: preset.name, sensoryState: preset.sensoryState }); }}><span className={`avatar avatar-${key}`}><UserRound size={21} /></span><span><strong>{preset.name}<small>{descriptions[key as keyof typeof descriptions][0]}</small></strong><span>{descriptions[key as keyof typeof descriptions][1]}</span></span><span className="selection-dot" /></button>)}</div>
      <p className="control-note">虚构教学画像，不代表同龄或同类障碍者。</p>
    </div>
    <fieldset className="control-section"><legend><Eye size={16} /> 视觉通道 <span>OPTICAL</span></legend>
      {([{ key: 'blur', label: '视力模糊与老花', max: 8, step: 0.1, unit: 'px' }, { key: 'cataract', label: '晶状体浑浊', max: 100, step: 1, unit: '%' }, { key: 'glaucoma', label: '管状视野收缩', max: 100, step: 1, unit: '%' }] as const).map(item => <label className="range-control" key={item.key}><span>{item.label}<output>{s[item.key]}<small>{item.unit}</small></output></span><input type="range" aria-label={item.label} min="0" max={item.max} step={item.step} value={s[item.key]} style={{ '--range-fill': `${s[item.key] / item.max * 100}%` } as React.CSSProperties} onChange={e => change({ [item.key]: Number(e.target.value) })} /></label>)}
      <div className="check-pair"><label className="check-control"><input type="checkbox" checked={s.scotoma} onChange={e => change({ scotoma: e.target.checked })} />中央暗点</label><label className="check-control"><input type="checkbox" checked={s.glare} onChange={e => change({ glare: e.target.checked })} />强光眩目</label></div>
      <label className="select-label">色觉模式<div className="select-wrap"><select value={s.colorVision} onChange={e => change({ colorVision: e.target.value as SensoryState['colorVision'] })} aria-label="色觉模式"><option value="normal">正常色觉 · Normal</option><option value="protanopia">红色盲 · Protanopia</option><option value="deuteranopia">绿色盲 · Deuteranopia</option><option value="tritanopia">蓝黄色盲 · Tritanopia</option><option value="achromatopsia">全色盲 · Achromatopsia</option></select><ChevronDown size={14} /></div></label>
    </fieldset>
    <fieldset className="control-section"><legend><Hand size={16} /> 运动控制 <span>MOTOR</span></legend><label className="range-control"><span>生理震颤强度<output>{s.tremorLevel}<small>/ 10</small></output></span><input aria-label="生理震颤强度" type="range" min="0" max="10" step="1" value={s.tremorLevel} onChange={e => change({ tremorLevel: +e.target.value })} /></label><p className="control-note">4–6 Hz 偏移真实作用于落点。{uiState.comfortMode ? '舒适模式隐藏晃动准星，物理参数不变。' : '准星是实际点击位置，而不是装饰。'}</p></fieldset>
    <HearingPreview />
    <fieldset className="control-section"><legend><Brain size={16} /> 认知负荷 <span>COGNITIVE</span></legend><label className="check-control"><input type="checkbox" checked={s.cognitive} disabled={uiState.comfortMode} onChange={e => change({ cognitive: e.target.checked })} />倒计时压力与通知干扰</label><p className="control-note">{uiState.comfortMode ? '舒适模式：无干扰、无超时失败。' : '只影响沙盒；调整参数会重新开始本轮。'}</p></fieldset>
  </div>;
}
