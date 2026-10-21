(function () {
    "use strict";
    var MKEY = "xv-catherine:musica";
    var params = new URLSearchParams(window.location.search);
    var familia = (params.get("familia") || "").trim();
 
    // Nombre de la familia en la tarjeta de entrada
    if (familia) {
        document.getElementById("guestName").textContent = familia;
        document.getElementById("invFor").hidden = false;
    }
 
    var bgm = document.getElementById("bgm");
    var seal = document.getElementById("openSeal");
    var opening = false;
    bgm.volume = 0.7;
 
    seal.addEventListener("click", function (e) {
        e.preventDefault();
        if (opening) return;
        opening = true;
        // Este toque es el permiso del navegador para reproducir sonido
        bgm.play().catch(function () {});
        document.body.classList.add("abriendo");
        setTimeout(function () {
            // Guardamos en qué segundo va la canción para continuarla en la otra página
            try { sessionStorage.setItem(MKEY, JSON.stringify({ t: bgm.currentTime || 0 })); } catch (err) { /* nada */ }
            // Se conserva ?familia=...&cupos=... en el paso a la invitación
            window.location.href = "invitacion.html" + window.location.search;
        }, 800);
    });
})();