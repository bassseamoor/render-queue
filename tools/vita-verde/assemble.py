"""Finish a full 24 fps Cycles beauty sequence with the thought bubble, end card and score."""
import argparse,json,subprocess
from pathlib import Path
from PIL import Image
from composite import overlay
p=argparse.ArgumentParser();p.add_argument('capture');p.add_argument('--output',default='vita-verde-cycles.mp4');a=p.parse_args();root=Path(a.capture);frames=json.loads((root/'scene.json').read_text())['frames']
if len(frames)!=2160 or abs(frames[1]['time']-1/24)>1e-6:raise SystemExit('Capture all 2160 frames with VV_FPS=24 before assembling the complete film.')
files=[root/'cycles'/f'beauty-{i:05d}.png' for i in range(2160)];missing=[str(f) for f in files if not f.exists()]
if missing:raise SystemExit(f'Missing {len(missing)} beauty frames. First: {missing[0]}')
W,H=Image.open(files[0]).size
cmd=['ffmpeg','-y','-f','rawvideo','-pixel_format','rgb24','-video_size',f'{W}x{H}','-framerate','24','-i','-','-i',str(root/'score.wav'),'-c:v','libx264','-crf','17','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-shortest','-movflags','+faststart',a.output]
proc=subprocess.Popen(cmd,stdin=subprocess.PIPE)
for i,f in enumerate(files):proc.stdin.write(overlay(Image.open(f).convert('RGB'),frames[i]['time']).tobytes())
proc.stdin.close();proc.wait();raise SystemExit(proc.returncode)
