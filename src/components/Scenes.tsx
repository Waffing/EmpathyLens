import { Check, ChevronRight, Circle, CreditCard, HeartPulse, Hospital, ShieldCheck, TriangleAlert, Volume2, X, ArrowRight, LockKeyhole } from 'lucide-react';
import type { Mode, SceneId } from '../state/types';

export interface SceneProps { scene: SceneId; mode: Mode; step: number; popup: boolean; active: boolean; elapsed: number; comfort: boolean; slide: number; autoRenew: boolean }
function Action({ id, children, className = '', label, disabled = false }: { id: string; children: React.ReactNode; className?: string; label?: string; disabled?: boolean }) {
  return <button type="button" data-action={id} data-contrast-sample={className === 'hidden-reject' ? '' : undefined} className={className} aria-label={label} disabled={disabled}>{children}</button>;
}
const departments = ['内科', '外科', '骨科', '眼科', '口腔科', '皮肤科', '儿科', '妇产科', '耳鼻喉科', '神经内科', '康复科', '消化内科', '呼吸内科', '心血管科', '中医科', '泌尿外科'];
export function Scenes(p: SceneProps) {
  const after = p.mode === 'after';
  return <div className={`scene-view ${p.scene}-scene ${p.mode}`} data-scene={p.scene} data-mode={p.mode}>
    {p.scene === 'hospital' && <>
      <div className="kiosk-header"><div className="hospital-emblem"><Hospital size={25} /><div><strong>仁和医院</strong><small>RENHE HOSPITAL · 教学模拟</small></div></div><span className="kiosk-time">{after ? <><ShieldCheck size={14} /> 安心挂号</> : `操作剩余 ${Math.max(0, 60 - Math.floor(p.elapsed))} 秒`}</span></div>
      <div className="kiosk-body"><div className="kiosk-steps"><span className="current">1 选择科室</span><i /><span className={p.step > 0 ? 'current' : ''}>2 确认挂号</span><i /><span>3 完成</span></div>
        {p.step === 0 ? <><div className="scene-title"><span className="eyebrow">{after ? '我们一步一步来' : '门诊服务 / 科室列表'}</span><h3>{after ? '您哪里不舒服？' : '请选择就诊科室'}</h3><p className="sample-text" data-contrast-sample>{after ? '选择身体部位，我们帮您找到对应科室。' : '请根据病情选择科室，确认后不可更改。'}</p></div>
          {after ? <div className="symptom-grid"><Action id="eyes" label="眼睛不舒服，推荐眼科"><span className="symptom-icon">◎</span><span>眼睛不舒服<small>眼科 · 可预约</small></span><ChevronRight size={20} /></Action><Action id="wrong" label="胸口不舒服，心内科"><HeartPulse size={26} /><span>胸口不舒服<small>心内科 · 可预约</small></span><ChevronRight size={20} /></Action><Action id="wrong"><span className="symptom-icon">＋</span><span>骨骼或关节痛<small>骨科 · 可预约</small></span><ChevronRight size={20} /></Action><Action id="wrong"><span className="symptom-icon">?</span><span>不确定选什么<small>全科 · 为您分诊</small></span><ChevronRight size={20} /></Action></div> : <><div className="department-grid">{departments.map((d, i) => <Action id={d === '眼科' ? 'eyes' : 'wrong'} key={d}><span className={`availability-dot ${i % 3 === 0 && d !== '眼科' ? 'full' : ''}`} />{d}</Action>)}</div><div className="color-legend"><span><i className="availability-dot" />可预约</span><span><i className="availability-dot full" />已满号</span></div><p className="tiny-notice">温馨提示：请携带有效身份证件、医保卡。初诊患者请先建档，医保患者请先完成授权。</p></>}
        </> : <div className="appointment-card"><span className="eyebrow">确认就诊信息</span><h3>眼科 · 普通门诊</h3><div><span>就诊时间</span><strong>今日 14:00 – 14:30</strong></div><div><span>挂号费用</span><strong>¥ 15.00</strong></div><div><span>号源状态</span><strong className="available"><Check size={16} />有号 · 可预约</strong></div><Action id="confirm" className="primary-action" label="确认眼科挂号">确认挂号 <ArrowRight size={18} /></Action><Action id="back" className="text-action">返回重新选择</Action></div>}
        {after && <Action id="narrate" className="read-aloud"><Volume2 size={18} />语音读给我听</Action>}
      </div><div className="kiosk-footer"><span>自助服务终端 No. 03</span><span>{after ? '大字体 · 大按钮 · 随时可返回' : '技术服务 400-000-0000（模拟）'}</span></div>
      {p.popup && <div className="insurance-popup"><Action id="close" className="tiny-close" label="关闭医保提示"><X size={10} /></Action><strong>医保电子凭证升级</strong><p>开通后即可享受便捷就医服务</p><Action id="trap" className="popup-cta">立即授权并开通</Action></div>}
    </>}
    {p.scene === 'payment' && <>
      <div className="kiosk-header"><div className="hospital-emblem"><CreditCard size={25} /><div><strong>{after ? '我的订阅账单' : '生活优选 · 会员中心'}</strong><small>DEMO ACCOUNT · 无真实扣款</small></div></div><LockKeyhole size={18} /></div>
      <div className="payment-body">{!after ? <><div className="promo-badge">专属福利 · 限时领取</div><h3 className="promo-title">您的补贴<br /><em>还差一步就到账</em></h3><div className="coupon"><span>新人专享补贴</span><strong><small>¥</small> 99</strong><span>开通会员后解锁 · 最高可得</span></div><Action id="trap" className="claim-button">立即领取补贴 <ChevronRight size={20} /></Action><Action id="renew" className="renew-control" label="切换连续包月勾选状态"><span className="fake-checkbox">{p.autoRenew ? '✓' : ''}</span>我已阅读并同意连续包月，¥29/月自动扣款</Action><div className="subscription-fineprint">首月优惠仅限首次开通，每月自动续费，具体以服务协议为准。</div><Action id="unsubscribe" className="hidden-reject">残忍拒绝 / 关闭自动续费</Action></> : <>
        <span className="eyebrow">每一笔支出，都由您决定</span><h3 data-contrast-sample>清楚的账单，安心的选择。</h3><div className="bill-card"><div><strong>生活优选会员</strong><span className="bill-tag">自动续费中</span></div><div className="bill-amount">¥29<span>/ 月</span></div><p>下次扣款：下月 1 日</p><p>关闭后不再自动扣款，已付权益保留至本期结束。</p></div>
        {p.step === 0 ? <div className="equal-actions"><Action id="unsubscribe">关闭自动续费</Action><Action id="keep">保留当前订阅</Action></div> : <div className="confirm-payment"><strong>确认不再续费 ¥29 / 月？</strong><p>请从左端滑至右端，避免误触。</p><div className="slide-confirm" data-action="slide" role="group" aria-label="滑动关闭自动续费"><span className="slide-fill" style={{ width: `${p.slide * 100}%` }} /><span className="slide-handle" style={{ left: `calc(${p.slide * 100}% - ${p.slide * 52}px)` }}><ArrowRight /></span><span>向右滑动确认</span></div><div className="equal-actions"><Action id="confirm" label="无需拖动，确认关闭自动续费">无需拖动 · 确认关闭</Action><Action id="back">返回</Action></div></div>}
      </>}</div><div className="kiosk-footer"><ShieldCheck size={14} />仅为本地教学，绝不产生付款或订阅</div>
    </>}
    {p.scene === 'escape' && <>
      <div className="kiosk-header"><div className="hospital-emblem"><TriangleAlert size={25} /><div><strong>实验室安全控制台</strong><small>BUILDING B / FLOOR 02 · 演练数据</small></div></div><span className="lab-live">● 系统监测中</span></div>
      <div className="escape-body"><div className={`alarm-message ${after ? 'accessible-alarm' : ''}`}><TriangleAlert size={22} /><span>{after ? '3 号阀门异常。请先关闭，再撤离。' : '系统告警：设备状态异常'}</span></div>
        {after && <p className="escape-instruction" data-contrast-sample>请先处理异常，再选择安全出口。</p>}
        <div className="valve-grid">{[1, 2, 3, 4].map(n => <Action key={n} id={n === 3 ? 'valve' : 'wrong'} className={`valve ${n === 3 && p.step === 0 ? 'abnormal' : 'normal'}`} label={after ? `${n}号阀门，${n === 3 && p.step === 0 ? '异常，请关闭' : '正常'}` : `${n}号阀门`}>
          {after ? n === 3 && p.step === 0 ? <TriangleAlert size={28} /> : <Circle size={28} /> : <span className={`lamp ${n === 3 && p.step === 0 ? 'red' : ''}`} />}
          <strong>V-0{n}</strong>{after && <span>{n === 3 && p.step === 0 ? '异常 · 请关闭' : n === 3 ? '已关闭 · 安全' : '正常运行'}</span>}
        </Action>)}</div>
        <div className="escape-plan"><span className="plan-label">疏散路线图 / 示意</span><div className="plan-room room-a">实验室 A</div><div className="plan-room room-b">实验室 B <span>当前位置</span></div><div className="plan-corridor"><span>←</span> 疏散走廊 <span>→</span></div><Action id="exit" className="exit-safe">{after ? <><Check size={18} />安全出口 A</> : <><span className="lamp" />出口 A</>}</Action><Action id="trap" className="exit-blocked">{after ? <><TriangleAlert size={18} />出口 B · 堵塞</> : <><span className="lamp red" />出口 B</>}</Action></div>
        {after ? <Action id="cue" className="read-aloud"><Volume2 size={18} />播放声光提示 · 不闪烁</Action> : <div className="alarm-log" data-contrast-sample><p>14:32:01 WARN V-03 pressure +18.4% / threshold exceeded</p><p>14:32:02 INFO V-01,02,04 check OK / route B unavailable</p><p>14:32:03 SYS waiting manual acknowledgement / auto reset disabled</p></div>}
      </div>
    </>}
  </div>;
}
