/* Original RoboNest UI; all state is volatile memory, no storage or requests. */
(function () {
  'use strict';
  const L=RoboLogic, $=id=>document.getElementById(id), mount=$('demo-mount');
  const narrow=matchMedia('(max-width: 767px)'), touch=matchMedia('(pointer: coarse)'), motion=matchMedia('(prefers-reduced-motion: reduce)');
  let program=[],state=L.initial(),actions=[],compiled=false,timer=null,id=0;
  let insertion={parent:null,index:0},hints=0,failures=0,lastActivity=Date.now(),reduced=motion.matches;
  let failedCounted=false,starter=false;
  const terminal=()=>!['ready','running','paused'].includes(state.status);
  const locked=()=>state.status==='running'||state.status==='paused';
  const uid=()=>`block-${++id}`;
  function stopTimer(){if(timer!==null){clearTimeout(timer);timer=null;}}
  function announce(text){if($('status')){$('status').textContent=text;$('status').dataset.status=state.status;}}
  function touchActivity(){lastActivity=Date.now();}
  function listFor(parent){if(parent===null)return program;const b=program.find(b=>b.id===parent);return b&&b.type==='repeat'?b.body:program;}
  function findBlock(blockId){for(const b of program){if(b.id===blockId)return {block:b,list:program,parent:null,index:program.indexOf(b)};if(b.type==='repeat'){const i=b.body.findIndex(c=>c.id===blockId);if(i>=0)return {block:b.body[i],list:b.body,parent:b.id,index:i};}}return null;}
  function resetRobot(announceReady=true){stopTimer();state=L.initial();actions=[];compiled=false;failedCounted=false;drawBoard();updateControls();highlight();if(announceReady)announce(L.message(state));}
  function editing(){if(locked())return false;starter=false;if(terminal()||compiled)resetRobot();touchActivity();return true;}
  function newBlock(type){return type==='repeat'?{id:uid(),type,times:2,body:[]}:{id:uid(),type};}
  function addBlock(type){
    if(!editing())return;
    if(L.countBlocks(program)>=10){announce('Blok sudah penuh (10/10). Coba pakai ulangi!');return;}
    if(type==='repeat'&&insertion.parent){announce('Tidak boleh ada ulangi di dalam ulangi. Pilih tambah di akhir program.');return;}
    const list=listFor(insertion.parent), b=newBlock(type);
    const index=Math.min(insertion.index,list.length);list.splice(index,0,b);insertion.index=index+1;
    if(type==='repeat')insertion={parent:b.id,index:0};
    renderProgram();drawBoard();updateControls();focusBlock(b.id);
    if(type==='repeat'){announce(`Ulangi ditambahkan. Sekarang ketuk Maju atau Belok untuk mengisinya. Blok: ${L.countBlocks(program)}/10.`);return;}
    announce(`Blok ${L.LABELS[type]} ditambahkan${insertion.parent?' ke dalam ulangi':''}. Blok: ${L.countBlocks(program)}/10.${L.countBlocks(program)===10?' Blok sudah penuh (10/10). Coba pakai ulangi!':''}`);
  }
  /* Ready-made loop: one tap adds "ulangi 2 kali { maju }" (2 blocks) at the root. */
  function addPreset(){
    if(!editing())return;
    if(L.countBlocks(program)+2>10){announce('Blok tidak cukup untuk ulangi siap pakai (perlu 2 blok).');return;}
    if(insertion.parent)insertion={parent:null,index:program.length};
    const b={id:uid(),type:'repeat',times:2,body:[{id:uid(),type:'forward'}]};
    const index=Math.min(insertion.index,program.length);program.splice(index,0,b);insertion={parent:null,index:index+1};
    renderProgram();drawBoard();updateControls();focusBlock(b.id);announce(`Ulangi 2 kali maju ditambahkan. Blok: ${L.countBlocks(program)}/10.`);
  }
  /* Cold start: one tap loads a starter loop and runs it, so Robo moves right away. The child still has to finish the route. */
  function quickStart(){
    stopTimer();$('intro').hidden=true;
    if(!program.length){program=[{id:uid(),type:'repeat',times:2,body:[{id:uid(),type:'forward'}]}];}
    insertion={parent:null,index:program.length};resetRobot(false);renderProgram();updateControls();
    starter=true;runToggle();
  }
  function focusBlock(blockId){const el=mount.querySelector(`[data-row="${blockId}"]`);if(el)el.focus();}
  function moveBlock(blockId,delta){if(!editing())return;const f=findBlock(blockId);if(!f)return;const j=f.index+delta;if(j<0||j>=f.list.length){announce('Blok sudah di ujung daftar.');return;}[f.list[f.index],f.list[j]]=[f.list[j],f.list[f.index]];insertion={parent:f.parent,index:j+1};renderProgram();updateControls();focusBlock(blockId);announce('Urutan blok diperbarui.');}
  function removeBlock(blockId){if(!editing())return;const f=findBlock(blockId);if(!f)return;f.list.splice(f.index,1);insertion={parent:f.parent,index:f.index};if(insertion.parent&&!program.some(b=>b.id===insertion.parent))insertion={parent:null,index:program.length};renderProgram();updateControls();const next=f.list[Math.min(f.index,f.list.length-1)];if(next)focusBlock(next.id);else $('append-root').focus();announce(`Blok dihapus. Blok: ${L.countBlocks(program)}/10.`);}
  function setTimes(blockId,value){if(!editing())return;const f=findBlock(blockId);if(!f||f.block.type!=='repeat')return;const n=Number(value);if(!Number.isInteger(n)||n<2||n>9){announce('Ulangi harus 2–9 kali. Nilai sebelumnya dipertahankan.');const input=$(`times-${blockId}`);if(input)input.value=f.block.times;return;}f.block.times=n;const input=$(`times-${blockId}`);if(input)input.value=n;announce(`Ulangi ${n} kali.`);}
  function button(text,label,action,blockId){const b=document.createElement('button');b.type='button';b.textContent=text;b.setAttribute('aria-label',label);b.dataset.action=action;b.dataset.id=blockId;b.disabled=locked();return b;}
  function renderProgram(){
    const container=$('program-list');if(!container)return;container.replaceChildren();
    const total=L.countBlocks(program);let position=0;
    function build(list,parent){const ol=document.createElement('ol');ol.setAttribute('aria-label',parent?'Isi blok ulangi':'Daftar blok program');for(const b of list){position++;const n=position;const li=document.createElement('li');li.className='block';const row=document.createElement('div');row.className='block-row'+(b.type==='repeat'?' repeat':'');row.tabIndex=0;row.dataset.row=b.id;row.setAttribute('role','group');row.setAttribute('aria-label',`Blok ${L.LABELS[b.type]}${b.type==='repeat'?' '+b.times+' kali':''}, posisi ${n} dari ${total}. Enter untuk memilih posisi tambah sesudah blok ini`);
      const name=document.createElement('span');name.className='block-name';name.textContent=`${n}. ${L.LABELS[b.type]}`;row.append(name);
      row.append(button('↑',`Pindah blok ${n} ke atas`,'up',b.id),button('↓',`Pindah blok ${n} ke bawah`,'down',b.id),button('×',`Hapus blok ${n}`,'remove',b.id));row.lastChild.className='remove';
      if(b.type==='repeat'){
        const settings=document.createElement('div');settings.className='repeat-settings';const label=document.createElement('label');label.htmlFor=`times-${b.id}`;label.textContent='Banyak ulangi';
        const input=document.createElement('input');input.id=`times-${b.id}`;input.type='number';input.min='2';input.max='9';input.step='1';input.value=b.times;input.dataset.times=b.id;input.disabled=locked();input.setAttribute('aria-label',`Banyak ulangi untuk blok ${n}, 2 sampai 9 kali`);
        settings.append(label,button('−',`Kurangi ulangi blok ${n}`,'minus',b.id),input,button('+',`Tambah ulangi blok ${n}`,'plus',b.id));row.append(settings);
        const into=button(insertion.parent===b.id?'Sedang diisi ✎':'Isi ulangi ini',`Isi ulangi blok ${n}: blok berikutnya masuk ke dalam ulangi`,'into',b.id);into.className='into'+(insertion.parent===b.id?' filling':'');row.append(into);
      }
      li.append(row);
      if(b.type==='repeat'){const body=document.createElement('div');body.className='repeat-body';if(!b.body.length){const empty=document.createElement('p');empty.className='empty-loop';empty.textContent=insertion.parent===b.id?'Ulangi masih kosong. Ketuk Maju atau Belok sekarang untuk mengisinya.':'Ulangi masih kosong. Pilih “Isi ulangi ini”, lalu ketuk blok.';body.append(empty);}body.append(build(b.body,b.id));li.append(body);}
      ol.append(li);
    }return ol;}
    container.append(build(program,null));highlight();
  }
  function highlight(){mount.querySelectorAll('[data-row]').forEach(el=>{el.classList.toggle('active',el.dataset.row===state.activeId);el.setAttribute('aria-current',el.dataset.row===state.activeId?'step':'false');});}
  function drawBoard(){if(!$('board'))return;const board=$('board');board.replaceChildren();for(let y=1;y<=5;y++)for(let x=1;x<=5;x++){
    const cell=document.createElement('div');cell.className='cell';cell.setAttribute('aria-hidden','true');cell.dataset.cell=`${x},${y}`;
    const pos=document.createElement('span');pos.className='coordinate';pos.textContent=`${x},${y}`;cell.append(pos);
    if(x===3&&y===3){cell.classList.add('finish');const flag=document.createElement('span');flag.className='flag';flag.textContent='⚑';const label=document.createElement('span');label.className='finish-label';label.textContent='FINIS';cell.append(flag,label);}
    if(hints>=3&&x===2&&y===1)cell.classList.add('next-hint');
    if(state.problem&&state.problem.x===x&&state.problem.y===y){cell.classList.add('problem');const mark=document.createElement('span');mark.textContent='!';cell.append(mark);}
    if(state.x===x&&state.y===y){const robot=document.createElement('span');robot.className='robot-token';const eyes=document.createElement('span');eyes.className='eyes';eyes.textContent='••';const arrow=document.createElement('span');arrow.className='arrow';arrow.textContent=['↑','→','↓','←'][state.dir];robot.append(eyes,arrow);cell.append(robot);}
    board.append(cell);
  }
  const description=`Robot di kolom ${state.x}, baris ${state.y}, menghadap ${L.DIRECTIONS[state.dir]}. Finis di kolom 3, baris 3. Grid 5 kali 5, tanpa batu.`;
  board.setAttribute('aria-label',description);$('position').textContent=`(${state.x},${state.y}) · Menghadap ${L.DIRECTIONS[state.dir]} · ${state.steps}/100 langkah`;
  }
  function updateControls(){if(!$('run'))return;const full=L.countBlocks(program)>=10;
    mount.querySelectorAll('[data-type]').forEach(b=>b.disabled=locked()||full||(b.dataset.type==='repeat'&&insertion.parent!==null));
    mount.querySelectorAll('[data-preset]').forEach(b=>b.disabled=locked()||L.countBlocks(program)+2>10);
    mount.querySelectorAll('[data-action], [data-times]').forEach(b=>b.disabled=locked());
    $('append-root').disabled=locked();$('append-root').textContent=insertion.parent?'✓ Selesai isi ulangi':'Tambah di akhir program';$('clear-program').disabled=locked();$('step').disabled=timer!==null;
    $('run').textContent=timer!==null?'Jeda':state.status==='paused'?'Lanjutkan':'Jalankan';
    $('block-count').textContent=`${L.countBlocks(program)}/10 blok`;
    $('insertion-label').textContent=insertion.parent?`Tambah ke isi ulangi, setelah posisi ${insertion.index}.`:`Tambah ke program utama, setelah posisi ${insertion.index}.`;
    $('limit-note').textContent=full?'Blok sudah penuh (10/10). Coba pakai ulangi!':'Maksimum 10 blok, termasuk ulangi dan isinya.';
    $('hint').textContent=`Petunjuk${L.hintAvailable(failures,Date.now()-lastActivity)&&hints<3?' · baru':''}`;
  }
  function prepare(){if(!compiled||terminal()){
    const c=L.compile(program);if(c.error){announce(c.error);return false;}
    state=L.initial();actions=c.actions;compiled=true;failedCounted=false;
  }return true;}
  function takeStep(){state=L.step(state,actions);drawBoard();highlight();
    const a=actions[Math.max(0,state.cursor-1)];
    const detail=`Langkah ${state.steps}: ${a?L.LABELS[a.type]:''}. Robot di kolom ${state.x}, baris ${state.y}, menghadap ${L.DIRECTIONS[state.dir]}.`;
    if(terminal()){
      stopTimer();const wasStarter=starter;starter=false;
      if(wasStarter&&state.status!=='success'){failedCounted=true;announce(`Robo sudah jalan! Sekarang giliranmu: bendera ⚑ masih di bawah. Tambahkan blok lagi supaya Robo sampai finis, lalu tekan Jalankan. ${detail}`);$('after-demo').hidden=true;updateControls();return;}
      if(state.status!=='success'&&!failedCounted){failures++;failedCounted=true;}
      const outcome=L.message(state,L.countBlocks(program));announce(`${outcome}${/[.!?]$/.test(outcome)?'':'.'} ${detail}`);
      $('after-demo').hidden=state.status!=='success';
      if(state.status==='success')$('result-detail').textContent=`Kamu berhasil menyelesaikan misi ini dengan ${L.countBlocks(program)} blok dan ${state.steps} langkah. ${L.countBlocks(program)<=5?'⭐ Bintang misi (5 blok atau kurang).':'Coba gunakan ulangi untuk mengurangi blok.'}`;
    }else announce(detail);
    updateControls();
  }
  function scheduledStep(){timer=null;takeStep();if(!terminal()){timer=setTimeout(scheduledStep,reduced?0:400);}updateControls();}
  function runToggle(){touchActivity();if(timer!==null){stopTimer();state={...state,status:'paused'};announce('Dijeda. Lanjutkan atau Reset untuk mengedit program.');updateControls();return;}
    if(!prepare())return;state={...state,status:'running'};renderProgram();$('after-demo').hidden=true;timer=setTimeout(scheduledStep,reduced?0:400);updateControls();announce('Program dijalankan.');
  }
  function singleStep(){touchActivity();if(timer!==null)return;if(!prepare())return;takeStep();if(!terminal())state={...state,status:'paused'};renderProgram();updateControls();}
  function showHint(){touchActivity();const next=L.hint(hints);hints=next.index;$('hint-box').hidden=false;$('hint-title').textContent=`Petunjuk ${hints} dari 3`;$('hint-text').textContent=next.text;drawBoard();updateControls();announce(`Petunjuk ${hints}: ${next.text}`);}
  function fullReset(){stopTimer();starter=false;program=[];insertion={parent:null,index:0};hints=0;failures=0;touchActivity();$('hint-box').hidden=true;$('after-demo').hidden=true;resetRobot();renderProgram();updateControls();$('intro').hidden=false;$('start-mission').focus();}
  function askClear(){const dialog=$('confirm-clear');dialog.showModal();$('cancel-clear').focus();}
  function mountEditor(){
    mount.innerHTML=`<section class="mission-intro" id="intro" aria-labelledby="intro-title"><div><h2 id="intro-title">Kenalan dengan Robo</h2><p>Robo ingin sampai ke bendera ⚑. Ketuk <strong>Coba langsung</strong> untuk melihat Robo jalan, lalu lanjutkan sendiri. Belok hanya memutar arah, bukan maju.</p></div><div class="intro-actions"><button class="button" type="button" id="quick-start">▶ Coba langsung</button><button class="quiet-button" type="button" id="start-mission">Susun sendiri dari awal</button></div></section>
    <div class="workspace" id="editor"><section class="panel palette-panel" aria-labelledby="palette-title"><div class="panel-head"><h2 id="palette-title">1. Pilih blok</h2></div><div class="palette-body"><button type="button" data-type="forward" aria-label="Tambah blok maju">↑ &nbsp; Maju</button><button type="button" data-type="left" aria-label="Tambah blok belok kiri">↶ &nbsp; Belok kiri</button><button type="button" data-type="right" aria-label="Tambah blok belok kanan">↷ &nbsp; Belok kanan</button><button type="button" data-type="repeat" aria-label="Tambah blok ulangi kosong">↻ &nbsp; Ulangi</button><button type="button" class="preset" data-preset="repeat-forward" aria-label="Tambah ulangi siap pakai: ulangi 2 kali maju">↻ &nbsp; Ulangi 2× maju <small>siap pakai</small></button></div><p class="palette-help">Ketuk untuk menambah. Setelah menambah Ulangi, blok berikutnya langsung masuk ke dalamnya; ketuk “Selesai isi ulangi” untuk kembali.</p></section>
    <section class="panel program-panel" aria-labelledby="program-title"><div class="panel-head"><h2 id="program-title">2. Susun program <small id="block-count">0/10 blok</small></h2></div><div class="program-toolbar"><button class="quiet-button" type="button" id="append-root">Tambah di akhir program</button><button class="quiet-button" type="button" id="clear-program">Hapus program</button><p id="insertion-label"></p></div><div class="program-list" id="program-list"></div><div class="controls"><button class="button" type="button" id="run">Jalankan</button><button class="quiet-button" type="button" id="step">Langkah</button><button class="quiet-button" type="button" id="reset">Reset</button><button class="quiet-button" type="button" id="hint">Petunjuk</button></div><p class="editor-note" id="limit-note"></p></section>
    <section class="panel board-panel" aria-labelledby="board-title"><div class="panel-head"><h2 id="board-title">3. Amati Robo <small>5 × 5</small></h2></div><div class="board-body"><div class="board-legend"><span>(1,1) MULAI →</span><span>(3,3) ⚑ FINIS</span></div><div class="grid" id="board" role="img" tabindex="0" aria-label="Papan misi"></div><p class="robot-position" id="position"></p><p class="board-key">Kolom → · Baris ↓ · Belok = putar 90° di tempat.<br>⚑ Finis · •• Robo · Panah = arah hadap.</p></div></section></div>
    <div id="status" class="mission-status" role="status" aria-live="polite" aria-atomic="true"></div>
    <aside class="hint-box" id="hint-box" hidden aria-labelledby="hint-title"><h3 id="hint-title">Petunjuk</h3><p id="hint-text"></p></aside>
    <section class="after-demo" id="after-demo" hidden aria-labelledby="result-title"><h2 id="result-title">Satu misi selesai. Masih bisa bereksperimen!</h2><p id="result-detail"></p><p>Yang dicoba di misi ini: urutan, arah, perulangan, dan memperbaiki program. Kelas berbayar dengan mentor masih direncanakan dan belum tersedia. ToddlerAI generatif masih direncanakan; demo panduan wali terkurasi sudah tersedia dalam prototipe ini.</p><button class="button secondary" type="button" id="replay">Ulangi demo</button> <a class="text-link" href="index.html#jenjang">Lihat rencana berikutnya ↗</a></section>
    <div class="demo-settings"><label><input type="checkbox" id="reduce-motion"> Kurangi animasi (jalankan tanpa jeda)</label><span>Reset mengembalikan Robo, bukan menghapus program.</span></div>
    <details class="keyboard-help"><summary>Panduan keyboard &amp; aturan misi</summary><p>Gunakan <kbd>Tab</kbd> untuk berpindah dan <kbd>Enter</kbd> / <kbd>Spasi</kbd> untuk memilih tombol. Fokuskan baris blok lalu tekan Enter/Spasi untuk memilih posisi tambah sesudahnya. <kbd>Alt</kbd> + <kbd>↑</kbd> / <kbd>↓</kbd> memindahkan blok dalam daftar yang sama. <kbd>Delete</kbd> menghapus blok. Pada baris ulangi, <kbd>−</kbd> / <kbd>+</kbd> mengubah jumlah (2–9). Setelah menambah Ulangi, blok berikutnya langsung masuk ke dalamnya; pilih “Selesai isi ulangi” untuk kembali, atau pakai “Ulangi 2× maju” siap pakai. Tidak ada ulangi di dalam ulangi.</p><p>Setiap blok termasuk ulangi dan isinya dihitung terpisah. Batas 10 blok dan 100 langkah aksi. Ulangi kosong tidak dijalankan. Langkah mengeksekusi satu maju/belok. Hint hanya menunjukkan arahan, tidak menjalankan atau menambah blok. Program yang melewati finis lalu meninggalkannya belum lulus. State hanya di memori tab: muat ulang halaman menghapusnya.</p></details>
    <dialog id="confirm-clear" aria-labelledby="clear-title"><h2 id="clear-title">Hapus seluruh program?</h2><p>Robo kembali ke awal. Semua blok akan dihapus.</p><div class="dialog-actions"><button class="button secondary" id="cancel-clear" type="button">Batal</button><button class="button" id="accept-clear" type="button">Ya, hapus</button></div></dialog>`;
    renderProgram();drawBoard();updateControls();announce(L.message(state));$('reduce-motion').checked=reduced;
    $('run').addEventListener('click',runToggle);$('step').addEventListener('click',singleStep);$('reset').addEventListener('click',()=>{touchActivity();resetRobot();renderProgram();$('after-demo').hidden=true;});$('hint').addEventListener('click',showHint);
    $('append-root').addEventListener('click',()=>{insertion={parent:null,index:program.length};touchActivity();renderProgram();updateControls();announce('Posisi tambah: akhir program utama.');});
    $('start-mission').addEventListener('click',()=>{$('intro').hidden=true;mount.querySelector('[data-type]').focus();});$('quick-start').addEventListener('click',quickStart);
    $('clear-program').addEventListener('click',askClear);$('cancel-clear').addEventListener('click',()=>{$('confirm-clear').close();$('clear-program').focus();});$('accept-clear').addEventListener('click',()=>{$('confirm-clear').close();program=[];insertion={parent:null,index:0};resetRobot();renderProgram();updateControls();$('clear-program').focus();});
    $('replay').addEventListener('click',fullReset);$('reduce-motion').addEventListener('change',e=>{reduced=e.target.checked;});
    if(hints){$('hint-box').hidden=false;$('hint-title').textContent=`Petunjuk ${hints} dari 3`;$('hint-text').textContent=L.HINTS[hints-1];}
  }
  mount.addEventListener('click',e=>{if(e.target.closest('[data-preset]')){addPreset();return;}const palette=e.target.closest('[data-type]');if(palette){addBlock(palette.dataset.type);return;}const b=e.target.closest('[data-action]');if(!b)return;const f=findBlock(b.dataset.id);if(!f)return;
    const action=b.dataset.action;
    if(action==='up'||action==='down')moveBlock(b.dataset.id,action==='up'?-1:1);
    if(action==='remove')removeBlock(b.dataset.id);
    if(action==='minus'||action==='plus')setTimes(b.dataset.id,Math.max(2,Math.min(9,f.block.times+(action==='plus'?1:-1))));
    if(action==='into'){insertion={parent:f.block.id,index:f.block.body.length};touchActivity();renderProgram();updateControls();announce('Posisi tambah: isi ulangi. Ketuk blok maju atau belok.');mount.querySelector('[data-type=forward]').focus();}
  });
  mount.addEventListener('focusin',e=>{const row=e.target.closest('[data-row]');if(!row||locked())return;const f=findBlock(row.dataset.row);if(f){mount.querySelectorAll('[data-row]').forEach(r=>r.classList.toggle('selected',r===row));}});
  mount.addEventListener('change',e=>{if(e.target.dataset.times)setTimes(e.target.dataset.times,e.target.value);});
  mount.addEventListener('keydown',e=>{const row=e.target.closest('[data-row]');if(!row||e.target.tagName==='INPUT'||locked())return;const blockId=row.dataset.row;
    if(e.target===row&&(e.key==='Enter'||e.key===' ')){e.preventDefault();const f=findBlock(blockId);if(f){insertion={parent:f.parent,index:f.index+1};touchActivity();updateControls();announce('Posisi tambah dipilih: sesudah blok ini.');}}
    if(e.altKey&&(e.key==='ArrowUp'||e.key==='ArrowDown')){e.preventDefault();moveBlock(blockId,e.key==='ArrowUp'?-1:1);}
    if(e.key==='Delete'){e.preventDefault();removeBlock(blockId);}
    if(['+','-','−'].includes(e.key)){const f=findBlock(blockId);if(f&&f.block.type==='repeat'){e.preventDefault();setTimes(blockId,Math.max(2,Math.min(9,f.block.times+(e.key==='+'?1:-1))));}}
  });
  /* Phones get a simplified, usable editor (no blocking wall). */
  function deviceMode(){const phone=narrow.matches;document.body.classList.toggle('phone-mode',phone);$('device-note').hidden=!(phone||touch.matches);if(!mount.children.length)mountEditor();}
  narrow.addEventListener('change',deviceMode);touch.addEventListener('change',deviceMode);motion.addEventListener('change',e=>{reduced=e.matches;if($('reduce-motion'))$('reduce-motion').checked=reduced;});
  $('copy-link').addEventListener('click',async()=>{const url=location.href;try{if(!navigator.clipboard)throw new Error('Clipboard unavailable');await navigator.clipboard.writeText(url);$('copy-status').textContent='Tautan disalin. Buka di PC bila ingin layar lebih lega.';}catch{
    $('copy-status').textContent='Salin manual tautan berikut. Jika ini file lokal, pindahkan folder yang sama ke PC.';
    let input=$('manual-link');if(!input){input=document.createElement('input');input.id='manual-link';input.readOnly=true;input.className='copy-fallback';input.setAttribute('aria-label','Tautan demo untuk disalin manual');$('copy-status').after(input);}input.value=url;input.focus();input.select();
  }});
  setInterval(()=>{if($('hint'))updateControls();},1000);
  deviceMode();
})();
