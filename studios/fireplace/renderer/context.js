// Fireplace Studio — renderer/context.js. See README.md for ownership and replacement boundaries.


const canvas = document.getElementById("scene");
const gl = canvas.getContext("webgl2", { antialias:false, alpha:false, powerPreference:"high-performance" });
if (!gl) { document.getElementById("nogl").style.display = "flex"; throw new Error("WebGL2 unavailable"); }

export { canvas, gl };
