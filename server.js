// ============================================================
// 100X LEADER EMRUL V9 — BACKEND SERVER
// All prediction logic, API fetching, and game URLs live here.
// Frontend only displays results.
// ============================================================

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

// ============================================================
// BASE64 DECODE HELPER (Node.js version of browser atob)
// ============================================================
const b64d = s => Buffer.from(s, 'base64').toString('utf-8');

// ============================================================
// MODE CONFIGS — GAME API URLS (stored safely on server)
// ============================================================
const _apiBase = b64d("aHR0cHM6Ly9kcmF3LmFyLWxvdHRlcnkwMS5jb20vV2luR28v");

const MODE_CONFIG = {
  '30s': { label:'30S', url: _apiBase + b64d("V2luR29fMzBTL0dldEhpc3RvcnlJc3N1ZVBhZ2UuanNvbg=="), timerMax: 30 },
  '1m':  { label:'1M',  url: _apiBase + b64d("V2luR29fMU0vR2V0SGlzdG9yeUlzc3VlUGFnZS5qc29u"),   timerMax: 60 },
  '3m':  { label:'3M',  url: _apiBase + b64d("V2luR29fM00vR2V0SGlzdG9yeUlzc3VlUGFnZS5qc29u"),   timerMax: 180 },
  '5m':  { label:'5M',  url: _apiBase + b64d("V2luR29fNU0vR2V0SGlzdG9yeUlzc3VlUGFnZS5qc29u"),   timerMax: 300 },
};

// ============================================================
// GAME REFERRAL URLS (stored safely on server)
// ============================================================
const GAME_URLS = {
  tigro: b64d("aHR0cHM6Ly93d3cudGlncm9jbHViLmFwcC8jL3JlZ2lzdGVyP2ludml0YXRpb25Db2RlPTE3NDUyNDA3MDU1"),
  dk:    b64d("aHR0cHM6Ly9ka3dpbjkuY29tLyMvcmVnaXN0ZXI/aW52aXRhdGlvbkNvZGU9MTg2NzMxOTgxMjY3")
};

const MAX_HISTORY    = 200;
const MIN_FOR_ANALYSIS = 10;

// ============================================================
// TRAINED PATTERN DATABASE (obfuscated via base64)
// ============================================================
const TRAINED_PATTERNS = (function(){
  const _raw = [
    b64d("QkJTQkJTQkJTQlNTU0JTQkJCU0JCQlNCQkJTQkJTU0JTU1NTU0JCQkJCQlNCU1NTQkJCU0JCU1NTQlNTQlNCQkJTU0JTU0JTQkJCU0JCQkJCU0JCVE5DQkJCVE5DTUJCU1RTQlRCVEJUQlNTQkJCVEJCQkJUQkJCVEJCUVRCVFRTVFRUVEJCQkJCQkJUQlNTVFRCQkJUQkJCVEJTU1NUU1NCU1NUU0JCQlRCQlNTU1NTVEJCQkJTU1NTXNJTU1JCVFNUUVFRQ1RUVVRCRFNTVFJCVFNUUVJCQVJCUFNJUVJUVFJCVFJCR1NVUlFSU1JTVVJSUVFSU1VTU1NVUVNSUVFTU1FSVVFSUXNUVFJCUFJCUUJCUFJUQVFSVFJSU1FTU1FTU1ZOVVJVVkpZU1ZaVFJRV1FWVldVU1dZVVZRUVZWVlFUVFRTVlZWVFdTVlVWVlZWVlZTVlVWVlZWVlZWVlZWVlZW"),
    b64d("QkJCQlNTQkJTQkJCQlNTQlNCU0JTQkJCU0JCU1NCU0JCU1NCU1NCU1NCU0JCU1NCUUNJUE5DU0JDU0ROZUNFQ0NBQ0VDQ0JDQUNBQ0NBQUNDQUFJQUNCQUNUQVBBQ0dQR1BBQ0FaUElHUFpHVVBHWlNZWlFVWllaWk5YUllZVlhYUVhVWlhVWlhVVlhWWFdWWFZYVlhWWFZYVlhWWFZYVlhWWFZYVlhWWFZYVlhWWA==")
  ];

  const rawData = _raw.filter(s => /^[BS]+$/.test(s));

  if(!rawData.length){
    rawData.push("BBSBBSBBSBSSSBSBBBSBBBSBBBSBBSSBSSSSSBBBBBBBSBSSSBBBSBBSSSBSSBSBBBSSBSSBSBBBSBBBBBSBSBSSSBSBBBBSSBBSSSBBBBBSSSSSBBSBBSBBBSBSBBSBBSBSSBBSBBBSBBBBSBBBSBSSSSBBBBBBBSSSSBSSBSSSSSSBBBBBBSSBBBSBBBSBSSSSBSSBSSBSBBBSBBSBSSSSSBBBBSSSSBBSSSSSSBSSSSBSBBSBSSBSSBBBSBSBSSSBBBSBSBBSSSSSSBSBBSSSSSSBBBBBBSSSSBSSBSSBBSBSSBBBSBBSBBSBBSBSSBBSSBBBSBBBBSSBBSBSSSSBBBBBBBSSSSBSSBSSSSSSBBBBBBSSSBBBBSSBBBSBSBBBBSBBSBSBBSSBBSBBSSBBSSBSSSBBSSSBSBBSBSSSBBBSSSBBSSBSSBBSSBBBBSSSBSBSSSSBBSBBBSBSBBBSBBSSBSBBBSBBSSSBSSBSSBBBBSBBSSBSBSBBSSBSBSSBSBBSSBBBBBSBBBBSSSBSSBBSBSSSBSBBBSBSBBSBBBSSBBBBSSSSBSSSBSSSBSSSBSSBSSSBSSSBBBSBBSSBBBBSBBSSSBSSSBBBBBSSSBSSBBBBSBBBSSSSBBBSSBBSBBBSSSBBBSSBBSSBBBSSBBSBBSSBBSSSSBSSSBBSBSBSBBSSBBSBBSBSBBSSBSSBSBBBSBSSBSSBSBSBBBSBSBSBSBBSSBSSSSBSSBSBBSSBSBSSBSSSSSSBSSBBSSSBBBBBBSBBSSBBBSBSBBBBSBSBBSBBSBBBBBBSBSSBSBBSSBSBSSBSSSSSSBSSBBSSSBBBBBBSBBSSBBBSBSBBBBSBSBBSBBSBBBBBBSBSBBSBSBSBSSBSSBSBBBSBSSBSSBSBSBBBSBSBSBSBBSSBSSSSBSSBSBBSSBSBSSBSSSSSSBSSBBSSSBBBBBBSBBSSBBBSBSBBBBSBSBBSBBSBBBBBBSBBSBSSBSSBBSBBSBSBBSSBSSBSBBBSBSSBSSBSBSBBBSBSBSBSBBSSBSSSSBSSBSBBSSBSBSSBSSSSSSBSSBBSSSBBBBBBSBBSSBBBSBSBBBBSBSBBSBBSBBBBBBSBBSSBSSSSBSSBSBBSSBSBSSBSSSSSSBSSBBSSSBBBBBBSBBSSBBBSBSBBBBSBSBBSBBSBBBBBBBSBSBSSBBBBSSBBBBBSBSBBBSBSSBSSBSBBBSBBSSBSBBBSBBSSSSSBBSSSBBSSBBBSBSBBBSBSSSSSBSBBBSBBSSSSBBSBBBSSBSSBSBSBSSBBSSBBBBBBSSBBBSBSSBSSBSBBSSBSBBBBBBSBSSBSSSSBSBSBSBBSSBSSBBSBBBSBBSBSSSBBSBBBSBBBBBSBSBSBSBBBSBSBSBBBBBBBSBBSSSBBSBBBBBBBBBSBBSBSSBSSSSSBBSSBSSBSSSBSSBBSSBSBSSBSBBBSBBSBSBBBSBBBSBSSSBSBSSBSSSBSBBSBSBSSBBSBBBSBBBSBBSSSSBSBSSBBBBBBBSBSBSSSBSBSSBSBBBSBSBBBBBBBSBBBBBBBBBBSSBSBBBSBBBBBBBSBSBSSBBSBBSBSBSSBBSBSBBBBBSBSBBBBBBBSBSSSSBSSBBSBBBBBSBSSBSSSBSBBBSBSBSSBSSBSSBBBSBSBBSBBBBBBSSBSSBSSBBBSBSBSSBSSBSSB");
  }

  const runDB     = { B: {}, S: {} };
  const patternDB = {};

  for(const raw of rawData){
    const arr = raw.split('').filter(c => c==='B'||c==='S');
    let i = 0;
    while(i < arr.length){
      const side = arr[i];
      if(side!=='B'&&side!=='S'){ i++; continue; }
      let len = 0;
      while(i+len < arr.length && arr[i+len] === side) len++;
      const nextSide = arr[i+len] || null;
      if(nextSide && (nextSide==='B'||nextSide==='S')){
        if(!runDB[side][len]) runDB[side][len] = { cont:0, rev:0 };
        if(nextSide === side) runDB[side][len].cont++;
        else                  runDB[side][len].rev++;
      }
      i += len;
    }
    for(let plen = 2; plen <= 6; plen++){
      for(let j = 0; j < arr.length - plen; j++){
        const key  = arr.slice(j, j+plen).join('');
        if(!/^[BS]+$/.test(key)) continue;
        const next = arr[j+plen];
        if(!next||(next!=='B'&&next!=='S')) continue;
        if(!patternDB[key]) patternDB[key] = { B:0, S:0 };
        patternDB[key][next]++;
      }
    }
  }
  return { runDB, patternDB };
})();

// ============================================================
// ANALYSIS HELPERS
// ============================================================
function getRunContinuationBias(side, runLen){
  const db = TRAINED_PATTERNS.runDB[side];
  let contTotal = 0, revTotal = 0;
  for(let l = Math.max(1, runLen-1); l <= runLen+1; l++){
    if(db[l]){ contTotal += db[l].cont; revTotal += db[l].rev; }
  }
  const total = contTotal + revTotal;
  if(total < 3) return null;
  return { contP: contTotal/total, revP: revTotal/total, total };
}

function getPatternBias(bsArr){
  const db = TRAINED_PATTERNS.patternDB;
  for(let plen = 6; plen >= 2; plen--){
    if(bsArr.length < plen) continue;
    const key = bsArr.slice(0, plen).join('');
    if(db[key] && (db[key].B + db[key].S) >= 3){
      const total = db[key].B + db[key].S;
      return { B: db[key].B/total, S: db[key].S/total, matchLen: plen, total };
    }
  }
  return null;
}

// ============================================================
// ANALYSIS ENGINE (full prediction logic — server-side)
// ============================================================
function runAnalysis(_h){
  const _s  = _h.slice().sort((a,b)=>Number(b.period)-Number(a.period));
  const _d  = _s.map(h=>({ num:h.num, bs: h.num>=5?'B':'S' }));
  const _bs = _d.map(d=>d.bs);
  const _ns = _d.map(d=>d.num);
  const _lb = _bs[0];
  const _r10= _d.slice(0,10);

  // Vote 1: Frequency
  const _bc = _r10.filter(x=>x.bs==='B').length;
  const _sc = _r10.filter(x=>x.bs==='S').length;
  const _fv = _bc < _sc ? 'B' : 'S';

  // Vote 2: Streak
  let _stk=1;
  for(let i=1;i<_r10.length;i++){ if(_r10[i].bs===_lb) _stk++; else break; }
  let _ps=0;
  if(_r10.length>1){ const _psi=_r10[1].bs; for(let i=1;i<_r10.length;i++){ if(_r10[i].bs===_psi) _ps++; else break; } }
  const _sjb = _stk===1 && _ps>=3;
  let _sv, _sw, _sn;
  if(_stk>=3){ _sv=_lb; _sw=5; _sn=`LOCK×${_stk}`; }
  else if(_sjb){
    const _rb2=getRunContinuationBias(_lb,_stk);
    if(_rb2&&Math.abs(_rb2.contP-_rb2.revP)>0.12){ _sv=_rb2.contP>_rb2.revP?_lb:(_lb==='B'?'S':'B'); _sw=Math.round(2+Math.max(_rb2.contP,_rb2.revP)*2); _sn='BROKE(HIST)'; }
    else { _sv=_fv; _sw=2; _sn='BROKE(FREQ10)'; }
  } else {
    const _rb3=getRunContinuationBias(_lb,_stk);
    if(_rb3&&Math.abs(_rb3.contP-_rb3.revP)>0.12){ _sv=_rb3.contP>_rb3.revP?_lb:(_lb==='B'?'S':'B'); _sw=Math.round(2+Math.max(_rb3.contP,_rb3.revP)*2); _sn=`HIST×${_stk}`; }
    else { _sv=_lb; _sw=1; _sn='STREAK'; }
  }

  // Vote 3: Alt pattern
  const _s6=_bs.slice(0,6); let _as=0;
  for(let i=0;i<_s6.length-1;i++) if(_s6[i]!==_s6[i+1]) _as++;
  const _ia=_as>=4;
  const _av=_ia?(_s6[0]==='B'?'S':'B'):_fv;
  const _aw=_ia?2:1;

  // Vote 4: Gap
  const _bp=_r10.map((x,i)=>x.bs==='B'?i:-1).filter(x=>x>=0);
  const _sp2=_r10.map((x,i)=>x.bs==='S'?i:-1).filter(x=>x>=0);
  const _bg=_bp.length>1?_bp[1]-_bp[0]:10;
  const _sg=_sp2.length>1?_sp2[1]-_sp2[0]:10;
  const _gv=_bg>_sg?'B':'S';

  // Vote 5: Momentum
  const _r3b=_r10.slice(0,3).filter(x=>x.bs==='B').length;
  const _r7b=_r10.slice(0,7).filter(x=>x.bs==='B').length;
  const _mv=_r3b/3-_r7b/7;
  const _mv2=_mv<0?'B':'S';

  // Vote 6: Pattern
  let _pv=null,_pw=0,_pn='NO-PATTERN';
  const _pb=getPatternBias(_bs.slice(0,8));
  if(_pb){ const _w=_pb.B>=_pb.S?'B':'S'; const _cf=Math.max(_pb.B,_pb.S); if(_cf>0.55){ _pv=_w; _pw=Math.round(_cf*4); _pn=`PATTERN-${_pb.matchLen}G(${Math.round(_cf*100)}%)`; } }

  // Vote 7: Direction lock
  let _dv=null,_dw=0;
  if(_stk>=3){ _dv=_lb; _dw=3; }

  // Weighted vote
  const _reas=[
    { vote:_fv, weight:2 },
    { vote:_sv, weight:_sw, name:_sn },
    { vote:_av, weight:_aw },
    { vote:_gv, weight:1 },
    { vote:_mv2, weight:2 },
  ];
  if(_pv) _reas.push({ vote:_pv, weight:_pw, name:_pn });
  if(_dv) _reas.push({ vote:_dv, weight:_dw });

  let _bsc=0,_ssc=0,_tw=0;
  _reas.forEach(r=>{ if(r.vote==='B') _bsc+=r.weight; else _ssc+=r.weight; _tw+=r.weight; });

  // ── 5-Rule Engine ──
  let _streak=1;
  for(let i=1;i<_bs.length;i++){ if(_bs[i]===_lb) _streak++; else break; }

  const _z6=_bs.slice(0,6); let _zAlts=0;
  for(let i=0;i<_z6.length-1;i++) if(_z6[i]!==_z6[i+1]) _zAlts++;
  const _isZigzag=_zAlts>=4;

  const _lastNum=_ns[0];
  let _gravityVote=null,_gravityWeight=0,_gravityName='';
  if(_lastNum===0||_lastNum===1){ _gravityVote='B'; _gravityWeight=5; _gravityName=`GRAVITY-UP(${_lastNum})`; }
  else if(_lastNum===6||_lastNum===7){ _gravityVote='S'; _gravityWeight=5; _gravityName=`GRAVITY-DN(${_lastNum})`; }

  let _fb,_activeRule,_ruleCls,_confBoost=0;

  if(_streak>=5){ _fb=_lb==='B'?'S':'B'; _activeRule=`DRAGON-BREAK ×${_streak}`; _ruleCls='dragon'; _confBoost=22; }
  else if(_streak===3){ _fb=_lb==='B'?'S':'B'; _activeRule='TRIPLET-REVERSE'; _ruleCls='triplet'; _confBoost=16; }
  else if(_isZigzag){ _fb=_lb==='B'?'S':'B'; _activeRule=`ZIGZAG-LOOP(${_zAlts}/5)`; _ruleCls='zigzag'; _confBoost=12; }
  else if(_streak===4){ _fb=_lb; _activeRule='TREND-CONT ×4'; _ruleCls='trend'; _confBoost=10; }
  else if(_streak===2){
    if(_gravityVote){ _fb=_gravityVote; _activeRule=_gravityName; _ruleCls='gravity'; _confBoost=8; }
    else { _bsc+=_lb==='B'?1:0; _ssc+=_lb==='S'?1:0; _tw+=1; _fb=_bsc>=_ssc?'B':'S'; _activeRule='TREND-CONT ×2'; _ruleCls='trend'; _confBoost=5; }
  } else {
    if(_gravityVote){ _fb=_gravityVote; _activeRule=_gravityName; _ruleCls='gravity'; _confBoost=8; }
    else { _fb=_bsc>=_ssc?'B':'S'; _activeRule=`VOTES(${_bsc}B/${_ssc}S)`; _ruleCls='votes'; _confBoost=0; }
  }

  const _conf=Math.min(97, Math.round((Math.max(_bsc,_ssc)/Math.max(_tw,1))*100)+_confBoost);

  // Stats
  const _btot=_bs.filter(x=>x==='B').length;
  const _bpct=_btot/_bs.length*100;
  const _dev=_bpct-50;
  const _pB=_bpct/100, _pS=1-_pB;
  const _entr=(_pB>0&&_pS>0)?-(_pB*Math.log2(_pB)+_pS*Math.log2(_pS)):0;
  let _sw2=0;
  for(let i=0;i<Math.min(_bs.length-1,19);i++) if(_bs[i]!==_bs[i+1]) _sw2++;
  const _vol=(_sw2/Math.min(_bs.length-1,19))*100;
  const _moms=_mv>0.08?'OVERBOUGHT':(_mv<-0.08?'OVERSOLD':'NEUTRAL');
  const _rsc=_entr>0.9?3:(_entr>0.7?2:1);
  const _rl=_rsc===1?'LOW':_rsc===2?'MEDIUM':'HIGH';
  const _hmm=_reas.reduce((a,b)=>b.weight>a.weight?b:a).name||'ANALYSIS';

  // ── New Logic Layer ──
  const _colorOf=n=>[1,3,7,9].includes(n)?'G':[2,4,6,8].includes(n)?'R':'V';
  const _recentColors=_ns.slice(0,10).map(_colorOf);
  const _gCount=_recentColors.filter(c=>c==='G').length;
  const _rCount=_recentColors.filter(c=>c==='R').length;
  let _colorComeback=null;
  if(_gCount>=7) _colorComeback='R';
  else if(_rCount>=7) _colorComeback='G';

  let _colorStreak=1;
  for(let i=1;i<_recentColors.length;i++){ if(_recentColors[i]===_recentColors[0]) _colorStreak++; else break; }
  let _colorStreakReverse=null;
  if(_colorStreak>=3){ if(_recentColors[0]==='G') _colorStreakReverse='R'; else if(_recentColors[0]==='R') _colorStreakReverse='G'; }

  const _violetRecent=_ns.slice(0,10).filter(n=>n===0||n===5).length;
  const _zeroRepeat=_ns.slice(0,5).filter(n=>n===0).length;
  const _fiveRepeat=_ns.slice(0,5).filter(n=>n===5).length;
  let _violetPressure=null;
  if(_zeroRepeat>=2) _violetPressure='S';
  if(_fiveRepeat>=2) _violetPressure='B';

  const _numFreq={};
  for(const n of _ns.slice(0,10)){ _numFreq[n]=(_numFreq[n]||0)+1; }
  const _maxRepeatNum=Object.keys(_numFreq).reduce((a,b)=>_numFreq[a]>_numFreq[b]?a:b,0);
  const _maxRepeatCount=_numFreq[_maxRepeatNum]||0;
  let _repeatPressure=null;
  if(_maxRepeatCount>=3) _repeatPressure='fatigue';

  const _highNums=_ns.slice(0,10).filter(n=>n>=7).length;
  const _lowNums=_ns.slice(0,10).filter(n=>n<=2).length;
  const _midNums=_ns.slice(0,10).filter(n=>n===5||n===6).length;
  let _numZonePressure=null;
  if(_highNums>=5) _numZonePressure='HIGH_DOMINANT';
  else if(_lowNums>=5) _numZonePressure='LOW_DOMINANT';
  else if(_midNums>=4) _numZonePressure='MID_STABLE';

  const _p1=_bs[0];
  const _p2pair=_bs.slice(0,2).join('');
  let _p2vote=null;
  if(_p2pair==='BB') _p2vote='S';
  else if(_p2pair==='SS') _p2vote='B';
  else if(_p2pair==='BS') _p2vote='B';
  else if(_p2pair==='SB') _p2vote='S';

  const _r5bs=_bs.slice(0,5);
  const _r5B=_r5bs.filter(x=>x==='B').length;
  const _r5S=_r5bs.filter(x=>x==='S').length;
  const _p3vote=_r5B>_r5S?'S':'B';

  const _r20bs=_bs.slice(0,20);
  const _r20B=_r20bs.filter(x=>x==='B').length;
  const _r20S=_r20bs.filter(x=>x==='S').length;
  const _p4vote=_r20B>_r20S?'S':'B';

  const _last3=_bs.slice(0,3);
  let _trapDetected=false;
  if(_last3.length===3){ if((_last3[0]!==_last3[1])&&(_last3[1]!==_last3[2])&&(_last3[0]===_last3[2])) _trapDetected=true; }

  const _altCheck=_bs.slice(0,8); let _altCount2=0;
  for(let i=0;i<_altCheck.length-1;i++) if(_altCheck[i]!==_altCheck[i+1]) _altCount2++;
  const _isHighAlternating=_altCount2>=6;

  let _newBboost=0,_newSboost=0;
  if(_p2vote==='B') _newBboost+=2; else if(_p2vote==='S') _newSboost+=2;
  if(_p3vote==='B') _newBboost+=1; else if(_p3vote==='S') _newSboost+=1;
  if(_p4vote==='B') _newBboost+=1; else if(_p4vote==='S') _newSboost+=1;
  if(_violetPressure==='B') _newBboost+=2; else if(_violetPressure==='S') _newSboost+=2;
  if(_isHighAlternating){ if(_lb==='B') _newSboost+=2; else _newBboost+=2; }
  if(_trapDetected){ if(_lb==='B') _newBboost+=1; else _newSboost+=1; }
  if(_numZonePressure==='HIGH_DOMINANT') _newBboost+=1;
  else if(_numZonePressure==='LOW_DOMINANT') _newSboost+=1;

  _bsc+=_newBboost; _ssc+=_newSboost; _tw+=(_newBboost+_newSboost);
  const _newLogicStrongOverride=Math.abs(_newBboost-_newSboost)>=3;
  if(_newLogicStrongOverride&&_ruleCls==='votes') _fb=_bsc>=_ssc?'B':'S';

  const _oc=_ns.slice(0,10).filter(x=>x%2!==0).length;
  const _oes=_oc>6?'even':'odd';
  const _a5=_ns.slice(0,5).reduce((a,b)=>a+b,0)/5;

  const _zn=_fb==='B'?[5,6,7,8,9]:[0,1,2,3,4];
  const _gaps={}; for(const n of _zn){ const idx=_ns.indexOf(n); _gaps[n]=idx===-1?50:idx; }
  const _temps={}; for(const n of _zn){ const g=_gaps[n]; _temps[n]=g<=2?'HOT':g<=6?'WARM':g<=10?'COLD':'FROZEN'; }
  const _scrs={};
  for(const n of _zn){
    let sc=_gaps[n]*1.5;
    if(_temps[n]==='COLD') sc+=20;
    if(_temps[n]==='FROZEN') sc+=35;
    if(_temps[n]==='HOT') sc-=20;
    const _io=n%2!==0;
    if((_oes==='odd'&&_io)||(_oes==='even'&&!_io)) sc+=15;
    sc-=Math.abs(n-_a5)*2;
    const _nc=_colorOf(n);
    if(_colorComeback&&_nc===_colorComeback) sc+=18;
    if(_colorStreakReverse&&_nc===_colorStreakReverse) sc+=12;
    if(_repeatPressure==='fatigue'&&n===parseInt(_maxRepeatNum)) sc-=25;
    if(_violetPressure==='B'&&n===5) sc+=15;
    if(_violetPressure==='S'&&n===0) sc+=15;
    if(_numZonePressure==='HIGH_DOMINANT'&&n>=7) sc+=10;
    if(_numZonePressure==='LOW_DOMINANT'&&n<=2) sc+=10;
    _scrs[n]=Math.max(0,sc);
  }
  const _srtd=_zn.slice().sort((a,b)=>_scrs[b]-_scrs[a]);

  return {
    bs:_fb, num:_srtd[0], backup:_srtd[1]??_srtd[0], confidence:_conf,
    bigVotes:_bsc, smallVotes:_ssc, totalVotes:_tw,
    hmmMode:(_hmm||'ANALYSIS').slice(0,18),
    entropy:_entr.toFixed(2), momentum:_moms,
    volatility:_vol.toFixed(1), regression:_dev.toFixed(1),
    riskLabel:_rl,
    zone:_fb==='B'?'BIG ZONE [5-9]':'SMALL ZONE [0-4]',
    activeRule:_activeRule, ruleCls:_ruleCls, streak:_streak,
    bsHistory:_bs.slice(0,6),
    colorComeback:_colorComeback, violetPressure:_violetPressure,
    numZonePressure:_numZonePressure, trapDetected:_trapDetected,
    isHighAlternating:_isHighAlternating,
  };
}

// ============================================================
// PER-MODE HISTORY STORE (in-memory cache)
// ============================================================
const historyStore = { '30s':[], '1m':[], '3m':[], '5m':[] };
const responseCache = {
  '30s':{ data:null, ts:0 },
  '1m': { data:null, ts:0 },
  '3m': { data:null, ts:0 },
  '5m': { data:null, ts:0 }
};

// ============================================================
// FETCH FROM GAME API
// ============================================================
async function fetchGameData(mode){
  const cfg = MODE_CONFIG[mode];
  const url = `${cfg.url}?pageNo=1&pageSize=100&_t=${Date.now()}`;
  const res  = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
  });
  if(!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json?.data?.list || json?.list || [];
}

// ============================================================
// REST ENDPOINTS
// ============================================================

// GET /api/predict?mode=30s
app.get('/api/predict', async (req, res) => {
  const mode = ['30s','1m','3m','5m'].includes(req.query.mode) ? req.query.mode : '30s';
  const cfg  = MODE_CONFIG[mode];
  const now  = Date.now();

  // Return cached response if less than 3 seconds old
  if(responseCache[mode].data && (now - responseCache[mode].ts) < 3000){
    return res.json(responseCache[mode].data);
  }

  try {
    const list  = await fetchGameData(mode);
    const store = historyStore[mode];

    for(const item of list){
      const period = String(item.issueNumber || item.period || '');
      const num    = parseInt(item.number ?? item.winNumber ?? -1);
      if(isNaN(num)||num<0||num>9) continue;
      if(!store.find(h=>h.period===period)) store.push({ period, num });
    }
    store.sort((a,b)=>Number(b.period)-Number(a.period));
    if(store.length > MAX_HISTORY) store.splice(MAX_HISTORY);

    let prediction = null;
    if(store.length >= MIN_FOR_ANALYSIS) prediction = runAnalysis(store);

    const payload = {
      success:      true,
      mode,
      timerMax:     cfg.timerMax,
      history:      store.slice(0, 100),
      latestPeriod: store[0]?.period || '—',
      prediction,
      gameUrls:     GAME_URLS
    };

    responseCache[mode] = { data: payload, ts: now };
    return res.json(payload);

  } catch(e){
    console.error(`[${mode}] fetch error:`, e.message);
    // Return stale cache if available
    if(responseCache[mode].data){
      return res.json({ ...responseCache[mode].data, stale: true });
    }
    return res.status(500).json({ success: false, error: e.message });
  }
});

// GET /api/gameurl/:game
app.get('/api/gameurl/:game', (req, res) => {
  const url = GAME_URLS[req.params.game];
  if(!url) return res.status(404).json({ success:false, error:'Unknown game' });
  res.json({ success:true, url });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status:'ok', uptime: process.uptime(), ts: new Date().toISOString() });
});

// Serve frontend SPA for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================================
// START
// ============================================================
app.listen(PORT, () => {
  console.log(`✅ 100X Leader Emrul server running on port ${PORT}`);
  console.log(`   API: http://localhost:${PORT}/api/predict?mode=30s`);
});
