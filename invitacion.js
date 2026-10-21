document.addEventListener("DOMContentLoaded", function () {
    // ==========================================
    // 1. CONFIGURACIÓN RSVP & GOOGLE SHEETS
    // ==========================================
    // Reemplaza esta URL con la que te genera Google Apps Script al desplegarlo
    const GOOGLE_SCRIPT_URL = "TU_URL_DE_GOOGLE_APPS_SCRIPT_AQUI";

    // Obtener parámetros de la URL (?familia=Familia%20Perez&cupos=3)
    const urlParams = new URLSearchParams(window.location.search);
    const familia = urlParams.get("familia");
    const cuposMaximos = parseInt(urlParams.get("cupos")) || 1;

    const rsvpMain = document.getElementById("rsvpMain");
    const rsvpFamily = document.getElementById("rsvpFamily");
    const rsvpSeats = document.getElementById("rsvpSeats");
    const rsvpForm = document.getElementById("rsvpForm");
    const rsvpDone = document.getElementById("rsvpDone");
    const rsvpClosed = document.getElementById("rsvpClosed");
    const rsvpMsg = document.getElementById("rsvpMsg");

    const btnYes = document.getElementById("btnYes");
    const btnNo = document.getElementById("btnNo");

    // Mostrar nombre de la familia y sus cupos asignados fijos
    if (rsvpMain && rsvpFamily && rsvpSeats) {
        if (familia) {
            rsvpFamily.textContent = familia;
            rsvpSeats.querySelector("span").textContent = cuposMaximos;
        } else {
            rsvpFamily.textContent = "Confirmación de Asistencia";
            rsvpSeats.querySelector("span").textContent = cuposMaximos;
        }
    }

    // Comprobar fecha límite: 5 de Noviembre de 2026 (23:59:59)
    const deadline = new Date("2026-11-05T23:59:59");
    const now = new Date();

    if (now > deadline && rsvpForm && rsvpClosed) {
        rsvpForm.style.display = "none";
        rsvpClosed.style.display = "block";
    }

    // Función para guardar la respuesta en Google Sheets
    function enviarRSVP(asistira) {
        if (!rsvpMsg || !btnYes || !btnNo) return;

        rsvpMsg.textContent = "Guardando respuesta...";
        btnYes.disabled = true;
        btnNo.disabled = true;

        const data = {
            familia: familia || "Invitado General",
            cuposAsignados: cuposMaximos,
            asistira: asistira ? "SÍ" : "NO",
            confirmados: asistira ? cuposMaximos : 0
        };

        fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        })
        .then(() => {
            if (rsvpForm) rsvpForm.style.display = "none";
            if (rsvpDone) rsvpDone.style.display = "block";
            rsvpMsg.textContent = "";

            const doneText = document.getElementById("rsvpDoneText");
            if (doneText) {
                doneText.textContent = asistira
                    ? `¡Gracias! Tu asistencia ha sido confirmada con ${cuposMaximos} cupo(s).`
                    : "Has registrado que no podrás asistir. ¡Gracias por avisarnos!";
            }
        })
        .catch(error => {
            console.error("Error al guardar RSVP:", error);
            rsvpMsg.textContent = "Hubo un error al guardar. Inténtalo de nuevo.";
            btnYes.disabled = false;
            btnNo.disabled = false;
        });
    }

    if (btnYes) btnYes.addEventListener("click", () => enviarRSVP(true));
    if (btnNo) btnNo.addEventListener("click", () => enviarRSVP(false));

    // Permitir cambiar la respuesta si presiona el botón
    document.getElementById("btnChange")?.addEventListener("click", function() {
        if (rsvpDone) rsvpDone.style.display = "none";
        if (rsvpForm) rsvpForm.style.display = "block";
        if (btnYes) btnYes.disabled = false;
        if (btnNo) btnNo.disabled = false;
    });


    // ==========================================
    // 2. CUENTA REGRESIVA (SAVE THE DATE)
    // ==========================================
    const targetDate = new Date("November 14, 2026 20:00:00").getTime();

    function updateCountdown() {
        const currentTime = new Date().getTime();
        const difference = targetDate - currentTime;

        const cdD = document.getElementById("cdD");
        const cdH = document.getElementById("cdH");
        const cdM = document.getElementById("cdM");
        const cdS = document.getElementById("cdS");

        if (difference > 0 && cdD) {
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            cdD.textContent = days < 10 ? "0" + days : days;
            cdH.textContent = hours < 10 ? "0" + hours : hours;
            cdM.textContent = minutes < 10 ? "0" + minutes : minutes;
            cdS.textContent = seconds < 10 ? "0" + seconds : seconds;
        } else if (difference <= 0 && cdD) {
            document.getElementById("countdown")?.style.setProperty("display", "none");
            document.getElementById("statusDuring")?.removeAttribute("hidden");
        }
    }

    setInterval(updateCountdown, 1000);
    updateCountdown();


    // ==========================================
    // 3. CONTROL DE MÚSICA DE FONDO
    // ==========================================
    const bgm = document.getElementById("bgm");
    const musicBtn = document.getElementById("musicBtn");

    if (musicBtn && bgm) {
        musicBtn.addEventListener("click", function () {
            if (bgm.paused) {
                bgm.play().then(() => {
                    musicBtn.classList.add("playing");
                }).catch(err => {
                    console.log("El navegador bloqueó la autoreproducción:", err);
                });
            } else {
                bgm.pause();
                musicBtn.classList.remove("playing");
            }
        });
    }


    // ==========================================
    // 4. ANIMACIÓN AL DESLIZAR (REVEAL)
    // ==========================================
    const reveals = document.querySelectorAll(".reveal");

    function revealOnScroll() {
        const windowHeight = window.innerHeight;
        const revealPoint = 80;

        reveals.forEach(element => {
            const revealTop = element.getBoundingClientRect().top;
            if (revealTop < windowHeight - revealPoint) {
                element.classList.add("active");
            }
        });
    }

    window.addEventListener("scroll", revealOnScroll);
    revealOnScroll(); // Ejecutar al cargar por si hay elementos visibles


    // ==========================================
    // 5. AÑO ACTUAL EN EL FOOTER
    // ==========================================
    const anioSpan = document.getElementById("anioActual");
    if (anioSpan) {
        anioSpan.textContent = new Date().getFullYear();
    }
});