/* RoboNest: original, dependency-free mission logic. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RoboLogic = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const LEVEL = Object.freeze({size:5,start:Object.freeze({x:1,y:1,dir:1}),finish:Object.freeze({x:3,y:3}),obstacles:Object.freeze([]),blockLimit:10,stepLimit:100});
  const DIRECTIONS = ['atas','kanan','bawah','kiri'];
  const LABELS = {forward:'maju',left:'belok kiri',right:'belok kanan',repeat:'ulangi'};
  const HINTS = ['Finis ada 2 kotak ke kanan lalu 2 kotak ke bawah.', 'Gerakan yang sama berulang? Coba blok ulangi.', 'Mulai dengan ulangi 2 kali berisi maju. Kotak tujuan berikutnya: kolom 2, baris 1.'];
  function countBlocks(program) {return program.reduce((n,b)=>n+1+(b.type==='repeat'?countBlocks(b.body || []):0),0);}
  function validate(program, level=LEVEL) {
    if (!Array.isArray(program) || !program.length) return 'Tambahkan blok dulu';
    let total=0;
    function visit(list, depth) {
      if (!Array.isArray(list)) return 'Isi ulangi tidak valid';
      for (const b of list) {
        total++;
        if (total>level.blockLimit) return 'Blok sudah penuh (10/10). Coba pakai ulangi!';
        if (!b || !Object.hasOwn(LABELS,b.type)) return 'Blok tidak dikenal';
        if(b.type==='repeat') {
          if(depth>0) return 'Tidak boleh ada ulangi di dalam ulangi';
          if(!Number.isInteger(b.times)||b.times<2||b.times>9) return 'Ulangi harus 2–9 kali';
          if(!Array.isArray(b.body)||!b.body.length) return 'Ulangi kosong. Tambahkan isi dulu';
          const error=visit(b.body,depth+1); if(error) return error;
        }
      }
      return null;
    }
    return visit(program,0);
  }
  function compile(program, level=LEVEL) {
    const error=validate(program,level); if(error) return {error,actions:[]};
    const actions=[];
    function expand(list) {
      for(const b of list) {
        if(actions.length>level.stepLimit) return;
        if(b.type==='repeat') {for(let i=0;i<b.times;i++){expand(b.body); if(actions.length>level.stepLimit) break;}}
        else actions.push({type:b.type,id:b.id});
      }
    }
    expand(program); return {error:null,actions};
  }
  function initial(level=LEVEL) {return {...level.start,steps:0,cursor:0,status:'ready',activeId:null,problem:null};}
  function step(state, actions, level=LEVEL) {
    if(!['ready','running','paused'].includes(state.status)) return {...state};
    if(state.cursor>=actions.length) return {...state,status:state.x===level.finish.x&&state.y===level.finish.y?'success':'incomplete'};
    if(state.steps>=level.stepLimit) return {...state,status:'limit'};
    const a=actions[state.cursor];
    const s={...state,steps:state.steps+1,cursor:state.cursor+1,activeId:a.id,status:'running',problem:null};
    if(a.type==='left') s.dir=(s.dir+3)%4;
    if(a.type==='right') s.dir=(s.dir+1)%4;
    if(a.type==='forward') {
      const dx=[0,1,0,-1][s.dir],dy=[-1,0,1,0][s.dir];
      const x=s.x+dx,y=s.y+dy;
      if(x<1||y<1||x>level.size||y>level.size) return {...s,status:'edge',problem:{x,y}};
      if(level.obstacles.some(p=>p.x===x&&p.y===y)) return {...s,status:'obstacle',problem:{x,y}};
      s.x=x;s.y=y;
    }
    if(s.cursor===actions.length) s.status=s.x===level.finish.x&&s.y===level.finish.y?'success':'incomplete';
    return s;
  }
  function run(program, level=LEVEL) {
    const compiled=compile(program,level); let state=initial(level);
    if(compiled.error) return {...state,status:'invalid',error:compiled.error};
    while(['ready','running'].includes(state.status)) state=step(state,compiled.actions,level);
    return state;
  }
  function hint(index) {return {index:Math.min(index+1,3),text:HINTS[Math.min(index,2)]};}
  function hintAvailable(failures,idleMs) {return failures>=2||idleMs>=90000;}
  function message(s, blocks=0) {
    const messages={ready:'Robo siap. Susun program, lalu jalankan.',success:`Hebat! Robo sampai finis. ${blocks} blok.${blocks<=5?' ⭐ Bintang misi!':''}`,edge:'Robo hampir jatuh dari papan',obstacle:'Robo menabrak batu',incomplete:'Program selesai, tapi Robo belum di finis',limit:'Batas 100 langkah tercapai. Coba pendekkan program.'};
    return messages[s.status]||`Langkah ${s.steps}: ${DIRECTIONS[s.dir]}.`;
  }
  return {LEVEL,DIRECTIONS,LABELS,HINTS,countBlocks,validate,compile,initial,step,run,hint,hintAvailable,message};
});
