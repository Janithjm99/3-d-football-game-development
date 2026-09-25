export class StadiumAudio {
  constructor(){this.context=null;this.muted=false}
  async start(){
    if(!this.context){
      const AudioContext=window.AudioContext||window.webkitAudioContext
      if(!AudioContext)return
      this.context=new AudioContext();this.master=this.context.createGain();this.master.gain.value=this.muted?0:.45;this.master.connect(this.context.destination)
      // A filtered noise bed loops seamlessly, avoiding downloaded audio and autoplay.
      const buffer=this.context.createBuffer(1,this.context.sampleRate*3,this.context.sampleRate),data=buffer.getChannelData(0)
      let last=0;for(let i=0;i<data.length;i++){last=(last+(Math.random()*2-1)*.035)/1.025;data[i]=last}
      this.crowd=this.context.createBufferSource();this.crowd.buffer=buffer;this.crowd.loop=true
      const filter=this.context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=750
      this.crowd.connect(filter);filter.connect(this.master);this.crowd.start()
    }
    if(this.context.state==='suspended')await this.context.resume()
  }
  toggle(){this.muted=!this.muted;if(this.master)this.master.gain.setTargetAtTime(this.muted?0:.45,this.context.currentTime,.1);return this.muted}
  tone(frequency,duration,volume,type='sine',end=frequency){
    if(!this.context)return
    const t=this.context.currentTime,osc=this.context.createOscillator(),gain=this.context.createGain()
    osc.type=type;osc.frequency.setValueAtTime(frequency,t);osc.frequency.exponentialRampToValueAtTime(end,t+duration)
    gain.gain.setValueAtTime(volume,t);gain.gain.exponentialRampToValueAtTime(.001,t+duration)
    osc.connect(gain);gain.connect(this.master);osc.start(t);osc.stop(t+duration)
    osc.onended=()=>{osc.disconnect();gain.disconnect()}
  }
  play(event){
    if(event==='kick')this.tone(130,.12,.7,'sine',45)
    if(event==='save')this.tone(80,.15,.45)
    if(event==='whistle'||event==='fulltime')this.tone(2200,.65,.13,'sine',1800)
    if(event==='goal'){this.tone(440,1.3,.15,'triangle');this.tone(554,1.5,.13,'triangle');this.tone(659,1.8,.12,'triangle')}
  }
  dispose(){this.crowd?.stop();this.context?.close()}
}
