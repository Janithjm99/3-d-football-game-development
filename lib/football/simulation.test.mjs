import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Match, FIELD } from './simulation.js'

const idle={x:0,z:0,spin:0,sprint:false,shoot:false,pass:false,switch:false}
function playing(){const m=new Match();m.state='playing';m.players.forEach(p=>p.cooldown=0);return m}

test('kickoff creates two teams and gives North possession',()=>{
  const m=new Match();assert.equal(m.players.length,10);assert.equal(m.ball.owner,3)
  assert.equal(m.players.filter(p=>p.keeper).length,2);assert.equal(m.state,'menu')
})
test('menu and pause freeze simulation time',()=>{
  const m=new Match();m.step(1,idle);assert.equal(m.remaining,180)
  m.state='paused';m.step(1,idle);assert.equal(m.remaining,180)
})
test('sprint increases movement and consumes stamina',()=>{
  const m=playing(),x=m.players[3].x
  for(let i=0;i<120;i++)m.step(1/120,{...idle,x:1,sprint:true})
  assert.ok(m.players[3].x>x+7);assert.ok(m.players[3].stamina<.9)
})
test('pass releases the ball and switches to the recipient',()=>{
  const m=playing();m.kick(3,'pass');assert.equal(m.ball.owner,-1);assert.notEqual(m.selected,3);assert.ok(Math.hypot(m.ball.vx,m.ball.vz)>0)
})
test('shoot counts an attempt, adds lift, and carries spin',()=>{
  const m=playing();m.kick(3,'shoot',1);assert.equal(m.shots[0],1);assert.equal(m.ball.spin,8);assert.ok(m.ball.vx>0);assert.ok(m.ball.vy>0)
})
test('a swept goal-line crossing scores exactly once',()=>{
  const events=[],m=playing();m.onEvent=(...e)=>events.push(e)
  Object.assign(m.ball,{owner:-1,x:33.99,y:1.8,z:0,vx:28,vy:0,vz:0,lock:1})
  m.step(1/120,idle);assert.deepEqual(m.score,[1,0]);assert.equal(m.state,'goal')
  for(let i=0;i<100;i++)m.step(1/120,idle)
  assert.equal(m.score[0],1);assert.equal(events.filter(e=>e[0]==='goal').length,1)
})
test('a shot over the bar restarts as a goal kick',()=>{
  const m=playing();Object.assign(m.ball,{owner:-1,x:33.99,y:5,z:0,vx:28,vy:0,vz:0,lock:1,lastTeam:0})
  m.step(1/120,idle);assert.deepEqual(m.score,[0,0]);assert.equal(m.ball.lastTeam,1);assert.equal(m.ball.owner,8);assert.equal(m.restartIn,1)
})
test('touchline crossing awards a kick-in to the other side',()=>{
  const m=playing();Object.assign(m.ball,{owner:-1,x:4,y:.5,z:21.99,vx:0,vy:0,vz:20,lock:1,lastTeam:0})
  m.step(1/120,idle);assert.equal(m.ball.owner,8);assert.ok(Math.abs(m.ball.z)<FIELD.z)
})
test('defender last touch awards a corner',()=>{
  const m=playing();Object.assign(m.ball,{owner:-1,x:33.99,y:.5,z:15,vx:20,vy:0,vz:0,lock:1,lastTeam:1})
  m.step(1/120,idle);assert.equal(m.ball.owner,3);assert.equal(m.ball.x,33);assert.equal(m.restartIn,1)
})
test('goalkeeper collects a reachable low ball',()=>{
  const m=playing();Object.assign(m.ball,{owner:-1,x:30.8,y:.5,z:0,vx:0,vy:0,vz:0,lock:0})
  m.step(1/120,idle);assert.equal(m.ball.owner,5)
})
test('full time ends the match and freezes the clock',()=>{
  const m=playing();m.remaining=.001;m.step(1/120,idle);assert.equal(m.state,'finished');assert.equal(m.remaining,0)
})
test('replay history is bounded and independent of live state',()=>{
  const m=playing();for(let i=0;i<1500;i++)m.step(1/120,idle)
  assert.ok(m.history.length<=100);const frame=m.frame();m.players[0].x=99;assert.notEqual(frame.players[0].x,99)
})
