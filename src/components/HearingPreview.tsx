import { useEffect, useState, useSyncExternalStore } from 'react';
import { Ear, Play, Square } from 'lucide-react';
import { HEARING_TEXT, hearingAudio } from '../lib/audio';
import { useAppDispatch, useAppState } from '../state/AppStateContext';

export function HearingPreview() {
  const { sensoryState, uiState } = useAppState();
  const dispatch = useAppDispatch();
  const status = useSyncExternalStore(hearingAudio.subscribe, hearingAudio.getSnapshot);
  const [muted, setMuted] = useState(false);
  const [windowResult, setWindowResult] = useState('');
  useEffect(() => { hearingAudio.setTinnitusMuted(uiState.comfortMode || muted); }, [uiState.comfortMode, muted]);
  useEffect(() => { hearingAudio.stop(); }, [uiState.resetKey]);
  useEffect(() => () => hearingAudio.dispose(), []);
  return <fieldset className="control-section hearing-preview"><legend><Ear size={16} /> 听觉通道 <span>AUDITORY</span></legend>
    <label className="check-control"><input type="checkbox" checked={sensoryState.hearing === 'impaired'} onChange={e => dispatch({ type: 'sensory/change', patch: { hearing: e.target.checked ? 'impaired' : 'normal' } })} />高频听力受损 · 1500 Hz 低通</label>
    <p className="hearing-text">“{HEARING_TEXT}”</p><div className="audio-buttons"><button type="button" onClick={() => void hearingAudio.play('normal')}><Play size={12} />正常试听</button><button type="button" onClick={() => void hearingAudio.play('impaired')}><Play size={12} />受损试听</button><button type="button" aria-label="停止声音" onClick={() => hearingAudio.stop()}><Square size={12} /></button></div>
    <div className="hearing-windows" aria-label="听觉指令练习">{[1, 2, 3].map(n => <button key={n} type="button" onClick={() => setWindowResult(n === 3 ? '已选择3号窗口。验证码7419；有文字辅助时信息无需只靠听觉传递。' : '这不是指令中的窗口。请再次试听或阅读文字辅助。')}>{n}号窗口</button>)}</div><p className="control-note" role="status">{windowResult}</p>
    <label className="check-control tinnitus-control"><input type="checkbox" checked={muted || uiState.comfortMode} disabled={uiState.comfortMode} onChange={e => setMuted(e.target.checked)} />耳鸣静音</label>
    <p className="control-note" role="status" data-audio-phase={status.phase}>{status.message}</p><p className="control-note">请先调低设备音量；数字限幅不等于声压安全保证。</p>
  </fieldset>;
}
