/* Reusable scene-first studio shell. Each renderer supplies its compact control map. */
(()=>{'use strict';
  const QUEUE_URL='https://bassseamoor.github.io/render-queue/';
  const start=(config)=>{
    const mount=()=>{
      if(document.getElementById('rq-bubble-studio')) return;
      const groups=(config.groups||[]).filter(group=>typeof group.mount==='function');
      if(!groups.length) return;
      document.body.classList.add('rq-bubble-active');
      if(config.accent) document.documentElement.style.setProperty('--rq-bubble-accent',config.accent);
      const shell=document.createElement('div'); shell.id='rq-bubble-studio';
      const back=document.createElement('a'); back.className='rq-bubble-back'; back.href=config.backHref||QUEUE_URL; back.textContent='Back'; back.setAttribute('aria-label','Back to studio browser');
      const popover=document.createElement('section'); popover.className='rq-bubble-popover'; popover.hidden=true; popover.setAttribute('aria-label',(config.title||'Studio')+' adjustments');
      const head=document.createElement('div'); head.className='rq-bubble-popover-head'; const title=document.createElement('strong'); const close=document.createElement('button'); close.type='button'; close.className='rq-bubble-close'; close.textContent='×'; close.setAttribute('aria-label','Close adjustments'); head.append(title,close);
      const content=document.createElement('div'); content.className='rq-bubble-content'; popover.append(head,content);
      const rail=document.createElement('nav'); rail.className='rq-bubble-rail'; rail.style.setProperty('--rq-bubble-count',groups.length); rail.setAttribute('aria-label',(config.title||'Studio')+' controls');
      const panels=new Map(), buttons=new Map();
      const api={
        panel(group){ return panels.get(group.id); },
        make(tag,className,text){ const element=document.createElement(tag); if(className) element.className=className; if(text!=null) element.textContent=text; return element; },
        close(){ popover.hidden=true; buttons.forEach(button=>button.setAttribute('aria-pressed','false')); },
        open(id){
          const panel=panels.get(id); if(!panel) return;
          const wasOpen=!popover.hidden&&buttons.get(id)?.getAttribute('aria-pressed')==='true';
          if(wasOpen){ api.close(); return; }
          panels.forEach((item,key)=>item.hidden=key!==id); buttons.forEach((button,key)=>button.setAttribute('aria-pressed',String(key===id)));
          title.textContent=groups.find(group=>group.id===id)?.title||id; content.scrollTop=0; popover.hidden=false;
        }
      };
      groups.forEach(group=>{
        const panel=document.createElement('div'); panel.className='rq-bubble-panel'; panel.hidden=true; panel.dataset.group=group.id; content.append(panel); panels.set(group.id,panel);
        group.mount(panel,api);
        const button=document.createElement('button'); button.type='button'; button.textContent=group.label; button.setAttribute('aria-pressed','false'); button.setAttribute('aria-controls','rq-bubble-panel-'+group.id); button.addEventListener('click',()=>api.open(group.id)); rail.append(button); buttons.set(group.id,button);
      });
      close.addEventListener('click',api.close); document.addEventListener('keydown',event=>{if(event.key==='Escape')api.close();});
      shell.append(back,popover,rail); document.body.append(shell); config.afterMount&&config.afterMount(api);
    };
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount,{once:true}); else mount();
  };
  window.RQBubbleStudio={init:start};
})();
