import json
import os
import re
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(os.environ.get('EMPATHY_OUTPUT', str(ROOT / 'artifacts')))
OUT.mkdir(parents=True, exist_ok=True)
BASE = os.environ.get('EMPATHY_URL', 'http://127.0.0.1:5178').rstrip('/')
results = []
errors = []
external = []

def record(name, **details):
    results.append({'test': name, 'passed': True, **details})
    print('PASS:', name, flush=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1440, 'height': 1040}, device_scale_factor=1, accept_downloads=True)
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('console', lambda msg: errors.append(msg.text) if msg.type == 'error' else None)
    page.on('request', lambda req: external.append(req.url) if not req.url.startswith((BASE, 'data:', 'blob:')) else None)
    try:
        assert context.cookies() == []
        response = page.goto(BASE)
        page.wait_for_load_state('networkidle')
        expect(page.get_by_role('heading', name='感官模拟矩阵', exact=True)).to_be_visible()
        assert response is not None and response.status == 200
        assert page.url.rstrip('/') == BASE
        record('anonymous fresh context opens app without login', status=response.status, final_url=page.url)
        page.screenshot(path=str(OUT / 'desktop-before.png'), full_page=True)
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        record('desktop initial render; no horizontal overflow')
        for label, blur, cataract, tremor, color in [('张奶奶', '3','55','3','normal'),('小林','0','0','0','protanopia'),('李叔','1','15','7','normal')]:
            page.get_by_role('button', name=re.compile('^'+label)).click()
            expect(page.get_by_role('slider', name='视力模糊与老花')).to_have_value(blur)
            expect(page.get_by_role('slider', name='晶状体浑浊')).to_have_value(cataract)
            expect(page.get_by_role('slider', name='生理震颤强度')).to_have_value(tremor)
            expect(page.get_by_label('色觉模式', exact=True)).to_have_value(color)
            record('persona '+label)
        page.keyboard.press('Escape')
        expect(page.get_by_role('slider', name='生理震颤强度')).to_have_value('0')
        expect(page.get_by_role('slider', name='视力模糊与老花')).to_have_value('0')
        record('Escape clears all persona effects')
        def switch_scene(name, mode):
            page.get_by_role('button', name=re.compile('^'+name)).click()
            page.get_by_role('button', name='Before · 传统界面' if mode == 'before' else 'After · 无障碍重构', exact=True).click()
        def start():
            page.get_by_role('button', name=re.compile('^开始 (15 秒挑战|舒适体验)$|^开始舒适体验$')).click()
        def success():
            expect(page.locator('.trial-notice')).to_contain_text('任务完成', timeout=4000)
        for mode in ['before','after']:
            switch_scene('医院自助挂号',mode)
            start()
            page.get_by_role('button', name='眼科' if mode=='before' else '眼睛不舒服，推荐眼科', exact=True).click()
            page.get_by_role('button', name='确认眼科挂号', exact=True).click()
            success()
            record('hospital '+mode, metrics=page.locator('.live-metrics').inner_text())
        page.screenshot(path=str(OUT/'desktop-after.png'),full_page=True)
        for mode in ['before','after']:
            switch_scene('自动续费退订',mode)
            start()
            if mode=='before':
                page.get_by_role('button',name=re.compile('^立即领取补贴')).click()
                expect(page.locator('.trial-notice')).to_contain_text('误触了诱导')
                page.get_by_role('button',name='残忍拒绝 / 关闭自动续费',exact=True).click()
            else:
                page.get_by_role('button',name='关闭自动续费',exact=True).click()
                page.get_by_role('button',name='无需拖动，确认关闭自动续费',exact=True).click()
            success()
            record('payment '+mode, metrics=page.locator('.live-metrics').inner_text())
        switch_scene('自动续费退订','after');start()
        page.get_by_role('button',name='关闭自动续费',exact=True).click()
        page.locator('.slide-confirm').scroll_into_view_if_needed()
        rect=page.locator('.slide-confirm').bounding_box()
        page.mouse.move(rect['x']+26,rect['y']+28);page.mouse.down()
        page.mouse.move(rect['x']+rect['width']-20,rect['y']+28,steps=24)
        page.wait_for_timeout(300)
        page.mouse.up();success();record('payment actual pointer slide confirmation')
        for mode in ['before','after']:
            switch_scene('公共空间应急',mode);start()
            page.get_by_role('button',name='3号阀门' if mode=='before' else '3号阀门，异常，请关闭',exact=True).click()
            page.get_by_role('button',name='出口 A' if mode=='before' else '安全出口 A',exact=True).click()
            success();record('escape '+mode)
        switch_scene('医院自助挂号','after');start()
        page.get_by_role('button',name='眼睛不舒服，推荐眼科',exact=True).focus();page.keyboard.press('Enter')
        page.get_by_role('button',name='确认眼科挂号',exact=True).focus();page.keyboard.press('Space')
        success();record('keyboard Enter and Space complete task')
        for value in ['normal','protanopia','deuteranopia','tritanopia','achromatopsia']:
            page.get_by_label('色觉模式',exact=True).select_option(value)
            assert page.locator('#sensory-optics feColorMatrix').count() == (1 if value=='normal' else 2)
        page.get_by_label('中央暗点',exact=True).check()
        page.get_by_label('强光眩目',exact=True).check()
        page.get_by_role('slider',name='管状视野收缩').fill('80')
        page.screenshot(path=str(OUT/'visual-masks.png'),full_page=True)
        record('all five color modes and canvas field masks')
        page.keyboard.press('Escape')
        page.get_by_role('slider',name='生理震颤强度').fill('10')
        switch_scene('自动续费退订','before');start()
        page.get_by_role('button',name='残忍拒绝 / 关闭自动续费',exact=True).scroll_into_view_if_needed()
        page.wait_for_timeout(150)
        target=page.get_by_role('button',name='残忍拒绝 / 关闭自动续费',exact=True).bounding_box()
        for i in range(4):
            page.mouse.click(target['x']+target['width']/2,target['y']+target['height']/2)
            if '任务完成' in page.locator('.trial-notice').inner_text():break
        offset=page.locator('.live-metrics>div').nth(1).locator('strong').inner_text()
        assert float(offset.replace('px','').strip()) > 0
        record('tremor applied to real pointer click', average_offset=offset)
        page.keyboard.press('Escape')
        page.get_by_role('button',name='正常试听',exact=True).click()
        expect(page.locator('[data-audio-phase]')).to_have_attribute('data-audio-phase','playing',timeout=10000)
        page.get_by_role('button',name='受损试听',exact=True).click()
        expect(page.locator('[data-audio-phase]')).to_contain_text('1500 Hz')
        page.keyboard.press('Escape')
        expect(page.locator('[data-audio-phase]')).to_have_attribute('data-audio-phase','stopped')
        record('same-origin normal/impaired audio playback and Escape stop')
        switch_scene('医院自助挂号','before');start()
        expect(page.get_by_role('button',name='关闭医保提示')).to_be_visible(timeout=6000)
        page.get_by_role('button',name='关闭医保提示').click()
        expect(page.get_by_role('button',name='关闭医保提示')).to_have_count(0)
        record('small insurance popup can be dismissed')
        expect(page.locator('.trial-notice')).to_contain_text('15 秒体验结束',timeout=17000)
        record('15-second timeout stores actual failed trial')
        page.get_by_role('switch').check()
        expect(page.get_by_label('倒计时压力与通知干扰',exact=True)).to_be_disabled()
        start();page.wait_for_timeout(15500)
        expect(page.locator('.trial-notice')).not_to_contain_text('15 秒体验结束')
        assert page.locator('.insurance-popup').count()==0
        record('comfort mode suppresses popups and removes deadline')
        page.keyboard.press('Escape')
        samples = []
        for label, scene_id, before_color in [('医院自助挂号','hospital','rgb(160, 168, 180)'),('自动续费退订','payment','rgb(180, 186, 196)'),('公共空间应急','escape','rgb(140, 151, 167)')]:
            for mode in ['before','after']:
                switch_scene(label,mode)
                sample = page.locator('[data-contrast-sample]')
                actual_color = sample.evaluate('(el)=>getComputedStyle(el).color')
                assert actual_color == (before_color if mode=='before' else 'rgb(15, 23, 42)'), (scene_id,mode,actual_color)
                if mode=='after':
                    sizes=page.locator('.scene-view [data-action]').evaluate_all('(els)=>els.map(e=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height}))')
                    assert all(r['w']>=44 and r['h']>=52 for r in sizes), sizes
                samples.append({'scene':scene_id,'mode':mode,'color':actual_color})
        record('diagnostic color samples equal rendered CSS and after targets >=44x52', samples=samples)
        audio_response=page.evaluate('''() => { const context=new OfflineAudioContext(1,44100,44100);const filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1500;filter.Q.value=.707;const f=new Float32Array([500,1500,6000]);const m=new Float32Array(3);const ph=new Float32Array(3);filter.getFrequencyResponse(f,m,ph);return Array.from(m); }''')
        assert audio_response[2] < audio_response[0]*.1, audio_response
        record('native Web Audio 1500Hz lowpass suppresses 6000Hz', frequency_response=audio_response)
        page.get_by_role('button',name='3号窗口',exact=True).click()
        expect(page.get_by_text('已选择3号窗口。验证码7419；有文字辅助时信息无需只靠听觉传递。',exact=True)).to_be_visible()
        record('hearing instruction window selection')
        with page.expect_download() as pending:
            page.get_by_role('button',name='导出无障碍共情体检报告',exact=True).click()
        download=pending.value;download.save_as(str(OUT/'empathy-report.png'))
        data=(OUT/'empathy-report.png').read_bytes()
        assert data[:8]==b'\x89PNG\r\n\x1a\n'
        assert int.from_bytes(data[16:20],'big')==1200 and int.from_bytes(data[20:24],'big')==1600
        record('native Canvas PNG download', width=1200,height=1600,bytes=len(data))
        page.get_by_role('button',name='实验原理与伦理边界',exact=True).click()
        expect(page.get_by_role('dialog')).to_be_visible()
        page.keyboard.press('Escape')
        expect(page.get_by_role('dialog')).to_have_count(0)
        record('ethics dialog and Escape recovery')
        page.set_viewport_size({'width':390,'height':844})
        page.screenshot(path=str(OUT/'mobile.png'),full_page=True)
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        record('390px mobile layout without horizontal overflow')
        assert not external, external
        assert not errors,errors
        record('no external asset requests or browser errors', requests=external,errors=errors)
    except Exception as error:
        page.screenshot(path=str(OUT/'failure.png'),full_page=True)
        results.append({'test':'execution','passed':False,'error':str(error)})
        raise
    finally:
        (OUT/'browser-results.json').write_text(json.dumps({'base':BASE,'results':results,'errors':errors,'externalRequests':external},ensure_ascii=False,indent=2),encoding='utf-8')
        browser.close()
