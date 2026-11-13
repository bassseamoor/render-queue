/* Rainforest's native controls, mapped into the shared one-bubble studio rail. */
(()=>{'use strict';
  const init=()=>{
    if(!window.RQBubbleStudio||!document.querySelector('.layout>aside')) return;
    const $=(selector)=>document.querySelector(selector);
    const moved=new Set();
    const control=(id,panel)=>{
      const input=$('#'+id); if(!input||moved.has(input)) return;
      const label=$('label[for="'+id+'"]')||input.closest('label');
      const wrap=document.createElement('div'); wrap.className='rq-bubble-control'; panel.append(wrap);
      if(label){ wrap.append(label); moved.add(label); }
      if(!label||!label.contains(input)) wrap.append(input);
      moved.add(input);
    };
    const node=(selector,panel)=>{const item=$(selector); if(item&&!moved.has(item)){panel.append(item);moved.add(item);} return item;};
    const action=(selector,panel)=>node(selector,panel);
    const map=(items,panel)=>items.forEach(id=>control(id,panel));
    window.RQBubbleStudio.init({
      title:'Rainforest',
      accent:'#d1eca7',
      groups:[
        {id:'sky',label:'Sky',title:'Sky',mount(panel){node('#world .presets',panel);map(['hour','cycle','dayLength'],panel);}},
        {id:'rain',label:'Rain',title:'Rain & mist',mount(panel){map(['weather','weatherPace','mist','wetness','wind'],panel);}},
        {id:'forest',label:'Forest',title:'Forest',mount(panel){map(['density','undergrowth','distance'],panel);}},
        {id:'life',label:'Life',title:'Wildlife',mount(panel){map(['life','events','frogs','insects'],panel);}},
        {id:'lens',label:'Lens',title:'Forest glass',mount(panel){node('#lensDescription',panel);node('#lensPresets',panel);map(['lensAmount','lensPosition','lensWidth'],panel);}},
        {id:'view',label:'View',title:'Camera',mount(panel){map(['fov','height','exposure','drift'],panel);action('#resetView',panel);action('#immerseBtn',panel);action('#full',panel);}},
        {id:'look',label:'Look',title:'Render look',mount(panel){map(['quality','shafts','volume','lightning'],panel);action('#soundBtn',panel);action('#pause',panel);action('#snapshot',panel);}},
        {id:'record',label:'Record',title:'Record',mount(panel){map(['resolution','fps','bitrate','duration','recordAudio','disk'],panel);action('#record',panel);action('#recordShortcut',panel);}}
      ],
      afterMount(){
        const leftover=[...document.querySelectorAll('.layout>aside input,.layout>aside select,.layout>aside button')].filter(element=>!moved.has(element)&&!element.closest('.tabs'));
        if(leftover.length) console.warn('Rainforest controls not mapped to compact rail',leftover.map(element=>element.id||element.textContent.trim()));
      }
    });
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
