/* Original guardian-only UI for fixed curated content. */
(function(){
  'use strict';
  const G=ToddlerGuide,stage=document.getElementById('guide-stage'),live=document.getElementById('guide-status');
  let state=G.initial();
  /* Original small illustrations, one per activity (decorative; the guardian reads, the child plays screen-free). */
  const MASCOT=`<svg class="mascot{cls}" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><g class="m-hop"><g class="m-body"><path d="M32 9v6" stroke="#654a40" stroke-width="3" stroke-linecap="round"/><circle class="m-bulb" cx="32" cy="7" r="4" fill="#efb76f" stroke="#82542e" stroke-width="1.5"/><rect x="14" y="15" width="36" height="28" rx="11" fill="#fbe7da" stroke="#654a40" stroke-width="3"/><g class="m-eyes"><circle cx="25" cy="28" r="3.6" fill="#543c35"/><circle cx="39" cy="28" r="3.6" fill="#543c35"/></g><circle cx="19.5" cy="35" r="3" fill="#e9a6a0"/><circle cx="44.5" cy="35" r="3" fill="#e9a6a0"/><path d="M28 35q4 4 8 0" stroke="#543c35" stroke-width="2.5" fill="none" stroke-linecap="round"/><rect x="21" y="44" width="22" height="12" rx="5" fill="#b6cdb1" stroke="#52694f" stroke-width="3"/><path d="M15 47 9 53" stroke="#654a40" stroke-width="3" stroke-linecap="round"/><g class="m-arm"><path d="M49 47l7-9" stroke="#654a40" stroke-width="3" stroke-linecap="round"/><circle cx="57" cy="36" r="3.6" fill="#fbe7da" stroke="#654a40" stroke-width="2"/></g></g></g></svg>`;
  function mascot(cls){return MASCOT.replace('{cls}',cls?' '+cls:'');}
  function icon(kind){
    const robo='<g class="art-robo"><path d="M50 18v6" stroke="#654a40" stroke-width="3" stroke-linecap="round"/><circle cx="50" cy="16" r="3.5" fill="#efb76f"/><rect x="36" y="24" width="28" height="22" rx="8" fill="#fbe7da" stroke="#654a40" stroke-width="3"/><circle cx="45" cy="34" r="2.6" fill="#543c35"/><circle cx="55" cy="34" r="2.6" fill="#543c35"/><path d="M46 40q4 3 8 0" stroke="#543c35" stroke-width="2" fill="none" stroke-linecap="round"/></g>';
    const shapes={
      palm:'<circle cx="50" cy="52" r="44" fill="#f7e6dc"/>'+robo+'<path class="art-move" d="M20 88 12 72c-2-5 3-8 6-4l4 5V52c0-5 6-5 6 0v14-18c0-5 6-5 6 0v18-15c0-5 6-5 6 0v16-8c0-5 6-5 6 0v17c0 7-4 11-8 14H20Z" fill="#e9b593" stroke="#70463b" stroke-width="2.5"/><g class="art-move alt" fill="#d9937c"><circle cx="70" cy="62" r="4"/><circle cx="80" cy="56" r="3"/><circle cx="88" cy="48" r="2.4"/></g>',
      pattern:'<circle cx="50" cy="52" r="44" fill="#e8efe3"/>'+robo+'<g class="art-move"><circle cx="20" cy="72" r="8" fill="#d9937c" stroke="#70463b" stroke-width="2.5"/><rect x="33" y="64" width="16" height="16" rx="4" fill="#b6cdb1" stroke="#52694f" stroke-width="2.5"/><circle cx="62" cy="72" r="8" fill="#d9937c" stroke="#70463b" stroke-width="2.5"/></g><rect class="art-move alt" x="74" y="64" width="16" height="16" rx="4" fill="#fffefa" stroke="#52694f" stroke-width="2.5" stroke-dasharray="4 3"/>',
      wave:'<circle cx="50" cy="52" r="44" fill="#efe3ef"/>'+robo+'<g class="art-move" fill="none" stroke="#70463b" stroke-width="3.5" stroke-linecap="round"><path d="M24 30a28 28 0 0 0 0 40"/><path d="M76 30a28 28 0 0 1 0 40"/></g><path class="art-move alt" d="M30 80q10-10 20 0t20 0" fill="none" stroke="#9a6f8f" stroke-width="4" stroke-linecap="round"/><path d="M71 66l5 4 5-5" fill="none" stroke="#70463b" stroke-width="3" stroke-linecap="round"/>'
    };
    return `<svg class="act-art" viewBox="0 0 100 100" aria-hidden="true" focusable="false">${shapes[kind]||shapes.palm}</svg>`;
  }
  function celebration(){let h='<div class="celebrate" aria-hidden="true">';for(let i=0;i<12;i++)h+=`<span class="${i%3===0?'c-star':'c-dot'}" style="--i:${i}"></span>`;return h+'</div>';}
  function btn(label,action,classes='button',extra=''){return `<button type="button" class="${classes}" data-action="${action}" ${extra}>${label}</button>`;}
  function render(focusHeading=false,checkIndex=null){
    const a=G.activity(state);let html='';
    if(state.phase==='choose'){
      const quick=G.ACTIVITIES.find(x=>x.id===G.QUICK_START_ID);
      html=`<section class="quick-start-card" aria-labelledby="quick-title"><div><p class="eyebrow">JALUR CEPAT</p><h2 id="quick-title">Mau langsung main?</h2><p>Mulai dengan <strong>${quick.name}</strong>: wali melambaikan tangan lalu diam, sambil duduk. Cukup 2 pemeriksaan singkat, lalu letakkan HP.</p></div>${btn('Mulai cepat <span aria-hidden="true">→</span>','quick','button')}</section>`;
      html+='<div class="stage-heading"><p class="eyebrow">ATAU PILIH SATU AKTIVITAS</p><h2 id="stage-title" tabindex="-1">Mau mencoba yang mana?</h2><p>Ada tiga pilihan aktivitas. Semuanya cukup dengan tubuh sendiri dan ruang yang diperiksa wali.</p></div><div class="activity-grid">';
      for(const item of G.ACTIVITIES)html+=`<article class="activity-card">${icon(item.icon)}<p class="eyebrow">${item.tag}</p><h3>${item.name}</h3><p>${item.intro}</p><p class="materials"><strong>Alat & bahan:</strong> ${item.materials}</p>${btn('Lihat persiapan <span class="sr-only">'+item.name+'</span>','select','button',`data-id="${item.id}"`)}</article>`;
      html+='</div>';
    }
    if(state.phase==='prep'){
      html=`<section class="guide-card prep-card" aria-labelledby="stage-title">${icon(a.icon).replace('act-art','act-art card-art')}<p class="eyebrow">PERSIAPAN WALI · ${a.source}</p><h2 id="stage-title" tabindex="-1">Siapkan dulu, yuk.</h2><h3>${a.name}</h3><p>Dua pemeriksaan singkat sebelum mengajak anak. Ketuk hanya jika wali sendiri sudah memeriksanya. Daftar ini bukan jaminan keselamatan.</p><p class="materials"><strong>Alat & bahan:</strong> ${a.materials}</p><div class="safety-checklist" role="group" aria-label="Daftar periksa keselamatan wali">`;
      G.CHECKLIST.forEach((text,i)=>{const selected=state.checks.includes(i);html+=btn(`<span class="check-symbol" aria-hidden="true">${selected?'✓':'○'}</span><span>${text}</span>`,'check','check-button',`data-index="${i}" aria-pressed="${selected}"`);});
      const ready=G.CHECKLIST.every((_,i)=>state.checks.includes(i));
      html+=`</div><p class="guide-small">${ready?'Wali telah menandai semua pemeriksaan. Putuskan sendiri apakah layak dimulai.':'Tandai kedua pemeriksaan agar tombol Siap aktif. Jika ragu, berhenti.'}</p><div class="guide-actions">${btn('Siap, mulai bermain','ready','button',ready?'':'disabled')}${btn('Pilih aktivitas lain','reset','button secondary')}</div><details class="adaptation"><summary>Adaptasi dari materi terkurasi</summary><p>${a.adaptation}</p><p>${a.source} — Roboclub, Materi Siap Ajar 2–4 Tahun. Adaptasi ini masih memerlukan review keselamatan manusia sebelum penggunaan luas.</p></details></section>`;
    }
    if(state.phase==='step'){
      const cards=G.steps(state),card=cards[state.index];
      html=`<section class="guide-card step-card" data-card="${state.index}" aria-labelledby="stage-title">${mascot('card-mascot')}<p class="eyebrow">${a.name} · ${state.mode==='easier'?'VERSI LEBIH MUDAH':'PANDUAN WALI'}</p><p class="step-caption">Kartu ${state.index+1} dari ${cards.length} · urutan panduan, bukan penilaian anak</p><h2 id="stage-title" tabindex="-1">${card.title}</h2><p class="step-text">${card.text}</p><p class="phone-down"><strong>Baca sebentar, lalu letakkan HP dan bermain bersama.</strong> Wali mendampingi langsung. Berhenti jika anak lelah atau tidak nyaman.</p><div class="guide-actions">${btn(state.index+1<cards.length?'Lanjut ke kartu berikutnya':'Lihat ringkasan','next')}${btn('Coba lebih mudah','easier','button secondary')}${state.index>0?btn('Kartu sebelumnya','previous','quiet-button'):''}</div></section>`;
    }
    if(state.phase==='easier'){
      html=`<section class="guide-card easier-card" aria-labelledby="stage-title"><p class="eyebrow">CABANG TERKURASI · ${a.name}</p><h2 id="stage-title" tabindex="-1">${a.easier.title}</h2><p class="step-text">${a.easier.text}</p><p>Tidak perlu menyelesaikan semua langkah. Kalau anak lelah atau tidak nyaman, gunakan tombol “Anak ingin berhenti”.</p>${btn('Coba langkah ini','try-easier')}</section>`;
    }
    if(state.phase==='stopped'){
      html=`<section class="guide-card stopped-card" aria-labelledby="stage-title"><p class="eyebrow">BERHENTI JUGA PILIHAN</p><h2 id="stage-title" tabindex="-1">Cukup dulu juga boleh.</h2><p class="step-text">Kalau si kecil lelah, tidak nyaman, atau ingin berhenti, akhiri permainan. Dampingi langsung dan beristirahat di tempat yang nyaman. Rapikan ruang bila memungkinkan.</p><p>Tidak ada langkah yang wajib dituntaskan. Panduan ini tidak menilai kemampuan anak.</p><div class="guide-actions">${btn('Lihat ringkasan','summary')}${btn('Kembali ke pilihan aktivitas','reset','button secondary')}</div></section>`;
    }
    if(state.phase==='summary'){
      const result=G.summary(state);
      const done=result.reason!=='stopped';
      html=`<section class="guide-card summary-card${done?' is-celebrating':''}" aria-labelledby="stage-title">${done?celebration()+mascot('card-mascot cheer'):''}<p class="eyebrow">RINGKASAN DI LAYAR WALI</p><h2 id="stage-title" tabindex="-1">Panduan yang tadi dibuka.</h2><h3>${result.name}</h3>${done?'<p class="thanks">Terima kasih sudah bermain bersama! ✿</p>':''}<p>${result.reason==='stopped'?'Wali memilih berhenti.':'Wali sampai pada akhir kartu panduan.'} Tidak ada penilaian kemampuan anak.</p><p>Daftar ini hanya mencatat kartu yang dibuka di layar wali, <strong>bukan bukti aktivitas dilakukan atau selesai oleh anak.</strong></p>`;
      html+=result.opened.length?'<h3>Kartu panduan yang dibuka</h3><ul class="opened-list">'+result.opened.map(t=>`<li>Dibuka: ${t}</li>`).join('')+'</ul>':'<p>Belum ada kartu langkah yang dibuka.</p>';
      html+=`<p>${result.usedEasier?'Kartu langkah versi lebih mudah sempat dibuka.':'Tidak ada kartu langkah versi lebih mudah yang dibuka.'} Ringkasan hanya ada selama halaman ini terbuka; muat ulang atau reset menghapusnya.</p><div class="guide-actions">${btn('Pilih aktivitas lain','reset')}<a class="button secondary" href="index.html">Kembali ke beranda</a></div></section>`;
    }
    stage.innerHTML=html+`<div class="guide-tools">${btn('Reset panduan','reset','quiet-button')}<span>Reset menghapus pilihan dan kartu yang dibuka dari memori halaman.</span></div>`;
    stage.dataset.phase=state.phase;
    const title=stage.querySelector('#stage-title');live.textContent=title?title.textContent:'';
    if(checkIndex!==null){const b=stage.querySelector(`[data-action="check"][data-index="${checkIndex}"]`);if(b)b.focus();}
    else if(focusHeading&&title)title.focus();
  }
  const top=document.querySelector('.top-mascot'),toggle=document.getElementById('motion-toggle'),motion=window.matchMedia?window.matchMedia('(prefers-reduced-motion: reduce)'):{matches:false};
  let calm=!!motion.matches;
  function applyMotion(){document.body.classList.toggle('motion-ok',!calm);document.body.classList.toggle('calm-motion',calm);toggle.setAttribute('aria-pressed',String(calm));}
  /* Memory-only toggle: no storage. */
  toggle.addEventListener('click',()=>{calm=!calm;applyMotion();});
  function hop(){if(!top||calm)return;top.classList.remove('hop');void top.getBoundingClientRect();top.classList.add('hop');}
  function send(event){const before=state;state=G.transition(state,event);render(event.type!=='check',event.type==='check'?event.index:null);if(before.phase!==state.phase||before.index!==state.index)hop();return before!==state;}
  stage.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b||b.disabled)return;const type=b.dataset.action;send(type==='quick'?{type:'select',id:G.QUICK_START_ID}:type==='select'?{type,id:b.dataset.id}:type==='check'?{type,index:Number(b.dataset.index)}:{type});});
  document.getElementById('stop-guide').addEventListener('click',()=>send({type:'stop'}));
  applyMotion();render();
})();
