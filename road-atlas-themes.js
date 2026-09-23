/* Road Atlas themes 1.0.0 — extends the baseline's 3 themes to 10.
 * Baseline: 329a68a46c825cc96708c377638f7c5415f14a96 (immutable).
 * The baseline keeps paper(0)/midnight(1)/blueprint(2) at their indices so
 * every existing seed looks identical. This module appends 7 new palettes
 * and patches the in-memory baseline source (never the file) so the theme
 * slider runs 0-9 and the painter resolves all 10.
 * Kind flags: night (dark, glowing arterials) or blue (blueprint-style
 * pale roads). Paper-kind is the default day look.
 */
var RoadAtlasThemes=(function(){
'use strict';
var VERSION='1.0.0';
var EXTRA=[
 { key:'sage',
   bg1:'#eef0dc', bg2:'#dde3c2', water:'#a8c8c8', waterDeep:'#7ba3a3', waterLine:'rgba(255,255,255,.5)',
   park:'#9fbf7d', parkEdge:'#7fa05f', tree:'#6a8f52',
   sidewalk:'#e2d9bd', local:'#d3cfae', collector:'#e8d79a', arterial:'#c07f2e',
   arterialEdge:'#9a6220', dashC:'#fbf6e6', nodeFill:'#b0782a', crosswalk:'rgba(255,255,255,.55)',
   label:'#4d5b3a', district:'#7d8f5f', halo:'rgba(238,240,220,.9)',
   bCols:['#c3bd9a','#b0a87f','#d2cba6','#9d9570'], bTop:'#ece7cd', bShadow:'rgba(90,100,60,.30)',
   ind:'#a8a284', bridge:'#bcb088', bridgeRail:'#6f6a4e', grain:0.06, compass:'#4d5b3a', vig:'rgba(110,120,70,.20)' },
 { key:'ember',
   bg1:'#f3e4d2', bg2:'#e8cdae', water:'#9fc0cf', waterDeep:'#7498ab', waterLine:'rgba(255,255,255,.5)',
   park:'#c2a86b', parkEdge:'#a3894f', tree:'#8f6f3a',
   sidewalk:'#e8d2b4', local:'#dcc9a8', collector:'#f0d090', arterial:'#c25a2e',
   arterialEdge:'#9a441f', dashC:'#fdf2e2', nodeFill:'#b0522a', crosswalk:'rgba(255,255,255,.55)',
   label:'#6b4530', district:'#a0704d', halo:'rgba(243,228,210,.9)',
   bCols:['#d0b48e','#bd9c72','#dcc09a','#a9885f'], bTop:'#f2e2c8', bShadow:'rgba(120,80,45,.30)',
   ind:'#b5a184', bridge:'#c8ab7e', bridgeRail:'#7d5f42', grain:0.06, compass:'#6b4530', vig:'rgba(140,95,50,.20)' },
 { key:'harbor',
   bg1:'#dcebf0', bg2:'#bcd8e2', water:'#5f96b8', waterDeep:'#3d6f8f', waterLine:'rgba(255,255,255,.55)',
   park:'#8fc4a8', parkEdge:'#6da387', tree:'#5a8f72',
   sidewalk:'#cfdde2', local:'#bccfd6', collector:'#e8e2b8', arterial:'#d08a2e',
   arterialEdge:'#a86a1f', dashC:'#f4fafc', nodeFill:'#c07f2a', crosswalk:'rgba(255,255,255,.6)',
   label:'#2f5a6b', district:'#5f8fa3', halo:'rgba(220,235,240,.9)',
   bCols:['#b3c9d2','#9db8c4','#c6d9e0','#8aa4b0'], bTop:'#eef4f6', bShadow:'rgba(50,90,110,.30)',
   ind:'#9fb2ba', bridge:'#b8c8d0', bridgeRail:'#4f6a75', grain:0.05, compass:'#2f5a6b', vig:'rgba(60,110,135,.22)' },
 { key:'dusk', night:true,
   bg1:'#1d1830', bg2:'#0e0b1a', water:'#2c2a5c', waterDeep:'#1a1840', waterLine:'rgba(200,160,255,.35)',
   park:'#2a4a3f', parkEdge:'#3a5f52', tree:'#4a8f6a',
   sidewalk:'#2a2545', local:'#4a4468', collector:'#5f5688', arterial:'#ff9a5c',
   arterialEdge:'#c76a35', dashC:'#ffe0c4', nodeFill:'#e08a45', crosswalk:'rgba(255,255,255,.45)',
   label:'#e8ddf5', district:'#a08fc9', halo:'rgba(29,24,48,.9)',
   bCols:['#342e52','#403860','#2a2442','#4c446e'], bTop:'#554d78', bShadow:'rgba(0,0,0,.5)',
   ind:'#3d3658', bridge:'#524a76', bridgeRail:'#c9a0ff', grain:0.03, compass:'#e8ddf5', vig:'rgba(0,0,0,.35)' },
 { key:'neon', night:true, glow:true,
   bg1:'#0a0f14', bg2:'#04070a', water:'#0f2f42', waterDeep:'#081c2a', waterLine:'rgba(0,255,255,.4)',
   park:'#0f3a2a', parkEdge:'#1a5a40', tree:'#2fbf71',
   sidewalk:'#14202a', local:'#2a3f52', collector:'#3a5a72', arterial:'#00f0ff',
   arterialEdge:'#00a8b8', dashC:'#d0fbff', nodeFill:'#00c8d8', crosswalk:'rgba(255,255,255,.5)',
   label:'#d0f4ff', district:'#7fb8d8', halo:'rgba(10,15,20,.9)',
   bCols:['#1c2a3a','#243646','#141e2a','#2e4256'], bTop:'#33465c', bShadow:'rgba(0,0,0,.55)',
   ind:'#263646', bridge:'#3a5a72', bridgeRail:'#00f0ff', grain:0.03, compass:'#d0f4ff', vig:'rgba(0,0,0,.40)' },
 { key:'ink',
   bg1:'#f7f5f0', bg2:'#e8e4da', water:'#b8c4cc', waterDeep:'#8fa0ac', waterLine:'rgba(255,255,255,.6)',
   park:'#c4ccc0', parkEdge:'#a8b0a4', tree:'#8f968c',
   sidewalk:'#e4e0d6', local:'#d4d0c4', collector:'#e8e4d8', arterial:'#2a2a2a',
   arterialEdge:'#000000', dashC:'#ffffff', nodeFill:'#3a3a3a', crosswalk:'rgba(0,0,0,.25)',
   label:'#2a2a2a', district:'#6a6a6a', halo:'rgba(247,245,240,.9)',
   bCols:['#cfccc2','#bdbab0','#dcd9d0','#aaa79d'], bTop:'#f2f0ea', bShadow:'rgba(60,60,60,.30)',
   ind:'#b0ada2', bridge:'#c4c1b6', bridgeRail:'#4a4a4a', grain:0.07, compass:'#2a2a2a', vig:'rgba(90,90,90,.20)' },
 { key:'canyon',
   bg1:'#f0ddc0', bg2:'#e3c49c', water:'#8fb8c9', waterDeep:'#6a94a8', waterLine:'rgba(255,255,255,.5)',
   park:'#a8b078', parkEdge:'#8a945f', tree:'#7d8f52',
   sidewalk:'#e3cba2', local:'#d8c096', collector:'#eecf92', arterial:'#b8542e',
   arterialEdge:'#93401f', dashC:'#fbf0da', nodeFill:'#a84c28', crosswalk:'rgba(255,255,255,.55)',
   label:'#6e4a2e', district:'#a07a4d', halo:'rgba(240,221,192,.9)',
   bCols:['#d4b184','#c09c6c','#e0bd8e','#ab8a5c'], bTop:'#f4e4c2', bShadow:'rgba(130,90,50,.32)',
   ind:'#bda37e', bridge:'#cba878', bridgeRail:'#7d5a38', grain:0.06, compass:'#6e4a2e', vig:'rgba(150,100,55,.22)' }
];
/* Patch the in-memory baseline source before it runs: widen the theme
 * slider to 0-9 with a label naming every theme, and let the painter
 * resolve the full THEMES array instead of clamping to the first 3.
 * IMPORTANT: the clamp replacement is length-preserving (",0,2)" -> ",0,9)")
 * because conditions.js fingerprints renderWorld's source with absolute
 * adapt() offsets. If EXTRA ever grows past 7 themes this throws loudly
 * instead of silently shifting those offsets. */
function transform(src){
  var maxIdx=2+EXTRA.length;
  if(maxIdx>9)throw new Error('themes: more than 10 themes would shift renderWorld adapt() offsets; update conditions.js explicitly');
  function once(anchor,replacement,fixLen){
    var parts=src.split(anchor);
    if(parts.length!==2)throw new Error('themes hook '+(parts.length<2?'missed':'ambiguous')+': '+anchor.slice(0,60));
    if(fixLen&&anchor.length!==replacement.length)throw new Error('themes hook must be length-preserving: '+anchor.slice(0,60));
    return parts[0]+replacement+parts[1];
  }
  src=once(
    "{key:'theme',          label:'Theme · 0 paper 1 midnight 2 blueprint', min:0, max:2, step:1, lv:3, dflt:0, int:1},",
    "{key:'theme',          label:'Theme · 0 paper 1 midnight 2 blueprint 3 sage 4 ember 5 harbor 6 dusk 7 neon 8 ink 9 canyon', min:0, max:9, step:1, lv:3, dflt:0, int:1},",
    false
  );
  src=once(
    "var T=THEMES[clamp(Math.round(P.theme),0,2)];",
    "var T=THEMES[clamp(Math.round(P.theme),0,"+maxIdx+")];",
    true
  );
  return src;
}
/* Extend the live THEMES array after the baseline defines it. Safe to call
 * once; also tags the two baseline night/blue themes with kind flags. */
function install(){
  if(!window.THEMES||window.THEMES._raThemesInstalled)return;
  if(window.THEMES.length>3)throw new Error('themes: unexpected THEMES length '+window.THEMES.length);
  window.THEMES[1].night=true;
  window.THEMES[2].blue=true;
  EXTRA.forEach(function(t){window.THEMES.push(t);});
  window.THEMES._raThemesInstalled=true;
}
return {version:VERSION, EXTRA:EXTRA, transform:transform, install:install,
        count:function(){return 3+EXTRA.length;}};
})();
window.RoadAtlasThemes=RoadAtlasThemes;
