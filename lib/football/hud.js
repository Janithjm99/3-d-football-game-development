const icons={
  arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
  sound:'<path d="m11 5-6 4H2v6h3l6 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  mute:'<path d="m11 5-6 4H2v6h3l6 4V5Zm5 4 6 6m0-6-6 6"/>',
  expand:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  settings:'<path d="M4 7h16M4 17h16M8 4v6m8 4v6"/>',
  pause:'<path d="M8 5v14m8-14v14"/>',
  play:'<path d="m8 5 11 7-11 7V5Z"/>',
  chevron:'<path d="m8 5 7 7-7 7"/>',
  close:'<path d="m6 6 12 12M6 18 18 6"/>',
  pin:'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
  shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
  trophy:'<path d="M8 3h8v7a4 4 0 0 1-8 0V3Zm0 2H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 2v5m-4 2h8"/>',
}
const icon=name=>`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.arrow}</svg>`
const key=(value)=>`<kbd>${value}</kbd>`
const controls=`<div class="control-row"><span class="key-set">${key('W')}${key('A')}${key('S')}${key('D')}</span><span>Move player</span></div><div class="control-row">${key('SHIFT')}<span>Sprint</span></div><div class="control-row">${key('SPACE')}<span>Shoot toward goal</span></div><div class="control-row">${key('E')}<span>Pass to teammate</span></div><div class="control-row">${key('Q')}<span>Switch player</span></div><div class="control-row"><span>${key('Z')} ${key('C')}</span><span>Hold to curve a shot</span></div><div class="control-row">${key('ESC')}<span>Pause match</span></div>`

export class HUD {
  constructor(root, actions){
    this.root=root;this.actions=actions;this.abort=new AbortController();this.lastState='';this.lastSecond=-1
    root.innerHTML=`
      <header class="app-header">
        <a class="wordmark" href="/" aria-label="Floodlight home"><span class="brand-mark">F<span></span></span>FLOODLIGHT<span class="beta-tag">PLAY</span></a>
        <nav aria-label="Game navigation"><button class="nav-item active" data-action="home">Quick match</button><button class="nav-item" data-action="controls">How to play</button><button class="nav-item" data-action="settings">Settings</button></nav>
        <div class="header-actions"><span class="local-status"><i></i> ALL PLAY. NO DOWNLOAD.</span><button class="icon-button sound-button" data-action="sound" aria-label="Mute sound">${icon('sound')}</button><button class="icon-button" data-action="fullscreen" aria-label="Toggle fullscreen">${icon('expand')}</button></div>
      </header>
      <section class="game-stage" aria-label="Football match">
        <div class="stadium-canvas"></div><div class="stage-vignette"></div><div class="stage-grain"></div>
        <div class="broadcast-bar"><div class="match-badge"><span class="live-dot"></span> EXHIBITION <span class="badge-divider"></span> 5-A-SIDE</div><div class="venue-label">${icon('pin')} THE FLOODLIGHT ARENA <span>21:00 · CLEAR NIGHT</span></div></div>
        <section class="scoreboard" aria-label="Match scoreboard"><div class="team-score home-team"><span class="mini-crest">N</span><span>NORTH FC</span></div><div class="score"><b data-score="0">0</b><span>:</span><b data-score="1">0</b></div><div class="team-score away-team"><span>SOUTH FC</span><span class="mini-crest">S</span></div><div class="clock"><span class="clock-dot"></span><span data-clock>00:00</span><span class="period">MATCH</span></div></section>
        <aside class="intro-panel">
          <div class="eyebrow"><span></span> THE BEAUTIFUL GAME. REIMAGINED.</div>
          <h1>THIS IS<br>YOUR <em>PITCH.</em></h1>
          <p class="intro-copy">Under the lights. In the moment.<br>Pure football, right in your browser.</p>
          <div class="match-setup"><div class="setup-title"><span>QUICK MATCH</span><span class="small-pill">5 v 5</span></div>
            <div class="teams-preview"><div><span class="team-crest north">${icon('shield')}<b>N</b></span><strong>North FC</strong><small>YOUR TEAM</small></div><span class="versus">VS</span><div><span class="team-crest south">${icon('shield')}<b>S</b></span><strong>South FC</strong><small>AI OPPONENT</small></div></div>
            <div class="setup-options"><label>Match length<select name="duration" aria-label="Match length"><option value="180">3 minutes</option><option value="300">5 minutes</option><option value="600">10 minutes</option></select></label><label>Difficulty<select name="difficulty" aria-label="Difficulty"><option value="0.8">Casual</option><option value="1" selected>Regular</option><option value="1.2">Challenging</option></select></label></div>
            <button class="kickoff-button" data-action="start"><span>${icon('play')} KICK OFF</span>${icon('arrow')}</button>
          </div>
          <p class="ready-note"><span class="live-dot"></span> No sign-up. Just step onto the pitch.</p>
        </aside>
        <div class="scene-caption"><span class="caption-line"></span><span>BUILT FOR THE LOVE<br><b>OF THE GAME.</b></span></div>
        <div class="stadium-detail"><span class="detail-dot"></span><span>THE FLOODLIGHT ARENA<small>FLOODLIT · NATURAL GRASS · 5-A-SIDE</small></span><span class="detail-number">01</span></div>
        <div class="pitch-direction"><span>NORTH FC</span> ATTACKING ${icon('arrow')}</div>
        <div class="player-card"><span class="player-number">9</span><div><span class="player-label">CONTROLLED PLAYER</span><strong class="player-name">L. Brooks</strong><div class="stamina-track"><i></i></div></div><span class="player-position">ST</span></div>
        <canvas class="radar" width="204" height="132" aria-label="Live tactical minimap"></canvas>
        <button class="pause-button icon-button" data-action="pause" aria-label="Pause match">${icon('pause')}</button>
        <div class="match-toast" role="status" aria-live="polite"></div>
        <div class="goal-banner" aria-live="polite"><span>WHAT A FINISH.</span><strong>GOOOAL!</strong><p class="goal-team"></p><button data-action="skip">Skip replay ${icon('chevron')}</button></div>
        <div class="replay-label"><span class="live-dot"></span> INSTANT REPLAY <span>0.5×</span></div>
        <div class="touch-controls"><div class="joystick" aria-label="Drag to move player"><span></span></div><div class="touch-actions"><button data-touch="switch" aria-label="Switch player">SWITCH</button><button data-touch="pass" aria-label="Pass ball">PASS</button><button data-touch="sprint" aria-label="Hold to sprint">SPRINT</button><button class="touch-shoot" data-touch="shoot" aria-label="Shoot ball">SHOOT</button></div></div>
        <div class="controls-dock"><span class="dock-label">THE BASICS</span><span>${key('W')}${key('A')}${key('S')}${key('D')} Move</span><span>${key('SHIFT')} Sprint</span><span>${key('SPACE')} Shoot</span><span>${key('E')} Pass</span><span>${key('Q')} Switch</span><button data-action="controls">All controls ${icon('chevron')}</button></div>
      </section>
      <footer class="status-footer"><span><i class="live-dot"></i> <span class="engine-status">STADIUM READY</span><span class="footer-separator">/</span><span class="render-tech">WEBGL 2.0</span></span><span class="footer-center">REAL FOOTBALL. ZERO FRICTION.</span><span><span class="quality-label">AUTO QUALITY</span><span class="footer-separator">/</span><span class="fps-value">— FPS</span><span class="connection-bars"><i></i><i></i><i></i><i></i></span></span></footer>
      <dialog class="game-dialog" aria-labelledby="dialog-title"><button class="dialog-close icon-button" data-action="close" aria-label="Close dialog">${icon('close')}</button><div class="dialog-content"></div></dialog>`
    root.addEventListener('click',event=>{const button=event.target.closest('[data-action]');if(button)actions[button.dataset.action]?.()}, {signal:this.abort.signal})
    this.dialog=root.querySelector('dialog');this.dialog.addEventListener('cancel',event=>{event.preventDefault();actions.close()}, {signal:this.abort.signal})
    this.dialog.addEventListener('click',e=>{if(e.target===this.dialog){const r=this.dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)actions.close()}},{signal:this.abort.signal})
    this.radar=root.querySelector('.radar').getContext('2d')
    this.elements={clock:root.querySelector('[data-clock]'),scores:[...root.querySelectorAll('[data-score]')],name:root.querySelector('.player-name'),number:root.querySelector('.player-number'),stamina:root.querySelector('.stamina-track i')}
  }
  showDialog(type,match){
    this.dialogType=type
    let content=''
    if(type==='controls')content=`<div class="eyebrow">YOUR FIRST TOUCH</div><h2 id="dialog-title">Make your move.</h2><p>Control North FC in a timed, five-a-side match. Attack the goal on the right.</p><div class="controls-list">${controls}</div><div class="rules-note"><strong>A few pitch rules</strong><p>Run close to the ball to collect or tackle. Shoot is aimed toward goal. Out-of-play balls restart as kick-ins, corners, or goal kicks. No offside or fouls in this arcade format. A draw stands at full time.</p><p>On touchscreens, drag the left joystick and use the action buttons. Landscape gives you the best view.</p></div><button class="kickoff-button" data-action="close">GOT IT ${icon('arrow')}</button>`
    if(type==='settings')content=`<div class="eyebrow">MAKE IT YOURS</div><h2 id="dialog-title">Match settings.</h2><p>Fine-tune the view. Settings apply to this session.</p><div class="settings-row"><label for="graphics">Graphics quality<small>Auto adapts to your device</small></label><select id="graphics"><option value="auto">Auto</option><option value="high">High · SSAO + bloom</option><option value="medium">Medium · bloom</option><option value="low">Low · performance</option></select></div><div class="settings-row"><label for="camera">Camera<small>Find your angle</small></label><select id="camera"><option value="broadcast">Broadcast</option><option value="tactical">Tactical</option></select></div><div class="rules-note"><p>High quality adds ambient occlusion and bloom. Low reduces pixel density and disables post-processing and shadows. Frame rate depends on your hardware.</p></div><button class="kickoff-button" data-action="close">BACK TO THE PITCH ${icon('arrow')}</button>`
    if(type==='pause')content=`<div class="eyebrow">TAKE A BREATHER</div><h2 id="dialog-title">Match paused.</h2><p>The pitch will be right here.</p><div class="pause-score">NORTH <b>${match.score[0]} : ${match.score[1]}</b> SOUTH</div><button class="kickoff-button" data-action="resume">RESUME MATCH ${icon('play')}</button><button class="secondary-button" data-action="controls">View controls</button><button class="secondary-button" data-action="settings">Settings</button><button class="text-button" data-action="quit">End match & return home</button>`
    if(type==='finished'){
      const result=match.score[0]===match.score[1]?'Honours even.':match.score[0]>match.score[1]?'The night is yours.':'A game to learn from.'
      const total=match.possession[0]+match.possession[1],poss=total?Math.round(match.possession[0]/total*100):50
      content=`<div class="eyebrow">${icon('trophy')} FULL TIME</div><h2 id="dialog-title">${result}</h2><div class="pause-score">NORTH <b>${match.score[0]} : ${match.score[1]}</b> SOUTH</div><div class="result-stat"><b>${match.shots[0]}</b><span>SHOTS</span><b>${match.shots[1]}</b></div><div class="result-stat"><b>${poss}%</b><span>POSSESSION</span><b>${100-poss}%</b></div><button class="kickoff-button" data-action="start">PLAY AGAIN ${icon('arrow')}</button><button class="text-button" data-action="quit">Back to quick match</button>`
    }
    this.root.querySelector('.dialog-content').innerHTML=content
    if(!this.dialog.open)this.dialog.showModal()
  }
  close(){this.dialog.close()}
  toast(message){this.root.querySelector('.match-toast').textContent=message;this.toastUntil=performance.now()+2200;this.root.querySelector('.match-toast').classList.add('visible')}
  update(match,fps){
    const state=match.state
    if(state!==this.lastState){this.root.dataset.state=state;this.lastState=state}
    const seconds=Math.floor(match.duration-match.remaining)
    if(seconds!==this.lastSecond){this.elements.clock.textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;this.lastSecond=seconds}
    this.elements.scores.forEach((e,i)=>{e.textContent=match.score[i]})
    const p=match.players[match.selected];this.root.querySelector('.player-position').textContent=['GK','DF','MF','ST','LW'][match.selected%5];this.elements.name.textContent=p.name;this.elements.number.textContent=p.number;this.elements.stamina.style.transform=`scaleX(${p.stamina})`
    this.root.querySelector('.fps-value').textContent=`${fps} FPS`
    if(performance.now()>this.toastUntil)this.root.querySelector('.match-toast').classList.remove('visible')
    const ctx=this.radar,w=204,h=132;ctx.clearRect(0,0,w,h);ctx.fillStyle='#101d19b3';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#9cb0a044';ctx.lineWidth=1
    ctx.strokeRect(9,9,w-18,h-18);ctx.beginPath();ctx.moveTo(w/2,9);ctx.lineTo(w/2,h-9);ctx.stroke();ctx.beginPath();ctx.arc(w/2,h/2,15,0,Math.PI*2);ctx.stroke();ctx.strokeRect(9,43,23,46);ctx.strokeRect(w-32,43,23,46)
    match.players.forEach((q,i)=>{const x=9+(q.x+34)/68*(w-18),y=9+(q.z+22)/44*(h-18);ctx.fillStyle=q.team?'#f08471':'#d4f68a';ctx.beginPath();ctx.arc(x,y,i===match.selected?4:2.7,0,Math.PI*2);ctx.fill();if(i===match.selected){ctx.strokeStyle='#fff';ctx.beginPath();ctx.arc(x,y,6,0,Math.PI*2);ctx.stroke()}})
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(9+(match.ball.x+34)/68*(w-18),9+(match.ball.z+22)/44*(h-18),2.3,0,Math.PI*2);ctx.fill()
  }
  sound(muted){const b=this.root.querySelector('.sound-button');b.innerHTML=icon(muted?'mute':'sound');b.setAttribute('aria-label',muted?'Enable sound':'Mute sound')}
  dispose(){this.abort.abort();this.dialog.close()}
}
