// Aquarium Studio — UI toggle (from aquarium.html block 1, verbatim).

(function(){var b=document.getElementById("uiToggle");
b.addEventListener("click",function(){var h=document.body.classList.toggle("ui-hidden");
b.innerHTML=h?"&#x1F435;":"&#x1F648;";
b.setAttribute("aria-label",h?"Show interface":"Hide interface");});})();
