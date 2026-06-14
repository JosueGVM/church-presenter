// Vincular los nuevos elementos de título del proyector al inicio del archivo
const displayTexto = document.getElementById('texto-proyectado');
const bgVideo = document.getElementById('proj-bg-video');
const bgImage = document.getElementById('proj-bg-image');

const projTitleBarTop = document.getElementById('proj-title-bar-top');
const projTitleBarBottom = document.getElementById('proj-title-bar-bottom');
const projTitleInlineTop = document.getElementById('proj-title-inline-top');
const projTitleInlineBottom = document.getElementById('proj-title-inline-bottom');

const projAlertBanner = document.getElementById('proj-alert-banner');

window.api.alActualizarProyeccion((datos) => {
    console.log("[Proyector Debug] Datos recibidos en tiempo real:", datos);

    // --- AGREGAR CONTROL DEL CINTILLO DE ALERTAS (FAJA) ---
    if (datos.alertText !== undefined) {
        if (datos.alertText) {
            projAlertBanner.textContent = datos.alertText;
            projAlertBanner.style.display = 'block';
        } else {
            projAlertBanner.style.display = 'none';
            projAlertBanner.textContent = '';
        }
    }

    // Si se pide explícitamente apagar la alerta por separado
    if (datos.clearAlert) {
        projAlertBanner.style.display = 'none';
        projAlertBanner.textContent = '';
    }

    // 1. MANEJAR LA CAPA DE FONDO MULTIMEDIA
    if (datos.background) {
        const pathNormalizado = datos.background.path;
        if (datos.background.type === 'video') {
            bgImage.style.display = 'none';
            bgImage.src = '';
            // Solo reiniciar el video si es uno distinto al que ya está corriendo
            if (bgVideo.src !== pathNormalizado) {
                bgVideo.src = pathNormalizado;
                bgVideo.style.display = 'block';
                bgVideo.play().catch(err => console.error("Error al reproducir video de fondo:", err));
            } else {
                bgVideo.style.display = 'block';
            }
        } else if (datos.background.type === 'image') {
            bgVideo.style.display = 'none';
            bgVideo.pause();
            bgVideo.src = '';
            bgImage.src = pathNormalizado;
            bgImage.style.display = 'block';
        }
    }

    if (datos.clearBg) {
        clearActiveBackgrounds();
    }

    // 2. MANEJAR ESTILOS AVANZADOS DEL TEMA EMITIDO
    if (datos.estilo) {
        const est = datos.estilo;

        if (est.bgType === 'color') {
            document.body.style.backgroundColor = est.bgPath || '#000000';
        } else {
            document.body.style.backgroundColor = '#000000';
        }

        // Tipografía
        displayTexto.style.fontFamily = est.fontFamily || 'Segoe UI';
        displayTexto.style.fontSize = est.fontSize ? `${est.fontSize}vh` : '5vh';
        displayTexto.style.color = est.fontColor || '#ffffff';
        displayTexto.style.lineHeight = est.lineHeight || 1.4;
        displayTexto.style.letterSpacing = est.letterSpacing ? `${est.letterSpacing}px` : '0px';
        displayTexto.style.fontWeight = est.isBold ? 'bold' : 'normal';
        displayTexto.style.fontStyle = est.isItalic ? 'italic' : 'normal';
        displayTexto.style.textTransform = est.isUppercase ? 'uppercase' : 'none';

        // Sombra con opacidad y difuminado configurables
        const shadowHex = est.textShadowColor || '#000000';
        const shadowOpacity = est.textShadowOpacity ?? 0.8;
        const shadowBlur = est.textShadowBlur ?? 8;
        const sNum = parseInt(shadowHex.replace('#', ''), 16);
        const shadowRgba = `rgba(${sNum >> 16}, ${(sNum >> 8) & 0xFF}, ${sNum & 0xFF}, ${shadowOpacity})`;
        let shadows = `2px 2px ${shadowBlur}px ${shadowRgba}`;

        // Glow
        if (est.hasGlow && est.glowColor) {
            const gb = est.glowBlur ?? 10;
            shadows += `, 0 0 ${gb}px ${est.glowColor}, 0 0 ${gb * 2}px ${est.glowColor}`;
        }
        displayTexto.style.textShadow = shadows;

        // Contorno
        displayTexto.style.webkitTextStroke = est.hasStroke
            ? `${est.strokeWidth}px ${est.strokeColor}`
            : '0px transparent';

        // Caja de relleno con padding configurable
        const textBox = document.getElementById('proj-text-box');
        if (textBox) {
            if (est.hasFillBox) {
                const fNum = parseInt(est.fillBoxColorHex.replace('#', ''), 16);
                const fRgba = `rgba(${fNum >> 16}, ${(fNum >> 8) & 0xFF}, ${fNum & 0xFF}, ${est.fillBoxOpacity})`;
                textBox.style.backgroundColor = fRgba;
                textBox.style.padding = `${est.fillBoxPadding ?? 15}px`;
                textBox.style.borderRadius = '8px';
            } else {
                textBox.style.backgroundColor = 'transparent';
                textBox.style.padding = '0';
            }
        }

        // Margen/padding de pantalla
        const projTextOverlay = document.getElementById('proj-text-overlay');
        if (projTextOverlay) {
            const pad = est.textPadding ?? 40;
            projTextOverlay.style.padding = `${pad}px`;
        }

        // Efectos de video de fondo
        if (bgVideo) {
            bgVideo.style.filter = `brightness(${est.videoBrightness ?? 100}%)`;
            bgVideo.style.opacity = (est.videoOpacity ?? 100) / 100;
            bgVideo.playbackRate = est.videoSpeed ?? 1;
        }
        if (bgImage) {
            bgImage.style.filter = `brightness(${est.videoBrightness ?? 100}%)`;
            bgImage.style.opacity = (est.videoOpacity ?? 100) / 100;
        }

        // --- LOGICA DE COMODATO DE TÍTULOS ---
        // Apagamos todos los títulos primero
        projTitleBarTop.style.display = 'none';
        projTitleBarBottom.style.display = 'none';
        projTitleInlineTop.style.display = 'none';
        projTitleInlineBottom.style.display = 'none';

        if (datos.esBiblia && datos.cita) {
            const tPos = est.verseTitlePos || 'top';
            
            if (tPos === 'top') {
                projTitleInlineTop.textContent = datos.cita;
                projTitleInlineTop.style.display = 'block';
                projTitleInlineTop.style.color = est.fontColor || '#ffffff';
            } else if (tPos === 'bottom') {
                projTitleInlineBottom.textContent = datos.cita;
                projTitleInlineBottom.style.display = 'block';
                projTitleInlineBottom.style.color = est.fontColor || '#ffffff';
            } else if (tPos.startsWith('bar-')) {
                // Función inline de conversión hex a rgba para el fondo de la faja
                const num = parseInt(est.titleBarColorHex.replace("#", ""), 16);
                const R = (num >> 16);
                const G = (num >> 8 & 0x00FF);
                const B = (num & 0x0000FF);
                const rgbaBarColor = `rgba(${R}, ${G}, ${B}, ${est.titleBarOpacity})`;

                if (tPos === 'bar-top') {
                    projTitleBarTop.textContent = datos.cita;
                    projTitleBarTop.style.display = 'block';
                    projTitleBarTop.style.backgroundColor = rgbaBarColor;
                    projTitleBarTop.style.color = '#ffffff';
                } else if (tPos === 'bar-bottom') {
                    projTitleBarBottom.textContent = datos.cita;
                    projTitleBarBottom.style.display = 'block';
                    projTitleBarBottom.style.backgroundColor = rgbaBarColor;
                    projTitleBarBottom.style.color = '#ffffff';
                }
            }
        }

        // Alineación Horizontal con Flexbox
        const overlay = document.getElementById('proj-text-overlay');
        if (overlay) {
            if (est.alignH === 'left') {
                overlay.style.justifyContent = 'flex-start';
                displayTexto.style.textAlign = 'left';
            } else if (est.alignH === 'right') {
                overlay.style.justifyContent = 'flex-end';
                displayTexto.style.textAlign = 'right';
            } else {
                overlay.style.justifyContent = 'center';
                displayTexto.style.textAlign = 'center';
            }

            // Alineación Vertical con Flexbox
            if (est.alignV === 'top') {
                overlay.style.alignItems = 'flex-start';
            } else if (est.alignV === 'bottom') {
                overlay.style.alignItems = 'flex-end';
            } else {
                overlay.style.alignItems = 'center';
            }
        }
    }

    // 3. MANEJAR TEXTO (BIBLIA / CANCIONES)
    if (datos.texto !== undefined) {
        displayTexto.classList.remove('active');
        
        setTimeout(() => {
            displayTexto.textContent = datos.texto;
            if (datos.texto) {
                displayTexto.classList.add('active');
                // Auto-fit: reducir font-size hasta que el texto quepa sin desbordarse
                fitTextToContainer(displayTexto);
            }
        }, 150);
    }
});

// Al presionar ESC: Oculta texto, fajas de título y limpia fondos
window.api.alLimpiarPantalla(() => {
    displayTexto.classList.remove('active');
    setTimeout(() => {
        displayTexto.textContent = '';
    }, 300);

    // Apagar fajas de títulos
    projTitleBarTop.style.display = 'none';
    projTitleBarBottom.style.display = 'none';
    projTitleInlineTop.style.display = 'none';
    projTitleInlineBottom.style.display = 'none';

    projAlertBanner.style.display = 'none';
    projAlertBanner.textContent = '';

    clearActiveBackgrounds();
});

function clearActiveBackgrounds() {
    bgVideo.style.display = 'none';
    bgVideo.pause();
    bgVideo.src = '';
    
    bgImage.style.display = 'none';
    bgImage.src = '';
}

// Auto-fit: reduce el font-size del elemento hasta que quepa dentro de su contenedor padre.
// Parte del tamaño actual definido por el tema y baja de a 0.5vh hasta que entre.
function fitTextToContainer(el) {
    const container = document.getElementById('proj-text-overlay');
    if (!el || !container) return;

    // Leer el font-size actual como punto de partida (en px)
    const computedSize = parseFloat(window.getComputedStyle(el).fontSize);
    if (!computedSize) return;

    // Convertir a vh para mantener consistencia con el sistema de temas
    const vh = window.innerHeight / 100;
    let currentVh = computedSize / vh;
    const minVh = 1.5; // Nunca bajar de 1.5vh para mantener legibilidad

    // Restablecer al tamaño del tema antes de medir
    el.style.fontSize = `${currentVh}vh`;

    // Reducir hasta que el texto no desborde el contenedor
    while (
        (el.scrollHeight > container.clientHeight || el.scrollWidth > container.clientWidth)
        && currentVh > minVh
    ) {
        currentVh -= 0.5;
        el.style.fontSize = `${currentVh}vh`;
    }
}
