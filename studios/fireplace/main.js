// One entry point. Native modules are the live source; there is no generated monolith.
import('./studio.js').then(({ startStudio })=>startStudio()).catch(error=>{
  console.error('[fireplace] Studio failed to start', error);
  const message=document.getElementById('nogl');
  if(message){
    message.style.display='grid';
    if(!String(error.message).includes('WebGL2 unavailable')){
      message.querySelector('h2').textContent='The studio could not start';
      message.querySelector('p').textContent='Please reload the page. '+error.message;
    }
  }
});
