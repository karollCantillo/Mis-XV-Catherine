(function () {
    "use strict";
    var MKEY = "xv-catherine:musica";
    var params = new URLSearchParams(window.location.search);
    var familia = (params.get("familia") || "").trim();
    var codigo = (params.get("c") || "").trim();

    // PEGA AQUÍ LA NUEVA URL DE TU APLICACIÓN WEB DE GOOGLE APPS SCRIPT
    var SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyi7Y8aM-jGianQsBFDnKksD09rXLNhiVeObmnFOHtnbwAszXUpKbt345Z597u6pNEIbg/exec";

    var guestNameElem = document.getElementById("guestName");
    var invForElem = document.getElementById("invFor");

    function mostrarNombre(nombre) {
        if (guestNameElem && invForElem && nombre) {
            guestNameElem.textContent = " " + nombre;
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
                    sessionStorage.setItem("xv-catherine:autoscroll", "1");
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