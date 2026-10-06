/* Compatibility locator only.
 * Canonical Funnel maintenance truth lives in funnel-maintenance-status.json.
 * This file intentionally contains no duplicated health claims.
 */
(function(root){
'use strict';
root.FUNNEL_MAINTENANCE_STATE_ALIAS=Object.freeze({
  schema:'moor.compatibility-alias',
  version:1,
  status:'superseded-alias',
  canonical:'funnel-maintenance-status.json',
  reason:'One factual maintenance register prevents the 3D factory, docs and CI from drifting into contradictory health states.'
});
})(window);
