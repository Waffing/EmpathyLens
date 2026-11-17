import { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, SlidersHorizontal, Scan, ArrowUpRight, ShieldCheck, X, ScanEye } from 'lucide-react';
import { SafetyBar } from './components/SafetyBar';
import { Panel } from './components/Panel';
import { SandboxFrame } from './components/SandboxFrame';
import { useAppDispatch, useAppState } from './state/AppStateContext';
import { hearingAudio } from './lib/audio';
import { FilterDefinitions } from './components/FilterDefinitions';
import { SensoryConsole } from './components/SensoryConsole';
import { Diagnostics } from './components/Diagnostics';
import { ETHICS } from './lib/scenes';

export default function App() {
  const dispatch = useAppDispatch();
  const { uiState } = useAppState();
  const [about, setAbout] = useState(false), [clearNotice, setClearNotice] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (about) dialog.current?.showModal(); }, [about]);
  const clear = useCallback(() => { hearingAudio.stop(); dispatch({ type: 'sensory/clear' }); setClearNotice('已安全恢复：所有感官模拟与声音均已关闭。'); setAbout(false); }, [dispatch]);
  useEffect(() => { const keydown = (event: KeyboardEvent) => { if (event.key === 'Escape') clear(); }; window.addEventListener('keydown', keydown); return () => window.removeEventListener('keydown', keydown); }, [clear]);
  useEffect(() => { const media = window.matchMedia('(prefers-reduced-motion: reduce)'); if (media.matches) dispatch({ type: 'ui/setComfortMode', enabled: true }); const change = (e: MediaQueryListEvent) => { if (e.matches) dispatch({ type: 'ui/setComfortMode', enabled: true }); }; media.addEventListener('change', change); return () => media.removeEventListener('change', change); }, [dispatch]);
  return <div className={`app-shell min-h-screen bg-lab-bg text-text-main antialiased ${uiState.comfortMode ? 'comfort-mode' : ''}`}>
    <a href="#workspace" className="skip-link">跳到实验工作区</a><FilterDefinitions /><SafetyBar onClear={clear} />
    <div className="page-intro"><div className="intro-copy"><span className="eyebrow">HUMAN-CENTERED DESIGN / INTERACTIVE LAB 01</span><h2>看见障碍，<span>而不止于看见。</span></h2><p>换一个视角，走过同一段数字生活。让每一次不便，都成为设计改变的起点。</p></div><div className="intro-side"><span className="competition-tag"><span />2026 Qoder · Hack4Good</span><button type="button" onClick={() => setAbout(true)}>实验原理与伦理边界 <ArrowUpRight size={14} /></button></div></div>
    <main className="workspace" id="workspace" tabIndex={-1} aria-label="共情之镜实验工作区">
      <Panel id="console" title="感官模拟矩阵" caption="01 / CONFIGURE" icon={<SlidersHorizontal size={17} />}><SensoryConsole /></Panel>
      <Panel id="sandbox" title="第一视角挑战" caption="02 / EXPERIENCE" icon={<Scan size={18} />}><SandboxFrame /></Panel>
      <Panel id="diagnostics" title="无障碍体格检查" caption="03 / IMPROVE" icon={<Activity size={18} />}><Diagnostics /></Panel>
    </main>
    <div className="ethics-strip"><ShieldCheck size={19} /><div><strong>共情不是替代真实经验，模拟不是医学诊断。</strong><p>{ETHICS} 请邀请真实障碍用户参与设计与测试。</p></div><span>LOCAL FIRST<br />零登录 · 零数据上传</span></div>
    <footer><span><ScanEye size={17} /> EmpathyLens <span>共情之镜</span></span><span>为每一种感知，留一扇门。</span><small>DESIGNED FOR EVERYONE · 2026</small></footer>
    <span className="sr-only" role="status">{clearNotice}</span>
    {about && <dialog ref={dialog} className="about-dialog" aria-labelledby="about-title" onCancel={event => { event.preventDefault(); clear(); }}><button className="about-close" type="button" autoFocus onClick={() => setAbout(false)} aria-label="关闭说明"><X size={22} /></button><span className="eyebrow">THE SCIENCE & THE LIMITS</span><h2 id="about-title">把体验，转译成更好的设计。</h2><p>{ETHICS}</p><dl><dt>视觉模型</dt><dd>SVG 高斯模糊、晶状体对比衰减、Canvas 中央暗点与视野遮罩。色觉使用 Machado 等（2009）完全二色视线性 RGB 近似矩阵；全色盲采用线性亮度灰度。暗点跟随指针模拟注视位置，不使用眼动追踪。</dd><dt>运动模型</dt><dd>4.1–5.9 Hz 正弦叠加与阻尼弹簧响应。准星位置用于实际命中，不等同于个体帕金森症状或临床震颤评估。</dd><dt>听觉模型</dt><dd>两态采用同一段离线合成中文语音；受损态加入 1500 Hz 低通与可静音耳鸣。不能复现真实听觉损失的全部机制。</dd><dt>诊断指标</dt><dd>WCAG 对比度检查选定关键文本的原始设计色，不是滤镜后感知或整页认证。菲茨指数使用固定 240px 假设距离。挫败指数为教学启发式，不是心理测量。</dd><dt>安全与隐私</dt><dd>全部数据仅在当前页面内存中，刷新即清除。语音仅请求本站打包资源，不上传体验数据。舒适模式关闭计时失败、弹窗与动态准星，保持运动计算参数。</dd></dl><button type="button" className="start-button" onClick={() => setAbout(false)}>了解，回到实验室</button></dialog>}
  </div>;
}
