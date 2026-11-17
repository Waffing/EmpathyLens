import { ScanEye, ShieldCheck, Zap } from 'lucide-react';
import { useAppDispatch, useAppState } from '../state/AppStateContext';
import { hearingAudio } from '../lib/audio';

export function SafetyBar({ onClear }: { onClear: () => void }) {
  const { uiState } = useAppState();
  const dispatch = useAppDispatch();
  return <header className="safety-bar" aria-label="全局安全栏"><div className="brand"><span className="brand-symbol"><ScanEye size={28} strokeWidth={1.7} /></span><div><h1>EmpathyLens<span>共情之镜</span></h1><p>无障碍共情与诊断实验室</p></div></div><div className="safety-controls"><span className="safety-caption"><ShieldCheck size={13} />您的舒适，始终优先</span><button type="button" className="clear-button" onClick={onClear}><Zap size={15} />一键清除所有感官滤镜<kbd>ESC</kbd></button><label className="comfort-control"><input type="checkbox" role="switch" checked={uiState.comfortMode} onChange={e => { hearingAudio.stop(); dispatch({ type: 'ui/setComfortMode', enabled: e.target.checked }); }} /><span className="switch-track" aria-hidden="true"><span /></span><span>舒适模式<small>减少晕动</small></span></label></div></header>;
}
