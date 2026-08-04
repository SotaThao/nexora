import {
  QR_APP_FONT_FAMILY,
  QR_APP_FONT_STYLESHEET,
  QR_BUSINESS_DISPLAY_NAME,
  QR_BUSINESS_PHONE,
  QR_PREVIEW_TOAST_MESSAGE,
  getQrPromoLabel,
  type QrPromoMock,
} from './constants'

function escapeHtml(value: string): string {
  return String(value).replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return map[char] ?? char
  })
}

type GuestCopy = {
  nm: string
  ph: string
  cs: string
  go: string
  ok: string
  show: string
  pNm: string
  e1: string
  e2: string
  e3: string
  bk: string
  sv: string
  dt: string
  tm: string
  tmPlaceholder: string
  bkgo: string
  bok: string
  e4: string
}

function getGuestCopy(language: string, brand: string): GuestCopy {
  if (language === 'en') {
    return {
      nm: 'Your name',
      ph: 'Phone number',
      cs: `I agree to receive text messages from ${brand}. Message frequency varies. Reply STOP to cancel, HELP for help. Msg & data rates may apply.`,
      go: '📩 Text Me My Promotion Code',
      ok: 'Promotion code sent via SMS!',
      show: 'Show this code to our staff at checkout 💅',
      pNm: 'e.g. Jessica Smith',
      e1: 'Please enter your name and phone number.',
      e2: 'Phone number must be 10 digits.',
      e3: 'Please agree to receive messages to get your code.',
      bk: '📅 Book an appointment now',
      sv: 'Service',
      dt: 'Date',
      tm: 'Time',
      tmPlaceholder: '— pick a time —',
      bkgo: '✅ Confirm booking',
      bok: '📅 Booked! Confirmation text sent — see you soon 💅',
      e4: 'Please pick a date and time.',
    }
  }
  return {
    nm: 'Tên của bạn',
    ph: 'Số điện thoại',
    cs: `Tôi đồng ý nhận tin nhắn từ ${brand}. Tần suất thay đổi. Reply STOP để hủy, HELP để được hỗ trợ. Có thể tính phí tin nhắn & dữ liệu.`,
    go: '📩 Nhận Promotion Code qua SMS',
    ok: 'Promotion code đã gửi qua SMS!',
    show: 'Đưa code này cho nhân viên khi thanh toán 💅',
    pNm: 'VD: Linh Trần',
    e1: 'Vui lòng điền tên và số điện thoại.',
    e2: 'Số điện thoại chưa đủ 10 số.',
    e3: 'Vui lòng đồng ý nhận tin nhắn để nhận code.',
    bk: '📅 Đặt lịch giữ chỗ luôn',
    sv: 'Dịch vụ',
    dt: 'Ngày',
    tm: 'Giờ',
    tmPlaceholder: '— chọn giờ —',
    bkgo: '✅ Xác nhận đặt lịch',
    bok: '📅 Đã đặt lịch! SMS xác nhận đã gửi — hẹn gặp bạn 💅',
    e4: 'Vui lòng chọn ngày và giờ.',
  }
}

type BuildQrPreviewHtmlArgs = {
  title: string
  body: string
  promo: QrPromoMock
  language: string
  kiosk?: boolean
}

export function buildQrPreviewHtml({
  title,
  body,
  promo,
  language,
  kiosk = false,
}: BuildQrPreviewHtmlArgs): string {
  const safeTitle = escapeHtml(title)
  const safeBody = escapeHtml(body).replace(/\n/g, '<br>')
  const sampleCode = `${promo.codePrefix}-X7K2`
  const brand = escapeHtml(QR_BUSINESS_DISPLAY_NAME)
  const phone = escapeHtml(QR_BUSINESS_PHONE)
  const promoLabel = escapeHtml(getQrPromoLabel(promo, language))
  const copy = getGuestCopy(language, brand)
  const copyJson = JSON.stringify(copy)

  return `<!DOCTYPE html><html lang="${language === 'en' ? 'en' : 'vi'}"><head>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <link href="${QR_APP_FONT_STYLESHEET}" rel="stylesheet">
    <style>
      *{margin:0;padding:0;box-sizing:border-box;font-family:${QR_APP_FONT_FAMILY};}
      body{background:linear-gradient(160deg,#7c3aed,#0a0a0f);color:white;min-height:100vh;padding:20px;}
      .top{display:flex;align-items:center;margin-bottom:16px;}
      .logo{font-size:12px;letter-spacing:2px;opacity:0.6;}
      .card{background:rgba(255,255,255,0.08);backdrop-filter:blur(12px);border-radius:20px;padding:22px;border:1px solid rgba(255,255,255,0.15);}
      h1{font-size:19px;font-weight:800;line-height:1.35;margin-bottom:10px;}
      .promo{background:rgba(255,255,255,0.14);border-radius:12px;padding:12px;font-size:14px;font-weight:700;margin-bottom:12px;text-align:center;}
      .cond{font-size:12px;color:rgba(255,255,255,0.75);line-height:1.6;margin-bottom:16px;}
      label{font-size:12px;letter-spacing:1px;text-transform:uppercase;opacity:0.7;display:block;margin-bottom:6px;}
      input[type=text],input[type=tel],input[type=date],select{width:100%;padding:15px 14px;border-radius:12px;border:none;font-size:16px;font-family:inherit;margin-bottom:14px;background:white;color:#111;}
      .consent{display:flex;gap:10px;align-items:flex-start;font-size:12px;color:rgba(255,255,255,0.8);line-height:1.5;margin-bottom:14px;}
      .consent input{width:20px;height:20px;flex-shrink:0;margin-top:1px;}
      .consent label{display:block;margin:0;font-size:inherit;letter-spacing:normal;text-transform:none;opacity:1;}
      button{width:100%;background:white;color:#7c3aed;border:none;padding:17px;border-radius:14px;font-size:16px;font-weight:800;font-family:inherit;cursor:pointer;}
      button:disabled{opacity:0.5;}
      .success{display:none;text-align:center;padding:10px 0;}
      .success .code{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:26px;font-weight:800;background:rgba(255,255,255,0.15);border-radius:12px;padding:14px;margin:12px 0;letter-spacing:2px;}
      .footer{text-align:center;font-size:12px;color:rgba(255,255,255,0.4);margin-top:16px;}
    </style>${kiosk ? `<style>
      body{padding:40px;max-width:640px;margin:0 auto;}
      h1{font-size:30px;}
      .promo{font-size:20px;padding:18px;}
      .cond{font-size:16px;}
      label{font-size:14px;}
      input[type=text],input[type=tel]{font-size:22px;padding:20px;}
      .consent{font-size:14px;}
      .consent input{width:26px;height:26px;}
      button{font-size:22px;padding:22px;}
      .success .code{font-size:40px;}
      .footer{font-size:13px;}
    </style>` : ''}</head><body>
    <div class="top">
      <div class="logo">${brand.toUpperCase()}</div>
    </div>
    <div class="card">
      <h1>${safeTitle}</h1>
      <div class="promo">${promoLabel}</div>
      <div class="cond">${safeBody}</div>
      <div id="frm">
        <label for="nm">${escapeHtml(copy.nm)}</label>
        <input type="text" id="nm" placeholder="${escapeHtml(copy.pNm)}" autocomplete="name">
        <label for="ph">${escapeHtml(copy.ph)}</label>
        <input type="tel" id="ph" placeholder="(832) 000-0000" inputmode="numeric" autocomplete="tel" maxlength="14">
        <div class="consent">
          <input type="checkbox" id="cs">
          <label for="cs">${escapeHtml(copy.cs)}</label>
        </div>
        <button id="go">${escapeHtml(copy.go)}</button>
      </div>
      <div class="success" id="ok">
        <div style="font-size:34px;">✅</div>
        <div style="font-size:14px;font-weight:600;margin-top:6px;">${escapeHtml(copy.ok)}</div>
        <div class="code">${escapeHtml(sampleCode)}</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.7);">${escapeHtml(copy.show)}</div>
        <button id="bk" style="margin-top:16px;background:rgba(255,255,255,0.15);color:white;border:1px solid rgba(255,255,255,0.3);">${escapeHtml(copy.bk)}</button>
        <div id="bkf" style="display:none;text-align:left;margin-top:16px;">
          <label for="sv">${escapeHtml(copy.sv)}</label>
          <select id="sv">
            <option>💅 Gel Manicure — $35</option>
            <option>🦶 Pedicure Deluxe — $45</option>
            <option>✨ Combo Mani + Pedi — $70</option>
            <option>💎 Dip Powder — $50</option>
            <option>🌸 Full Set Gel-X — $65</option>
          </select>
          <label for="dt">${escapeHtml(copy.dt)}</label>
          <input type="date" id="dt">
          <label for="tm">${escapeHtml(copy.tm)}</label>
          <select id="tm">
            <option value="">${escapeHtml(copy.tmPlaceholder)}</option>
            <option>10:00</option><option>11:00</option><option>12:00</option>
            <option>13:00</option><option>14:00</option><option>15:00</option>
            <option>16:00</option><option>17:00</option><option>18:00</option>
          </select>
          <button id="bkgo">${escapeHtml(copy.bkgo)}</button>
        </div>
        <div id="bok" style="display:none;margin-top:16px;font-size:14px;font-weight:600;background:rgba(16,185,129,0.25);border-radius:12px;padding:14px;">${escapeHtml(copy.bok)}</div>
      </div>
      <div class="footer">${brand} • ${phone}<br>Powered by NEXORA TOUCH</div>
    </div>
    <script>
      var TXT=${copyJson};
      var KIOSK=${kiosk ? 'true' : 'false'};
      function g(id){return document.getElementById(id);}
      function notify(message, level){
        parent.postMessage({ type: '${QR_PREVIEW_TOAST_MESSAGE}', message: message, level: level || 'error' }, '*');
      }
      function kioskFocusables(){
        return Array.prototype.filter.call(
          document.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled])'),
          function(element){return element.offsetParent !== null;}
        );
      }
      g('ph').addEventListener('input',function(){
        var d=this.value.replace(/\\D/g,'').slice(0,10);
        if(d.length>6) this.value='('+d.slice(0,3)+') '+d.slice(3,6)+'-'+d.slice(6);
        else if(d.length>3) this.value='('+d.slice(0,3)+') '+d.slice(3);
        else this.value=d;
      });
      g('go').onclick=function(){
        var nm=g('nm').value.trim();
        var d=g('ph').value.replace(/\\D/g,'');
        if(!nm||!d){notify(TXT.e1,'error');return;}
        if(d.length<10){notify(TXT.e2,'error');return;}
        if(!g('cs').checked){notify(TXT.e3,'error');return;}
        g('frm').style.display='none';
        g('ok').style.display='block';
        notify(TXT.ok,'success');
        if(KIOSK){ T=setTimeout(reset,8000); }
      };
      var T=null;
      function reset(){
        g('ok').style.display='none'; g('frm').style.display='block';
        g('nm').value=''; g('ph').value=''; g('cs').checked=false;
        g('bk').style.display=''; g('bkf').style.display='none'; g('bok').style.display='none';
        g('dt').value=''; g('tm').selectedIndex=0; g('sv').selectedIndex=0;
      }
      g('bk').onclick=function(){
        if(T){clearTimeout(T);T=null;}
        this.style.display='none';
        g('bkf').style.display='block';
      };
      g('bkgo').onclick=function(){
        if(!g('dt').value||!g('tm').value){notify(TXT.e4,'error');return;}
        g('bkf').style.display='none';
        g('bok').style.display='block';
        notify(TXT.bok,'success');
        if(KIOSK){ T=setTimeout(reset,8000); }
      };
      document.addEventListener('keydown',function(event){
        if (KIOSK && event.key === 'Escape') {
          event.preventDefault();
          parent.postMessage({ type: 'nexora-kiosk-close' }, '*');
          return;
        }
        if (!KIOSK || event.key !== 'Tab') return;
        var focusable=kioskFocusables();
        if(!focusable.length)return;
        var first=focusable[0];
        var last=focusable[focusable.length-1];
        if(event.shiftKey && document.activeElement === first){
          event.preventDefault(); last.focus();
        }else if(!event.shiftKey && document.activeElement === last){
          event.preventDefault(); first.focus();
        }
      });
      window.addEventListener('message',function(event){
        if(!KIOSK || event.source !== parent || !event.data || event.data.type !== 'nexora-kiosk-focus')return;
        var focusable=kioskFocusables();
        if(!focusable.length)return;
        var target=event.data.edge === 'last' ? focusable[focusable.length-1] : focusable[0];
        target.focus();
      });
    </script>
    </body></html>`
}

type BuildQrPosterHtmlArgs = {
  promoLabel: string
  qrDataUrl: string
  publicPath: string
  title: string
  step1: string
  step2: string
  step3: string
  secondary: string
}

export function buildQrPosterHtml({
  promoLabel,
  qrDataUrl,
  publicPath,
  title,
  step1,
  step2,
  step3,
  secondary,
}: BuildQrPosterHtmlArgs): string {
  const brand = escapeHtml(QR_BUSINESS_DISPLAY_NAME)
  const phone = escapeHtml(QR_BUSINESS_PHONE)
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
  <link href="${QR_APP_FONT_STYLESHEET}" rel="stylesheet">
  <style>
    @page{size:A4;margin:0;}
    *{margin:0;padding:0;box-sizing:border-box;font-family:${QR_APP_FONT_FAMILY};}
    body{width:210mm;min-height:297mm;padding:22mm 18mm;background:white;color:#111;text-align:center;}
    .brand{font-size:13px;letter-spacing:4px;color:#7c3aed;font-weight:800;margin-bottom:10mm;}
    h1{font-size:34px;font-weight:900;line-height:1.25;margin-bottom:8mm;}
    .promo{display:inline-block;border:3px solid #7c3aed;color:#7c3aed;border-radius:16px;padding:14px 26px;font-size:24px;font-weight:800;margin-bottom:10mm;}
    .qr{margin-bottom:10mm;}
    .qr img{width:320px;height:320px;border:1px solid #ddd;border-radius:12px;padding:12px;}
    .steps{display:inline-block;text-align:left;font-size:17px;line-height:2.1;margin-bottom:8mm;}
    .steps b{display:inline-block;width:26px;height:26px;line-height:26px;text-align:center;background:#7c3aed;color:white;border-radius:50%;margin-right:10px;font-size:14px;}
    .en{font-size:14px;color:#666;margin-bottom:10mm;}
    .footer{font-size:13px;color:#888;border-top:1px solid #eee;padding-top:6mm;}
  </style></head><body>
    <div class="brand">${brand.toUpperCase()}</div>
    <h1>${escapeHtml(title)}</h1>
    <div class="promo">${escapeHtml(promoLabel)}</div>
    <div class="qr"><img src="${qrDataUrl}" alt="QR"></div>
    <div class="steps">
      <div><b>1</b> ${escapeHtml(step1)}</div>
      <div><b>2</b> ${escapeHtml(step2)}</div>
      <div><b>3</b> ${escapeHtml(step3)}</div>
    </div>
    <div class="en">${escapeHtml(secondary)}</div>
    <div class="footer">${brand} • ${phone} • ${escapeHtml(publicPath)}</div>
  </body></html>`
}
