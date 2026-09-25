import { Stadium } from './stadium.js'
import { Match } from './simulation.js'
import { Input } from './input.js'
import { HUD } from './hud.js'
import { StadiumAudio } from './audio.js'

export function createGame(root){
  const abort=new AbortController(),audio=new StadiumAudio()
  let stadium,input,raf,disposed=false,last=0,accumulator=0,uiTime=0,frames=0,fps=60,fpsTime=0,slowTime=0,camera='broadcast',replayTime=0,replayFrames=[],goalTeam=0,pausedFrom='playing'
  const match=new Match((event,data)=>{
    audio.play(event)
    if(event==='goal'){
      goalTeam=data;replayTime=0;replayFrames=[...match.history,match.frame()]
      stadium.celebrate(match.ball.x,match.ball.z)
      root.querySelector('.goal-team').textContent=`${data?'SOUTH':'NORTH'} FC · ${match.score[0]} – ${match.score[1]}`
    }
    if(event==='restart')hud.toast(data)
    if(event==='save')hud.toast('Saved by the keeper')
    if(event==='fulltime')hud.showDialog('finished',match)
  })
  const pause=()=>{
    if(match.state==='playing'||match.state==='goal'){pausedFrom=match.state;match.state='paused';input.clear();hud.showDialog('pause',match)}
    else if(match.state==='paused'){actions.resume()}
  }
  const open=type=>{
    if(match.state==='playing'||match.state==='goal'){pausedFrom=match.state;match.state='paused';input.clear()}
    hud.showDialog(type,match)
    if(type==='settings'){
      const quality=root.querySelector('#graphics'),angle=root.querySelector('#camera')
      quality.value=stadium.quality;angle.value=camera
      quality.onchange=()=>{stadium.setQuality(quality.value);root.querySelector('.quality-label').textContent=`${quality.value.toUpperCase()} QUALITY`;slowTime=0}
      angle.onchange=()=>{camera=angle.value}
    }
  }
  const actions={
    start:()=>{
      match.duration=Number(root.querySelector('[name="duration"]').value);match.difficulty=Number(root.querySelector('[name="difficulty"]').value)
      match.reset();match.state='playing';accumulator=0;input.clear();hud.close();audio.start().then(()=>audio.play('whistle')).catch(()=>hud.toast('Audio unavailable; match is ready'))
      hud.toast('Kick off! North FC attacks right');root.querySelector('.engine-status').textContent='MATCH IN PROGRESS'
    },
    home:()=>{if(match.state!=='menu')pause()},
    controls:()=>open('controls'),settings:()=>open('settings'),pause,
    close:()=>{if(match.state==='paused')hud.showDialog('pause',match);else hud.close()},
    resume:()=>{hud.close();match.state=pausedFrom;input.clear();accumulator=0},
    quit:()=>{hud.close();match.reset();input.clear();root.querySelector('.engine-status').textContent='STADIUM READY'},
    sound:()=>{audio.start().catch(()=>hud.toast('Audio unavailable'));hud.sound(audio.toggle())},
    fullscreen:async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(root.requestFullscreen)await root.requestFullscreen();else hud.toast('Fullscreen is not supported on this browser')}catch{hud.toast('Fullscreen is unavailable in this preview')}},
    skip:()=>{if(match.state==='goal'){match.kickoff(1-goalTeam);match.history=[];match.state='playing';replayTime=0;hud.toast('Back to the centre. Play on.')}},
  }
  const hud=new HUD(root,actions)
  try{stadium=new Stadium(root.querySelector('.stadium-canvas'))}catch(error){
    root.querySelector('.intro-panel').innerHTML='<div class="eyebrow">GRAPHICS UNAVAILABLE</div><h1>LET’S GET<br>YOU PLAYING.</h1><p class="intro-copy">This game needs WebGL 2. Enable hardware acceleration in your browser, then reload.</p><button class="kickoff-button" data-action="reload">RELOAD GAME</button>'
    root.querySelector('[data-action="reload"]').onclick=()=>location.reload();root.querySelector('.engine-status').textContent='WEBGL UNAVAILABLE'
    return {dispose(){hud.dispose();audio.dispose();root.innerHTML=''}}
  }
  input=new Input(root,pause)
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(match.state==='playing'||match.state==='goal')pause();last=0}}, {signal:abort.signal})
  window.addEventListener('blur',()=>{if(match.state==='playing'||match.state==='goal')pause()}, {signal:abort.signal})
  const canvas=stadium.renderer.domElement
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();if(match.state==='playing'||match.state==='goal')pause();hud.toast('Graphics interrupted. Reload the page to restore the stadium.')},{signal:abort.signal})
  function animate(now){
    if(disposed)return
    raf=requestAnimationFrame(animate)
    const elapsed=last?(now-last)/1000:1/60,dt=Math.min(elapsed,.1);last=now
    if(document.hidden)return
    input.enabled=match.state==='playing'
    // Fixed 120 Hz simulation remains stable when render frame rate fluctuates.
    accumulator+=dt;const controls=input.read(accumulator>=1/120);let first=true
    while(accumulator>=1/120){match.step(1/120,first?controls:{...controls,shoot:false,pass:false,switch:false});accumulator-=1/120;first=false}
    let replay=null
    if(match.state==='goal'){
      replayTime+=dt
      if(replayTime>1.3 && replayFrames.length){
        const duration=(replayFrames.length-1)/20,index=Math.min(replayFrames.length-1,Math.floor((replayTime-1.3)*10));replay=replayFrames[index]
        if(replayTime>1.3+duration*2+.5)actions.skip()
      }else if(!replayFrames.length&&replayTime>3)actions.skip()
    }
    root.classList.toggle('replaying',!!replay)
    stadium.render(match,dt,camera,replay)
    fpsTime+=elapsed;frames++;uiTime+=dt
    if(fpsTime>=1){fps=Math.round(frames/fpsTime);frames=0;fpsTime=0
      // Auto quality degrades only after sustained slow rendering, never oscillates.
      if(stadium.quality==='auto'&&fps<38&&!stadium.low)slowTime++;else slowTime=0
      if(slowTime>=5){stadium.setQuality('low');root.querySelector('.quality-label').textContent='AUTO · PERFORMANCE';hud.toast('Graphics adapted for smoother play')}
    }
    if(uiTime>.1){hud.update(match,fps);uiTime=0}
  }
  hud.update(match,60);raf=requestAnimationFrame(animate)
  return {dispose(){disposed=true;cancelAnimationFrame(raf);abort.abort();input.dispose();hud.dispose();stadium.dispose();audio.dispose();root.innerHTML=''}}
}
