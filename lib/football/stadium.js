import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

const C = { lime: 0xd2fa73, red: 0xef6957, grass: 0x356642, dark: 0x141e20 }
const standard = (color, extra={}) => new THREE.MeshStandardMaterial({color,roughness:.82,...extra})

function canvasTexture(width,height,paint){
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height
  paint(canvas.getContext('2d'),width,height)
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace
  return texture
}

export class Stadium {
  constructor(host){
    this.host=host;this.time=0;this.quality='auto';this.particles=[];this.low=window.innerWidth<700;this.lastMode='menu'
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'})
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,this.low?1:1.5));this.renderer.shadowMap.enabled=!this.low;this.renderer.shadowMap.type=THREE.PCFShadowMap
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.12
    this.renderer.domElement.setAttribute('aria-label','Interactive 3D football stadium');host.appendChild(this.renderer.domElement)
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0x10191d);this.scene.fog=new THREE.FogExp2(0x10191d,.006)
    this.camera=new THREE.PerspectiveCamera(43,1,.2,300);this.camera.position.set(50,61,73)
    this.target=new THREE.Vector3();this.camera.lookAt(0,0,0)
    const pmrem=new THREE.PMREMGenerator(this.renderer),room=new RoomEnvironment()
    this.environment=pmrem.fromScene(room,.04);this.scene.environment=this.environment.texture;this.scene.environmentIntensity=.28;room.dispose();pmrem.dispose()
    this.buildLights();this.buildPitch();this.buildStands();this.buildGoals();this.buildPlayers();this.buildBall();this.buildParticles()
    this.composer=new EffectComposer(this.renderer);this.composer.addPass(new RenderPass(this.scene,this.camera))
    this.ssao=new SSAOPass(this.scene,this.camera,1,1);this.ssao.kernelRadius=3;this.ssao.minDistance=.002;this.ssao.maxDistance=.08;this.ssao.enabled=!this.low;this.composer.addPass(this.ssao)
    this.bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.23,.6,1.2);this.bloom.enabled=!this.low;this.composer.addPass(this.bloom);this.composer.addPass(new OutputPass())
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(host);this.resize()
  }
  box(w,h,d,material,x,y,z,parent=this.scene){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.receiveShadow=true;parent.add(mesh);return mesh}
  line(points,color=0xd6e8d2,parent=this.scene){const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p))),new THREE.LineBasicMaterial({color,transparent:true,opacity:.85}));parent.add(line);return line}
  buildLights(){
    this.scene.add(new THREE.HemisphereLight(0xcbe5f3,0x243522,2))
    const light=new THREE.DirectionalLight(0xf4f7e7,3.1);light.position.set(-20,55,-15);light.castShadow=true
    Object.assign(light.shadow.camera,{left:-48,right:48,top:35,bottom:-35,near:1,far:120});light.shadow.mapSize.set(2048,2048);light.shadow.normalBias=.06;light.shadow.bias=-.00015;this.scene.add(light);this.keyLight=light
    const rim=new THREE.DirectionalLight(0xa1ceff,1);rim.position.set(30,20,35);this.scene.add(rim)
    const pole=standard(0x5c686b,{metalness:.7,roughness:.4}),lamp=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xdcecff,emissiveIntensity:5})
    for(const x of [-43,43])for(const z of [-31,31]){
      this.box(.45,27,.45,pole,x,13.5,z)
      const rig=new THREE.Group();rig.position.set(x,27,z);rig.lookAt(0,5,0);this.scene.add(rig)
      this.box(7,2,.4,pole,0,0,0,rig)
      for(let i=0;i<6;i++)for(let j=0;j<2;j++)this.box(.85,.65,.15,lamp,-2.8+i*1.12,-.46+j*.92,.26,rig)
    }
  }
  buildPitch(){
    this.box(100,.8,76,standard(0x1d302a),0,-.6,0)
    const texture=canvasTexture(1024,1024,(ctx,w,h)=>{
      ctx.fillStyle='#4d7750';ctx.fillRect(0,0,w,h)
      let seed=43;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647}
      for(let i=0;i<110000;i++){const v=Math.floor(random()*50);ctx.fillStyle=`rgba(${80+v},${110+v},${50+v},.3)`;ctx.fillRect(random()*w,random()*h,1,2+random()*3)}
    });texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(5,4);texture.anisotropy=Math.min(8,this.renderer.capabilities.getMaxAnisotropy())
    for(let i=0;i<12;i++)this.box(68/12,.15,44,standard(i%2?0x729567:0x5e8155,{map:texture}),-34+(i+.5)*68/12,-.08,0)
    const white=standard(0xd4e2c9)
    const mark=(w,d,x,z)=>this.box(w,.022,d,white,x,.025,z)
    mark(68,.14,0,-22);mark(68,.14,0,22);mark(.14,44,-34,0);mark(.14,44,34,0);mark(.14,44,0,0)
    for(const sign of [-1,1]){
      mark(.13,24,sign*23,0);mark(11,.13,sign*28.5,-12);mark(11,.13,sign*28.5,12)
      mark(.13,12,sign*30,0);mark(4,.13,sign*32,-6);mark(4,.13,sign*32,6)
      const dot=new THREE.Mesh(new THREE.CircleGeometry(.15,12),white);dot.rotation.x=-Math.PI/2;dot.position.set(sign*26,.045,0);this.scene.add(dot)
      for(const z of [-22,22]){
        this.box(.065,1.7,.065,white,sign*34,.85,z)
        const flag=this.box(.65,.45,.03,standard(C.lime),sign*34+.32,1.48,z);flag.rotation.y=.3
      }
    }
    const ring=new THREE.Mesh(new THREE.RingGeometry(6,6.14,96),white);ring.rotation.x=-Math.PI/2;ring.position.y=.04;this.scene.add(ring)
    const dot=new THREE.Mesh(new THREE.CircleGeometry(.18,16),white);dot.rotation.x=-Math.PI/2;dot.position.y=.05;this.scene.add(dot)
    const boardTex=canvasTexture(2048,64,(ctx,w,h)=>{
      ctx.fillStyle='#162520';ctx.fillRect(0,0,w,h);ctx.font='italic 700 25px Arial';ctx.textBaseline='middle'
      for(let i=0;i<4;i++){ctx.fillStyle=i%2?'#d0f58c':'#e8efe8';ctx.fillText(i%2?'THE BEAUTIFUL GAME.':'F / FLOODLIGHT',i*512+45,34)}
    })
    const boardMat=standard(0xffffff,{map:boardTex,emissive:0xffffff,emissiveMap:boardTex,emissiveIntensity:.38})
    for(const z of [-24,24]){this.box(72,1.1,.2,boardMat,0,.65,z)}
    for(const x of [-36,36])this.box(.2,1.1,47,standard(0x364a38,{emissive:C.lime,emissiveIntensity:.08}),x,.65,0)
  }
  buildStands(){
    const concrete=standard(0x2a3336),trim=standard(0x101a20,{metalness:.35}),rail=standard(0x66797d,{metalness:.6})
    const group=new THREE.Group();this.scene.add(group)
    for(let row=0;row<10;row++){
      const y=row*.73,z=27+row*1.08
      this.box(91,.8,1.2,concrete,0,y,z,group);this.box(91,.8,1.2,concrete,0,y,-z,group)
      this.box(1.2,.8,54,concrete,39+row*1.08,y,0,group);this.box(1.2,.8,54,concrete,-39-row*1.08,y,0,group)
    }
    for(const z of [-39,39]){
      this.box(102,2.1,.8,trim,0,9,z);this.box(102,.12,.12,rail,0,10.2,z)
      for(let x=-48;x<=48;x+=8){this.box(.3,10,.3,rail,x,5,z);this.box(.3,.3,6,rail,x,10,z-Math.sign(z)*2)}
      const roof=this.box(103,.3,8,standard(0x1e292d,{metalness:.5}),0,11,z);roof.rotation.x=Math.sign(z)*.07
      this.box(99,.09,.12,new THREE.MeshBasicMaterial({color:0x91b4c1}),0,10.7,z-Math.sign(z)*3.8)
    }
    // The seats and crowd share geometry: thousands of spectators in four draw calls.
    const seatPositions=[]
    for(let r=0;r<10;r++)for(let i=0;i<92;i++)if(i%23>1){
      for(const s of [-1,1])seatPositions.push([(i-45.5)*.94,r*.73+.55,s*(27+r*1.08)])
    }
    for(let r=0;r<10;r++)for(let i=0;i<54;i++)if(i%18>1){for(const s of [-1,1])seatPositions.push([s*(39+r*1.08),r*.73+.55,(i-26.5)*.96])}
    const dummy=new THREE.Object3D(),color=new THREE.Color()
    const seats=new THREE.InstancedMesh(new THREE.BoxGeometry(.64,.55,.65),standard(0xffffff),seatPositions.length)
    const people=new THREE.InstancedMesh(new THREE.CapsuleGeometry(.19,.36,2,4),standard(0xffffff),seatPositions.length)
    const heads=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.16,0),standard(0xffffff),seatPositions.length)
    const palette=[0x3f6669,0x66786f,0x273c43,0x83959a,0xb3ae94,0x304e62,0xa16a5a,0x78875c]
    seatPositions.forEach(([x,y,z],i)=>{
      dummy.position.set(x,y,z);dummy.updateMatrix();seats.setMatrixAt(i,dummy.matrix);seats.setColorAt(i,color.set(i%5?0x233e45:0x586e62))
      dummy.position.y=y+.28;dummy.updateMatrix();people.setMatrixAt(i,dummy.matrix);people.setColorAt(i,color.set(palette[(i*7+Math.floor(i/13))%palette.length]))
      dummy.position.y=y+.75;dummy.updateMatrix();heads.setMatrixAt(i,dummy.matrix);heads.setColorAt(i,color.set([0x9f7762,0xc29e82,0x765648][i%3]))
    })
    const crowd=new THREE.Group();crowd.add(people,heads);this.crowdLOD=new THREE.LOD();this.crowdLOD.addLevel(crowd,0);this.crowdLOD.addLevel(new THREE.Group(),155);this.scene.add(seats,this.crowdLOD)
    for(const x of [-48,48])this.box(.5,9,78,trim,x,4,0)
    const banner=canvasTexture(1024,128,(ctx,w,h)=>{ctx.fillStyle='#26322e';ctx.fillRect(0,0,w,h);ctx.fillStyle='#bfcac0';ctx.textAlign='center';ctx.font='italic bold 45px Arial';ctx.fillText('MAKE EVERY MOMENT COUNT.',w/2,80)})
    this.box(44,2,.2,standard(0xffffff,{map:banner}),0,8.5,-38)
  }
  buildGoals(){
    const post=standard(0xe8ebe3,{metalness:.35,roughness:.3}),net=new THREE.LineBasicMaterial({color:0xc1d0c5,transparent:true,opacity:.38})
    for(const s of [-1,1]){
      for(const z of [-4.6,4.6]){this.box(.16,3.1,.16,post,s*34,1.55,z);this.box(.1,2.8,.1,post,s*37,1.4,z)}
      this.box(.16,.16,9.35,post,s*34,3.1,0);this.box(.1,.1,9.3,post,s*37,2.8,0)
      const pts=[];const segment=(a,b)=>pts.push(...a,...b)
      for(let z=-4.6;z<=4.61;z+=.38){segment([s*37,0,z],[s*37,2.8,z]);segment([s*34,3.1,z],[s*37,2.8,z])}
      for(let y=0;y<=2.81;y+=.35){segment([s*37,y,-4.6],[s*37,y,4.6]);for(const z of [-4.6,4.6])segment([s*34,y,z],[s*37,y,z])}
      for(let x=34;x<=37;x+=.38){for(const z of [-4.6,4.6])segment([s*x,0,z],[s*x,2.8,z]);segment([s*x,3.1-(x-34)*.1,-4.6],[s*x,3.1-(x-34)*.1,4.6])}
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));this.scene.add(new THREE.LineSegments(geometry,net))
    }
  }
  buildPlayers(){
    const skin=standard(0xb88a69),boots=standard(0xe9e8cc),hair=standard(0x202323)
    this.playerMeshes=[]
    for(let i=0;i<10;i++){
      const team=i<5?0:1,keeper=i%5===0,color=keeper?(team?0xa99aff:0xf0bd63):(team?C.red:C.lime)
      const kit=standard(color),shorts=standard(team?0x713e38:0x233e32)
      const group=new THREE.Group(),body=new THREE.Group();group.add(body)
      const torso=this.box(.64,.76,.36,kit,0,1.3,0,body);torso.castShadow=true
      const head=new THREE.Mesh(new THREE.SphereGeometry(.23,12,8),skin);head.position.y=1.98;head.castShadow=true;body.add(head)
      const cap=new THREE.Mesh(new THREE.SphereGeometry(.237,10,6,0,Math.PI*2,0,Math.PI*.45),hair);cap.position.y=2.02;body.add(cap)
      this.box(.61,.3,.38,shorts,0,.79,0,body)
      const limbs=[]
      for(const s of [-1,1]){
        const leg=new THREE.Group();leg.position.set(s*.18,.78,0);body.add(leg)
        this.box(.2,.42,.22,skin,0,-.24,0,leg);this.box(.21,.27,.23,kit,0,-.51,0,leg);this.box(.24,.15,.39,boots,0,-.69,.08,leg);limbs.push(leg)
        const arm=new THREE.Group();arm.position.set(s*.42,1.58,0);body.add(arm)
        this.box(.2,.27,.26,kit,0,-.1,0,arm);this.box(.16,.4,.18,skin,0,-.41,0,arm);limbs.push(arm)
      }
      const numberTex=canvasTexture(64,64,ctx=>{ctx.clearRect(0,0,64,64);ctx.fillStyle=team?'#fff0e8':'#24402a';ctx.font='bold 43px Arial';ctx.textAlign='center';ctx.fillText(String([1,4,6,9,11][i%5]),32,49)})
      const number=new THREE.Mesh(new THREE.PlaneGeometry(.36,.36),new THREE.MeshBasicMaterial({map:numberTex,transparent:true,side:THREE.DoubleSide}));number.position.set(0,1.4,-.187);number.rotation.y=Math.PI;body.add(number)
      const lod=new THREE.LOD();lod.addLevel(body,0)
      const simple=new THREE.Group();const lowBody=new THREE.Mesh(new THREE.CapsuleGeometry(.32,1.15,2,5),kit);lowBody.position.y=1.05;simple.add(lowBody);lod.addLevel(simple,115)
      group.remove(body);group.add(lod);this.scene.add(group);this.playerMeshes.push({group,body,limbs})
      const shadow=new THREE.Mesh(new THREE.CircleGeometry(.7,20),new THREE.MeshBasicMaterial({color:0x09150b,transparent:true,opacity:.22,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.055;group.add(shadow)
    }
    this.selection=new THREE.Mesh(new THREE.RingGeometry(.75,.88,40),new THREE.MeshBasicMaterial({color:C.lime,side:THREE.DoubleSide}));this.selection.rotation.x=-Math.PI/2;this.selection.position.y=.08;this.scene.add(this.selection)
    this.arrow=new THREE.Mesh(new THREE.ConeGeometry(.3,.45,3),new THREE.MeshBasicMaterial({color:C.lime}));this.arrow.rotation.z=Math.PI;this.scene.add(this.arrow)
  }
  buildBall(){
    const texture=canvasTexture(512,256,(ctx,w,h)=>{
      ctx.fillStyle='#eeeedd';ctx.fillRect(0,0,w,h);ctx.fillStyle='#243232';ctx.strokeStyle='#8c9991';ctx.lineWidth=2
      for(let r=0;r<4;r++)for(let c=0;c<8;c++){
        const x=c*64+(r%2)*32,y=r*72+12;ctx.beginPath()
        for(let k=0;k<5;k++){const a=k*Math.PI*2/5;ctx.lineTo(x+19*Math.cos(a),y+19*Math.sin(a))}ctx.closePath();ctx.fill()
      }
    })
    this.ball=new THREE.Mesh(new THREE.SphereGeometry(.36,24,16),standard(0xffffff,{map:texture,roughness:.58}));this.ball.castShadow=true;this.scene.add(this.ball)
    this.ballShadow=new THREE.Mesh(new THREE.CircleGeometry(.4,20),new THREE.MeshBasicMaterial({color:0x0b190c,transparent:true,opacity:.4,depthWrite:false}));this.ballShadow.rotation.x=-Math.PI/2;this.scene.add(this.ballShadow)
  }
  buildParticles(){
    this.particlePositions=new Float32Array(160*3);this.particlePositions.fill(-100)
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(this.particlePositions,3))
    this.particleMesh=new THREE.Points(geometry,new THREE.PointsMaterial({color:C.lime,size:.2,transparent:true,opacity:.9}));this.particleMesh.frustumCulled=false;this.scene.add(this.particleMesh)
  }
  celebrate(x,z){this.particles=Array.from({length:160},()=>({x,y:.7,z,vx:(Math.random()-.5)*16,vy:5+Math.random()*11,vz:(Math.random()-.5)*16,life:2+Math.random()*2}))}
  setQuality(value){
    this.quality=value;this.low=value==='low'||(value==='auto'&&innerWidth<700)
    this.ssao.enabled=value==='high'||(!this.low&&value==='auto');this.bloom.enabled=!this.low
    this.renderer.shadowMap.enabled=!this.low;this.renderer.setPixelRatio(Math.min(devicePixelRatio,value==='high'?1.75:this.low?1:1.5));this.resize()
  }
  resize(){
    const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return
    this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h);this.composer.setSize(w,h)
  }
  render(match,dt,mode='broadcast',replay=null){
    this.time+=dt
    const frame=replay||match,players=frame.players,b=frame.ball
    for(let i=0;i<10;i++){
      const p=players[i],mesh=this.playerMeshes[i];mesh.group.position.set(p.x,0,p.z);mesh.group.rotation.y=Math.atan2(p.dirX,p.dirZ)
      const running=match.state==='playing'||replay,swing=running?Math.sin(this.time*12+i)*Math.min(.6,Math.hypot(p.vx||0,p.vz||0)*.08):0
      mesh.limbs.forEach((limb,j)=>limb.rotation.x=swing*(j<2?1:-1)*(j%2?-1:1))
      mesh.body.position.y=running?Math.abs(swing)*.05:0
    }
    this.ball.position.set(b.x,b.y,b.z);this.ball.rotation.z-=dt*(match.ball.vx||0)*2;this.ball.rotation.x+=dt*(match.ball.vz||0)*2
    this.ballShadow.position.set(b.x,.05,b.z);this.ballShadow.scale.setScalar(1+b.y*.15)
    const selected=players[match.selected];this.selection.position.set(selected.x,.09,selected.z);this.arrow.position.set(selected.x,2.8+Math.sin(this.time*3)*.08,selected.z)
    const menu=match.state==='menu',aspect=this.camera.aspect
    let cx,cy,cz,tx=0,tz=0
    if(replay){cx=b.x+Math.cos(this.time*.3)*12;cy=7;cz=b.z+Math.sin(this.time*.3)*12;tx=b.x;tz=b.z}
    else if(menu){cx=47;cy=60;cz=72;tx=aspect>1.2?-9:0;tz=aspect>1.2?3:0;if(aspect<1){cy=95;cz=105}}
    else if(mode==='tactical'){cx=0;cy=aspect<1?110:76;cz=30;tx=b.x*.12}
    else{cx=b.x*.4+12;cy=aspect<1?66:46;cz=b.z*.25+52;tx=b.x*.45;tz=b.z*.35}
    const smooth=1-Math.exp(-dt*3)
    this.camera.position.lerp(new THREE.Vector3(cx,cy,cz),smooth);this.target.lerp(new THREE.Vector3(tx,0,tz),smooth);this.camera.lookAt(this.target)
    this.particles.forEach((p,i)=>{p.life-=dt;p.vy-=9*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;this.particlePositions[i*3]=p.x;this.particlePositions[i*3+1]=p.life>0?Math.max(.1,p.y):-100;this.particlePositions[i*3+2]=p.z})
    if(this.particles.length)this.particleMesh.geometry.attributes.position.needsUpdate=true
    this.composer.render()
  }
  dispose(){
    this.resizeObserver.disconnect()
    const geometries=new Set(),materials=new Set(),textures=new Set()
    this.scene.traverse(obj=>{if(obj.geometry)geometries.add(obj.geometry);if(obj.material)(Array.isArray(obj.material)?obj.material:[obj.material]).forEach(m=>{materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value)})})
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());this.environment.dispose()
    for(const pass of this.composer.passes)pass.dispose?.();this.composer.dispose();this.renderer.dispose();this.renderer.domElement.remove()
  }
}
