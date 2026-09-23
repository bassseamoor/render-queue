// Checks the actual bundled muxer using real H.264 packets. This validates the
// duration fallback/container path, not browser VideoEncoder or WebGL capture.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'grand-tour-muxer-'));
try{
 const source=path.join(tmp,'source.mp4'),result=path.join(tmp,'result.mp4');
 execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','testsrc=size=320x180:rate=30','-frames:v','15','-c:v','libx264','-pix_fmt','yuv420p','-profile:v','baseline','-bf','0','-y',source]);
 const packets=JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','v:0','-show_entries','packet=pts_time,duration_time,flags,pos,size','-of','json',source])).packets;
 const input=fs.readFileSync(source),avcc=input.indexOf(Buffer.from('avcC'));assert.ok(avcc>4,'AVC configuration missing');
 const description=new Uint8Array(input.subarray(avcc+4,avcc-4+input.readUInt32BE(avcc-4)));
 const Mp4Muxer=vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../roadtrip-muxer.js'),'utf8')+';Mp4Muxer;',{Uint8Array,ArrayBuffer,DataView,TextEncoder});
 const muxer=new Mp4Muxer.Muxer({target:new Mp4Muxer.ArrayBufferTarget(),video:{codec:'avc',width:320,height:180},fastStart:'in-memory',firstTimestampBehavior:'offset'});
 packets.forEach((p,i)=>muxer.addVideoChunkRaw(new Uint8Array(input.subarray(+p.pos,+p.pos+ +p.size)),p.flags.includes('K')?'key':'delta',Math.round(+p.pts_time*1e6),Math.round(1e6/30),i===0?{decoderConfig:{codec:'avc1.42e01f',codedWidth:320,codedHeight:180,description}}:undefined));
 muxer.finalize();fs.writeFileSync(result,Buffer.from(muxer.target.buffer));
 const stream=JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames','-show_entries','stream=codec_name,width,height,duration,nb_read_frames','-of','json',result])).streams[0];
 assert.equal(stream.codec_name,'h264');assert.equal(+stream.nb_read_frames,15);assert.equal(stream.width,320);assert.equal(stream.height,180);assert.ok(Math.abs(+stream.duration-.5)<1/30);
 console.log(JSON.stringify({check:'bundled muxer with explicit frame-duration fallback',...stream,bytes:fs.statSync(result).size},null,2));
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
