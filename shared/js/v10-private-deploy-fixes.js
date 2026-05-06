(function(){
  const cfg = (window.HR_SUPABASE_CONFIG = window.HR_SUPABASE_CONFIG || {});
  cfg.attendance = Object.assign({
    qrRequired:false,
    reminderInPageHour:10,
    reminderPushHour:9,
    reminderPushMinute:30,
    gpsSamples:18,
    gpsSampleWindowMs:30000,
    gpsTargetAccuracyMeters:15,
    gpsMaxAcceptableAccuracyMeters:90,
    gpsSafetyBufferMeters:90,
    gpsUncertainReviewOnly:true
  }, cfg.attendance || {}, { qrRequired:false });
  cfg.security = Object.assign({ allowLocalFallback:false }, cfg.security || {});
  try { delete cfg.security.allowLocalDemo; } catch {}
  cfg.cacheVersion = cfg.cacheVersion || 'v31-production-deploy-ready-keep-dev-files';
  cfg.deployment = Object.assign({}, cfg.deployment || {}, { packageVersion: 'v31-production-deploy-ready-keep-dev-files' });
  window.HR_QR_REQUIRED = false;
  window.HR_PRIVATE_DEPLOY_BUNDLE = true;

  function toast(msg,type='ok',ms=5000){
    if(!msg) return;
    document.querySelectorAll('.hr-toast.v10').forEach(t=>t.remove());
    const el=document.createElement('div');
    el.className='hr-toast v10 '+(type==='error'?'error':'ok');
    el.textContent=msg;
    el.setAttribute('role','status');
    document.body.appendChild(el);
    requestAnimationFrame(()=>el.classList.add('is-visible'));
    setTimeout(()=>{el.classList.remove('is-visible'); setTimeout(()=>el.remove(),260)},ms);
  }

  function confirmDialog({title='ØªØ£ÙƒÙŠØ¯', message='', confirmLabel='ØªØ£ÙƒÙŠØ¯', cancelLabel='Ù„Ø§Ø­Ù‚Ù‹Ø§'}={}){
    return new Promise(resolve=>{
      const overlay=document.createElement('div');
      overlay.className='modal-backdrop v10-confirm-backdrop';
      overlay.setAttribute('role','dialog');
      overlay.setAttribute('aria-modal','true');
      overlay.innerHTML='<div class="confirm-modal v10-confirm-modal" role="document"><div class="panel-head"><div><h2></h2><p></p></div></div><div class="form-actions"><button class="button ghost" type="button" data-cancel></button><button class="button primary" type="button" data-confirm></button></div></div>';
      overlay.querySelector('h2').textContent=title;
      overlay.querySelector('p').textContent=message;
      overlay.querySelector('[data-cancel]').textContent=cancelLabel;
      overlay.querySelector('[data-confirm]').textContent=confirmLabel;
      const cleanup=(answer)=>{overlay.remove(); document.removeEventListener('keydown', onKey); resolve(answer);};
      const onKey=(event)=>{if(event.key==='Escape') cleanup(false);};
      overlay.addEventListener('click', event=>{if(event.target===overlay) cleanup(false);});
      overlay.querySelector('[data-cancel]').addEventListener('click', ()=>cleanup(false));
      overlay.querySelector('[data-confirm]').addEventListener('click', ()=>cleanup(true));
      document.addEventListener('keydown', onKey);
      document.body.appendChild(overlay);
      overlay.querySelector('[data-confirm]').focus();
    });
  }

  window.HRToast = toast;
  window.HRExplainAndEnablePush = async function(){
    if(!('Notification' in window)) { toast('Ù‡Ø°Ø§ Ø§Ù„Ù…ØªØµÙØ­ Ù„Ø§ ÙŠØ¯Ø¹Ù… Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª.', 'error'); return false; }
    if(!('serviceWorker' in navigator) || !('PushManager' in window)) { toast('Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Web Push ØºÙŠØ± Ù…Ø¯Ø¹ÙˆÙ…Ø© Ø¹Ù„Ù‰ Ù‡Ø°Ø§ Ø§Ù„Ø¬Ù‡Ø§Ø².', 'error'); return false; }
    const ok = await confirmDialog({
      title:'ØªÙØ¹ÙŠÙ„ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª',
      message:'Ø³ÙŠØªÙ… ØªÙØ¹ÙŠÙ„ Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„Ø¨ØµÙ…Ø© ÙˆØ·Ù„Ø¨ Ø§Ù„Ù…ÙˆÙ‚Ø¹ ÙˆØ§Ù„Ù‚Ø±Ø§Ø±Ø§Øª Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠØ© Ø¹Ù„Ù‰ Ù‡Ø°Ø§ Ø§Ù„Ø¬Ù‡Ø§Ø². ÙŠÙ…ÙƒÙ†Ùƒ Ø¥ÙŠÙ‚Ø§ÙÙ‡Ø§ Ù„Ø§Ø­Ù‚Ù‹Ø§ Ù…Ù† Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ù…ØªØµÙØ­.',
      confirmLabel:'ØªÙØ¹ÙŠÙ„',
      cancelLabel:'Ù„Ø§Ø­Ù‚Ù‹Ø§'
    });
    if(!ok) return false;
    const perm = await Notification.requestPermission();
    toast(perm==='granted'?'ØªÙ… Ø§Ù„Ø³Ù…Ø§Ø­ Ø¨Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª.':'Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø³Ù…Ø§Ø­ Ø¨Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª.', perm==='granted'?'ok':'error');
    return perm==='granted';
  };

  window.HRExplainAndEnableLocation = async function(){
    if(!navigator.geolocation) { toast('Ù‡Ø°Ø§ Ø§Ù„Ø¬Ù‡Ø§Ø² Ù„Ø§ ÙŠØ¯Ø¹Ù… ØªØ­Ø¯ÙŠØ¯ Ø§Ù„Ù…ÙˆÙ‚Ø¹.', 'error'); return null; }
    return new Promise(resolve=>navigator.geolocation.getCurrentPosition(
      pos=>{ toast('ØªÙ… ØªÙØ¹ÙŠÙ„ Ø§Ù„Ù…ÙˆÙ‚Ø¹ ÙˆÙ‚Ø±Ø§Ø¡Ø© GPS Ø¨Ù†Ø¬Ø§Ø­.'); resolve(pos); },
      err=>{ toast('Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø³Ù…Ø§Ø­ Ø¨Ø§Ù„Ù…ÙˆÙ‚Ø¹. ÙØ¹Ù‘Ù„ ØµÙ„Ø§Ø­ÙŠØ© Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ù…Ù† Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ù…ØªØµÙØ­.', 'error'); resolve(null); },
      {enableHighAccuracy:true,timeout:20000,maximumAge:0}
    ));
  };

  document.addEventListener('click', (e)=>{
    const btn=e.target.closest('[data-enable-push],[data-enable-notifications]');
    if(btn && !btn.dataset.hrPushBound){ e.preventDefault(); window.HRExplainAndEnablePush(); }
    const loc=e.target.closest('[data-enable-location]');
    if(loc && !loc.dataset.hrLocationBound){ e.preventDefault(); window.HRExplainAndEnableLocation(); }
  });
})();
