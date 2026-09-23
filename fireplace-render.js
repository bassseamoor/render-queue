// Uses the current render-queue MP4/WebCodecs path, including its iOS-safe 2D frame copy.
/* mp4-muxer v5.2.1 (inlined for offline render mode) */
/**
 * Minified by jsDelivr using Terser v5.39.0.
 * Original file: /npm/mp4-muxer@5.2.1/build/mp4-muxer.js
 *
 * Do NOT use SRI with dynamically generated files! More information: https://www.jsdelivr.com/using-sri-with-dynamic-files
 */
"use strict";var Mp4Muxer=(()=>{var e=Object.defineProperty,t=Object.getOwnPropertyDescriptor,i=Object.getOwnPropertyNames,s=Object.prototype.hasOwnProperty,a=(e,t,i)=>{if(!t.has(e))throw TypeError("Cannot "+i)},r=(e,t,i)=>(a(e,t,"read from private field"),i?i.call(e):t.get(e)),n=(e,t,i)=>{if(t.has(e))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(e):t.set(e,i)},o=(e,t,i,s)=>(a(e,t,"write to private field"),s?s.call(e,i):t.set(e,i),i),h=(e,t,i)=>(a(e,t,"access private method"),i),l={};((t,i)=>{for(var s in i)e(t,s,{get:i[s],enumerable:!0})})(l,{ArrayBufferTarget:()=>Me,FileSystemWritableFileStreamTarget:()=>Oe,Muxer:()=>Rt,StreamTarget:()=>We});var d,f,u,m,p,c,w,g,b=new Uint8Array(8),y=new DataView(b.buffer),k=e=>[(e%256+256)%256],T=e=>(y.setUint16(0,e,!1),[b[0],b[1]]),C=e=>(y.setUint32(0,e,!1),[b[1],b[2],b[3]]),v=e=>(y.setUint32(0,e,!1),[b[0],b[1],b[2],b[3]]),S=e=>(y.setUint32(0,Math.floor(e/2**32),!1),y.setUint32(4,e,!1),[b[0],b[1],b[2],b[3],b[4],b[5],b[6],b[7]]),x=e=>(y.setInt16(0,256*e,!1),[b[0],b[1]]),z=e=>(y.setInt32(0,65536*e,!1),[b[0],b[1],b[2],b[3]]),E=e=>(y.setInt32(0,2**30*e,!1),[b[0],b[1],b[2],b[3]]),A=(e,t=!1)=>{let i=Array(e.length).fill(null).map(((t,i)=>e.charCodeAt(i)));return t&&i.push(0),i},M=e=>e&&e[e.length-1],W=e=>{let t;for(let i of e)(!t||i.presentationTimestamp>t.presentationTimestamp)&&(t=i);return t},O=(e,t,i=!0)=>{let s=e*t;return i?Math.round(s):s},B=e=>{let t=e*(Math.PI/180),i=Math.cos(t),s=Math.sin(t);return[i,s,0,-s,i,0,0,0,1]},U=B(0),D=e=>[z(e[0]),z(e[1]),E(e[2]),z(e[3]),z(e[4]),E(e[5]),z(e[6]),z(e[7]),E(e[8])],j=e=>e?"object"!=typeof e?e:Array.isArray(e)?e.map(j):Object.fromEntries(Object.entries(e).map((([e,t])=>[e,j(t)]))):e,R=e=>e>=0&&e<2**32,I=(e,t,i)=>({type:e,contents:t&&new Uint8Array(t.flat(10)),children:i}),N=(e,t,i,s,a)=>I(e,[k(t),C(i),s??[]],a),V=e=>({type:"mdat",largeSize:e}),F=(e,t,i=!1)=>I("moov",null,[L(t,e),...e.map((e=>$(e,t))),i?me(e):null]),L=(e,t)=>{let i=O(Math.max(0,...t.filter((e=>e.samples.length>0)).map((e=>{const t=W(e.samples);return t.presentationTimestamp+t.duration}))),Bt),s=Math.max(...t.map((e=>e.id)))+1,a=!R(e)||!R(i),r=a?S:v;return N("mvhd",+a,0,[r(e),r(e),v(Bt),r(i),z(1),x(1),Array(10).fill(0),D(U),Array(24).fill(0),v(s)])},$=(e,t)=>I("trak",null,[P(e,t),H(e,t)]),P=(e,t)=>{let i,s=W(e.samples),a=O(s?s.presentationTimestamp+s.duration:0,Bt),r=!R(t)||!R(a),n=r?S:v;return i="video"===e.info.type?"number"==typeof e.info.rotation?B(e.info.rotation):e.info.rotation:U,N("tkhd",+r,3,[n(t),n(t),v(e.id),v(0),n(a),Array(8).fill(0),T(0),T(0),x("audio"===e.info.type?1:0),T(0),D(i),z("video"===e.info.type?e.info.width:0),z("video"===e.info.type?e.info.height:0)])},H=(e,t)=>I("mdia",null,[_(e,t),q("video"===e.info.type?"vide":"soun"),G(e)]),_=(e,t)=>{let i=W(e.samples),s=O(i?i.presentationTimestamp+i.duration:0,e.timescale),a=!R(t)||!R(s),r=a?S:v;return N("mdhd",+a,0,[r(t),r(t),v(e.timescale),r(s),T(21956),T(0)])},q=e=>N("hdlr",0,0,[A("mhlr"),A(e),v(0),v(0),v(0),A("mp4-muxer-hdlr",!0)]),G=e=>I("minf",null,["video"===e.info.type?J():K(),Q(),Z(e)]),J=()=>N("vmhd",0,1,[T(0),T(0),T(0),T(0)]),K=()=>N("smhd",0,0,[T(0),T(0)]),Q=()=>I("dinf",null,[X()]),X=()=>N("dref",0,0,[v(1)],[Y()]),Y=()=>N("url ",0,1),Z=e=>{const t=e.compositionTimeOffsetTable.length>1||e.compositionTimeOffsetTable.some((e=>0!==e.sampleCompositionTimeOffset));return I("stbl",null,[ee(e),oe(e),he(e),le(e),de(e),fe(e),t?ue(e):null])},ee=e=>N("stsd",0,0,[v(1)],["video"===e.info.type?te(Se[e.info.codec],e):ne(ze[e.info.codec],e)]),te=(e,t)=>{return I(e,[Array(6).fill(0),T(1),T(0),T(0),Array(12).fill(0),T(t.info.width),T(t.info.height),v(4718592),v(4718592),v(0),T(1),Array(32).fill(0),T(24),(i=65535,y.setInt16(0,i,!1),[b[0],b[1]])],[xe[t.info.codec](t),(t.info.decoderConfig&&t.info.decoderConfig.colorSpace)?re(t):null]);var i},ie={bt709:1,bt470bg:5,smpte170m:6},se={bt709:1,smpte170m:6,"iec61966-2-1":13},ae={rgb:0,bt709:1,bt470bg:5,smpte170m:6},re=e=>I("colr",[A("nclx"),T(ie[e.info.decoderConfig.colorSpace.primaries]),T(se[e.info.decoderConfig.colorSpace.transfer]),T(ae[e.info.decoderConfig.colorSpace.matrix]),k((e.info.decoderConfig.colorSpace.fullRange?1:0)<<7)]),ne=(e,t)=>I(e,[Array(6).fill(0),T(1),T(0),T(0),v(0),T(t.info.numberOfChannels),T(16),T(0),T(0),z(t.info.sampleRate)],[Ee[t.info.codec](t)]),oe=e=>N("stts",0,0,[v(e.timeToSampleTable.length),e.timeToSampleTable.map((e=>[v(e.sampleCount),v(e.sampleDelta)]))]),he=e=>{if(e.samples.every((e=>"key"===e.type)))return null;let t=[...e.samples.entries()].filter((([,e])=>"key"===e.type));return N("stss",0,0,[v(t.length),t.map((([e])=>v(e+1)))])},le=e=>N("stsc",0,0,[v(e.compactlyCodedChunkTable.length),e.compactlyCodedChunkTable.map((e=>[v(e.firstChunk),v(e.samplesPerChunk),v(1)]))]),de=e=>N("stsz",0,0,[v(0),v(e.samples.length),e.samples.map((e=>v(e.size)))]),fe=e=>e.finalizedChunks.length>0&&M(e.finalizedChunks).offset>=2**32?N("co64",0,0,[v(e.finalizedChunks.length),e.finalizedChunks.map((e=>S(e.offset)))]):N("stco",0,0,[v(e.finalizedChunks.length),e.finalizedChunks.map((e=>v(e.offset)))]),ue=e=>N("ctts",0,0,[v(e.compositionTimeOffsetTable.length),e.compositionTimeOffsetTable.map((e=>[v(e.sampleCount),v(e.sampleCompositionTimeOffset)]))]),me=e=>I("mvex",null,e.map(pe)),pe=e=>N("trex",0,0,[v(e.id),v(1),v(0),v(0),v(0)]),ce=(e,t)=>I("moof",null,[we(e),...t.map(be)]),we=e=>N("mfhd",0,0,[v(e)]),ge=e=>{let t=0,i=0,s="delta"===e.type;return i|=+s,t|=s?1:2,t<<24|i<<16},be=e=>I("traf",null,[ye(e),ke(e),Te(e)]),ye=e=>{let t=0;t|=8,t|=16,t|=32,t|=131072;let i=e.currentChunk.samples[1]??e.currentChunk.samples[0],s={duration:i.timescaleUnitsToNextSample,size:i.size,flags:ge(i)};return N("tfhd",0,131128,[v(e.id),v(s.duration),v(s.size),v(s.flags)])},ke=e=>N("tfdt",1,0,[S(O(e.currentChunk.startTimestamp,e.timescale))]),Te=e=>{let t=e.currentChunk.samples.map((e=>e.timescaleUnitsToNextSample)),i=e.currentChunk.samples.map((e=>e.size)),s=e.currentChunk.samples.map(ge),a=e.currentChunk.samples.map((t=>O(t.presentationTimestamp-t.decodeTimestamp,e.timescale))),r=new Set(t),n=new Set(i),o=new Set(s),h=new Set(a),l=2===o.size&&s[0]!==s[1],d=r.size>1,f=n.size>1,u=!l&&o.size>1,m=h.size>1||[...h].some((e=>0!==e)),p=0;return p|=1,p|=4*+l,p|=256*+d,p|=512*+f,p|=1024*+u,p|=2048*+m,N("trun",1,p,[v(e.currentChunk.samples.length),v(e.currentChunk.offset-e.currentChunk.moofOffset||0),l?v(s[0]):[],e.currentChunk.samples.map(((e,r)=>{return[d?v(t[r]):[],f?v(i[r]):[],u?v(s[r]):[],m?(n=a[r],y.setInt32(0,n,!1),[b[0],b[1],b[2],b[3]]):[]];var n}))])},Ce=(e,t)=>N("tfra",1,0,[v(e.id),v(63),v(e.finalizedChunks.length),e.finalizedChunks.map((i=>[S(O(i.startTimestamp,e.timescale)),S(i.moofOffset),v(t+1),v(1),v(1)]))]),ve=()=>N("mfro",0,0,[v(0)]),Se={avc:"avc1",hevc:"hvc1",vp9:"vp09",av1:"av01"},xe={avc:e=>e.info.decoderConfig&&I("avcC",[...new Uint8Array(e.info.decoderConfig.description)]),hevc:e=>e.info.decoderConfig&&I("hvcC",[...new Uint8Array(e.info.decoderConfig.description)]),vp9:e=>{if(!e.info.decoderConfig)return null;let t=e.info.decoderConfig;if(!t.colorSpace)throw new Error("'colorSpace' is required in the decoder config for VP9.");let i=t.codec.split("."),s=Number(i[1]),a=Number(i[2]),r=0+(Number(i[3])<<4)+Number(t.colorSpace.fullRange);return N("vpcC",1,0,[k(s),k(a),k(r),k(2),k(2),k(2),T(0)])},av1:()=>I("av1C",[129,0,0,0])},ze={aac:"mp4a",opus:"Opus"},Ee={aac:e=>{let t=new Uint8Array(e.info.decoderConfig.description);return N("esds",0,0,[v(58753152),k(32+t.byteLength),T(1),k(0),v(75530368),k(18+t.byteLength),k(64),k(21),C(0),v(130071),v(130071),v(92307584),k(t.byteLength),...t,v(109084800),k(1),k(2)])},opus:e=>{let t=3840,i=0;const s=e.info.decoderConfig?.description;if(s){if(s.byteLength<18)throw new TypeError("Invalid decoder description provided for Opus; must be at least 18 bytes long.");const e=ArrayBuffer.isView(s)?new DataView(s.buffer,s.byteOffset,s.byteLength):new DataView(s);t=e.getUint16(10,!0),i=e.getInt16(14,!0)}return I("dOps",[k(0),k(e.info.numberOfChannels),T(t),v(e.info.sampleRate),x(i),k(0)])}},Ae=(Symbol("isTarget"),class{}),Me=class extends Ae{constructor(){super(...arguments),this.buffer=null}},We=class extends Ae{constructor(e){if(super(),this.options=e,"object"!=typeof e)throw new TypeError("StreamTarget requires an options object to be passed to its constructor.");if(e.onData){if("function"!=typeof e.onData)throw new TypeError("options.onData, when provided, must be a function.");if(e.onData.length<2)throw new TypeError("options.onData, when provided, must be a function that takes in at least two arguments (data and position). Ignoring the position argument, which specifies the byte offset at which the data is to be written, can lead to broken outputs.")}if(void 0!==e.chunked&&"boolean"!=typeof e.chunked)throw new TypeError("options.chunked, when provided, must be a boolean.");if(void 0!==e.chunkSize&&(!Number.isInteger(e.chunkSize)||e.chunkSize<1024))throw new TypeError("options.chunkSize, when provided, must be an integer and not smaller than 1024.")}},Oe=class extends Ae{constructor(e,t){if(super(),this.stream=e,this.options=t,!(e instanceof FileSystemWritableFileStream))throw new TypeError("FileSystemWritableFileStreamTarget requires a FileSystemWritableFileStream instance.");if(void 0!==t&&"object"!=typeof t)throw new TypeError("FileSystemWritableFileStreamTarget's options, when provided, must be an object.");if(t&&void 0!==t.chunkSize&&(!Number.isInteger(t.chunkSize)||t.chunkSize<=0))throw new TypeError("options.chunkSize, when provided, must be a positive integer")}},Be=class{constructor(){this.pos=0,n(this,d,new Uint8Array(8)),n(this,f,new DataView(r(this,d).buffer)),this.offsets=new WeakMap}seek(e){this.pos=e}writeU32(e){r(this,f).setUint32(0,e,!1),this.write(r(this,d).subarray(0,4))}writeU64(e){r(this,f).setUint32(0,Math.floor(e/2**32),!1),r(this,f).setUint32(4,e,!1),this.write(r(this,d).subarray(0,8))}writeAscii(e){for(let t=0;t<e.length;t++)r(this,f).setUint8(t%8,e.charCodeAt(t)),t%8==7&&this.write(r(this,d));e.length%8!=0&&this.write(r(this,d).subarray(0,e.length%8))}writeBox(e){if(this.offsets.set(e,this.pos),e.contents&&!e.children)this.writeBoxHeader(e,e.size??e.contents.byteLength+8),this.write(e.contents);else{let t=this.pos;if(this.writeBoxHeader(e,0),e.contents&&this.write(e.contents),e.children)for(let t of e.children)t&&this.writeBox(t);let i=this.pos,s=e.size??i-t;this.seek(t),this.writeBoxHeader(e,s),this.seek(i)}}writeBoxHeader(e,t){this.writeU32(e.largeSize?1:t),this.writeAscii(e.type),e.largeSize&&this.writeU64(t)}measureBoxHeader(e){return 8+(e.largeSize?8:0)}patchBox(e){let t=this.pos;this.seek(this.offsets.get(e)),this.writeBox(e),this.seek(t)}measureBox(e){if(e.contents&&!e.children){return this.measureBoxHeader(e)+e.contents.byteLength}{let t=this.measureBoxHeader(e);if(e.contents&&(t+=e.contents.byteLength),e.children)for(let i of e.children)i&&(t+=this.measureBox(i));return t}}};d=new WeakMap,f=new WeakMap;var Ue=class extends Be{constructor(e){super(),n(this,w),n(this,u,void 0),n(this,m,new ArrayBuffer(65536)),n(this,p,new Uint8Array(r(this,m))),n(this,c,0),o(this,u,e)}write(e){h(this,w,g).call(this,this.pos+e.byteLength),r(this,p).set(e,this.pos),this.pos+=e.byteLength,o(this,c,Math.max(r(this,c),this.pos))}finalize(){h(this,w,g).call(this,this.pos),r(this,u).buffer=r(this,m).slice(0,Math.max(r(this,c),this.pos))}};u=new WeakMap,m=new WeakMap,p=new WeakMap,c=new WeakMap,w=new WeakSet,g=function(e){let t=r(this,m).byteLength;for(;t<e;)t*=2;if(t===r(this,m).byteLength)return;let i=new ArrayBuffer(t),s=new Uint8Array(i);s.set(r(this,p),0),o(this,m,i),o(this,p,s)};var De,je,Re,Ie,Ne,Ve,Fe,Le,$e,Pe,He,_e,qe,Ge=class extends Be{constructor(e){super(),n(this,Ve),n(this,Le),n(this,Pe),n(this,_e),n(this,De,void 0),n(this,je,[]),n(this,Re,void 0),n(this,Ie,void 0),n(this,Ne,[]),o(this,De,e),o(this,Re,e.options?.chunked??!1),o(this,Ie,e.options?.chunkSize??16777216)}write(e){r(this,je).push({data:e.slice(),start:this.pos}),this.pos+=e.byteLength}flush(){if(0===r(this,je).length)return;let e=[],t=[...r(this,je)].sort(((e,t)=>e.start-t.start));e.push({start:t[0].start,size:t[0].data.byteLength});for(let i=1;i<t.length;i++){let s=e[e.length-1],a=t[i];a.start<=s.start+s.size?s.size=Math.max(s.size,a.start+a.data.byteLength-s.start):e.push({start:a.start,size:a.data.byteLength})}for(let t of e){t.data=new Uint8Array(t.size);for(let e of r(this,je))t.start<=e.start&&e.start<t.start+t.size&&t.data.set(e.data,e.start-t.start);r(this,Re)?(h(this,Ve,Fe).call(this,t.data,t.start),h(this,_e,qe).call(this)):r(this,De).options.onData?.(t.data,t.start)}r(this,je).length=0}finalize(){r(this,Re)&&h(this,_e,qe).call(this,!0)}};De=new WeakMap,je=new WeakMap,Re=new WeakMap,Ie=new WeakMap,Ne=new WeakMap,Ve=new WeakSet,Fe=function(e,t){let i=r(this,Ne).findIndex((e=>e.start<=t&&t<e.start+r(this,Ie)));-1===i&&(i=h(this,Pe,He).call(this,t));let s=r(this,Ne)[i],a=t-s.start,n=e.subarray(0,Math.min(r(this,Ie)-a,e.byteLength));s.data.set(n,a);let o={start:a,end:a+n.byteLength};if(h(this,Le,$e).call(this,s,o),0===s.written[0].start&&s.written[0].end===r(this,Ie)&&(s.shouldFlush=!0),r(this,Ne).length>2){for(let e=0;e<r(this,Ne).length-1;e++)r(this,Ne)[e].shouldFlush=!0;h(this,_e,qe).call(this)}n.byteLength<e.byteLength&&h(this,Ve,Fe).call(this,e.subarray(n.byteLength),t+n.byteLength)},Le=new WeakSet,$e=function(e,t){let i=0,s=e.written.length-1,a=-1;for(;i<=s;){let r=Math.floor(i+(s-i+1)/2);e.written[r].start<=t.start?(i=r+1,a=r):s=r-1}for(e.written.splice(a+1,0,t),(-1===a||e.written[a].end<t.start)&&a++;a<e.written.length-1&&e.written[a].end>=e.written[a+1].start;)e.written[a].end=Math.max(e.written[a].end,e.written[a+1].end),e.written.splice(a+1,1)},Pe=new WeakSet,He=function(e){let t={start:Math.floor(e/r(this,Ie))*r(this,Ie),data:new Uint8Array(r(this,Ie)),written:[],shouldFlush:!1};return r(this,Ne).push(t),r(this,Ne).sort(((e,t)=>e.start-t.start)),r(this,Ne).indexOf(t)},_e=new WeakSet,qe=function(e=!1){for(let t=0;t<r(this,Ne).length;t++){let i=r(this,Ne)[t];if(i.shouldFlush||e){for(let e of i.written)r(this,De).options.onData?.(i.data.subarray(e.start,e.end),i.start+e.start);r(this,Ne).splice(t--,1)}}};var Je,Ke,Qe,Xe,Ye,Ze,et,tt,it,st,at,rt,nt,ot,ht,lt,dt,ft,ut,mt,pt,ct,wt,gt,bt,yt,kt,Tt,Ct,vt,St,xt,zt,Et,At,Mt,Wt,Ot=class extends Ge{constructor(e){super(new We({onData:(t,i)=>e.stream.write({type:"write",data:t,position:i}),chunked:!0,chunkSize:e.options?.chunkSize}))}},Bt=1e3,Ut=["avc","hevc","vp9","av1"],Dt=["aac","opus"],jt=["strict","offset","cross-track-offset"],Rt=class{constructor(e){if(n(this,nt),n(this,ht),n(this,dt),n(this,ut),n(this,pt),n(this,wt),n(this,bt),n(this,kt),n(this,Ct),n(this,St),n(this,zt),n(this,At),n(this,Je,void 0),n(this,Ke,void 0),n(this,Qe,void 0),n(this,Xe,void 0),n(this,Ye,null),n(this,Ze,null),n(this,et,Math.floor(Date.now()/1e3)+2082844800),n(this,tt,[]),n(this,it,1),n(this,st,[]),n(this,at,[]),n(this,rt,!1),h(this,nt,ot).call(this,e),e.video=j(e.video),e.audio=j(e.audio),e.fastStart=j(e.fastStart),this.target=e.target,o(this,Je,{firstTimestampBehavior:"strict",...e}),e.target instanceof Me)o(this,Ke,new Ue(e.target));else if(e.target instanceof We)o(this,Ke,new Ge(e.target));else{if(!(e.target instanceof Oe))throw new Error(`Invalid target: ${e.target}`);o(this,Ke,new Ot(e.target))}h(this,ut,mt).call(this),h(this,ht,lt).call(this)}addVideoChunk(e,t,i,s){if(!(e instanceof EncodedVideoChunk))throw new TypeError("addVideoChunk's first argument (sample) must be of type EncodedVideoChunk.");if(t&&"object"!=typeof t)throw new TypeError("addVideoChunk's second argument (meta), when provided, must be an object.");if(void 0!==i&&(!Number.isFinite(i)||i<0))throw new TypeError("addVideoChunk's third argument (timestamp), when provided, must be a non-negative real number.");if(void 0!==s&&!Number.isFinite(s))throw new TypeError("addVideoChunk's fourth argument (compositionTimeOffset), when provided, must be a real number.");let a=new Uint8Array(e.byteLength);e.copyTo(a),this.addVideoChunkRaw(a,e.type,i??e.timestamp,e.duration,t,s)}addVideoChunkRaw(e,t,i,s,a,n){if(!(e instanceof Uint8Array))throw new TypeError("addVideoChunkRaw's first argument (data) must be an instance of Uint8Array.");if("key"!==t&&"delta"!==t)throw new TypeError("addVideoChunkRaw's second argument (type) must be either 'key' or 'delta'.");if(!Number.isFinite(i)||i<0)throw new TypeError("addVideoChunkRaw's third argument (timestamp) must be a non-negative real number.");if(!Number.isFinite(s)||s<0)throw new TypeError("addVideoChunkRaw's fourth argument (duration) must be a non-negative real number.");if(a&&"object"!=typeof a)throw new TypeError("addVideoChunkRaw's fifth argument (meta), when provided, must be an object.");if(void 0!==n&&!Number.isFinite(n))throw new TypeError("addVideoChunkRaw's sixth argument (compositionTimeOffset), when provided, must be a real number.");if(h(this,At,Mt).call(this),!r(this,Je).video)throw new Error("No video track declared.");if("object"==typeof r(this,Je).fastStart&&r(this,Ye).samples.length===r(this,Je).fastStart.expectedVideoChunks)throw new Error(`Cannot add more video chunks than specified in 'fastStart' (${r(this,Je).fastStart.expectedVideoChunks}).`);let o=h(this,wt,gt).call(this,r(this,Ye),e,t,i,s,a,n);if("fragmented"===r(this,Je).fastStart&&r(this,Ze)){for(;r(this,at).length>0&&r(this,at)[0].decodeTimestamp<=o.decodeTimestamp;){let e=r(this,at).shift();h(this,bt,yt).call(this,r(this,Ze),e)}o.decodeTimestamp<=r(this,Ze).lastDecodeTimestamp?h(this,bt,yt).call(this,r(this,Ye),o):r(this,st).push(o)}else h(this,bt,yt).call(this,r(this,Ye),o)}addAudioChunk(e,t,i){if(!(e instanceof EncodedAudioChunk))throw new TypeError("addAudioChunk's first argument (sample) must be of type EncodedAudioChunk.");if(t&&"object"!=typeof t)throw new TypeError("addAudioChunk's second argument (meta), when provided, must be an object.");if(void 0!==i&&(!Number.isFinite(i)||i<0))throw new TypeError("addAudioChunk's third argument (timestamp), when provided, must be a non-negative real number.");let s=new Uint8Array(e.byteLength);e.copyTo(s),this.addAudioChunkRaw(s,e.type,i??e.timestamp,e.duration,t)}addAudioChunkRaw(e,t,i,s,a){if(!(e instanceof Uint8Array))throw new TypeError("addAudioChunkRaw's first argument (data) must be an instance of Uint8Array.");if("key"!==t&&"delta"!==t)throw new TypeError("addAudioChunkRaw's second argument (type) must be either 'key' or 'delta'.");if(!Number.isFinite(i)||i<0)throw new TypeError("addAudioChunkRaw's third argument (timestamp) must be a non-negative real number.");if(!Number.isFinite(s)||s<0)throw new TypeError("addAudioChunkRaw's fourth argument (duration) must be a non-negative real number.");if(a&&"object"!=typeof a)throw new TypeError("addAudioChunkRaw's fifth argument (meta), when provided, must be an object.");if(h(this,At,Mt).call(this),!r(this,Je).audio)throw new Error("No audio track declared.");if("object"==typeof r(this,Je).fastStart&&r(this,Ze).samples.length===r(this,Je).fastStart.expectedAudioChunks)throw new Error(`Cannot add more audio chunks than specified in 'fastStart' (${r(this,Je).fastStart.expectedAudioChunks}).`);let n=h(this,wt,gt).call(this,r(this,Ze),e,t,i,s,a);if("fragmented"===r(this,Je).fastStart&&r(this,Ye)){for(;r(this,st).length>0&&r(this,st)[0].decodeTimestamp<=n.decodeTimestamp;){let e=r(this,st).shift();h(this,bt,yt).call(this,r(this,Ye),e)}n.decodeTimestamp<=r(this,Ye).lastDecodeTimestamp?h(this,bt,yt).call(this,r(this,Ze),n):r(this,at).push(n)}else h(this,bt,yt).call(this,r(this,Ze),n)}finalize(){if(r(this,rt))throw new Error("Cannot finalize a muxer more than once.");if("fragmented"===r(this,Je).fastStart){for(let e of r(this,st))h(this,bt,yt).call(this,r(this,Ye),e);for(let e of r(this,at))h(this,bt,yt).call(this,r(this,Ze),e);h(this,St,xt).call(this,!1)}else r(this,Ye)&&h(this,Ct,vt).call(this,r(this,Ye)),r(this,Ze)&&h(this,Ct,vt).call(this,r(this,Ze));let e=[r(this,Ye),r(this,Ze)].filter(Boolean);if("in-memory"===r(this,Je).fastStart){let t;for(let i=0;i<2;i++){let i=F(e,r(this,et)),s=r(this,Ke).measureBox(i);t=r(this,Ke).measureBox(r(this,Xe));let a=r(this,Ke).pos+s+t;for(let e of r(this,tt)){e.offset=a;for(let{data:i}of e.samples)a+=i.byteLength,t+=i.byteLength}if(a<2**32)break;t>=2**32&&(r(this,Xe).largeSize=!0)}let i=F(e,r(this,et));r(this,Ke).writeBox(i),r(this,Xe).size=t,r(this,Ke).writeBox(r(this,Xe));for(let e of r(this,tt))for(let t of e.samples)r(this,Ke).write(t.data),t.data=null}else if("fragmented"===r(this,Je).fastStart){let t=r(this,Ke).pos,i=(e=>I("mfra",null,[...e.map(Ce),ve()]))(e);r(this,Ke).writeBox(i);let s=r(this,Ke).pos-t;r(this,Ke).seek(r(this,Ke).pos-4),r(this,Ke).writeU32(s)}else{let t=r(this,Ke).offsets.get(r(this,Xe)),i=r(this,Ke).pos-t;r(this,Xe).size=i,r(this,Xe).largeSize=i>=2**32,r(this,Ke).patchBox(r(this,Xe));let s=F(e,r(this,et));if("object"==typeof r(this,Je).fastStart){r(this,Ke).seek(r(this,Qe)),r(this,Ke).writeBox(s);let e=t-r(this,Ke).pos;r(this,Ke).writeBox({type:"free",size:e})}else r(this,Ke).writeBox(s)}h(this,zt,Et).call(this),r(this,Ke).finalize(),o(this,rt,!0)}};return Je=new WeakMap,Ke=new WeakMap,Qe=new WeakMap,Xe=new WeakMap,Ye=new WeakMap,Ze=new WeakMap,et=new WeakMap,tt=new WeakMap,it=new WeakMap,st=new WeakMap,at=new WeakMap,rt=new WeakMap,nt=new WeakSet,ot=function(e){if("object"!=typeof e)throw new TypeError("The muxer requires an options object to be passed to its constructor.");if(!(e.target instanceof Ae))throw new TypeError("The target must be provided and an instance of Target.");if(e.video){if(!Ut.includes(e.video.codec))throw new TypeError(`Unsupported video codec: ${e.video.codec}`);if(!Number.isInteger(e.video.width)||e.video.width<=0)throw new TypeError(`Invalid video width: ${e.video.width}. Must be a positive integer.`);if(!Number.isInteger(e.video.height)||e.video.height<=0)throw new TypeError(`Invalid video height: ${e.video.height}. Must be a positive integer.`);const t=e.video.rotation;if("number"==typeof t&&![0,90,180,270].includes(t))throw new TypeError(`Invalid video rotation: ${t}. Has to be 0, 90, 180 or 270.`);if(Array.isArray(t)&&(9!==t.length||t.some((e=>"number"!=typeof e))))throw new TypeError(`Invalid video transformation matrix: ${t.join()}`);if(void 0!==e.video.frameRate&&(!Number.isInteger(e.video.frameRate)||e.video.frameRate<=0))throw new TypeError(`Invalid video frame rate: ${e.video.frameRate}. Must be a positive integer.`)}if(e.audio){if(!Dt.includes(e.audio.codec))throw new TypeError(`Unsupported audio codec: ${e.audio.codec}`);if(!Number.isInteger(e.audio.numberOfChannels)||e.audio.numberOfChannels<=0)throw new TypeError(`Invalid number of audio channels: ${e.audio.numberOfChannels}. Must be a positive integer.`);if(!Number.isInteger(e.audio.sampleRate)||e.audio.sampleRate<=0)throw new TypeError(`Invalid audio sample rate: ${e.audio.sampleRate}. Must be a positive integer.`)}if(e.firstTimestampBehavior&&!jt.includes(e.firstTimestampBehavior))throw new TypeError(`Invalid first timestamp behavior: ${e.firstTimestampBehavior}`);if("object"==typeof e.fastStart){if(e.video){if(void 0===e.fastStart.expectedVideoChunks)throw new TypeError("'fastStart' is an object but is missing property 'expectedVideoChunks'.");if(!Number.isInteger(e.fastStart.expectedVideoChunks)||e.fastStart.expectedVideoChunks<0)throw new TypeError("'expectedVideoChunks' must be a non-negative integer.")}if(e.audio){if(void 0===e.fastStart.expectedAudioChunks)throw new TypeError("'fastStart' is an object but is missing property 'expectedAudioChunks'.");if(!Number.isInteger(e.fastStart.expectedAudioChunks)||e.fastStart.expectedAudioChunks<0)throw new TypeError("'expectedAudioChunks' must be a non-negative integer.")}}else if(![!1,"in-memory","fragmented"].includes(e.fastStart))throw new TypeError("'fastStart' option must be false, 'in-memory', 'fragmented' or an object.");if(void 0!==e.minFragmentDuration&&(!Number.isFinite(e.minFragmentDuration)||e.minFragmentDuration<0))throw new TypeError("'minFragmentDuration' must be a non-negative number.")},ht=new WeakSet,lt=function(){var e;if(r(this,Ke).writeBox((e={holdsAvc:"avc"===r(this,Je).video?.codec,fragmented:"fragmented"===r(this,Je).fastStart}).fragmented?I("ftyp",[A("iso5"),v(512),A("iso5"),A("iso6"),A("mp41")]):I("ftyp",[A("isom"),v(512),A("isom"),e.holdsAvc?A("avc1"):[],A("mp41")])),o(this,Qe,r(this,Ke).pos),"in-memory"===r(this,Je).fastStart)o(this,Xe,V(!1));else if("fragmented"===r(this,Je).fastStart);else{if("object"==typeof r(this,Je).fastStart){let e=h(this,dt,ft).call(this);r(this,Ke).seek(r(this,Ke).pos+e)}o(this,Xe,V(!0)),r(this,Ke).writeBox(r(this,Xe))}h(this,zt,Et).call(this)},dt=new WeakSet,ft=function(){if("object"!=typeof r(this,Je).fastStart)return;let e=0,t=[r(this,Je).fastStart.expectedVideoChunks,r(this,Je).fastStart.expectedAudioChunks];for(let i of t)i&&(e+=8*Math.ceil(2/3*i),e+=4*i,e+=12*Math.ceil(2/3*i),e+=4*i,e+=8*i);return e+=4096,e},ut=new WeakSet,mt=function(){if(r(this,Je).video&&o(this,Ye,{id:1,info:{type:"video",codec:r(this,Je).video.codec,width:r(this,Je).video.width,height:r(this,Je).video.height,rotation:r(this,Je).video.rotation??0,decoderConfig:null},timescale:r(this,Je).video.frameRate??57600,samples:[],finalizedChunks:[],currentChunk:null,firstDecodeTimestamp:void 0,lastDecodeTimestamp:-1,timeToSampleTable:[],compositionTimeOffsetTable:[],lastTimescaleUnits:null,lastSample:null,compactlyCodedChunkTable:[]}),r(this,Je).audio&&(o(this,Ze,{id:r(this,Je).video?2:1,info:{type:"audio",codec:r(this,Je).audio.codec,numberOfChannels:r(this,Je).audio.numberOfChannels,sampleRate:r(this,Je).audio.sampleRate,decoderConfig:null},timescale:r(this,Je).audio.sampleRate,samples:[],finalizedChunks:[],currentChunk:null,firstDecodeTimestamp:void 0,lastDecodeTimestamp:-1,timeToSampleTable:[],compositionTimeOffsetTable:[],lastTimescaleUnits:null,lastSample:null,compactlyCodedChunkTable:[]}),"aac"===r(this,Je).audio.codec)){let e=h(this,pt,ct).call(this,2,r(this,Je).audio.sampleRate,r(this,Je).audio.numberOfChannels);r(this,Ze).info.decoderConfig={codec:r(this,Je).audio.codec,description:e,numberOfChannels:r(this,Je).audio.numberOfChannels,sampleRate:r(this,Je).audio.sampleRate}}},pt=new WeakSet,ct=function(e,t,i){let s=[96e3,88200,64e3,48e3,44100,32e3,24e3,22050,16e3,12e3,11025,8e3,7350].indexOf(t),a=i,r="";r+=e.toString(2).padStart(5,"0"),r+=s.toString(2).padStart(4,"0"),15===s&&(r+=t.toString(2).padStart(24,"0")),r+=a.toString(2).padStart(4,"0");let n=8*Math.ceil(r.length/8);r=r.padEnd(n,"0");let o=new Uint8Array(r.length/8);for(let e=0;e<r.length;e+=8)o[e/8]=parseInt(r.slice(e,e+8),2);return o},wt=new WeakSet,gt=function(e,t,i,s,a,r,n){let o=s/1e6,l=(s-(n??0))/1e6,d=a/1e6,f=h(this,kt,Tt).call(this,o,l,e);return o=f.presentationTimestamp,l=f.decodeTimestamp,r?.decoderConfig&&(null===e.info.decoderConfig?e.info.decoderConfig=r.decoderConfig:Object.assign(e.info.decoderConfig,r.decoderConfig)),{presentationTimestamp:o,decodeTimestamp:l,duration:d,data:t,size:t.byteLength,type:i,timescaleUnitsToNextSample:O(d,e.timescale)}},bt=new WeakSet,yt=function(e,t){"fragmented"!==r(this,Je).fastStart&&e.samples.push(t);const i=O(t.presentationTimestamp-t.decodeTimestamp,e.timescale);if(null!==e.lastTimescaleUnits){let s=O(t.decodeTimestamp,e.timescale,!1),a=Math.round(s-e.lastTimescaleUnits);if(e.lastTimescaleUnits+=a,e.lastSample.timescaleUnitsToNextSample=a,"fragmented"!==r(this,Je).fastStart){let t=M(e.timeToSampleTable);1===t.sampleCount?(t.sampleDelta=a,t.sampleCount++):t.sampleDelta===a?t.sampleCount++:(t.sampleCount--,e.timeToSampleTable.push({sampleCount:2,sampleDelta:a}));const s=M(e.compositionTimeOffsetTable);s.sampleCompositionTimeOffset===i?s.sampleCount++:e.compositionTimeOffsetTable.push({sampleCount:1,sampleCompositionTimeOffset:i})}}else e.lastTimescaleUnits=0,"fragmented"!==r(this,Je).fastStart&&(e.timeToSampleTable.push({sampleCount:1,sampleDelta:O(t.duration,e.timescale)}),e.compositionTimeOffsetTable.push({sampleCount:1,sampleCompositionTimeOffset:i}));e.lastSample=t;let s=!1;if(e.currentChunk){let i=t.presentationTimestamp-e.currentChunk.startTimestamp;if("fragmented"===r(this,Je).fastStart){let a=r(this,Ye)??r(this,Ze);const n=r(this,Je).minFragmentDuration??1;e===a&&"key"===t.type&&i>=n&&(s=!0,h(this,St,xt).call(this))}else s=i>=.5}else s=!0;s&&(e.currentChunk&&h(this,Ct,vt).call(this,e),e.currentChunk={startTimestamp:t.presentationTimestamp,samples:[]}),e.currentChunk.samples.push(t)},kt=new WeakSet,Tt=function(e,t,i){const s="strict"===r(this,Je).firstTimestampBehavior,a=-1===i.lastDecodeTimestamp;if(s&&a&&0!==t)throw new Error(`The first chunk for your media track must have a timestamp of 0 (received DTS=${t}).Non-zero first timestamps are often caused by directly piping frames or audio data from a MediaStreamTrack into the encoder. Their timestamps are typically relative to the age of thedocument, which is probably what you want.\n\nIf you want to offset all timestamps of a track such that the first one is zero, set firstTimestampBehavior: 'offset' in the options.\n`);if("offset"===r(this,Je).firstTimestampBehavior||"cross-track-offset"===r(this,Je).firstTimestampBehavior){let s;void 0===i.firstDecodeTimestamp&&(i.firstDecodeTimestamp=t),s="offset"===r(this,Je).firstTimestampBehavior?i.firstDecodeTimestamp:Math.min(r(this,Ye)?.firstDecodeTimestamp??1/0,r(this,Ze)?.firstDecodeTimestamp??1/0),t-=s,e-=s}if(t<i.lastDecodeTimestamp)throw new Error(`Timestamps must be monotonically increasing (DTS went from ${1e6*i.lastDecodeTimestamp} to ${1e6*t}).`);return i.lastDecodeTimestamp=t,{presentationTimestamp:e,decodeTimestamp:t}},Ct=new WeakSet,vt=function(e){if("fragmented"===r(this,Je).fastStart)throw new Error("Can't finalize individual chunks if 'fastStart' is set to 'fragmented'.");if(e.currentChunk)if(e.finalizedChunks.push(e.currentChunk),r(this,tt).push(e.currentChunk),0!==e.compactlyCodedChunkTable.length&&M(e.compactlyCodedChunkTable).samplesPerChunk===e.currentChunk.samples.length||e.compactlyCodedChunkTable.push({firstChunk:e.finalizedChunks.length,samplesPerChunk:e.currentChunk.samples.length}),"in-memory"!==r(this,Je).fastStart){e.currentChunk.offset=r(this,Ke).pos;for(let t of e.currentChunk.samples)r(this,Ke).write(t.data),t.data=null;h(this,zt,Et).call(this)}else e.currentChunk.offset=0},St=new WeakSet,xt=function(e=!0){if("fragmented"!==r(this,Je).fastStart)throw new Error("Can't finalize a fragment unless 'fastStart' is set to 'fragmented'.");let t=[r(this,Ye),r(this,Ze)].filter((e=>e&&e.currentChunk));if(0===t.length)return;let i=(s=this,a=it,{set _(e){o(s,a,e,n)},get _(){return r(s,a,l)}})._++;var s,a,n,l;if(1===i){let e=F(t,r(this,et),!0);r(this,Ke).writeBox(e)}let d=r(this,Ke).pos,f=ce(i,t);r(this,Ke).writeBox(f);{let e=V(!1),i=0;for(let e of t)for(let t of e.currentChunk.samples)i+=t.size;let s=r(this,Ke).measureBox(e)+i;s>=2**32&&(e.largeSize=!0,s=r(this,Ke).measureBox(e)+i),e.size=s,r(this,Ke).writeBox(e)}for(let e of t){e.currentChunk.offset=r(this,Ke).pos,e.currentChunk.moofOffset=d;for(let t of e.currentChunk.samples)r(this,Ke).write(t.data),t.data=null}let u=r(this,Ke).pos;r(this,Ke).seek(r(this,Ke).offsets.get(f));let m=ce(i,t);r(this,Ke).writeBox(m),r(this,Ke).seek(u);for(let e of t)e.finalizedChunks.push(e.currentChunk),r(this,tt).push(e.currentChunk),e.currentChunk=null;e&&h(this,zt,Et).call(this)},zt=new WeakSet,Et=function(){r(this,Ke)instanceof Ge&&r(this,Ke).flush()},At=new WeakSet,Mt=function(){if(r(this,rt))throw new Error("Cannot add new video or audio chunks after the file has been finalized.")},Wt=l,((a,r,n,o)=>{if(r&&"object"==typeof r||"function"==typeof r)for(let h of i(r))s.call(a,h)||h===n||e(a,h,{get:()=>r[h],enumerable:!(o=t(r,h))||o.enumerable});return a})(e({},"__esModule",{value:!0}),Wt)})();"object"==typeof module&&"object"==typeof module.exports&&Object.assign(module.exports,Mp4Muxer);

/* ============================================================
   RENDER MODE — headless deterministic video render.
   URL: ?render=1&seed=SEED&fps=30&seconds=300&qid=ID&w=1280&h=720
   The studio's rAF loop must honor window.__renderMode (see surgical
   edit in the studio's frame loop): fixed dt = 1/fps, time = frame/fps.
   Encoding: WebCodecs VideoEncoder (H.264) + inlined mp4-muxer.
   Same seed + same settings = identical video, every time.
   ============================================================ */
(function () {
  'use strict';
  var qs = new URLSearchParams(location.search);
  if (qs.get('render') !== '1') return;

  var fps = Math.min(120, Math.max(1, parseInt(qs.get('fps'), 10) || 30));
  var seconds = Math.min(3600, Math.max(5, parseInt(qs.get('seconds'), 10) || 300));
  var _wu = parseInt(qs.get('warmup'), 10);
  var warmupFrames = (isNaN(_wu) || _wu < 0) ? 90 : Math.min(_wu, 600);
  var totalFrames = fps * seconds;
  var seed = qs.get('seed') || '';
  var qid = qs.get('qid') || '';
  var W = parseInt(qs.get('w'), 10) || 1280;
  var H = parseInt(qs.get('h'), 10) || 720;
  var studioLabel = ((document.title || 'Studio').split('\u2014')[0] || 'Studio').trim();

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmtDur(s) { s = +s; return s >= 60 ? (s / 60) + ' min' : s + ' sec'; }
  function fmtTime(s) { s = Math.max(0, Math.round(s)); var m = Math.floor(s / 60); return m + ':' + ('0' + (s % 60)).slice(-2); }

  /* ---- shared state read by the studio's frame loop ---- */
  var RM = window.__renderMode = {
    fps: fps, W: W, H: H,
    frame: 0, warmup: warmupFrames, totalFrames: totalFrames,
    phase: 'warmup', paused: false, _bp: false,
    onPhase: null, onFrame: null
  };

  /* ---- take over the page ----
     Generic: works no matter what the studio names its canvas or how deep
     it sits in the DOM. The canvas's ancestor chain is kept visible so the
     small live preview survives; everything else is hidden for speed. */
  var css = document.createElement('style');
  css.textContent =
    'body.rendering>*:not(#rmOverlay):not(script):not(style):not([data-rm-keep]){display:none!important;}' +
    'body.rendering #rmOverlay{display:flex!important;}';
  document.head.appendChild(css);
  document.body.classList.add('rendering');
  try {
    var _rc = window.__renderCanvas || document.querySelector('canvas');
    if (_rc) {
      var _n = _rc;
      while (_n && _n !== document.body) { _n.setAttribute('data-rm-keep', '1'); _n = _n.parentElement; }
      _rc.style.setProperty('display', 'block', 'important');
      _rc.style.setProperty('position', 'fixed', 'important');
      _rc.style.setProperty('right', '12px', 'important');
      _rc.style.setProperty('top', '12px', 'important');
      _rc.style.setProperty('width', '168px', 'important');
      _rc.style.setProperty('height', '94px', 'important');
      _rc.style.setProperty('z-index', '60', 'important');
      _rc.style.setProperty('border-radius', '10px', 'important');
      _rc.style.setProperty('border', '1px solid rgba(255,255,255,.25)', 'important');
    }
  } catch (e) {}

  var overlay = document.createElement('div');
  overlay.id = 'rmOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:50;display:flex;flex-direction:column;' +
    'align-items:center;justify-content:center;background:#0b0e14;color:#e8ecf4;' +
    'font-family:-apple-system,system-ui,sans-serif;padding:24px;text-align:center;';
  overlay.innerHTML =
    '<div style="font-size:15px;color:#8b95ab;margin-bottom:6px">\uD83C\uDFAC Rendering</div>' +
    '<div style="font-size:22px;font-weight:800;margin-bottom:4px">' + esc(studioLabel) + '</div>' +
    '<div style="font-size:13px;color:#8b95ab;margin-bottom:18px;font-family:ui-monospace,monospace">seed ' + esc(seed) + ' \u00B7 ' + W + '\u00D7' + H + ' \u00B7 ' + fps + 'fps \u00B7 ' + fmtDur(seconds) + '</div>' +
    '<div style="width:min(320px,80vw);height:10px;background:#1a2236;border-radius:99px;overflow:hidden;margin-bottom:10px">' +
    '<div id="rmBar" style="height:100%;width:0%;background:#2f7bff;border-radius:99px;transition:width .3s"></div></div>' +
    '<div id="rmStatus" style="font-size:14px;color:#c6cfe4;margin-bottom:4px">Preparing\u2026</div>' +
    '<div id="rmEta" style="font-size:12px;color:#8b95ab;margin-bottom:22px"></div>' +
    '<div style="display:flex;gap:10px">' +
    '<button id="rmPause" style="font-size:16px;font-weight:700;border:0;border-radius:12px;padding:14px 22px;background:#1a2236;color:#fff">\u23F8 Pause</button>' +
    '<button id="rmCancel" style="font-size:16px;font-weight:700;border:0;border-radius:12px;padding:14px 22px;background:#3a1d1d;color:#ff9c9c">\u2715 Cancel</button>' +
    '</div>' +
    '<div style="font-size:12px;color:#5b6b8c;margin-top:18px;max-width:300px;line-height:1.6">Keep this tab open while rendering.<br>You can pause anytime \u2014 but closing this tab loses the render.</div>';
  document.body.appendChild(overlay);

  function setStatus(s) { var el = document.getElementById('rmStatus'); if (el) el.textContent = s; }
  function fail(msg) {
    RM.phase = 'cancelled'; RM.onFrame = null;
    try { if (encoder) encoder.close(); } catch (e) {}
    setStatus('\u26A0\uFE0F ' + msg);
    var b = document.getElementById('rmEta');
    if (b) b.textContent = 'Nothing was rendered.';
  }

  /* ---- encoder ---- */
  var encoder = null, muxer = null, encodedFrames = 0, t0 = 0;
  /* Counters that prove the iOS path actually produced media. A finished
     render with zero muxed chunks is a 581-byte empty shell, not a video. */
  var framesAttempted = 0, encodeErrors = 0, muxedChunks = 0;

  /* If the device encoder rejects frames, say so fast and plainly instead of
     spending the whole render on output that can only come out empty. */
  function noteEncodeError() {
    encodeErrors++;
    if (encodeErrors >= 20 && muxedChunks === 0 && RM.phase === 'record') {
      fail('This device\u2019s video encoder rejected ' + encodeErrors +
        ' frames and recorded nothing, so the video can\u2019t be made here. ' +
        'Try a lower resolution, or close and reopen Safari and try again.');
    }
  }
  var rcanvas = window.__renderCanvas || document.querySelector('canvas');

  /* ---- iOS-safe frame source ----
     Never hand the encoder a VideoFrame taken straight from the studio's
     WebGL canvas: on iOS Safari the hardware H.264 encoder silently drops
     those frames (no error, zero output chunks — the classic 581-byte empty
     MP4). Copying through a plain 2D canvas first works everywhere. */
  var frame2d = null, fctx = null;
  function ensureFrame2d() {
    if (frame2d && frame2d.width === W && frame2d.height === H && fctx) return true;
    try {
      frame2d = document.createElement('canvas');
      frame2d.width = W; frame2d.height = H;
      fctx = frame2d.getContext('2d');
      return !!fctx;
    } catch (e) { frame2d = null; fctx = null; return false; }
  }

  /* Shared "empty video" message: 60+ frames drained through the encoder,
     zero chunks came out. Used both mid-render (fail fast) and at finish. */
  function failEmpty() {
    fail('The video came out empty \u2014 ' + framesAttempted + ' frames went in, but this device\u2019s encoder recorded 0 of them' +
      (encodeErrors ? ' (' + encodeErrors + ' were rejected).' : '.') +
      ' Please try again; if it keeps happening, use a lower resolution.');
  }
  var _avcDc = null;
  function withAvcDecoderConfig(chunk, meta) {
    meta = meta || {};
    if (meta.decoderConfig) { _avcDc = meta.decoderConfig; return meta; }
    if (_avcDc) return { decoderConfig: _avcDc };
    var dc = null;
    try {
      if (chunk && chunk.type === 'key' && chunk.byteLength > 0) {
        var buf = new Uint8Array(chunk.byteLength);
        chunk.copyTo(buf);
        dc = avcDcFromNalUnits(buf);
      }
    } catch (e) { dc = null; }
    if (dc) { _avcDc = dc; return { decoderConfig: dc }; }
    return meta;
  }
  function avcDcFromNalUnits(buf) {
    var nals = [], i, j, k, m, p, len, sc, scLen, end, t;
    var annexB = buf.length > 4 && buf[0] === 0 && buf[1] === 0 &&
      (buf[2] === 1 || (buf[2] === 0 && buf[3] === 1));
    if (annexB) {
      i = 0;
      while (i + 3 < buf.length) {
        sc = -1; scLen = 0;
        for (j = i; j + 3 < buf.length; j++) {
          if (buf[j] === 0 && buf[j + 1] === 0 && buf[j + 2] === 1) { sc = j; scLen = 3; break; }
          if (buf[j] === 0 && buf[j + 1] === 0 && buf[j + 2] === 0 && buf[j + 3] === 1) { sc = j; scLen = 4; break; }
        }
        if (sc < 0) break;
        end = buf.length;
        for (m = sc + scLen; m + 3 < buf.length; m++) {
          if (buf[m] === 0 && buf[m + 1] === 0 &&
            (buf[m + 2] === 1 || (buf[m + 2] === 0 && buf[m + 3] === 1))) { end = m; break; }
        }
        if (sc + scLen < end) nals.push(buf.subarray(sc + scLen, end));
        i = end;
      }
    } else {
      p = 0;
      while (p + 4 <= buf.length) {
        len = (buf[p] << 24) | (buf[p + 1] << 16) | (buf[p + 2] << 8) | buf[p + 3];
        if (len <= 0 || p + 4 + len > buf.length) break;
        nals.push(buf.subarray(p + 4, p + 4 + len));
        p += 4 + len;
      }
    }
    var sps = null, pps = null;
    for (k = 0; k < nals.length; k++) {
      t = nals[k][0] & 31;
      if (t === 7 && !sps) sps = nals[k];
      else if (t === 8 && !pps) pps = nals[k];
      if (sps && pps) break;
    }
    if (!sps || !pps || sps.length < 4) return null;
    var avcC = new Uint8Array(11 + sps.length + pps.length);
    avcC[0] = 1; avcC[1] = sps[1]; avcC[2] = sps[2]; avcC[3] = sps[3];
    avcC[4] = 0xFF; avcC[5] = 0xE1;
    avcC[6] = (sps.length >> 8) & 255; avcC[7] = sps.length & 255;
    avcC.set(sps, 8);
    var o = 8 + sps.length;
    avcC[o] = 1; avcC[o + 1] = (pps.length >> 8) & 255; avcC[o + 2] = pps.length & 255;
    avcC.set(pps, o + 3);
    function hx(b) { return ('0' + b.toString(16)).slice(-2); }
    return { codec: 'avc1.' + hx(sps[1]) + hx(sps[2]) + hx(sps[3]), description: avcC };
  }

  RM.onPhase = function (phase) {
    if (phase === 'reset') doReset();
    else if (phase === 'done') finishRender();
  };

  function doReset() {
    RM.phase = 'reset';
    try { if (typeof window.__renderReset === 'function') window.__renderReset(); } catch (e) {}
    RM.frame = 0;
    if (!setupEncoder()) return;
    RM.phase = 'record';
    t0 = performance.now();
    setStatus('Rendering\u2026');
  }

  function setupEncoder() {
    if (typeof VideoEncoder === 'undefined') {
      fail('This browser can\u2019t do headless rendering (needs WebCodecs). Try Safari on iOS 17.4+.');
      return false;
    }
    if (typeof Mp4Muxer === 'undefined') { fail('Video muxer failed to load.'); return false; }
    try {
      muxer = new Mp4Muxer.Muxer({
        target: new Mp4Muxer.ArrayBufferTarget(),
        video: { codec: 'avc', width: W, height: H },
        fastStart: 'in-memory',
        firstTimestampBehavior: 'offset'
      });
      encoder = new VideoEncoder({
        output: function (chunk, meta) {
          try { muxer.addVideoChunk(chunk, withAvcDecoderConfig(chunk, meta)); muxedChunks++; } catch (e) {}
          if (RM._bp && encoder.encodeQueueSize < 20) RM._bp = false;
        },
        error: function (e) { fail('Encoder error: ' + (e && e.message)); }
      });
      /* Note: iOS Safari's isConfigSupported can falsely report H.264 as
         unsupported, so we skip the check and just configure. */
      encoder.configure({
        codec: 'avc1.640028', width: W, height: H,
        bitrate: Math.min(40000000, Math.round(12000000 * (W * H) / (1280 * 720))),
        framerate: fps
      });
      ensureFrame2d();
      RM.onFrame = encodeFrame;
      return true;
    } catch (e) {
      fail('Couldn\u2019t start the encoder: ' + e.message);
      return false;
    }
  }

  function encodeFrame(idx) {
    if (!encoder || RM.phase !== 'record' || !rcanvas) return;
    if (encoder.encodeQueueSize > 90) { RM._bp = true; return; }
    var src = rcanvas;
    if (fctx && frame2d) {
      try { fctx.drawImage(rcanvas, 0, 0, W, H); src = frame2d; }
      catch (e) { noteEncodeError(); return; }
    }
    var vf = null;
    try { vf = new VideoFrame(src, { timestamp: Math.round(idx * 1e6 / fps), alpha: 'discard' }); }
    catch (e) { noteEncodeError(); return; }
    framesAttempted++;
    try { encoder.encode(vf, { keyFrame: idx % (fps * 5) === 0 }); }
    catch (e) { noteEncodeError(); }
    try { vf.close(); } catch (e) {}
    encodedFrames = idx + 1;
    /* Fail fast on a silently stalled encoder: 60 frames fully drained,
       nothing recorded. Saves the user sitting through a doomed render. */
    if (framesAttempted >= 60 && muxedChunks === 0 && encoder.encodeQueueSize === 0) {
      failEmpty();
      return;
    }
    if ((idx & 15) === 0) updateProgress();
  }

  function updateProgress() {
    var pct = Math.min(100, (encodedFrames / totalFrames) * 100);
    var bar = document.getElementById('rmBar');
    if (bar) bar.style.width = pct.toFixed(1) + '%';
    var el = (performance.now() - t0) / 1000;
    var rate = encodedFrames / Math.max(el, 0.1);
    var remain = rate > 0.01 ? (totalFrames - encodedFrames) / rate : 0;
    setStatus('Frame ' + encodedFrames.toLocaleString() + ' / ' + totalFrames.toLocaleString() + ' (' + pct.toFixed(0) + '%)');
    var eta = document.getElementById('rmEta');
    if (eta) eta.textContent = '\u2248 ' + fmtTime(remain) + ' left \u00B7 ' + rate.toFixed(1) + ' fps wall \u00B7 ' + muxedChunks + ' chunks \u00B7 q' + encoder.encodeQueueSize;
  }

  async function finishRender() {
    RM.phase = 'done'; RM.onFrame = null;
    updateProgress();
    setStatus('Finishing video\u2026');
    try {
      if (encoder) await encoder.flush();
      if (muxer) muxer.finalize();
    } catch (e) { fail('Couldn\u2019t finish the video: ' + e.message); return; }
    var buf = muxer.target.buffer;
    if (!buf || !buf.byteLength) { fail('The video came out empty.'); return; }
    if (muxedChunks === 0) { failEmpty(); return; }
    try { window.__renderResult = buf; } catch (e) {} /* lets automated tests grab the MP4 */
    var blob = new Blob([buf], { type: 'video/mp4' });
    var cleanSeed = seed.replace(/[^A-Za-z0-9]+/g, '').slice(0, 14) || 'seed';
    var name = studioLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') +
      '-' + cleanSeed + '-' + seconds + 's.mp4';
    showDone(blob, name);
    markQueueDone();
  }

  function showDone(blob, name) {
    var url = URL.createObjectURL(blob);
    var mb = (blob.size / 1048576).toFixed(1);
    overlay.innerHTML =
      '<div style="font-size:44px;margin-bottom:10px">\u2705</div>' +
      '<div style="font-size:20px;font-weight:800;margin-bottom:6px">Your video is ready</div>' +
      '<div style="font-size:13px;color:#8b95ab;margin-bottom:20px;font-family:ui-monospace,monospace">' + esc(name) + ' \u00B7 ' + mb + ' MB</div>' +
      '<button id="rmShare" style="font-size:17px;font-weight:800;border:0;border-radius:14px;padding:16px 30px;background:#2f7bff;color:#fff;margin-bottom:12px">Share video</button>' +
      '<div style="font-size:12px;color:#8b95ab;max-width:300px;line-height:1.6">Share \u2192 Save to Files \u2192 your SSD.<br>Or use the download link below.</div>' +
      '<a id="rmDl" href="' + url + '" download="' + esc(name) + '" style="margin-top:14px;color:#9cc3ff;font-size:14px">Download instead</a>';
    document.getElementById('rmShare').onclick = function () {
      var file = new File([blob], name, { type: 'video/mp4' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: name }).catch(function () {});
      } else {
        document.getElementById('rmDl').click();
      }
    };
  }

  async function markQueueDone() {
    var token = null;
    try { token = localStorage.getItem('rq_token'); } catch (e) {}
    if (!token || !qid) return;
    try {
      var api = 'https://api.github.com/repos/bassseamoor/render-queue/contents/queue.json';
      var h = { Authorization: 'Bearer ' + token };
      var r = await fetch(api, { headers: h });
      if (!r.ok) return;
      var j = await r.json();
      var data = JSON.parse(atob(j.content));
      var it = (data.items || []).find(function (x) { return x.id === qid; });
      if (!it) return;
      it.status = 'done';
      await fetch(api, {
        method: 'PUT', headers: Object.assign({ 'Content-Type': 'application/json' }, h),
        body: JSON.stringify({
          message: 'Mark render done', sha: j.sha,
          content: btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))))
        })
      });
    } catch (e) {}
  }

  document.getElementById('rmPause').onclick = function () {
    if (RM.phase !== 'record' && RM.phase !== 'warmup') return;
    RM.paused = !RM.paused;
    this.textContent = RM.paused ? '\u25B6 Resume' : '\u23F8 Pause';
    setStatus(RM.paused ? 'Paused \u2014 nothing is lost.' : (RM.phase === 'record' ? 'Rendering\u2026' : 'Preparing\u2026'));
  };
  document.getElementById('rmCancel').onclick = function () {
    RM.phase = 'cancelled'; RM.onFrame = null;
    try { if (encoder) encoder.close(); } catch (e) {}
    overlay.innerHTML =
      '<div style="font-size:20px;font-weight:800;margin-bottom:8px">Cancelled</div>' +
      '<div style="font-size:13px;color:#8b95ab;margin-bottom:18px">No video was saved.</div>' +
      '<button id="rmBack" ' +
      'style="font-size:16px;font-weight:700;border:0;border-radius:12px;padding:14px 24px;background:#1a2236;color:#fff">Back to queue</button>';
    /* Was: inline onclick with curly quotes around the URL — a JS syntax
       error, so tapping the button silently did nothing. */
    document.getElementById('rmBack').onclick = function () {
      location.href = 'https://bassseamoor.github.io/render-queue/';
    };
  };

  /* ---- force render-size drawing buffer, keep screen awake ----
     Set the buffer directly (reliable) and also try the studio's own
     resize path if it exposes one (it may reallocate its targets). */
  try {
    if (rcanvas) { rcanvas.width = W; rcanvas.height = H; }
    if (typeof loop !== 'undefined' && loop && loop.resize) { try { loop.resize(); } catch (e) {} }
  } catch (e) {}
  try {
    if (navigator.wakeLock) {
      var keepAwake = function () { navigator.wakeLock.request('screen').catch(function () {}); };
      keepAwake();
      document.addEventListener('visibilitychange', function () { if (!document.hidden) keepAwake(); });
    }
  } catch (e) {}
  setStatus('Preparing\u2026 (warming up)');
})();
