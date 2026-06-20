var St=Object.defineProperty;var Tt=(e,t,s)=>t in e?St(e,t,{enumerable:!0,configurable:!0,writable:!0,value:s}):e[t]=s;var r=(e,t,s)=>Tt(e,typeof t!="symbol"?t+"":t,s);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))i(o);new MutationObserver(o=>{for(const a of o)if(a.type==="childList")for(const n of a.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&i(n)}).observe(document,{childList:!0,subtree:!0});function s(o){const a={};return o.integrity&&(a.integrity=o.integrity),o.referrerPolicy&&(a.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?a.credentials="include":o.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function i(o){if(o.ep)return;o.ep=!0;const a=s(o);fetch(o.href,a)}})();function Pt(e){let t=1779033703^e.length;for(let s=0;s<e.length;s++)t=Math.imul(t^e.charCodeAt(s),3432918353),t=t<<13|t>>>19;return()=>(t=Math.imul(t^t>>>16,2246822507),t=Math.imul(t^t>>>13,3266489909),t^=t>>>16,t>>>0)}function Et(e,t,s,i){return()=>{e>>>=0,t>>>=0,s>>>=0,i>>>=0;let o=e+t|0;return e=t^t>>>9,t=s+(s<<3)|0,s=s<<21|s>>>11,i=i+1|0,o=o+i|0,s=s+o|0,(o>>>0)/4294967296}}function At(e){const t=Pt(e),s=Et(t(),t(),t(),t());for(let o=0;o<12;o++)s();let i=null;return{seed:e,next:s,range:(o,a)=>o+s()*(a-o),int:(o,a)=>o+Math.floor(s()*(a-o+1)),pick:o=>o[Math.floor(s()*o.length)],gaussian:(o=0,a=1)=>{if(i!==null){const m=i;return i=null,o+m*a}let n=0,c=0,h=0;do n=s()*2-1,c=s()*2-1,h=n*n+c*c;while(h===0||h>=1);const p=Math.sqrt(-2*Math.log(h)/h);return i=c*p,o+n*p*a}}}function Mt(){const e=["aurora","flux","moiré","drift","cyan","ember","lattice","phase","spore","nimbus","quartz","halo"],t=e[Math.floor(Math.random()*e.length)],s=Math.floor(Math.random()*9e3+1e3);return`${t}-${s}`}const pt=Math.sqrt(3),Nt=.5*(pt-1),O=(3-pt)/6,Rt=1/3,C=1/6,W=e=>Math.floor(e)|0,nt=new Float64Array([1,1,-1,1,1,-1,-1,-1,1,0,-1,0,1,0,-1,0,0,1,0,-1,0,1,0,-1]),it=new Float64Array([1,1,0,-1,1,0,1,-1,0,-1,-1,0,1,0,1,-1,0,1,1,0,-1,-1,0,-1,0,1,1,0,-1,1,0,1,-1,0,-1,-1]);function Ct(e=Math.random){const t=mt(e),s=new Float64Array(t).map(o=>nt[o%12*2]),i=new Float64Array(t).map(o=>nt[o%12*2+1]);return function(a,n){let c=0,h=0,p=0;const m=(a+n)*Nt,l=W(a+m),b=W(n+m),u=(l+b)*O,d=l-u,I=b-u,N=a-d,R=n-I;let _,$;N>R?(_=1,$=0):(_=0,$=1);const U=N-_+O,T=R-$+O,P=N-1+2*O,y=R-1+2*O,E=l&255,A=b&255;let w=.5-N*N-R*R;if(w>=0){const g=E+t[A],F=s[g],k=i[g];w*=w,c=w*w*(F*N+k*R)}let x=.5-U*U-T*T;if(x>=0){const g=E+_+t[A+$],F=s[g],k=i[g];x*=x,h=x*x*(F*U+k*T)}let S=.5-P*P-y*y;if(S>=0){const g=E+1+t[A+1],F=s[g],k=i[g];S*=S,p=S*S*(F*P+k*y)}return 70*(c+h+p)}}function Ft(e=Math.random){const t=mt(e),s=new Float64Array(t).map(a=>it[a%12*3]),i=new Float64Array(t).map(a=>it[a%12*3+1]),o=new Float64Array(t).map(a=>it[a%12*3+2]);return function(n,c,h){let p,m,l,b;const u=(n+c+h)*Rt,d=W(n+u),I=W(c+u),N=W(h+u),R=(d+I+N)*C,_=d-R,$=I-R,U=N-R,T=n-_,P=c-$,y=h-U;let E,A,w,x,S,g;T>=P?P>=y?(E=1,A=0,w=0,x=1,S=1,g=0):T>=y?(E=1,A=0,w=0,x=1,S=0,g=1):(E=0,A=0,w=1,x=1,S=0,g=1):P<y?(E=0,A=0,w=1,x=0,S=1,g=1):T<y?(E=0,A=1,w=0,x=0,S=1,g=1):(E=0,A=1,w=0,x=1,S=1,g=0);const F=T-E+C,k=P-A+C,Z=y-w+C,Q=T-x+2*C,J=P-S+2*C,K=y-g+2*C,tt=T-1+3*C,et=P-1+3*C,st=y-1+3*C,B=d&255,H=I&255,Y=N&255;let q=.6-T*T-P*P-y*y;if(q<0)p=0;else{const v=B+t[H+t[Y]];q*=q,p=q*q*(s[v]*T+i[v]*P+o[v]*y)}let z=.6-F*F-k*k-Z*Z;if(z<0)m=0;else{const v=B+E+t[H+A+t[Y+w]];z*=z,m=z*z*(s[v]*F+i[v]*k+o[v]*Z)}let G=.6-Q*Q-J*J-K*K;if(G<0)l=0;else{const v=B+x+t[H+S+t[Y+g]];G*=G,l=G*G*(s[v]*Q+i[v]*J+o[v]*K)}let X=.6-tt*tt-et*et-st*st;if(X<0)b=0;else{const v=B+1+t[H+1+t[Y+1]];X*=X,b=X*X*(s[v]*tt+i[v]*et+o[v]*st)}return 32*(p+m+l+b)}}function mt(e){const s=new Uint8Array(512);for(let i=0;i<512/2;i++)s[i]=i;for(let i=0;i<512/2-1;i++){const o=i+~~(e()*(256-i)),a=s[i];s[i]=s[o],s[o]=a}for(let i=256;i<512;i++)s[i]=s[i-256];return s}function kt(e){const t=Ct(()=>e.next()),s=Ft(()=>e.next()),i=(o,a,n,c=2,h=.5)=>{let p=.5,m=1,l=0,b=0;for(let u=0;u<n;u++)l+=p*t(o*m,a*m),b+=p,p*=h,m*=c;return b>0?l/b:0};return{n2:t,n3:s,fbm2:i,curl(o,a,n=.001){const c=t(o,a+n),h=t(o,a-n),p=t(o+n,a),m=t(o-n,a),l=(c-h)/(2*n),b=(p-m)/(2*n);return[l,-b]},warp(o,a,n,c){const h=i(o,a,4),p=i(o+5.2,a+1.3,4);return i(o*c+n*h,a*c+n*p,5)}}}const L=e=>e<0?0:e>1?1:e,ot=e=>e<=.0031308?12.92*e:1.055*Math.pow(e,1/2.4)-.055;function It(e,t,s){const i=e+.3963377774*t+.2158037573*s,o=e-.1055613458*t-.0638541728*s,a=e-.0894841775*t-1.291485548*s,n=i*i*i,c=o*o*o,h=a*a*a;return[4.0767416621*n-3.3077115913*c+.2309699292*h,-1.2684380046*n+2.6097574011*c-.3413193965*h,-.0041960863*n-.7034186147*c+1.707614701*h]}const rt=Math.PI/180;function ct(e,t,s){return{L:e,a:t*Math.cos(s*rt),b:t*Math.sin(s*rt)}}function Dt(e,t,s){const i=It(e,t,s);return[Math.round(L(ot(L(i[0])))*255),Math.round(L(ot(L(i[1])))*255),Math.round(L(ot(L(i[2])))*255)]}const _t=([e,t,s])=>`rgb(${e},${t},${s})`,f=(e,t,s)=>({L:e,C:t,h:s}),lt={"quantum-ink":{id:"quantum-ink",label:"Quantum Ink",bg:"#05070d",stops:[f(.16,.07,265),f(.42,.16,270),f(.64,.16,215),f(.82,.15,190),f(.95,.1,160)]},aurora:{id:"aurora",label:"Aurora",bg:"#04080a",stops:[f(.18,.06,200),f(.5,.16,165),f(.72,.18,150),f(.86,.16,120),f(.96,.12,95)]},spectral:{id:"spectral",label:"Spectral",bg:"#08060c",stops:[f(.2,.16,300),f(.45,.2,260),f(.62,.19,200),f(.76,.2,130),f(.9,.2,70),f(.96,.18,35)]},ember:{id:"ember",label:"Ember",bg:"#0a0604",stops:[f(.12,.05,30),f(.4,.16,35),f(.64,.2,55),f(.84,.16,80),f(.97,.06,95)]},mono:{id:"mono",label:"Mono",bg:"#060708",stops:[f(.12,.01,250),f(.4,.015,250),f(.68,.02,250),f(.9,.01,250),f(.99,0,250)]}},$t=e=>lt[e]??lt["quantum-ink"];function dt(e,t){const s=e.stops,i=(t<0?0:t>1?1:t)*(s.length-1),o=Math.min(s.length-2,Math.floor(i)),a=i-o,n=ct(s[o].L,s[o].C,s[o].h),c=ct(s[o+1].L,s[o+1].C,s[o+1].h);return Dt(n.L+(c.L-n.L)*a,n.a+(c.a-n.a)*a,n.b+(c.b-n.b)*a)}const Lt=(e,t)=>_t(dt(e,t));function Ut(e,t){if(t==="webgl2"){const i=e.getContext("webgl2",{antialias:!1,preserveDrawingBuffer:!0,premultipliedAlpha:!1});if(!i)throw new Error("surface: WebGL2 unavailable");return{kind:"webgl2",canvas:e,gl:i,width:1,height:1,dpr:1}}if(t==="three")return{kind:"three",canvas:e,width:1,height:1,dpr:1};const s=e.getContext("2d",{alpha:!1});if(!s)throw new Error("surface: 2d context unavailable");return{kind:"canvas2d",canvas:e,ctx:s,width:1,height:1,dpr:1}}function ht(e,t,s,i){e.width=Math.max(1,Math.round(t*i)),e.height=Math.max(1,Math.round(s*i)),e.dpr=i,e.canvas.width=e.width,e.canvas.height=e.height,e.kind==="canvas2d"?e.ctx.setTransform(1,0,0,1,0,0):e.kind==="webgl2"&&e.gl.viewport(0,0,e.width,e.height)}function qt(e){const t={};for(const s in e)t[s]=e[s].default;return t}const zt=(e,t,s)=>e+(t-e)*s,Gt=e=>e<0?0:e>1?1:e,at=(e,t,s)=>zt(t,s,Gt(e)),Xt=(e,t,s)=>Math.round(at(e,t,s)),M=3e4,D=32;function Ot(e){const t=e.replace("#","");return[parseInt(t.slice(0,2),16),parseInt(t.slice(2,4),16),parseInt(t.slice(4,6),16)]}class Wt{constructor(){r(this,"id","curl-flow");r(this,"title","Curl Flow");r(this,"tags",["flow","nature","math"]);r(this,"backend","canvas2d");r(this,"loopSeconds",14);r(this,"schema",{speed:{type:"number",min:.2,max:3,step:.05,default:1,label:"speed"},noiseScale:{type:"number",min:.3,max:4,step:.05,default:1.4,label:"field scale"},trail:{type:"number",min:.015,max:.3,step:.005,default:.07,label:"trail fade"},lineWidth:{type:"number",min:.5,max:3,step:.1,default:1.1,label:"line width"},hueShift:{type:"number",min:0,max:1,step:.01,default:0,label:"hue shift"},life:{type:"int",min:40,max:400,default:170,label:"particle life"}});r(this,"ctx");r(this,"w",1);r(this,"h",1);r(this,"rng");r(this,"noise");r(this,"palette");r(this,"bg",[5,7,13]);r(this,"x",new Float32Array(M));r(this,"y",new Float32Array(M));r(this,"px",new Float32Array(M));r(this,"py",new Float32Array(M));r(this,"age",new Float32Array(M));r(this,"life",new Float32Array(M));r(this,"hue",new Float32Array(M));r(this,"active",4e3);r(this,"curlStrength",1.2);r(this,"speedScale",1);r(this,"pSpeed",1);r(this,"pScale",1.4);r(this,"pTrail",.07);r(this,"pLine",1.1);r(this,"pHue",0);r(this,"pLife",170)}init(t){const s=t.surface;if(s.kind!=="canvas2d")throw new Error("curlFlow: expected canvas2d surface");this.ctx=s.ctx,this.w=t.width,this.h=t.height,this.rng=t.rng,this.noise=t.noise,this.palette=t.palette,this.bg=Ot(t.palette.bg),this.readParams(t.params),this.applyMeta(t.meta.complexity,t.meta.chaos);for(let i=0;i<M;i++)this.spawn(i,!0);this.ctx.fillStyle=`rgb(${this.bg[0]},${this.bg[1]},${this.bg[2]})`,this.ctx.fillRect(0,0,this.w,this.h)}readParams(t){this.pSpeed=Number(t.speed),this.pScale=Number(t.noiseScale),this.pTrail=Number(t.trail),this.pLine=Number(t.lineWidth),this.pHue=Number(t.hueShift),this.pLife=Number(t.life)}applyMeta(t,s){this.active=Xt(t,1200,M),this.curlStrength=at(s,.6,3.2),this.speedScale=at(s,.7,1.8)}spawn(t,s){const i=this.rng.range(0,this.w),o=this.rng.range(0,this.h);this.x[t]=i,this.y[t]=o,this.px[t]=i,this.py[t]=o,this.age[t]=s?this.rng.range(0,this.pLife):0,this.life[t]=this.pLife*this.rng.range(.6,1.4),this.hue[t]=(this.noise.fbm2(i*.0016,o*.0016,3)+1)*.5}update(t,s){const i=this.loopSeconds,o=.65,a=Math.cos(2*Math.PI*s/i)*o,n=Math.sin(2*Math.PI*s/i)*o,c=this.pScale*.0024,h=this.pSpeed*this.speedScale*this.curlStrength*60*t,p=this.w,m=this.h;for(let l=0;l<this.active;l++){this.px[l]=this.x[l],this.py[l]=this.y[l];const[b,u]=this.noise.curl(this.x[l]*c+a,this.y[l]*c+n);this.x[l]+=b*h,this.y[l]+=u*h,this.age[l]+=t*60,(this.age[l]>this.life[l]||this.x[l]<-2||this.x[l]>p+2||this.y[l]<-2||this.y[l]>m+2)&&this.spawn(l,!1)}}render(){const t=this.ctx;t.fillStyle=`rgba(${this.bg[0]},${this.bg[1]},${this.bg[2]},${this.pTrail})`,t.fillRect(0,0,this.w,this.h),t.lineWidth=this.pLine,t.lineCap="round";const s=[],i=[];for(let o=0;o<D;o++)s.push(new Path2D),i.push(Lt(this.palette,(o/D+this.pHue)%1));for(let o=0;o<this.active;o++){let a=(this.hue[o]+this.pHue)%1*D;a=a<0?a+D:a;const n=a>=D?D-1:a|0,c=s[n];c.moveTo(this.px[o],this.py[o]),c.lineTo(this.x[o],this.y[o])}for(let o=0;o<D;o++)t.strokeStyle=i[o],t.stroke(s[o])}resize(t,s){this.w=t,this.h=s,this.ctx.fillStyle=`rgb(${this.bg[0]},${this.bg[1]},${this.bg[2]})`,this.ctx.fillRect(0,0,t,s);for(let i=0;i<M;i++)this.spawn(i,!0)}reseed(){for(let t=0;t<M;t++)this.spawn(t,!0)}dispose(){}}const jt=()=>new Wt,j=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

uniform vec2  uRes;
uniform float uTime;        // loop-phase seconds
uniform float uPhase;       // 0..2π over one loop (use for seamless motion)
uniform float uComplexity;  // 0..1
uniform float uChaos;       // 0..1
uniform vec2  uSeed;
uniform sampler2D uPalette; // 256x1 theme ramp

const float PI  = 3.14159265359;
const float TAU = 6.28318530718;

// aspect-correct centred coords (y in [-0.5,0.5])
vec2 uvAspect() {
  return (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
}

vec3 pal(float t) {
  return texture(uPalette, vec2(clamp(t, 0.0, 1.0), 0.5)).rgb;
}

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453) * 2.0 - 1.0;
}

float gnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(dot(hash2(i + vec2(0, 0)), f - vec2(0, 0)), dot(hash2(i + vec2(1, 0)), f - vec2(1, 0)), u.x),
    mix(dot(hash2(i + vec2(0, 1)), f - vec2(0, 1)), dot(hash2(i + vec2(1, 1)), f - vec2(1, 1)), u.x),
    u.y);
}

float fbm(vec2 p, int oct) {
  float a = 0.5, s = 0.0, n = 0.0;
  for (int i = 0; i < 8; i++) {
    if (i >= oct) break;
    s += a * gnoise(p);
    n += a;
    p *= 2.0;
    a *= 0.5;
  }
  return n > 0.0 ? s / n : 0.0;
}
`,Vt=`#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;function ut(e,t,s){const i=e.createShader(s);if(e.shaderSource(i,t),e.compileShader(i),!e.getShaderParameter(i,e.COMPILE_STATUS)){const o=e.getShaderInfoLog(i);throw e.deleteShader(i),new Error(`shader compile: ${o}`)}return i}class Bt{constructor(t,s,i=Vt){r(this,"gl");r(this,"program");r(this,"vao");r(this,"loc",new Map);r(this,"unit",0);this.gl=t;const o=ut(t,i,t.VERTEX_SHADER),a=ut(t,s,t.FRAGMENT_SHADER),n=t.createProgram();if(t.attachShader(n,o),t.attachShader(n,a),t.linkProgram(n),!t.getProgramParameter(n,t.LINK_STATUS))throw new Error(`program link: ${t.getProgramInfoLog(n)}`);t.deleteShader(o),t.deleteShader(a),this.program=n,this.vao=t.createVertexArray()}use(){return this.gl.useProgram(this.program),this.unit=0,this}u(t){return this.loc.has(t)||this.loc.set(t,this.gl.getUniformLocation(this.program,t)),this.loc.get(t)??null}f(t,s){return this.gl.uniform1f(this.u(t),s),this}i(t,s){return this.gl.uniform1i(this.u(t),s),this}v2(t,s,i){return this.gl.uniform2f(this.u(t),s,i),this}tex(t,s){const i=this.gl;return i.activeTexture(i.TEXTURE0+this.unit),i.bindTexture(i.TEXTURE_2D,s),i.uniform1i(this.u(t),this.unit),this.unit++,this}draw(){const t=this.gl;t.bindVertexArray(this.vao),t.drawArrays(t.TRIANGLES,0,3),t.bindVertexArray(null)}dispose(){this.gl.deleteProgram(this.program),this.gl.deleteVertexArray(this.vao)}}function Ht(e,t){const i=new Uint8Array(1024);for(let a=0;a<256;a++){const n=dt(t,a/255);i[a*4]=n[0],i[a*4+1]=n[1],i[a*4+2]=n[2],i[a*4+3]=255}const o=e.createTexture();return e.bindTexture(e.TEXTURE_2D,o),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,256,1,0,e.RGBA,e.UNSIGNED_BYTE,i),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),o}const Yt=Math.PI*2;function V(e){return()=>{let t,s,i,o=1,a=1,n=0,c=0,h=0,p=.5,m=.5,l={};return{id:e.id,title:e.title,tags:e.tags,backend:"webgl2",loopSeconds:e.loopSeconds,schema:e.schema,init(u){const d=u.surface;if(d.kind!=="webgl2")throw new Error(`${e.id}: expected webgl2 surface`);t=d.gl,o=u.width,a=u.height,l=u.params,c=u.rng.range(-50,50),h=u.rng.range(-50,50),s=new Bt(t,e.frag),i=Ht(t,u.palette)},update(u,d){n=d},render(){var I;t.viewport(0,0,o,a);const u=n/e.loopSeconds*Yt,d=s.use();d.v2("uRes",o,a).f("uTime",n).f("uPhase",u).f("uComplexity",p).f("uChaos",m).v2("uSeed",c,h),d.tex("uPalette",i),(I=e.uniforms)==null||I.call(e,d,l,p,m),d.draw()},resize(u,d){o=u,a=d},reseed(){},applyMeta(u,d){p=u,m=d},dispose(){s==null||s.dispose(),i&&t.deleteTexture(i)}}}}const Zt=j+`
uniform float uZoom;
uniform float uGlow;
void main() {
  float det = mix(0.7, 2.2, uComplexity);
  vec2 p = uvAspect() * uZoom * det + uSeed;
  float warp = mix(0.5, 3.0, uChaos);
  vec2 q = vec2(
    fbm(p + vec2(cos(uPhase), sin(uPhase)) * 0.35, 5),
    fbm(p + vec2(5.2, 1.3) + vec2(sin(uPhase), cos(uPhase)) * 0.35, 5));
  vec2 r = vec2(
    fbm(p + warp * q + vec2(1.7, 9.2), 6),
    fbm(p + warp * q + vec2(8.3, 2.8), 6));
  float v = fbm(p + warp * r, 6);
  float t = clamp(v * 0.5 + 0.5, 0.0, 1.0);
  vec3 col = pal(t);
  col *= 0.45 + uGlow * length(r);
  fragColor = vec4(col, 1.0);
}`,Qt=V({id:"domain-warp",title:"Domain Warp",tags:["flow","nature","noise"],loopSeconds:18,schema:{zoom:{type:"number",min:.4,max:3,step:.05,default:1.4,label:"zoom"},glow:{type:"number",min:0,max:1.5,step:.05,default:.7,label:"glow"}},frag:Zt,uniforms:(e,t)=>e.f("uZoom",Number(t.zoom)).f("uGlow",Number(t.glow))}),Jt=j+`
uniform float uScale;
uniform float uShift;
void main() {
  float scl = uScale * mix(1.0, 2.2, uComplexity);
  vec2 p = uvAspect() * scl;
  float v = 0.0;
  v += sin(p.x * 1.3 + uPhase);
  v += sin(p.y * 1.7 - uPhase);
  v += sin((p.x + p.y) * 0.9 + uPhase);
  v += sin(length(p) * 2.0 - uPhase);
  v += mix(0.0, 3.0, uChaos) * fbm(p * 0.7 + vec2(cos(uPhase), sin(uPhase)), 5);
  float t = fract(0.5 + 0.12 * v + uShift);
  fragColor = vec4(pal(t), 1.0);
}`,Kt=V({id:"plasma",title:"Plasma",tags:["flow","math"],loopSeconds:12,schema:{uScale:{type:"number",min:1,max:6,step:.1,default:2.6,label:"scale"},uShift:{type:"number",min:0,max:1,step:.01,default:0,label:"colour shift"}},frag:Jt,uniforms:(e,t)=>e.f("uScale",Number(t.uScale)).f("uShift",Number(t.uShift))}),te=j+`
uniform float uDensity;
uniform float uEdge;
void main() {
  float dens = uDensity * mix(0.6, 1.8, uComplexity) * 6.0;
  vec2 p = uvAspect() * dens;
  vec2 ip = floor(p), fp = fract(p);
  float d1 = 9.0, d2 = 9.0;
  vec2 idBest = vec2(0.0);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 hh = hash2(ip + g);
      vec2 o = 0.5 + 0.5 * sin(uPhase + TAU * hh + uChaos * 3.0 * hh.yx);
      vec2 r = g + o - fp;
      float d = dot(r, r);
      if (d < d1) { d2 = d1; d1 = d; idBest = ip + g; }
      else if (d < d2) { d2 = d; }
    }
  }
  float edge = sqrt(d2) - sqrt(d1);
  float glow = 1.0 - smoothstep(0.0, uEdge, edge);
  float cellTone = fract(sin(dot(idBest, vec2(12.9898, 78.233))) * 43758.5453);
  vec3 col = pal(cellTone) * 0.5 + pal(0.95) * glow;
  fragColor = vec4(col, 1.0);
}`,ee=V({id:"voronoi-cells",title:"Voronoi Cells",tags:["math","nature"],loopSeconds:16,schema:{uDensity:{type:"number",min:.5,max:2.5,step:.05,default:1,label:"density"},uEdge:{type:"number",min:.02,max:.4,step:.005,default:.12,label:"edge glow"}},frag:te,uniforms:(e,t)=>e.f("uDensity",Number(t.uDensity)).f("uEdge",Number(t.uEdge))}),se=j+`
uniform float uSources;
uniform float uFreq;
void main() {
  int N = int(uSources + 0.5);
  vec2 uv = uvAspect();
  float amp = 0.0;
  float freq = uFreq * mix(0.6, 1.6, uComplexity);
  for (int i = 0; i < 8; i++) {
    if (i >= N) break;
    float fi = float(i);
    vec2 src = 0.62 * vec2(sin(uSeed.x * 0.7 + fi * 2.39), cos(uSeed.y * 0.5 + fi * 1.71));
    float d = length(uv - src);
    amp += sin(d * freq - uPhase + uChaos * 3.0 * sin(fi * 1.3));
  }
  amp /= float(N);
  float t = 0.5 + 0.5 * amp;
  fragColor = vec4(pal(t), 1.0);
}`,ie=V({id:"wave-interference",title:"Wave Interference",tags:["quantum","physics","math"],loopSeconds:10,schema:{uSources:{type:"int",min:2,max:8,default:4,label:"sources"},uFreq:{type:"number",min:10,max:60,step:1,default:28,label:"frequency"}},frag:se,uniforms:(e,t)=>e.f("uSources",Number(t.uSources)).f("uFreq",Number(t.uFreq))}),oe=j+`
uniform float uWaves;
void main() {
  int N = int(uWaves + 0.5);
  float scl = mix(2.0, 5.0, uComplexity);
  vec2 p = uvAspect() * scl + uSeed * 0.1;
  float turb = uChaos * 2.0 * fbm(p * 0.8 + vec2(cos(uPhase), sin(uPhase)), 4);
  float re = 0.0, im = 0.0;
  for (int i = 0; i < 7; i++) {
    if (i >= N) break;
    float fi = float(i + 1);
    vec2 dir = vec2(cos(fi * 1.7 + uSeed.x), sin(fi * 2.3 + uSeed.y)) * fi;
    float dir2 = (i < 3) ? 1.0 : -1.0;
    float ph = dot(p, dir) + uPhase * dir2 + turb;
    re += cos(ph);
    im += sin(ph);
  }
  float mag = length(vec2(re, im)) / float(N);
  float hue = (atan(im, re) + PI) / TAU;
  vec3 col = pal(hue) * clamp(0.15 + mag * 1.3, 0.0, 1.0);
  fragColor = vec4(col, 1.0);
}`,ae=V({id:"phase-field",title:"Phase Field",tags:["quantum","math"],loopSeconds:14,schema:{uWaves:{type:"int",min:2,max:7,default:5,label:"waves"}},frag:oe,uniforms:(e,t)=>e.f("uWaves",Number(t.uWaves))}),ne=[Qt,ae,ie,Kt,ee,jt],gt=ne,bt=gt.map(e=>e()),vt=bt.map(e=>({id:e.id,title:e.title,tags:e.tags,backend:e.backend,schema:e.schema,loopSeconds:e.loopSeconds})),yt=new Map;bt.forEach((e,t)=>yt.set(e.id,gt[t]));const re=e=>{var t;return(t=yt.get(e))==null?void 0:t()},wt=e=>vt.find(t=>t.id===e),pe=()=>vt[0];function me(e,t={w:1500,h:500},s="quantum-ink"){const i=wt(e);return i?{pieceId:e,seed:Mt(),params:qt(i.schema),size:t,meta:{complexity:.45,chaos:.45},theme:s}:null}class de{constructor(t,s,i={}){r(this,"canvas");r(this,"surface");r(this,"piece",null);r(this,"cfg");r(this,"opts");r(this,"raf",0);r(this,"playing",!1);r(this,"last",0);r(this,"elapsed",0);r(this,"fpsT",0);r(this,"fpsN",0);r(this,"tick",t=>{var a,n;if(!this.playing||!this.piece)return;const s=this.last?Math.min(.05,(t-this.last)/1e3):1/60;this.last=t,this.elapsed+=s;const i=this.piece.loopSeconds,o=i?this.elapsed%i:this.elapsed;this.piece.update(s,o),this.piece.render(),this.fpsN++,t-this.fpsT>500&&((n=(a=this.opts).onFrame)==null||n.call(a,Math.round(this.fpsN*1e3/(t-this.fpsT))),this.fpsN=0,this.fpsT=t),this.raf=requestAnimationFrame(this.tick)});var a;this.cfg=s,this.opts=i,this.canvas=document.createElement("canvas"),this.canvas.className="prism-canvas",t.appendChild(this.canvas);const o=((a=wt(s.pieceId))==null?void 0:a.backend)??"canvas2d";this.surface=Ut(this.canvas,o),this.mount()}get config(){return this.cfg}dims(){if(this.opts.sizing==="fit"){const t=this.canvas.parentElement.getBoundingClientRect();return{w:Math.max(2,Math.floor(t.width)),h:Math.max(2,Math.floor(t.height))}}return{w:this.cfg.size.w,h:this.cfg.size.h}}mount(){var c;this.pause(),(c=this.piece)==null||c.dispose();const{w:t,h:s}=this.dims();ht(this.surface,t,s,1);const i=At(this.cfg.seed),o=kt(i),a=$t(this.cfg.theme),n=re(this.cfg.pieceId);n&&(n.init({surface:this.surface,width:this.surface.width,height:this.surface.height,rng:i,noise:o,palette:a,params:this.cfg.params,meta:this.cfg.meta}),n.applyMeta(this.cfg.meta.complexity,this.cfg.meta.chaos),this.piece=n,this.elapsed=0,n.render(),this.play())}play(){this.playing||!this.piece||(this.playing=!0,this.last=0,this.fpsT=performance.now(),this.raf=requestAnimationFrame(this.tick))}pause(){this.playing=!1,cancelAnimationFrame(this.raf)}toggle(){this.playing?this.pause():this.play()}isPlaying(){return this.playing}restart(){this.mount()}reseed(t){this.cfg.seed=t,this.mount()}setParam(t,s){this.cfg.params[t]=s,this.mount()}setTheme(t){this.cfg.theme=t,this.mount()}setMeta(t,s){var i;this.cfg.meta={complexity:t,chaos:s},(i=this.piece)==null||i.applyMeta(t,s)}setSize(t,s){this.cfg.size={w:t,h:s},this.opts.sizing!=="fit"&&this.mount()}refit(){if(this.opts.sizing!=="fit"||!this.piece)return;const{w:t,h:s}=this.dims();ht(this.surface,t,s,1),this.piece.resize(this.surface.width,this.surface.height)}destroy(){var t;this.pause(),(t=this.piece)==null||t.dispose(),this.piece=null}}const ce=e=>btoa(unescape(encodeURIComponent(e))).replace(/=+$/,""),le=e=>decodeURIComponent(escape(atob(e)));function xt(e){return ce(JSON.stringify(e))}function he(e){try{const t=JSON.parse(le(e));return!t.pieceId||!t.size?null:t}catch{return null}}function ge(){const e=location.hash.replace(/^#/,"");return e?he(e):null}let ft=0;function be(e){clearTimeout(ft),ft=window.setTimeout(()=>{history.replaceState(null,"",`#${xt(e)}`)},120)}function ue(e){return`${location.origin}/prism/embed.html#${xt(e)}`}function ve(e){const{w:t,h:s}=e.size;return`<iframe src="${ue(e)}" width="${t}" height="${s}" style="border:0;max-width:100%" loading="lazy" title="Prism — ${e.pieceId}"></iframe>`}export{de as P,vt as a,Mt as b,lt as c,me as d,ue as e,pe as f,wt as g,ve as h,ge as r,be as w};
