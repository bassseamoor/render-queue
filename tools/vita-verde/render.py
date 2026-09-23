"""Native EGL review renderer for the actual scene snapshots. Not a browser/WebGL test."""
import os,sys,json,math,argparse
from pathlib import Path
if os.environ.get('VV_RENDER_DEPS'):sys.path.insert(0,os.environ['VV_RENDER_DEPS'])
import numpy as np
import moderngl as gl
from PIL import Image,ImageDraw,ImageFont
P=argparse.ArgumentParser();P.add_argument('folder');P.add_argument('--width',type=int,default=960);P.add_argument('--height',type=int,default=540);P.add_argument('--frames',default='');P.add_argument('--video',default='');P.add_argument('--begin',type=int,default=0);P.add_argument('--end',type=int);P.add_argument('--silent',action='store_true');args=P.parse_args();root=Path(args.folder);data=json.loads((root/'scene.json').read_text());W,H=args.width,args.height
ctx=gl.create_standalone_context(backend='egl');print(ctx.info['GL_RENDERER'],flush=True)
VS='''#version 330
in vec3 in_pos,in_normal;in vec2 in_uv;uniform mat4 model,view,projection,light_matrix;out vec3 normal,world;out vec2 uv;out vec4 light;
void main(){vec4 p=model*vec4(in_pos,1);world=p.xyz;normal=normalize(transpose(inverse(mat3(model)))*in_normal);uv=in_uv;light=light_matrix*p;gl_Position=projection*view*p;}
'''
FS='''#version 330
in vec3 normal,world;in vec2 uv;in vec4 light;out vec4 frag;uniform vec3 color,emissive,eye,sun,light_color,sky,ground,fog_color;uniform float roughness,metalness,opacity,power,fill,fog_near,fog_far;uniform sampler2D albedo;uniform sampler2DShadow shadow;uniform bool has_map;
void main(){vec3 N=normalize(normal);if(!gl_FrontFacing)N=-N;vec3 V=normalize(eye-world),L=normalize(sun),H=normalize(V+L);vec3 base=color*(has_map?texture(albedo,uv).rgb:vec3(1));float nl=max(dot(N,L),0),nv=max(dot(N,V),.001),nh=max(dot(N,H),0),vh=max(dot(V,H),0);float a=max(.05,roughness*roughness),a2=a*a,den=nh*nh*(a2-1)+1;float D=a2/(3.14159*den*den),k=(roughness+1)*(roughness+1)/8;float G=nl/(nl*(1-k)+k)*nv/(nv*(1-k)+k);vec3 F0=mix(vec3(.04),base,metalness),F=F0+(1-F0)*pow(1-vh,5);vec3 spec=D*G*F/max(4*nl*nv,.001);vec3 lc=light.xyz/light.w*.5+.5;float vis=1.;if(lc.x>0&&lc.x<1&&lc.y>0&&lc.y<1&&lc.z<1){vis=0;for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++)vis+=texture(shadow,vec3(lc.xy+vec2(x,y)/2048.,lc.z-.0008));vis/=9.;}vec3 ambient=mix(ground,sky,clamp(N.y*.5+.5,0,1))*fill*.52;vec3 c=base*ambient*(1-metalness*.55)+(base*(1-metalness)/3.14159+spec)*light_color*power*nl*vis+emissive;float f=smoothstep(fog_near,fog_far,length(eye-world));c=mix(c,fog_color,f);frag=vec4(c,opacity);}
'''
prog=ctx.program(vertex_shader=VS,fragment_shader=FS)
shadowp=ctx.program(vertex_shader='''#version 330
in vec3 in_pos;uniform mat4 model,light_matrix;void main(){gl_Position=light_matrix*model*vec4(in_pos,1);}
''',fragment_shader='''#version 330
void main(){}
''')
postfrag=(root/'post.glsl').read_text().replace('precision highp float;','').replace('varying vec2 vUv;','in vec2 vUv; out vec4 outputColor;').replace('texture2D(','texture(').replace('gl_FragColor','outputColor')
post=ctx.program(vertex_shader='''#version 330
in vec2 pos,tex;out vec2 vUv;void main(){vUv=tex;gl_Position=vec4(pos,0,1);}
''',fragment_shader='#version 330\n'+postfrag)
quad=ctx.vertex_array(post,[(ctx.buffer(np.array([-1,-1,0,0,1,-1,1,0,-1,1,0,1,1,1,1,1],dtype='f4').tobytes()),'2f 2f','pos','tex')])
shadowtex=ctx.depth_texture((2048,2048));shadowtex.compare_func='<=';shadowtex.repeat_x=shadowtex.repeat_y=False;sfbo=ctx.framebuffer(depth_attachment=shadowtex)
ctex=ctx.texture((W,H),4,dtype='f2');ctex.filter=(gl.LINEAR,gl.LINEAR);depth=ctx.depth_texture((W,H));depth.compare_func='';depth.filter=(gl.NEAREST,gl.NEAREST);fbo=ctx.framebuffer([ctex],depth)
outtex=ctx.texture((W,H),4);outfbo=ctx.framebuffer([outtex]);texs={-1:ctx.texture((1,1),4,b'\xff'*4)}
for t in data['textures']:
 tex=ctx.texture((t['width'],t['height']),4,(root/f"t{t['id']}.bin").read_bytes());tex.build_mipmaps();texs[t['id']]=tex
geos={}
for g in data['geometries']:
 buf=ctx.buffer((root/f"g{g['id']}.bin").read_bytes());geos[g['id']]=(ctx.vertex_array(prog,[(buf,'3f 3f 2f','in_pos','in_normal','in_uv')]),ctx.vertex_array(shadowp,[(buf,'3f 20x','in_pos')]))
def matrix(p,name,v):p[name].write(np.asarray(v,dtype='f4').tobytes())
post['tColor']=0;post['tDepth']=1;post['resolution']=(W,H);post['grain']=.004;post['debugPass']=0
prog['albedo']=0;prog['shadow']=1
fontpath='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
font=ImageFont.truetype(fontpath,18)
from composite import overlay

frames=data['frames'];selected=list(range(args.begin,args.end or len(frames))) if not args.frames else [int(x) for x in args.frames.split(',')]
pipe=None
if args.video:
 import subprocess
 fps=len(frames)/90
 command=['ffmpeg','-y','-loglevel','warning','-f','rawvideo','-pixel_format','rgb24','-video_size',f'{W}x{H}','-framerate',str(fps),'-i','-']
 if not args.silent:command+=['-ss',str(args.begin/fps),'-i',str(root/'score.wav')]
 command+=['-c:v','libx264','-crf','20','-pix_fmt','yuv420p']
 if not args.silent:command+=['-c:a','aac','-b:a','160k','-shortest']
 command+=['-movflags','+faststart',args.video]
 pipe=subprocess.Popen(command,stdin=subprocess.PIPE)

for number in selected:
 f=frames[number];li=f['light'];ca=f['camera'];objects=f['objects'];ctx.enable(gl.DEPTH_TEST);ctx.disable(gl.BLEND|gl.CULL_FACE);ctx.depth_func='<='
 sfbo.use();ctx.viewport=(0,0,2048,2048);sfbo.clear(depth=1);matrix(shadowp,'light_matrix',li['matrix'])
 for o in objects:
  if o['shadow'] and not data['materials'][o['m']]['transparent']:matrix(shadowp,'model',o['matrix']);geos[o['g']][1].render()
 fbo.use();ctx.viewport=(0,0,W,H);fbo.clear(*f['background'],1,depth=1);matrix(prog,'view',ca['view']);matrix(prog,'projection',ca['projection']);matrix(prog,'light_matrix',li['matrix']);prog['eye']=ca['position'];prog['sun']=li['direction'];prog['light_color']=li['color'];prog['power']=li['power'];prog['sky']=li['sky'];prog['ground']=li['ground'];prog['fill']=li['fill'];prog['fog_color']=f['fog']['color'];prog['fog_near']=f['fog']['near'];prog['fog_far']=f['fog']['far'];shadowtex.use(1)
 for transparent in [False,True]:
  if transparent:ctx.enable(gl.BLEND);ctx.blend_func=gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA
  for o in objects:
   m=data['materials'][o['m']]
   if m['transparent']!=transparent:continue
   matrix(prog,'model',o['matrix']);prog['color']=m['color'];prog['emissive']=m['emissive'];prog['roughness']=m['roughness'];prog['metalness']=m['metalness'];prog['opacity']=m['opacity'];prog['has_map']=m['map']>=0;texs[m['map']].use(0);geos[o['g']][0].render()
 ctx.disable(gl.DEPTH_TEST|gl.BLEND);outfbo.use();ctex.use(0);depth.use(1);matrix(post,'inverseProjection',ca['inverseProjection']);post['focus']=ca['focus'];post['time']=f['time'];quad.render(gl.TRIANGLE_STRIP)
 im=Image.frombytes('RGBA',(W,H),outfbo.read(components=4)).transpose(Image.Transpose.FLIP_TOP_BOTTOM).convert('RGB');im=overlay(im,f['time'])
 if pipe:pipe.stdin.write(im.tobytes())
 else:im.save(root/f"frame-{number:04d}.jpg",quality=94)
 if number%30==0 or not pipe:print(f"Rendered {number+1}/{len(frames)} · {f['time']:.2f}s",flush=True)
if pipe:pipe.stdin.close();pipe.wait();assert pipe.returncode==0
else:
 thumbw=320;thumbh=180;sheet=Image.new('RGB',(thumbw*4,(thumbh+32)*math.ceil(len(selected)/4)), '#13231b');d=ImageDraw.Draw(sheet)
 for i,num in enumerate(selected):
  im=Image.open(root/f'frame-{num:04d}.jpg');im.thumbnail((thumbw,thumbh));x=i%4*thumbw;y=i//4*(thumbh+32);sheet.paste(im,(x,y));d.text((x+10,y+thumbh+5),f"{frames[num]['shot']:02d}  {frames[num]['world']} / {frames[num]['time']:.1f}s",font=font,fill='#e6dcc4')
 sheet.save(root/'contact-sheet.jpg',quality=93)
