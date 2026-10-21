(function () {
    "use strict";
    var MKEY = "xv-catherine:musica";
    var params = new URLSearchParams(window.location.search);
    var familia = (params.get("familia") || "").trim();
    var codigo = (params.get("c") || "").trim();

    // URL de tu aplicación web de Google Apps Script
    var SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxHYpQdrTlij7nRNcD-69R0_fjhJBW1OzSDxMpa7xMWGVKpOcTZXMfUvJZ5IGPDkR88ew/exec";

    var guestNameElem = document.getElementById("guestName");
    var invForElem = document.getElementById("invFor");

    // Función para mostrar el nombre en la tarjeta de entrada
    function mostrarNombre(nombre) {
        if (guestNameElem && invForElem && nombre) {
            guestNameElem.textContent = nombre;
            invForElem.hidden = false;
        }
    }

    // 1. Si la URL ya trae ?familia=... lo mostramos de inmediato
    if (familia) {
        mostrarNombre(familia);
    } 
    // 2. Si la URL trae ?c=... consultamos a Google Sheets para obtener el nombre
    else if (codigo && SCRIPT_URL) {
        fetch(SCRIPT_URL + "?action=info&c=" + encodeURIComponent(codigo))
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (data && data.ok && data.familia) {
                    mostrarNombre(data.familia);
                }
            })
            .catch(function (err) {
                console.warn("No se pudo cargar el nombre del invitado:", err);
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

            // Permiso del navegador para reproducir sonido
            if (bgm) {
                bgm.play().catch(function () {});
            }

            document.body.classList.add("abriendo");
            setTimeout(function () {
                // Guardamos en qué segundo va la canción para continuarla en la otra página
                try {
                    if (bgm) {
                        sessionStorage.setItem(MKEY, JSON.stringify({ t: bgm.currentTime || 0 }));
                    }
                } catch (err) { /* nada */ }

                // Se conserva toda la URL actual (ya sea ?familia=... o ?c=...) al pasar a la invitación
                window.location.href = "invitacion.html" + window.location.search;
            }, 800);
        });
    }
})();