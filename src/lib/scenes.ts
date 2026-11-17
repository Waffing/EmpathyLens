import type { SceneId } from '../state/types';

export const SCENES = {
  hospital: { id: 'hospital', title: '医院自助挂号', english: 'HOSPITAL KIOSK', number: '01', short: '就医', task: '为眼睛不适挂一个眼科普通号。', afterTask: '选择「眼睛不舒服」，再确认眼科挂号。', before: { foreground: '#A0A8B4', background: '#FFFFFF', target: 28, font: 12 }, after: { foreground: '#0F172A', background: '#FFFFFF', target: 56, font: 18 } },
  payment: { id: 'payment', title: '自动续费退订', english: 'SUBSCRIPTION & PAYMENT', number: '02', short: '支付', task: '关闭每月 29 元的连续包月，不领取任何补贴。', afterTask: '查看账单，关闭自动续费并完成二次确认。', before: { foreground: '#B4BAC4', background: '#FFFFFF', target: 18, font: 10 }, after: { foreground: '#0F172A', background: '#FFFFFF', target: 56, font: 18 } },
  escape: { id: 'escape', title: '公共空间应急', english: 'LAB SAFETY CONSOLE', number: '03', short: '应急', task: '找到异常阀门并关闭它，再选择安全出口。', afterTask: '找到三角形警告阀门，关闭后沿安全出口撤离。', before: { foreground: '#8C97A7', background: '#FFFFFF', target: 28, font: 12 }, after: { foreground: '#0F172A', background: '#FFFFFF', target: 56, font: 18 } },
} as const satisfies Record<SceneId, unknown>;
export const ETHICS = '本工具的视觉、听觉与震颤模型为基于公开人因工程学与 WCAG 2.2 标准的启发式交互模拟，旨在促进数字无障碍共情与界面设计改进，不作为临床医学诊断依据。';
export const PRESCRIPTIONS = [
  { title: '让信息真正看得清', standard: '1.4.3 / 1.4.4', before: 'font-size: 12px; color: #A0A8B4;', after: 'font-size: 18px; line-height: 1.6; color: #0F172A;', note: '正文放大并提升对比度；18px 是本项目设计值，并非 WCAG 固定字号。' },
  { title: '让每一次点击有余地', standard: '2.5.5 / 2.5.8', before: 'height: 28px; gap: 4px;', after: 'min-height: 56px; min-width: 56px; gap: 12px;', note: '采用 ≥44×44px 增强目标（AAA）；2.5.8 AA 最低为24×24px，含例外。' },
  { title: '不让颜色独自承担信息', standard: '1.4.1', before: '<span class="red-dot" />', after: '<span><Triangle /> 异常 · 请关闭</span>', note: '颜色、图形和文字共同编码。应急场景采用 Okabe–Ito 蓝与橙。' },
  { title: '给不稳定的手一份确定', standard: '2.5.2 / 3.3.4', before: 'onClick={commitImmediately}', after: 'pointerup → hitTest(actualPoint) → confirm', note: '抬起才激活；可选长按吸附，支付二次滑动确认另设无拖动替代。' },
  { title: '让读屏与键盘都能抵达', standard: '2.1.1 / 4.1.2', before: '<div onClick={action}>…</div>', after: '<button aria-label="确认眼科挂号">…</button>', note: '语义化按钮、可见焦点、状态播报；键盘操作不施加指针震颤。' },
];
