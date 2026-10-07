// TAGS: funnel, auditor, testing, automation
(function(){
  const TOOL_ID='comp-auditor';
  window.PulseTools=window.PulseTools||{};
  window.PulseTools[TOOL_ID]={
    id:TOOL_ID,
    title:'Scripted Auditor',
    page:'https://bassseamoor.github.io/render-queue/scripted-auditor.html',
    description:'Automated auditing with bounded connections, auto-termination, and anti-intent accumulation.',
    open(){ window.open(this.page,'_blank'); }
  };
})();
