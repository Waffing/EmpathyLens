export function CalibrationPage() {
  return <div className="calibration-page">
    <h3>滤镜标定页</h3><p className="sample-large">看见不同的界面</p><p className="sample-medium">请核对文字、颜色与操作目标。</p><p className="sample-small">小字样张：窗口 3 · 验证码 7419 · 服务时间 09:00–17:00</p>
    <div className="color-swatches">{['红', '绿', '黄', '蓝'].map((label, i) => <div className={`swatch swatch-${i}`} key={label}>{label}</div>)}</div>
    <div className="sample-buttons"><button type="button" className="target-small">28px</button><button type="button" className="target-large">52px</button></div>
    <div className="status-lights">{['待处理', '已完成', '需注意'].map((text, i) => <span key={text}><i className={`light light-${i}`} />{text}</span>)}</div>
  </div>;
}
