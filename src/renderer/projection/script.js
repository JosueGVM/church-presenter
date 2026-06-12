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
            bgVideo.src = pathNormalizado;
            bgVideo.style.display = 'block';
            bgVideo.play().catch(err => console.error("Error al reproducir video de fondo:", err));
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

        // Estilos de tipografía
        displayTexto.style.fontFamily = est.fontFamily || 'Segoe UI';
        displayTexto.style.fontSize = est.fontSize ? `${est.fontSize}vh` : '5vh';
        displayTexto.style.color = est.fontColor || '#ffffff';
        displayTexto.style.lineHeight = est.lineHeight || 1.4;
        displayTexto.style.letterSpacing = est.letterSpacing ? `${est.letterSpacing}px` : '0px';

        displayTexto.style.fontWeight = est.isBold ? 'bold' : 'normal';
        displayTexto.style.fontStyle = est.isItalic ? 'italic' : 'normal';
        displayTexto.style.textTransform = est.isUppercase ? 'uppercase' : 'none';

        displayTexto.style.textShadow = est.textShadowColor ? `2px 2px 8px ${est.textShadowColor}` : '2px 2px 8px rgba(0,0,0,0.9)';

        // Contorno (Stroke)
        if (est.hasStroke) {
            displayTexto.style.webkitTextStroke = `${est.strokeWidth}px ${est.strokeColor}`;
        } else {
            displayTexto.style.webkitTextStroke = '0px transparent';
        }

        // Caja de relleno de texto única (Bounding Box)
        const textBox = document.getElementById('proj-text-box');
        if (textBox) {
            if (est.hasFillBox) {
                const num = parseInt(est.fillBoxColorHex.replace("#", ""), 16);
                const R = (num >> 16);
                const G = (num >> 8 & 0x00FF);
                const B = (num & 0x0000FF);
                const rgbaColor = `rgba(${R}, ${G}, ${B}, ${est.fillBoxOpacity})`;

                textBox.style.backgroundColor = rgbaColor;
                textBox.style.padding = '15px 25px';
                textBox.style.borderRadius = '8px';
            } else {
                textBox.style.backgroundColor = 'transparent';
                textBox.style.padding = '0';
            }
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