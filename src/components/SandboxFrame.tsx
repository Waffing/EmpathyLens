import { useEffect, useRef, useState } from 'react';
import type { MouseEvent, PointerEvent } from 'react';
import { ArrowRight, CheckCircle2, Clock3, Crosshair, Hospital, CreditCard, Siren, Play, RotateCcw, Info, Volume2 } from 'lucide-react';
import { useAppDispatch, useAppState } from '../state/AppStateContext';
import { averageOffset, frustration } from '../lib/metrics';
import { SCENES } from '../lib/scenes';
import { hitTarget, stepTremor } from '../lib/tremor';
import type { Point, SpringState } from '../lib/tremor';
import type { Mode, SceneId, Trial } from '../state/types';
import { hearingAudio } from '../lib/audio';
import { Scenes } from './Scenes';

export function SandboxFrame() {
  const { uiState } = useAppState();
  const dispatch = useAppDispatch();
  const icons = { hospital: Hospital, payment: CreditCard, escape: Siren };
  return <div className="sandbox-content"><nav className="scene-tabs" aria-label="选择挑战场景">{Object.values(SCENES).map(scene => { const Icon = icons[scene.id]; return <button type="button" aria-pressed={uiState.sceneId === scene.id} key={scene.id} onClick={() => { hearingAudio.stop(); dispatch({ type: 'ui/scene', sceneId: scene.id }); }}><Icon size={17} /><span>{scene.title}</span><small>{scene.number}</small></button>; })}</nav>
    <div className="mode-toolbar"><span className="section-caption">同一个任务，不同的设计</span><div className="mode-toggle" aria-label="界面版本">{(['before', 'after'] as Mode[]).map(mode => <button type="button" key={mode} aria-pressed={uiState.mode === mode} className={mode} onClick={() => { hearingAudio.stop(); dispatch({ type: 'ui/mode', mode }); }}>{mode === 'before' ? 'Before · 传统界面' : 'After · 无障碍重构'}</button>)}</div></div>
    <TrialStage key={uiState.resetKey} scene={uiState.sceneId} mode={uiState.mode} />
  </div>;
}
function TrialStage({ scene, mode }: { scene: SceneId; mode: Mode }) {
  const { sensoryState: s, uiState, profileName } = useAppState();
  const dispatch = useAppDispatch();
  const frame = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null), cursor = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0, inside: false });
  const spring = useRef<SpringState>({ x: 0, y: 0, vx: 0, vy: 0 });
  const down = useRef<{ at: number; point: Point; slide: boolean } | null>(null);
  const start = useRef(0), finished = useRef(false);
  const empty: Trial = { sceneId: scene, mode, status: 'idle', elapsed: 0, clicks: 0, errors: 0, traps: 0, offsetTotal: 0, pointerClicks: 0, keyboardClicks: 0, profileName, sensory: { ...s }, comfort: uiState.comfortMode, timestamp: Date.now() };
  const live = useRef<Trial>(empty);
  const [runNumber, setRunNumber] = useState(0);
  const [trial, setTrial] = useState(empty), [step, setStep] = useState(0), [popup, setPopup] = useState(false), [slide, setSlide] = useState(0), [autoRenew, setAutoRenew] = useState(true), [notice, setNotice] = useState('准备好后开始。滤镜只作用于下方设备区域。'), [cue, setCue] = useState(false);
  const update = (next: Trial, save = false) => { live.current = next; setTrial(next); dispatch({ type: save ? 'trial/save' : 'trial/live', trial: next }); };
  function finish(status: 'success' | 'timeout') {
    if (finished.current || live.current.status !== 'running') return;
    finished.current = true;
    const elapsed = (performance.now() - start.current) / 1000;
    update({ ...live.current, status, elapsed: status === 'timeout' ? 15 : Math.round(elapsed * 100) / 100 }, true);
    setPopup(false); setNotice(status === 'success' ? '任务完成。改变设计，比要求每个人更努力更有效。' : '15 秒体验结束。不是您做得不够好，试试无障碍重构。');
  }
  useEffect(() => {
    if (trial.status !== 'running') return;
    const timer = window.setInterval(() => {
      const elapsed = (performance.now() - start.current) / 1000;
      if (!uiState.comfortMode && elapsed >= 15) { finish('timeout'); return; }
      update({ ...live.current, elapsed });
    }, 100);
    return () => clearInterval(timer);
  }, [trial.status, uiState.comfortMode]);
  useEffect(() => {
    if (trial.status !== 'running' || uiState.comfortMode) return;
    const timers: number[] = [];
    if (mode === 'before' && scene === 'hospital') timers.push(window.setTimeout(() => setPopup(true), 3200));
    if (s.cognitive) timers.push(window.setTimeout(() => setPopup(true), 6500), window.setTimeout(() => setPopup(true), 10500));
    return () => timers.forEach(clearTimeout);
  }, [trial.status, mode, scene, s.cognitive, uiState.comfortMode, runNumber]);
  useEffect(() => { if (!cue) return; const timer = window.setTimeout(() => setCue(false), 2400); return () => clearTimeout(timer); }, [cue]);
  useEffect(() => {
    const element = frame.current!, target = canvas.current!, ctx = target.getContext('2d')!;
    let width = element.clientWidth, height = element.clientHeight, raf = 0, previous = performance.now();
    const resize = () => { width = element.clientWidth; height = element.clientHeight; const dpr = Math.min(2, window.devicePixelRatio || 1); target.width = width * dpr; target.height = height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    const observer = new ResizeObserver(resize); observer.observe(element); resize();
    const draw = (time: number) => {
      spring.current = stepTremor(spring.current, time / 1000, (time - previous) / 1000, s.tremorLevel); previous = time;
      ctx.clearRect(0, 0, width, height);
      if (s.cataract) { ctx.fillStyle = `rgba(255,224,151,${s.cataract / 100 * 0.28})`; ctx.fillRect(0, 0, width, height); }
      const r = element.getBoundingClientRect();
      const x = pointer.current.inside ? pointer.current.x - r.left : width / 2, y = pointer.current.inside ? pointer.current.y - r.top : height / 2;
      if (s.scotoma) { const g = ctx.createRadialGradient(x, y, 8, x, y, 82); g.addColorStop(0, 'rgba(15,23,42,.98)'); g.addColorStop(0.55, 'rgba(15,23,42,.94)'); g.addColorStop(1, 'rgba(15,23,42,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, width, height); }
      if (s.glaucoma) { const radius = Math.min(width, height) * (0.48 - s.glaucoma / 100 * 0.35); const g = ctx.createRadialGradient(width / 2, height / 2, radius, width / 2, height / 2, radius + Math.min(width, height) * 0.38); g.addColorStop(0, 'transparent'); g.addColorStop(1, `rgba(5,10,20,${s.glaucoma / 100 * 0.98})`); ctx.fillStyle = g; ctx.fillRect(0, 0, width, height); }
      if (s.glare) { const g = ctx.createRadialGradient(width * 0.68, height * 0.3, 0, width * 0.68, height * 0.3, width * 0.6); g.addColorStop(0, 'rgba(255,255,240,.90)'); g.addColorStop(0.3, 'rgba(255,255,240,.5)'); g.addColorStop(1, 'transparent'); ctx.fillStyle = g; ctx.fillRect(0, 0, width, height); }
      if (cursor.current) { cursor.current.style.display = pointer.current.inside && s.tremorLevel > 0 && !uiState.comfortMode ? 'block' : 'none'; cursor.current.style.transform = `translate(${x + spring.current.x}px,${y + spring.current.y}px)`; }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { observer.disconnect(); cancelAnimationFrame(raf); };
  }, [s, uiState.comfortMode]);
  function begin() { hearingAudio.stop(); setRunNumber(v => v + 1); start.current = performance.now(); finished.current = false; setStep(0); setPopup(false); setSlide(0); setAutoRenew(true); setNotice('体验进行中；找不到入口时，可以随时按 ESC。'); update({ ...empty, status: 'running', timestamp: Date.now() }); }
  function action(id: string | null, offset: number, keyboard = false) {
    if (popup && id !== 'close' && id !== 'trap') id = null;
    if (id === 'narrate') { void hearingAudio.play(s.hearing, scene); return; }
    if (id === 'cue') { setCue(true); void hearingAudio.cue(); return; }
    if (live.current.status !== 'running') { setNotice('请先点击上方“开始 15 秒挑战”，再操作设备。'); return; }
    if (!uiState.comfortMode && performance.now() - start.current >= 15000) { finish('timeout'); return; }
    let error = false, trap = false, success = false;
    if (id === 'close') setPopup(false);
    else if (id === 'back') { setStep(0); setSlide(0); }
    else if (scene === 'hospital' && id === 'eyes') { setStep(1); setNotice('已选眼科，请核对信息并确认挂号。'); }
    else if (scene === 'hospital' && id === 'confirm' && step === 1) success = true;
    else if (scene === 'payment' && id === 'renew') setAutoRenew(v => !v);
    else if (scene === 'payment' && id === 'unsubscribe') { if (mode === 'before') success = true; else { setStep(1); setNotice('请完成二次确认；也可使用无需拖动的确认按钮。'); } }
    else if (scene === 'payment' && id === 'confirm' && step === 1) success = true;
    else if (scene === 'escape' && id === 'valve' && step === 0) { setStep(1); setNotice('异常阀门已关闭，请选择安全出口 A。'); }
    else if (scene === 'escape' && id === 'exit' && step === 1) success = true;
    else { error = true; trap = id === 'trap'; setNotice(trap ? '误触了诱导或危险选项。这里只是模拟，不会实际扣款。' : '落点没有命中当前任务目标，请再试一次。'); }
    update({ ...live.current, clicks: live.current.clicks + 1, errors: live.current.errors + +error, traps: live.current.traps + +trap, offsetTotal: live.current.offsetTotal + offset, pointerClicks: live.current.pointerClicks + +!keyboard, keyboardClicks: live.current.keyboardClicks + +keyboard, elapsed: (performance.now() - start.current) / 1000 });
    if (success) finish('success');
  }
  function targets() { return Array.from(frame.current!.querySelectorAll<HTMLElement>(popup ? '.insurance-popup [data-action], .cognitive-popup [data-action]' : '[data-action]')).filter(e => !(e as HTMLButtonElement).disabled && e.getClientRects().length > 0).map(e => { const r = e.getBoundingClientRect(); return { id: e.dataset.action!, left: r.left, top: r.top, width: r.width, height: r.height }; }); }
  function actual(x: number, y: number) { return { x: x + spring.current.x, y: y + spring.current.y }; }
  function onDown(e: PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    e.preventDefault();
    const el = (e.target as HTMLElement).closest<HTMLElement>('button'); el?.focus();
    pointer.current = { x: e.clientX, y: e.clientY, inside: true };
    const point = actual(e.clientX, e.clientY), rect = frame.current!.querySelector('[data-action="slide"]')?.getBoundingClientRect();
    down.current = { at: performance.now(), point, slide: !!rect && point.x >= rect.left && point.x <= rect.left + 60 && point.y >= rect.top && point.y <= rect.bottom };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onMove(e: PointerEvent<HTMLDivElement>) {
    pointer.current = { x: e.clientX, y: e.clientY, inside: true };
    if (down.current?.slide) { const rect = frame.current!.querySelector('[data-action="slide"]')!.getBoundingClientRect(); const point = actual(e.clientX, e.clientY); setSlide(Math.max(0, Math.min(1, (point.x - rect.left - 26) / (rect.width - 52)))); }
  }
  function onUp(e: PointerEvent<HTMLDivElement>) {
    if (!down.current) return;
    const held = down.current; down.current = null;
    const point = actual(e.clientX, e.clientY), offset = Math.hypot(spring.current.x, spring.current.y);
    const r = frame.current!.getBoundingClientRect();
    if (point.x < r.left || point.x > r.right || point.y < r.top || point.y > r.bottom) { action(null, offset); return; }
    if (held.slide) { const rect = frame.current!.querySelector('[data-action="slide"]')!.getBoundingClientRect(); const valid = point.x >= rect.right - 35 && Math.abs(point.y - (rect.top + rect.height / 2)) <= 36 && performance.now() - held.at >= 250; action(valid ? 'confirm' : null, offset); if (!valid) setSlide(0); return; }
    const buffer = mode === 'after' && performance.now() - held.at >= 450 && Math.hypot(point.x - held.point.x, point.y - held.point.y) < 65 ? 12 : 0;
    action(hitTarget(point, targets(), buffer), offset);
  }
  function onClick(e: MouseEvent<HTMLDivElement>) {
    e.preventDefault(); e.stopPropagation();
    if (e.detail === 0) action((e.target as HTMLElement).closest<HTMLElement>('[data-action]')?.dataset.action ?? null, 0, true);
  }
  return <>
    <div className="task-brief"><div className="task-icon"><Crosshair size={21} /></div><div><span className="eyebrow">您的微任务 / {uiState.comfortMode ? '不限时体验' : '15 秒挑战'}</span><h3>{mode === 'after' ? SCENES[scene].afterTask : SCENES[scene].task}</h3></div><button type="button" className="start-button" onClick={begin}>{trial.status === 'idle' ? <Play size={15} /> : <RotateCcw size={15} />}{trial.status === 'idle' ? (uiState.comfortMode ? '开始舒适体验' : '开始 15 秒挑战') : '重新体验'}</button></div>
    {trial.status === 'running' && !uiState.comfortMode && <div className="challenge-countdown" aria-label={`挑战剩余 ${Math.max(0, Math.ceil(15 - trial.elapsed))} 秒`}><span>体验剩余 <b>{Math.max(0, Math.ceil(15 - trial.elapsed))}</b> 秒</span><progress max={15} value={Math.max(0, 15 - trial.elapsed)} /></div>}
    <div className="device-meta"><span><i className={trial.status === 'running' ? 'status-dot active' : 'status-dot'} /> {SCENES[scene].english}</span><span>{mode === 'before' ? '传统缺陷态' : '无障碍重构态'} <span className="meta-divider">/</span> {profileName}</span></div>
    <div className={`device-frame ${s.tremorLevel ? 'tremor-active' : ''} ${cue && !uiState.comfortMode ? 'cue-active' : ''}`} ref={frame} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={() => { down.current = null; setSlide(0); }} onLostPointerCapture={() => { down.current = null; }} onPointerLeave={() => { pointer.current.inside = false; }} onClickCapture={onClick} aria-label="感官模拟挑战沙盒">
      <div className="sensory-content" style={{ filter: 'url(#sensory-optics)' }}><Scenes scene={scene} mode={mode} step={step} popup={popup && scene === 'hospital' && mode === 'before'} active={trial.status === 'running'} elapsed={trial.elapsed} comfort={uiState.comfortMode} slide={slide} autoRenew={autoRenew} />
      {popup && !(scene === 'hospital' && mode === 'before') && <div className="cognitive-popup"><strong>系统通知</strong><p>您还有 3 项未完成事项，请及时处理。</p><button data-action="close" type="button">稍后处理</button><button data-action="trap" type="button">立即前往</button></div>}</div>
      <canvas className="sensory-mask" ref={canvas} aria-hidden="true" />{s.glare && <svg className="sensory-mask" aria-hidden="true"><rect width="100%" height="100%" filter="url(#glare-diffusion)" /></svg>}
      <div className="virtual-cursor" ref={cursor} aria-hidden="true"><Crosshair size={29} /></div>
    </div>
    <div className="live-metrics" aria-label="本轮实时指标"><div><Clock3 size={15} /><span>任务耗时</span><strong>{trial.elapsed.toFixed(1)}<small>s</small></strong></div><div><Crosshair size={15} /><span>平均点击偏移</span><strong>{averageOffset(trial).toFixed(1)}<small>px</small></strong></div><div><span className="metric-marker">×</span><span>误触陷阱</span><strong>{trial.traps}<small>次</small></strong></div><div><span className="metric-marker">↗</span><span>挫败指数</span><strong>{frustration(trial)}<small>/ 100</small></strong></div></div>
    <div className={`trial-notice ${trial.status}`} role="status">{trial.status === 'success' ? <CheckCircle2 size={18} /> : <Info size={17} />}<span>{notice}</span>{trial.status === 'success' && mode === 'before' && <button type="button" onClick={() => dispatch({ type: 'ui/mode', mode: 'after' })}>体验重构 <ArrowRight size={14} /></button>}</div>
    <div className="stage-explainer"><div><span className="explainer-number">01</span><strong>代入一个视角</strong><p>选择人物画像或调整参数。</p></div><div><span className="explainer-number">02</span><strong>完成同一个任务</strong><p>保留参数，切换 Before / After。</p></div><div><span className="explainer-number">03</span><strong>把共情变成改造</strong><p>阅读处方，带走您的体检报告。</p></div></div>
    <p className="sandbox-note"><Volume2 size={14} />声音仅在主动点击后播放。After 可长按 450ms 获得 12px 邻近吸附；键盘 Enter/空格正常操作，不施加震颤。</p>
  </>;
}
