export class Input {
  constructor(root, onPause) {
    this.keys=new Set();this.actions=new Set();this.touch={x:0,z:0,sprint:false};this.abort=new AbortController()
    const options={signal:this.abort.signal}
    this.enabled=false
    window.addEventListener('keydown',e=>{
      if(e.isComposing || e.keyCode===229 || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return
      if(e.code==='Escape' && !e.repeat)onPause()
      if(!this.enabled)return
      if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault()
      this.keys.add(e.code)
      if(!e.repeat){if(e.code==='Space')this.actions.add('shoot');if(e.code==='KeyE')this.actions.add('pass');if(e.code==='KeyQ')this.actions.add('switch')}
    },options)
    window.addEventListener('keyup',e=>this.keys.delete(e.code),options)
    window.addEventListener('blur',()=>this.clear(),options)
    const stick=root.querySelector('.joystick'),knob=stick.querySelector('span')
    let pointer=null
    const move=e=>{if(e.pointerId!==pointer)return;const r=stick.getBoundingClientRect();const x=(e.clientX-r.left-r.width/2)/36,z=(e.clientY-r.top-r.height/2)/36;const len=Math.max(1,Math.hypot(x,z));this.touch.x=x/len;this.touch.z=z/len;knob.style.transform=`translate(${this.touch.x*28}px,${this.touch.z*28}px)`}
    stick.addEventListener('pointerdown',e=>{pointer=e.pointerId;stick.setPointerCapture(pointer);move(e)},options)
    stick.addEventListener('pointermove',move,options)
    const release=()=>{pointer=null;this.touch.x=0;this.touch.z=0;knob.style.transform=''}
    stick.addEventListener('pointerup',release,options);stick.addEventListener('pointercancel',release,options)
    root.querySelectorAll('[data-touch]').forEach(button=>{
      button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);const action=button.dataset.touch;if(action==='sprint')this.touch.sprint=true;else this.actions.add(action)},options)
      const end=()=>{if(button.dataset.touch==='sprint')this.touch.sprint=false}
      button.addEventListener('pointerup',end,options);button.addEventListener('pointercancel',end,options)
    })
  }
  read(consume=true){
    const k=this.keys
    const value={x:Number(k.has('KeyD')||k.has('ArrowRight'))-Number(k.has('KeyA')||k.has('ArrowLeft'))+this.touch.x,z:Number(k.has('KeyS')||k.has('ArrowDown'))-Number(k.has('KeyW')||k.has('ArrowUp'))+this.touch.z,sprint:k.has('ShiftLeft')||k.has('ShiftRight')||this.touch.sprint,spin:Number(k.has('KeyC'))-Number(k.has('KeyZ')),shoot:this.actions.has('shoot'),pass:this.actions.has('pass'),switch:this.actions.has('switch')}
    if(consume)this.actions.clear();return value
  }
  clear(){this.keys.clear();this.actions.clear();this.touch={x:0,z:0,sprint:false}}
  dispose(){this.abort.abort();this.clear()}
}
