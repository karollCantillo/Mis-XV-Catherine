document.addEventListener("DOMContentLoaded", function () {
    "use strict";
 
    // ==========================================
    // CONFIGURACIÓN — lo que falte se llena AQUÍ
    // ==========================================
    const CONFIG = {
        // Inicio y fin del evento (hora de Colombia, UTC-5)
        inicio: "2026-11-14T20:00:00-05:00",
        horasDespuesDelInicio: 6,            // "el evento terminó" aparece 6 h después de empezar
        limiteConfirmacion: "2026-11-05T23:59:59-05:00", // "" si no hay fecha límite
 
        lugar: "Salón de Eventos Le Grand, Cra 47 #72-104, Barranquilla",
        mapsUrl: "https://maps.app.goo.gl/adJExLu59pzZqfbYA",
 
        // CONFIRMACIÓN — usa una de las dos (o las dos):
        // 1) Google Sheets: pega aquí la URL de la app web (ver google-apps-script.gs)
        scriptUrl: "https://script.google.com/macros/s/AKfycbxHYpQdrTlij7nRNcD-69R0_fjhJBW1OzSDxMpa7xMWGVKpOcTZXMfUvJZ5IGPDkR88ew/exec",
        // 2) WhatsApp: número con código de país, sin + ni espacios. Ej: "573001234567"
        whatsapp: "573004673523",
 
        albumUrl: "https://photos.app.goo.gl/tDVtaLkbte8xFnfM6",   // link del álbum compartido (opcional)
        volumen: 0.7,
 
        // Fotos del carrusel (se muestran en blanco y negro). Súbelas a la carpeta /fotos
        fotos: [
            "fotos/01.png", "fotos/02.png", "fotos/03.png", "fotos/04.png", "fotos/05.png",
            "fotos/07.png", "fotos/08.png", "fotos/09.png", "fotos/10.png",
            "fotos/11.png", "fotos/12.png", "fotos/13.png", "fotos/14.png", "fotos/15.png",
            "fotos/16.png", "fotos/17.png", "fotos/18.png", "fotos/19.png", "fotos/20.png",
            "fotos/21.png", "fotos/22.png", "fotos/23.png"
        ]
    };
 
    // ==========================================
    // UTILIDADES
    // ==========================================
    const $ = (id) => document.getElementById(id);
    const pad = (n) => String(n).padStart(2, "0");
    const params = new URLSearchParams(window.location.search);
 
    const START = new Date(CONFIG.inicio);
    const END = new Date(+START + CONFIG.horasDespuesDelInicio * 36e5);
    const DEADLINE = CONFIG.limiteConfirmacion ? new Date(CONFIG.limiteConfirmacion) : null;
 
    // Modo de prueba: ?test=before | during | after  (simula la fecha)
    const TEST = params.get("test");
    const fake = TEST === "before" ? +START - 3 * 864e5
               : TEST === "during" ? +START + 36e5
               : TEST === "after"  ? +END + 36e5 : null;
    const offset = fake === null ? 0 : fake - Date.now();
    const now = () => new Date(Date.now() + offset);
 
    let toastTimer;
    function toast(msg) {
        const t = $("toast");
        if (!t) return;
        t.textContent = msg;
        t.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => t.classList.remove("show"), 2400);
    }
 
    // ==========================================
    // 1. CONFIRMACIÓN DE ASISTENCIA (RSVP) con código privado
    // ==========================================
    // El link de cada invitado es: ?c=CODIGO
    // La familia y los cupos los entrega Google Sheets; el link ya no los trae.
    const codigo = (params.get("c") || "").trim();
    let familia = "";
    let cupos = 1;
 
    const rsvpMain = $("rsvpMain"), rsvpNoFam = $("rsvpNoFam");
    const rsvpForm = $("rsvpForm"), rsvpDone = $("rsvpDone"), rsvpClosed = $("rsvpClosed");
    const rsvpMsg = $("rsvpMsg");
    const btnYes = $("btnYes"), btnNo = $("btnNo"), btnChange = $("btnChange"), btnCancel = $("btnCancel"), btnWa = $("btnWa");
 
    let estado = null;      // "si" | "no" | null
    let personas = 0;
    let count = 1;
    let editing = false;
    let busy = false;
 
    const isClosed = () => !!DEADLINE && now() > DEADLINE;
    const plural = (n) => n + (n === 1 ? " persona" : " personas");
 
    function waLink(est, n) {
        const msg = est === "si"
            ? familia + " confirma su asistencia (" + plural(n) + ") a los XV de Catherine 🎉"
            : familia + " no podrá asistir a los XV de Catherine.";
        return "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(msg);
    }
 
    function updateStepper() {
        $("count").textContent = count;
        $("minus").disabled = count <= 1;
        $("plus").disabled = count >= cupos;
        $("seatPicker").hidden = cupos === 1;      // con 1 solo cupo no hay nada que elegir
    }
 
    function renderRsvp() {
        if (!rsvpMain) return;
        if (!familia) {                            // sin código o código inválido
            rsvpNoFam.hidden = false; rsvpMain.hidden = true; return;
        }
        rsvpNoFam.hidden = true; rsvpMain.hidden = false;
 
        $("rsvpFamily").textContent = familia;
        $("rsvpSeats").querySelector("span").textContent = cupos;
 
        const closed = isClosed();
        const answered = !!estado;
        rsvpForm.hidden = closed || (answered && !editing);
        rsvpDone.hidden = !answered || editing;
        rsvpClosed.hidden = !(closed && !answered);
 
        if (answered) {
            const si = estado === "si";
            $("rsvpIcon").textContent = si ? "✓" : "✕";
            $("rsvpDoneTitle").textContent = si ? "¡Asistencia Confirmada!" : "Respuesta registrada";
            $("rsvpDoneText").textContent = si
                ? "Gracias por confirmar. Te esperamos con " + plural(personas) + "."
                : "Registramos que no podrás asistir. ¡Gracias por avisarnos!";
            btnChange.textContent = si ? "Cambiar número de personas" : "Cambiar mi respuesta";
            btnChange.hidden = closed;
            btnCancel.hidden = closed || !si;
            const showWa = !!CONFIG.whatsapp;
            btnWa.hidden = !showWa;
            if (showWa) btnWa.href = waLink(estado, personas);
        }
        updateStepper();
    }
 
    async function enviar(nuevoEstado) {
        if (busy || !familia) return;
        if (isClosed()) { rsvpMsg.textContent = "El plazo para confirmar ha terminado."; renderRsvp(); return; }
        const n = nuevoEstado === "si" ? count : 0;
 
        busy = true;
        rsvpMsg.textContent = "Guardando respuesta...";
        [btnYes, btnNo, btnChange, btnCancel].forEach((b) => b && (b.disabled = true));
 
        try {
            // Solo se envía el código, el estado y las personas. El cupo lo valida Google.
            const q = new URLSearchParams({ action: "rsvp", c: codigo, estado: nuevoEstado, personas: n });
            const r = await fetch(CONFIG.scriptUrl + "?" + q.toString());
            const d = await r.json();
            if (!d.ok) throw new Error(d.error || "No se pudo guardar");
            estado = nuevoEstado;
            personas = Number(d.personas) || 0;
            editing = false;
            rsvpMsg.textContent = "";
        } catch (e) {
            console.warn("Error al guardar RSVP:", e);
            rsvpMsg.textContent = "No pudimos guardar tu respuesta. Revisa tu conexión e inténtalo de nuevo.";
        } finally {
            busy = false;
            [btnYes, btnNo, btnChange, btnCancel].forEach((b) => b && (b.disabled = false));
            renderRsvp();
        }
    }
 
    async function cargarInvitado() {
        if (!codigo || !CONFIG.scriptUrl) { renderRsvp(); return; }
        try {
            const r = await fetch(CONFIG.scriptUrl + "?action=info&c=" + encodeURIComponent(codigo));
            const d = await r.json();
            if (d && d.ok) {
                familia = d.familia;
                cupos = d.cupos;
                estado = d.estado;                       // "si" | "no" | null
                personas = Number(d.personas) || 0;
                count = Math.min(personas || cupos, cupos);
            }
        } catch (e) {
            console.warn("No se pudo cargar la invitación:", e);
        }
        renderRsvp();
    }
 
    if (rsvpMain) {
        rsvpMain.hidden = true;                          // oculto mientras carga
        rsvpNoFam.hidden = true;
 
        $("minus").addEventListener("click", () => { count = Math.max(1, count - 1); updateStepper(); });
        $("plus").addEventListener("click", () => { count = Math.min(cupos, count + 1); updateStepper(); });
        btnYes.addEventListener("click", () => enviar("si"));
        btnNo.addEventListener("click", () => enviar("no"));
        btnCancel.addEventListener("click", () => enviar("no"));
        btnChange.addEventListener("click", () => {
            editing = true;
            rsvpMsg.textContent = "";
            count = Math.min(personas || cupos, cupos);
            renderRsvp();
        });
 
        cargarInvitado();
    }
 
    // ==========================================
    // 2. CUENTA REGRESIVA Y ESTADOS DEL EVENTO
    // ==========================================
    let phase = "";
    let lastClosed = null;
 
    function setPhase(p) {
        phase = p;
        document.body.dataset.phase = p;
        const show = (id, v) => { const el = $(id); if (el) el.hidden = !v; };
        show("countdown", p === "before");
        show("statusDuring", p === "during");
        show("statusAfter", p === "after");
        document.querySelectorAll(".cal-btns").forEach((el) => { el.hidden = p !== "before"; });
        const sec = $("confirmar");                // después del evento ya no se confirma
        if (sec) sec.hidden = p === "after";
        const cm = $("closingMsg");
        if (cm) cm.textContent = p === "after"
            ? "Gracias por acompañarme en una noche inolvidable. Comparte tus fotos con nuestros hashtags."
            : "Gracias por ser parte de esta noche tan especial. Los espero para brillar juntos.";
    }
 
    function updateCountdown() {
        const n = now();
        const p = n < START ? "before" : n < END ? "during" : "after";
        if (p !== phase) setPhase(p);
        if (p === "before") {
            const diff = START - n;
            $("cdD").textContent = pad(Math.floor(diff / 864e5));
            $("cdH").textContent = pad(Math.floor((diff % 864e5) / 36e5));
            $("cdM").textContent = pad(Math.floor((diff % 36e5) / 6e4));
            $("cdS").textContent = pad(Math.floor((diff % 6e4) / 1e3));
        }
        const closed = isClosed();
        if (closed !== lastClosed) { lastClosed = closed; if (rsvpMain) renderRsvp(); }
    }
    setInterval(updateCountdown, 1000);
    updateCountdown();
 
    // ==========================================
    // 3. AGREGAR AL CALENDARIO
    // ==========================================
    const icsDate = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const TITULO = "Mis XV años · Catherine";
    const DETALLE = "Te esperamos para celebrar. Dress code: formal (evitar rojo y dorado).";
 
    const gcal = new URL("https://calendar.google.com/calendar/render");
    gcal.searchParams.set("action", "TEMPLATE");
    gcal.searchParams.set("text", TITULO);
    gcal.searchParams.set("dates", icsDate(START) + "/" + icsDate(END));
    gcal.searchParams.set("location", CONFIG.lugar);
    gcal.searchParams.set("details", DETALLE);
    if ($("calGoogle")) $("calGoogle").href = gcal.toString();
    if ($("mapsBtn")) $("mapsBtn").href = CONFIG.mapsUrl;
 
    if ($("calIcs")) $("calIcs").addEventListener("click", function (e) {
        e.preventDefault();
        const ics = [
            "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//XV Catherine//ES", "BEGIN:VEVENT",
            "UID:xv-catherine-2026@invitacion",
            "DTSTAMP:" + icsDate(new Date()),
            "DTSTART:" + icsDate(START), "DTEND:" + icsDate(END),
            "SUMMARY:" + TITULO,
            "LOCATION:" + CONFIG.lugar.replace(/,/g, "\\,"),
            "DESCRIPTION:Dress code formal (evitar rojo y dorado).\\nMapa: " + CONFIG.mapsUrl,
            "END:VEVENT", "END:VCALENDAR"
        ].join("\r\n");
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
        a.download = "xv-catherine.ics";
        document.body.appendChild(a); a.click(); a.remove();
    });
 
    // ==========================================
    // 4. CARRUSEL DE FOTOS (blanco y negro)
    // ==========================================
    function loadImg(src) {
        return new Promise((res) => {
            const img = new Image();
            img.onload = () => res(src);
            img.onerror = () => res(null);
            img.src = src;
        });
    }
 
    async function buildCarousel() {
        const sec = $("galeria"), track = $("track"), dotsBox = $("dots");
        if (!sec || !track) return;
        let slides = (await Promise.all(CONFIG.fotos.map(loadImg))).filter(Boolean);
        const demo = params.has("demo");
        if (!slides.length) {
            if (!demo) { sec.hidden = true; return; }   // sin fotos: se oculta la sección
            slides = [1, 2, 3];                         // ?demo=1 muestra marcos de prueba
        }
        slides.forEach((s, i) => {
            const li = document.createElement("div");
            li.className = "slide";
            const frame = document.createElement("div");
            frame.className = "frame";
            if (typeof s === "number") {
                frame.innerHTML = '<div class="ph">Foto ' + s + "</div>";
            } else {
                const img = document.createElement("img");
                img.src = s; img.alt = "Foto " + (i + 1) + " de Catherine"; img.loading = "lazy";
                frame.appendChild(img);
            }
            li.appendChild(frame);
            track.appendChild(li);
            dotsBox.appendChild(document.createElement("i"));
        });
 
        const dots = Array.from(dotsBox.children);
        const total = slides.length;
        let idx = 0, inView = true, paused = false, st;
        const mark = () => dots.forEach((d, i) => d.classList.toggle("on", i === idx));
        const go = (i) => { idx = (i + total) % total; track.scrollTo({ left: idx * track.clientWidth, behavior: "smooth" }); mark(); };
        mark();
        if (total < 2) { $("prev").hidden = true; $("next").hidden = true; }
 
        track.addEventListener("scroll", () => {
            clearTimeout(st);
            st = setTimeout(() => { idx = Math.round(track.scrollLeft / track.clientWidth); mark(); }, 80);
        }, { passive: true });
        $("prev").addEventListener("click", () => go(idx - 1));
        $("next").addEventListener("click", () => go(idx + 1));
 
        const car = $("carousel");
        ["touchstart", "mouseenter"].forEach((ev) => car.addEventListener(ev, () => { paused = true; }, { passive: true }));
        ["touchend", "mouseleave"].forEach((ev) => car.addEventListener(ev, () => { setTimeout(() => { paused = false; }, 2500); }, { passive: true }));
        if ("IntersectionObserver" in window) {
            new IntersectionObserver((e) => { inView = e[0].isIntersecting; }, { threshold: 0.3 }).observe(car);
        }
        setInterval(() => { if (inView && !paused && total > 1) go(idx + 1); }, 4500);
        window.addEventListener("resize", () => track.scrollTo({ left: idx * track.clientWidth }));
    }
    buildCarousel();
 
    // ==========================================
    // 5. MÚSICA DE FONDO (continúa desde el sello)
    // ==========================================
    const bgm = $("bgm");
    const musicBtn = $("musicBtn");
    const MKEY = "xv-catherine:musica";
 
    if (bgm && musicBtn) {
        bgm.volume = CONFIG.volumen;
        const sync = () => musicBtn.classList.toggle("playing", !bgm.paused);
        let quiereMusica = true;       // pasa a false solo si la persona la pausa
 
        // La página del sello (index.html) guarda en qué segundo iba la canción
        let saved = null;
        try { saved = JSON.parse(sessionStorage.getItem(MKEY)); } catch (e) { /* nada */ }
        if (saved && saved.t) {
            const setT = () => { try { bgm.currentTime = saved.t; } catch (e) { /* nada */ } };
            if (bgm.readyState >= 1) setT(); else bgm.addEventListener("loadedmetadata", setT, { once: true });
        }
 
        if (saved) {   // solo si viene del sello
            bgm.play().then(sync).catch(function () {
                // Algunos celulares (sobre todo iPhone) piden otro toque en esta página
                toast("Toca la pantalla para activar la música 🎵");
                const evs = ["pointerdown", "touchend", "click"];
                const start = function () {
                    if (quiereMusica && bgm.paused) bgm.play().catch(() => {});
                    evs.forEach((ev) => window.removeEventListener(ev, start));
                };
                evs.forEach((ev) => window.addEventListener(ev, start, { passive: true }));
            });
        }
 
        musicBtn.addEventListener("click", function () {
            if (bgm.paused) { quiereMusica = true; bgm.play().catch((err) => console.log("Audio bloqueado:", err)); }
            else { quiereMusica = false; bgm.pause(); }
            sync();
        });
        bgm.addEventListener("play", sync);
        bgm.addEventListener("pause", sync);
    }
 
    // ==========================================
    // 6. HASHTAGS (tocar para copiar) Y ÁLBUM
    // ==========================================
    async function copyText(text) {
        try { await navigator.clipboard.writeText(text); }
        catch (e) {
            const ta = document.createElement("textarea");
            ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
            document.body.appendChild(ta); ta.select();
            try { document.execCommand("copy"); } catch (_) { /* nada */ }
            ta.remove();
        }
        toast("Copiado ✓");
    }
    if ($("chips")) $("chips").addEventListener("click", (e) => {
        const chip = e.target.closest(".chip");
        if (chip) copyText(chip.dataset.copy);
    });
    if ($("copyAll")) $("copyAll").addEventListener("click", () => {
        copyText(Array.from(document.querySelectorAll(".chip")).map((c) => c.dataset.copy).join(" "));
    });
    if (CONFIG.albumUrl && $("albumBtn")) { $("albumBtn").href = CONFIG.albumUrl; $("albumBtn").hidden = false; }
 
    // ==========================================
    // 7. ANIMACIÓN AL DESLIZAR (REVEAL)
    // ==========================================
    const reveals = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("active"); io.unobserve(en.target); } });
        }, { threshold: 0.12 });
        reveals.forEach((el) => io.observe(el));
    } else {
        reveals.forEach((el) => el.classList.add("active"));
    }
 
    // ==========================================
    // 8. AÑO ACTUAL EN EL FOOTER
    // ==========================================
    const anioSpan = $("anioActual");
    if (anioSpan) anioSpan.textContent = new Date().getFullYear();
});