export const FIELD = { x: 34, z: 22, goal: 4.6, height: 3.1 }
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z)
const names = ['A. Morgan', 'J. Silva', 'M. Carter', 'L. Brooks', 'D. Reyes']

export class Match {
  constructor(onEvent = () => {}) {
    this.onEvent = onEvent
    this.duration = 180
    this.difficulty = 1
    this.reset()
  }
  reset() {
    this.score = [0, 0]; this.remaining = this.duration; this.elapsed = 0
    this.selected = 3; this.state = 'menu'; this.restartIn = 0
    this.shots = [0, 0]; this.possession = [0, 0]; this.history = []; this.recordTime = 0
    this.kickoff(0)
  }
  kickoff(team) {
    const formation = [[-31, 0], [-19, -11], [-17, 11], [-2, 0], [-9, -6]]
    this.players = Array.from({ length: 10 }, (_, i) => {
      const side = i < 5 ? 0 : 1, slot = i % 5, sign = side ? -1 : 1
      return { x: formation[slot][0] * sign, z: formation[slot][1] * sign,
        homeX: formation[slot][0] * sign, homeZ: formation[slot][1] * sign,
        vx: 0, vz: 0, dirX: sign, dirZ: 0, team: side, keeper: slot === 0,
        number: [1, 4, 6, 9, 11][slot], name: side ? ['R. Costa', 'S. King', 'T. Reed', 'N. Cole', 'J. Park'][slot] : names[slot], stamina: 1, cooldown: .7 }
    })
    this.ball = { x: 0, y: .36, z: 0, vx: 0, vy: 0, vz: 0, spin: 0, owner: team * 5 + 3, lastTeam: team, lock: 0 }
    this.players[team * 5 + 3].x = team ? .85 : -.85
    this.selected = 3
  }
  switchPlayer() {
    const candidates = this.players.map((p, i) => ({ p, i })).filter(({ p, i }) => p.team === 0 && !p.keeper && i !== this.selected)
    candidates.sort((a, b) => distance(a.p, this.ball) - distance(b.p, this.ball))
    this.selected = candidates[0].i
  }
  kick(index, type, spin = 0) {
    const p = this.players[index], b = this.ball
    if (b.owner !== index || p.cooldown > 0) return
    let dx = p.dirX, dz = p.dirZ, speed = 28, lift = 5
    if (type === 'pass') {
      const targets = this.players.map((q, i) => ({ q, i })).filter(({ q, i }) => q.team === p.team && !q.keeper && i !== index)
      targets.sort((a, c) => (distance(p, a.q) - (a.q.x-p.x)*dx*1.1 - (a.q.z-p.z)*dz) - (distance(p, c.q) - (c.q.x-p.x)*dx*1.1 - (c.q.z-p.z)*dz))
      const target = targets[0]
      dx = target.q.x - p.x; dz = target.q.z - p.z; speed = Math.min(24, 9 + Math.hypot(dx, dz)*.65); lift = .6
      if (!p.team) this.selected = target.i
    } else {
      // Aim assistance makes shooting reliable from both keyboard and touch input.
      dx = (p.team ? -FIELD.x : FIELD.x) - p.x
      dz = clamp(p.z * .12 + p.dirZ * 2, -3.3, 3.3) - p.z
      this.shots[p.team]++
    }
    const len = Math.hypot(dx, dz) || 1
    b.owner = -1; b.vx = dx / len * speed; b.vz = dz / len * speed; b.vy = lift
    b.spin = spin * 8; b.lastTeam = p.team; b.lock = .25; p.cooldown = .6
    this.onEvent('kick')
  }
  step(dt, input) {
    if (this.state !== 'playing') return
    this.remaining = Math.max(0, this.remaining - dt); this.elapsed += dt
    if (!this.remaining) { this.state = 'finished'; this.onEvent('fulltime'); return }
    if (this.restartIn > 0) { this.restartIn -= dt; return }
    const b = this.ball, human = this.players[this.selected]
    if (input.switch) this.switchPlayer()
    if (input.shoot) this.kick(this.selected, 'shoot', input.spin)
    if (input.pass) this.kick(this.selected, 'pass')
    b.lock = Math.max(0, b.lock - dt)
    const nearest = [0, 1].map(team => this.players.map((p, i) => ({ p, i })).filter(({ p }) => p.team === team && !p.keeper).sort((a,c) => distance(a.p,b)-distance(c.p,b))[0].i)
    for (let i = 0; i < this.players.length; i++) {
      const p = this.players[i], sign = p.team ? -1 : 1
      p.cooldown = Math.max(0, p.cooldown-dt)
      let dx = 0, dz = 0, speed = p.team ? 5.8 * this.difficulty : 6.5
      if (i === this.selected) {
        dx = input.x; dz = input.z
        const sprint = input.sprint && p.stamina > .05 && Math.hypot(dx,dz) > .1
        speed = sprint ? 10.5 : 7.1
        p.stamina = clamp(p.stamina + dt * (sprint ? -.18 : .12), 0, 1)
      } else {
        let tx = p.homeX, tz = p.homeZ
        if (p.keeper) {
          tx = -sign * 31; tz = clamp(b.z * .55, -3.5, 3.5); speed = 7
          if (b.owner === i) this.kick(i, 'pass')
        } else if (b.owner === i) {
          tx = sign * 31; tz = p.z * .5
          if (Math.abs(p.x) > 14 && p.x * sign > 0) this.kick(i, 'shoot', Math.sin(this.elapsed))
          else if (distance(p,human) < 2.5 && p.team) this.kick(i, 'pass')
        } else if (nearest[p.team] === i && (b.owner < 0 || this.players[b.owner].team !== p.team)) {
          tx = b.x + b.vx*.15; tz = b.z + b.vz*.15
        } else {
          tx = clamp(p.homeX + b.x*.5 + (b.owner >= 0 && this.players[b.owner].team === p.team ? sign * 10 : 0), -29, 29)
          tz = clamp(p.homeZ + b.z*.25, -19, 19)
        }
        dx = tx-p.x; dz = tz-p.z
        if (Math.hypot(dx,dz) < .5) { dx=0; dz=0 }
      }
      const len = Math.hypot(dx,dz), scale = len > 1 ? 1/len : 1
      p.vx += (dx*scale*speed-p.vx)*Math.min(1,dt*12)
      p.vz += (dz*scale*speed-p.vz)*Math.min(1,dt*12)
      p.x = clamp(p.x+p.vx*dt,-33,33); p.z = clamp(p.z+p.vz*dt,-21,21)
      if (len > .1) { p.dirX = dx/len; p.dirZ = dz/len }
      if (b.lock === 0 && p.cooldown === 0 && distance(p,b) < (p.keeper ? 1.8 : 1.1) && b.y < (p.keeper ? 2.7 : .9) && b.owner !== i) {
        if (b.owner < 0 || this.players[b.owner].team !== p.team) {
          b.owner = i; b.lastTeam=p.team; b.lock=.5
          if (p.keeper) this.onEvent('save')
        }
      }
    }
    // Lightweight separation avoids stacked players without a heavyweight physics engine.
    for(let i=0;i<10;i++) for(let j=i+1;j<10;j++) {
      const p=this.players[i],q=this.players[j],d=distance(p,q)
      if(d<.85 && d>.001){const k=(.85-d)*.5/d;const x=(p.x-q.x)*k,z=(p.z-q.z)*k;p.x+=x;p.z+=z;q.x-=x;q.z-=z}
    }
    if (b.owner >= 0) {
      const p = this.players[b.owner]
      b.x = p.x + p.dirX*.9; b.z = p.z+p.dirZ*.9; b.y=.36+Math.abs(Math.sin(this.elapsed*12))*.06
      b.vx=p.vx; b.vz=p.vz; b.vy=0; this.possession[p.team]+=dt
    } else {
      const oldX=b.x
      // Semi-implicit integration: Magnus force curves the ball perpendicular to travel.
      const vx=b.vx
      b.vx += -b.vz*b.spin*.014*dt; b.vz += vx*b.spin*.014*dt
      b.vy -= 15*dt; b.x+=b.vx*dt; b.z+=b.vz*dt; b.y+=b.vy*dt
      if(b.y<.36){b.y=.36;b.vy=Math.abs(b.vy)>.7?-b.vy*.48:0;b.vx*=Math.exp(-1.1*dt);b.vz*=Math.exp(-1.1*dt)}
      b.spin*=Math.exp(-.4*dt)
      // Test the swept goal-line crossing, not just the end position of a fast shot.
      if(Math.abs(b.x)>=FIELD.x && Math.abs(oldX)<FIELD.x){
        if(Math.abs(b.z)<FIELD.goal-.36 && b.y<FIELD.height-.18){
          const team=b.x>0?0:1;this.score[team]++;this.state='goal';this.onEvent('goal',team);return
        }
        const corner = b.lastTeam === (b.x > 0 ? 1 : 0)
        this.restart(corner?'Corner kick':'Goal kick',corner?1-b.lastTeam:(b.x>0?1:0),Math.sign(b.x)*(corner?33:28),corner?Math.sign(b.z||1)*21:0)
      } else if(Math.abs(b.z)>FIELD.z){this.restart('Kick-in',1-b.lastTeam,clamp(b.x,-31,31),Math.sign(b.z)*20.5)}
    }
    this.recordTime+=dt
    if(this.recordTime>=1/20){this.recordTime=0;this.history.push(this.frame());if(this.history.length>100)this.history.shift()}
  }
  restart(label,team,x,z){
    const i=team*5+3,p=this.players[i];p.x=x;p.z=z;p.dirX=team?-1:1;p.dirZ=0
    Object.assign(this.ball,{x,y:.36,z,vx:0,vy:0,vz:0,owner:i,lock:1,lastTeam:team});this.restartIn=1
    this.onEvent('restart',label)
  }
  frame(){return {ball:{x:this.ball.x,y:this.ball.y,z:this.ball.z},players:this.players.map(p=>({x:p.x,z:p.z,dirX:p.dirX,dirZ:p.dirZ,vx:p.vx,vz:p.vz}))}}
}
