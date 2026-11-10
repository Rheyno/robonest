/* Original curated guide state machine. Pure, deterministic, volatile state. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.ToddlerGuide=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  /* v3: two combined guardian checks (was four); every safety point is kept. */
  const CHECKLIST=[
    'Saya wali dewasa yang hadir langsung dan memegang HP; anak tidak perlu melihat layar. Anak boleh mengamati atau menolak, dan saya berhenti jika anak lelah, tidak nyaman, atau ingin berhenti.',
    'Ruang duduk datar, tidak licin, bebas halangan, jauh dari tangga, air, panas, dan benda berbahaya. Tidak ada mainan kecil, magnet lepas, baterai, kabel, atau elektronik; cukup tubuh sendiri.'
  ];
  const ACTIVITIES=[
    {id:'pesan',name:'Aku robot, kamu pemberi pesan',source:'Sesi 01',icon:'palm',tag:'Pesan & pilihan',
     intro:'Wali menjadi robot yang mengikuti pesan berhenti. Anak boleh memberi gestur atau hanya mengamati.',
     materials:'Tubuh sendiri dan ruang duduk datar yang tidak licin. Tidak perlu kartu, mainan, atau alat.',
     adaptation:'Kartu A4 diganti gestur telapak tangan. Gerak maju dan tukar peran berjalan dihilangkan; gunakan versi duduk dan pesan berhenti dari remedial sumber.',
     regular:[
       {id:'pesan-contoh',title:'Wali contohkan pesan berhenti',text:'Tetap duduk dengan nyaman. Wali tunjukkan telapak tangan terbuka sambil berkata pelan “berhenti”, lalu diam. Tidak perlu berpindah tempat.'},
       {id:'pesan-pilih',title:'Ikuti pilihan si kecil',text:'Tawarkan anak memilih gestur berhenti atau mengamati. Bila anak ingin memberi pesan, wali mengikuti dengan diam. Tidak perlu meminta anak bergerak atau menggerakkan tangannya.'},
       {id:'pesan-tutup',title:'Cukup atau ingin mencoba lagi?',text:'Terima pilihan berhenti. Bila anak sendiri ingin mengulang dan tetap nyaman, wali boleh mencontoh pesan yang sama. Tidak perlu menambah gerakan.'}
     ],
     easier:{title:'Kita sederhanakan, yuk.',text:'Cukup wali menunjukkan satu telapak tangan untuk berhenti sambil duduk. Anak boleh diam mengamati; tidak perlu memilih atau meniru.',steps:[{id:'pesan-amati',title:'Satu pesan, boleh mengamati saja',text:'Wali duduk dan menunjukkan telapak tangan berhenti dengan lembut. Anak boleh mengamati tanpa memberi respons. Lalu akhiri bila cukup.'}]}},
    {id:'pola',name:'Temukan pola robot',source:'Sesi 04',icon:'pattern',tag:'Pola gerak lembut',
     intro:'Gunakan pilihan pola gerak dari materi: tepuk lembut lalu lambaikan. Tanpa balok atau kartu.',
     materials:'Tubuh sendiri dan ruang duduk datar yang tidak licin. Tidak ada benda yang perlu diambil.',
     adaptation:'Memakai opsi pola gerak tepuk–lambaikan dari sumber, bukan balok dan kartu. Jumlah pengulangan wajib dihapus. Tidak ada tuntutan jawaban benar atau bunyi keras.',
     regular:[
       {id:'pola-contoh',title:'Wali tunjukkan pola sederhana',text:'Sambil duduk, wali memperagakan tepuk sangat lembut lalu lambaikan tangan. Hindari bunyi keras. Anak boleh hanya melihat gerak wali, bukan layar.'},
       {id:'pola-pilih',title:'Beri ruang untuk pilihan',text:'Jika anak ingin, tawarkan ikut gerak atau memilih gerak mana yang wali contohkan. Ikuti pilihannya tanpa kuis benar–salah dan tanpa memegang paksa tangannya.'},
       {id:'pola-tutup',title:'Ulang hanya bila anak mau',text:'Jika anak meminta dan nyaman, wali boleh mencontoh pola yang sama. Kalau cukup, akhiri. Jika suara atau gerak tidak nyaman, berhenti dan pilih suasana tenang.'}
     ],
     easier:{title:'Kita sederhanakan, yuk.',text:'Hilangkan tepuk. Wali cukup melambaikan tangan sambil duduk; anak boleh mengamati saja. Ini penyederhanaan opsi gerak sumber, bukan latihan baru.',steps:[{id:'pola-lambai',title:'Cukup satu lambaian lembut',text:'Wali melambaikan tangan perlahan sambil duduk, tanpa tepuk atau tuntutan meniru. Anak boleh mengamati saja. Akhiri bila cukup.'}]}},
    {id:'ulang',name:'Ulang gerak robot',source:'Sesi 09',icon:'wave',tag:'Lambaikan & jeda',
     intro:'Wali melambaikan tangan lalu diam. Anak boleh memilih mengamati, memimpin gerak, atau berhenti.',
     materials:'Tubuh sendiri dan ruang duduk datar yang tidak licin. Tidak perlu kartu, matras tambahan, atau elektronik.',
     adaptation:'Kartu A4 dihilangkan dan gerak dibatasi pada tangan wali sambil duduk, sesuai alternatif sumber; tidak ada jumlah atau durasi wajib.',
     regular:[
       {id:'ulang-contoh',title:'Lambaikan, lalu diam',text:'Wali tetap duduk dan melambaikan tangan dengan lembut, lalu diam. Beri jeda sesuai kenyamanan; tidak perlu menghitung atau mengejar pengulangan.'},
       {id:'ulang-pilih',title:'Anak boleh menentukan pilihan',text:'Tawarkan anak mengamati, memilih gerak tangan yang sama, atau menjadi pemimpin gerak bila bersedia. Jangan menuntut respons atau kontak mata.'},
       {id:'ulang-tutup',title:'Lagi hanya jika ingin',text:'Tanyakan cukup atau ingin gerak yang sama lagi. Ulang hanya bila anak ingin dan nyaman. Jika lelah atau tidak nyaman, hentikan dan beristirahat.'}
     ],
     easier:{title:'Kita sederhanakan, yuk.',text:'Gunakan satu contoh lambaian wali saja lalu diam. Anak cukup mengamati; jangan meminta mengikuti atau mengulang. Ini remedial satu gerak dari sumber.',steps:[{id:'ulang-amati',title:'Satu contoh, lalu istirahat',text:'Wali melambaikan tangan dengan lembut sambil duduk lalu diam. Anak boleh mengamati saja. Tidak ada pengulangan yang harus dilakukan.'}]}}
  ];
  const HAND_REMINDER='Gerakkan tangan dengan lembut dan jauh dari wajah.';
  for(const a of ACTIVITIES){
    for(const card of [...a.regular,...a.easier.steps])card.text+=' '+HAND_REMINDER;
    a.easier.text+=' '+HAND_REMINDER;
  }
  function deepFreeze(o){Object.freeze(o);for(const value of Object.values(o))if(value&&typeof value==='object'&&!Object.isFrozen(value))deepFreeze(value);return o;}
  deepFreeze(ACTIVITIES);deepFreeze(CHECKLIST);
  function initial(){return {phase:'choose',activityId:null,checks:[],mode:'regular',index:0,opened:[],usedEasier:false,reason:null};}
  function activity(s){return ACTIVITIES.find(a=>a.id===s.activityId)||null;}
  function steps(s){const a=activity(s);return a?(s.mode==='easier'?a.easier.steps:a.regular):[];}
  function opened(s){const card=steps(s)[s.index];return card?{...s,opened:s.opened.includes(card.id)?[...s.opened]:[...s.opened,card.id]}:s;}
  function transition(state,event){
    const s={...state,checks:[...state.checks],opened:[...state.opened]};
    if(event.type==='reset')return initial();
    if(event.type==='stop')return {...s,phase:'stopped',reason:'stopped'};
    if(event.type==='select'&&s.phase==='choose'&&ACTIVITIES.some(a=>a.id===event.id))return {...initial(),phase:'prep',activityId:event.id};
    if(event.type==='check'&&s.phase==='prep'&&Number.isInteger(event.index)&&event.index>=0&&event.index<CHECKLIST.length){s.checks=s.checks.includes(event.index)?s.checks.filter(n=>n!==event.index):[...s.checks,event.index];return s;}
    if(event.type==='ready'&&s.phase==='prep'&&CHECKLIST.every((_,i)=>s.checks.includes(i)))return opened({...s,phase:'step',mode:'regular',index:0});
    if(event.type==='easier'&&s.phase==='step')return {...s,phase:'easier'};
    if(event.type==='try-easier'&&s.phase==='easier')return opened({...s,phase:'step',mode:'easier',index:0,usedEasier:true});
    if(event.type==='previous'&&s.phase==='step'&&s.index>0)return opened({...s,index:s.index-1});
    if(event.type==='next'&&s.phase==='step')return s.index+1<steps(s).length?opened({...s,index:s.index+1}):{...s,phase:'summary',reason:'guide-end'};
    if(event.type==='summary'&&s.phase==='stopped')return {...s,phase:'summary'};
    return s;
  }
  function summary(s){const a=activity(s);const cards=a?[...a.regular,...a.easier.steps]:[];return {name:a?a.name:'Belum ada aktivitas dipilih',opened:s.opened.map(id=>cards.find(c=>c.id===id)).filter(Boolean).map(c=>c.title),usedEasier:s.usedEasier,reason:s.reason};}
  const QUICK_START_ID='ulang';
  return {ACTIVITIES,CHECKLIST,HAND_REMINDER,QUICK_START_ID,initial,activity,steps,transition,summary};
});
