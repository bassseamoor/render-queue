/* Pure scroll policy: shared by runtime and regression tests. */
(function(root){
'use strict';
const limits=Object.freeze({live:3,native:1,retained:12,posters:48,dom:60,pixels:900000,fps:30});
function windowRange(count,columns,step,top,height){
 columns=Math.max(1,columns);step=Math.max(1,step);
 const first=Math.max(0,Math.floor(top/step)-2)*columns;
 const end=Math.min(count,(Math.ceil((top+height)/step)+3)*columns,first+limits.dom);
 return {first,end,before:Math.floor(first/columns)*step,after:Math.max(0,Math.ceil(count/columns)-Math.ceil(end/columns))*step};
}
function fit(width,height){
 const scale=Math.min(1,Math.sqrt(limits.pixels/(Math.max(1,width)*Math.max(1,height))));
 return {width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale))};
}
const api={limits,windowRange,fit};
if(typeof module==='object'&&module.exports)module.exports=api;else root.WonderScrollPolicy=api;
})(typeof window==='undefined'?this:window);
