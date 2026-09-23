"""Blender 4.5+ Cycles adapter for capture.mjs scene snapshots.
blender -b --python tools/vita-verde/render_cycles.py -- /path/to/capture --frame 1152
blender -b --python tools/vita-verde/render_cycles.py -- /path/to/capture --animation
Run capture with VV_FPS=24 for every final frame. Output: linear EXR depth + PNG beauty.
This adapter is separate from the real-time preview; it requires Blender.
"""
# Keep this filename distinct from Blender's own `cycles` add-on module.
import bpy,sys,json,math,argparse
from pathlib import Path
from mathutils import Matrix,Vector
import numpy as np
parser=argparse.ArgumentParser();parser.add_argument('folder');parser.add_argument('--frame',type=int,default=0);parser.add_argument('--animation',action='store_true');parser.add_argument('--samples',type=int,default=128);parser.add_argument('--width',type=int,default=1920);parser.add_argument('--height',type=int,default=1080);parser.add_argument('--save',action='store_true');args=parser.parse_args(sys.argv[sys.argv.index('--')+1:]);root=Path(args.folder);data=json.loads((root/'scene.json').read_text());out=root/'cycles';out.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=args.samples;scene.cycles.use_denoising=True;scene.cycles.max_bounces=8;scene.cycles.diffuse_bounces=4;scene.cycles.glossy_bounces=4;scene.cycles.transparent_max_bounces=8;scene.render.resolution_x=args.width;scene.render.resolution_y=args.height;scene.render.resolution_percentage=100;scene.render.fps=24;scene.render.image_settings.file_format='PNG';scene.view_settings.view_transform='AgX';scene.render.film_transparent=False
# Keep the source Y-up world intact; explicit camera and light matrices define their orientation.
world=bpy.data.worlds.new('Vita Verde atmosphere');scene.world=world;world.use_nodes=True;wn=world.node_tree.nodes;wn['Background'].inputs['Strength'].default_value=.55
materials=[]
for m in data['materials']:
 mat=bpy.data.materials.new('VV_material_'+str(m['id']));mat.use_nodes=True;bsdf=mat.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Base Color'].default_value=(*m['color'],1);bsdf.inputs['Roughness'].default_value=m['roughness'];bsdf.inputs['Metallic'].default_value=m['metalness'];bsdf.inputs['Emission Color'].default_value=(*m['emissive'],1);bsdf.inputs['Emission Strength'].default_value=1;bsdf.inputs['Alpha'].default_value=m['opacity']
 if m['transparent'] and m['roughness']<.5:bsdf.inputs['Transmission Weight'].default_value=.55
 if m['map']>=0:
  tex=next(t for t in data['textures'] if t['id']==m['map']);pixels=np.fromfile(root/f"t{tex['id']}.bin",dtype=np.uint8).astype(np.float32)/255
  image=bpy.data.images.new('VV_surface_'+str(tex['id']),width=tex['width'],height=tex['height'],alpha=True,float_buffer=True);image.colorspace_settings.name='Non-Color';image.pixels.foreach_set(pixels);image.pack();node=mat.node_tree.nodes.new('ShaderNodeTexImage');node.image=image;mat.node_tree.links.new(node.outputs['Color'],bsdf.inputs['Base Color'])
 materials.append(mat)
meshes={}
for g in data['geometries']:
 raw=np.fromfile(root/f"g{g['id']}.bin",dtype=np.float32).reshape((-1,8));mesh=bpy.data.meshes.new('VV_mesh_'+str(g['id']));mesh.from_pydata(raw[:,:3].tolist(),[],np.arange(len(raw)).reshape((-1,3)).tolist());mesh.update();uv=mesh.uv_layers.new(name='UVMap');uv.data.foreach_set('uv',raw[:,6:8].ravel());mesh.normals_split_custom_set_from_vertices(raw[:,3:6].tolist());meshes[g['id']]=mesh
cam_data=bpy.data.cameras.new('Film camera');cam=bpy.data.objects.new('Film camera',cam_data);scene.collection.objects.link(cam);scene.camera=cam;cam_data.clip_start=.008;cam_data.clip_end=140;cam_data.dof.use_dof=True;cam_data.dof.aperture_fstop=5.6
ld=bpy.data.lights.new('Large soft sun','SUN');ld.angle=math.radians(4);sun=bpy.data.objects.new('Large soft sun',ld);scene.collection.objects.link(sun)
# Convert the dinner's soft studio fill into physical area lights. A dark world
# alone does not reproduce the preview's hemisphere lighting around the food.
softboxes=[]
for name,location,size in [('Dining soft key',(-.7,2.4,-.4),1.3),('Dining bounce',(.9,1.7,-.8),1.0)]:
 light=bpy.data.lights.new(name,'AREA');light.shape='DISK';light.size=size;light.color=(1.0,.79,.55);light.energy=0;obj=bpy.data.objects.new(name,light);scene.collection.objects.link(obj);obj.location=location;obj.rotation_euler=(Vector((0,.93,0))-obj.location).to_track_quat('-Z','Y').to_euler();softboxes.append(light)
objects={}
def mat4(values):return Matrix(np.array(values).reshape((4,4),order='F').tolist())
def apply(frame):
 for light,power in zip(softboxes,[65,22]):light.energy=power if frame['world']=='dinner' else 0
 for obj in objects.values():obj.hide_render=True
 for item in frame['objects']:
  key=item['id']
  if key not in objects:
   obj=bpy.data.objects.new(item['name'] or 'produce',meshes[item['g']]);scene.collection.objects.link(obj)
   # Per-object material slots avoid changing other instances of shared geometry.
   if len(obj.data.materials)==0:obj.data.materials.append(materials[item['m']])
   obj.material_slots[0].link='OBJECT';obj.material_slots[0].material=materials[item['m']];objects[key]=obj
  obj=objects[key];obj.hide_render=False;obj.matrix_world=mat4(item['matrix'])
 camera=frame['camera'];cam.matrix_world=mat4(camera['view']).inverted();fovy=2*math.atan(1/camera['projection'][5]);cam_data.sensor_fit='HORIZONTAL';cam_data.sensor_width=36;cam_data.lens=36/(2*math.tan(fovy/2)*(args.width/args.height));cam_data.dof.focus_distance=camera['focus'];direction=Vector(frame['light']['direction']);sun.rotation_euler=(-direction).to_track_quat('-Z','Y').to_euler();ld.color=frame['light']['color'];ld.energy=frame['light']['power']*.7;wn['Background'].inputs['Color'].default_value=(*frame['background'],1)
 scene.frame_set(round(frame['time']*24)+1)
# Depth remains in linear scene units in its own OpenEXR output; never burn it into beauty.
scene.view_layers[0].use_pass_z=True;scene.use_nodes=True;nodes=scene.node_tree.nodes;nodes.clear();layers=nodes.new('CompositorNodeRLayers');composite=nodes.new('CompositorNodeComposite');scene.node_tree.links.new(layers.outputs['Image'],composite.inputs['Image']);depth=nodes.new('CompositorNodeOutputFile');depth.base_path=str(out/'depth');depth.format.file_format='OPEN_EXR';depth.format.color_depth='32';scene.node_tree.links.new(layers.outputs['Depth'],depth.inputs[0])
chosen=range(len(data['frames'])) if args.animation else [args.frame]
for index in chosen:
 apply(data['frames'][index]);scene.render.filepath=str(out/f'beauty-{index:05d}.png');bpy.ops.render.render(write_still=True)
 if args.save:bpy.ops.wm.save_as_mainfile(filepath=str(out/f'vita-verde-{index:05d}.blend'))
print('Cycles render complete. Apply the same timeline overlays and score during final assembly.')
