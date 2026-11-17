import { useEffect, useState } from 'react';

export function CognitiveOverlay() {
  const [remaining, setRemaining] = useState(15);
  const [notice, setNotice] = useState(false);
  useEffect(() => {
    const countdown = setInterval(() => setRemaining(value => Math.max(0, value - 1)), 1000);
    const notifications = setInterval(() => setNotice(true), 6000);
    return () => { clearInterval(countdown); clearInterval(notifications); };
  }, []);
  return <div className="cognitive-overlay">
    <div className="distraction-timer">干扰演示 · {remaining} 秒<progress aria-label="干扰演示倒计时" max="15" value={remaining} /></div>
    {notice && <aside className="distraction-notice"><button type="button" aria-label="关闭系统通知" onClick={() => setNotice(false)}>×</button><strong>系统通知</strong><p>界面设置已保持同步。</p></aside>}
  </div>;
}
