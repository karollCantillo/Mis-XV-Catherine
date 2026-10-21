(function () {
    "use strict";
    var MKEY = "xv-catherine:musica";
    var params = new URLSearchParams(window.location.search);
    var codigo = (params.get("c") || "").trim();
 
    // API de confirmación en Cloudflare
    var API_URL = "https://xv-catherine-api.xv-catherine.workers.dev";
 
    var guestNameElem = document.getElementById("guestName");
    var invForElem = document.getElementById("invFor");
 
    function mostrarNombre(nombre) {
        if (guestNameElem && invForElem && nombre) {
            guestNameElem.textContent = " " + nombre;
            invForElem.hidden = false;
        }
    }
 
    // Si la URL trae ?c=... consultamos la API para obtener el nombre del invitado
    if (codigo) {
        fetch(API_URL + "?c=" + encodeURIComponent(codigo))
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (data && data.ok && data.familia) {
                    mostrarNombre(data.familia);
                } else {
                    mostrarNombre("Invitado Especial");
                }
            })
            .catch(function (err) {
                console.warn("Error al cargar el invitado:", err);
                mostrarNombre("Estimado Invitado");
            });
    }
 
    var bgm = document.getElementById("bgm");
    var seal = document.getElementById("openSeal");
    var opening = false;
    if (bgm) bgm.volume = 0.7;
 
    if (seal) {
        seal.addEventListener("click", function (e) {
            e.preventDefault();
            if (opening) return;
            opening = true;
 
            if (bgm) {
                bgm.play().catch(function () {});
            }
 
            document.body.classList.add("abriendo");
            setTimeout(function () {
                try {
                    if (bgm) {
                        sessionStorage.setItem(MKEY, JSON.stringify({ t: bgm.currentTime || 0 }));
                    }
                } catch (err) {}
 
                // Pasa a la invitación conservando el código o parámetros en la URL
                window.location.href = "invitacion.html" + window.location.search;
            }, 800);
        });
    }
})();