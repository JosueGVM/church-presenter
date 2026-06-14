import { selectTab } from '../../control/script.js';

// --- ESTADOS INTERNOS ---
let settingsData = null;
let scannedFonts = [];
let scannedMedia = [];
let selectedThemeId = null;
let activeAlignH = 'center';
let activeAlignV = 'center';

// --- ELEMENTOS ---
let themesList, btnCreateTheme;
let selectGlobalBible, selectGlobalSongs, selectGlobalNotes;
let editorHeaderTitle, themeNameInput, themeFontSelect;
let themeSizeSlider, themeSizeVal;
let themeLineHeight, themeLineHeightVal, themeLetterSpacing, themeLetterSpacingVal;
let btnBold, btnItalic, btnUppercase;
let themeColorInput;

// Sombra
let themeShadowColorInput, themeShadowOpacity, themeShadowOpacityVal, themeShadowBlur, themeShadowBlurVal;

// Glow
let btnToggleGlow, glowControls, themeGlowColor, themeGlowBlur, themeGlowBlurVal;

// Contorno
let btnToggleStroke, strokeControls, themeStrokeColor, themeStrokeWidth, themeStrokeWidthVal;

// Caja de relleno
let btnToggleFillbox, fillboxControls, themeFillboxColor, themeFillboxOpacity, themeFillboxOpacityVal, themeFillboxPadding, themeFillboxPaddingVal;

// Alineación y margen
let themePadding, themePaddingVal;

// Título Biblia
let themeTitlePos, titleBarControls, themeTitleBarColor, themeTitleBarOpacity, themeTitleBarOpacityVal;
let btnToggleComments;

// Fondo
let themeBgTypeSelect, groupBgMedia, themeBgMediaSelect, groupBgColor, themeBgColorInput, groupBgVideoFx;
let themeBrightness, themeBrightnessVal, themeVideoOpacity, themeVideoOpacityVal, themeVideoSpeed, themeVideoSpeedVal;

// Acciones
let btnDeleteTheme, btnSaveTheme, settingsSaveStatus;

// Preview
let themePreviewBox, previewBgVideo, previewBgImage, previewTextOverlay, previewTextContent, previewTextBox;
let previewTitleBarTop, previewTitleBarBottom, previewTitleInlineTop, previewTitleInlineBottom;

export async function init() {
    // Catálogo
    themesList = document.getElementById('themes-list');
    btnCreateTheme = document.getElementById('btn-create-theme');
    selectGlobalBible = document.getElementById('select-global-bible');
    selectGlobalSongs = document.getElementById('select-global-songs');
    selectGlobalNotes = document.getElementById('select-global-notes');

    // General y fuente
    editorHeaderTitle = document.getElementById('editor-header-title');
    themeNameInput = document.getElementById('theme-name');
    themeFontSelect = document.getElementById('theme-font-select');
    themeSizeSlider = document.getElementById('theme-size-slider');
    themeSizeVal = document.getElementById('theme-size-val');
    themeLineHeight = document.getElementById('theme-line-height');
    themeLineHeightVal = document.getElementById('theme-line-height-val');
    themeLetterSpacing = document.getElementById('theme-letter-spacing');
    themeLetterSpacingVal = document.getElementById('theme-letter-spacing-val');
    btnBold = document.getElementById('theme-check-bold');
    btnItalic = document.getElementById('theme-check-italic');
    btnUppercase = document.getElementById('theme-check-uppercase');
    themeColorInput = document.getElementById('theme-color');

    // Sombra y glow
    themeShadowColorInput = document.getElementById('theme-shadow-color');
    themeShadowOpacity = document.getElementById('theme-shadow-opacity');
    themeShadowOpacityVal = document.getElementById('theme-shadow-opacity-val');
    themeShadowBlur = document.getElementById('theme-shadow-blur');
    themeShadowBlurVal = document.getElementById('theme-shadow-blur-val');
    btnToggleGlow = document.getElementById('btn-toggle-glow');
    glowControls = document.getElementById('glow-controls');
    themeGlowColor = document.getElementById('theme-glow-color');
    themeGlowBlur = document.getElementById('theme-glow-blur');
    themeGlowBlurVal = document.getElementById('theme-glow-blur-val');

    // Contorno
    btnToggleStroke = document.getElementById('btn-toggle-stroke');
    strokeControls = document.getElementById('stroke-controls');
    themeStrokeColor = document.getElementById('theme-stroke-color');
    themeStrokeWidth = document.getElementById('theme-stroke-width');
    themeStrokeWidthVal = document.getElementById('theme-stroke-width-val');

    // Caja de relleno
    btnToggleFillbox = document.getElementById('btn-toggle-fillbox');
    fillboxControls = document.getElementById('fillbox-controls');
    themeFillboxColor = document.getElementById('theme-fillbox-color');
    themeFillboxOpacity = document.getElementById('theme-fillbox-opacity');
    themeFillboxOpacityVal = document.getElementById('theme-fillbox-opacity-val');
    themeFillboxPadding = document.getElementById('theme-fillbox-padding');
    themeFillboxPaddingVal = document.getElementById('theme-fillbox-padding-val');

    // Alineación y margen
    themePadding = document.getElementById('theme-padding');
    themePaddingVal = document.getElementById('theme-padding-val');

    // Título Biblia
    themeTitlePos = document.getElementById('theme-title-pos');
    titleBarControls = document.getElementById('title-bar-controls');
    themeTitleBarColor = document.getElementById('theme-title-bar-color');
    themeTitleBarOpacity = document.getElementById('theme-title-bar-opacity');
    themeTitleBarOpacityVal = document.getElementById('theme-title-bar-opacity-val');
    btnToggleComments = document.getElementById('btn-toggle-comments');

    // Fondo
    themeBgTypeSelect = document.getElementById('theme-bg-type');
    groupBgMedia = document.getElementById('group-bg-media');
    themeBgMediaSelect = document.getElementById('theme-bg-media');
    groupBgColor = document.getElementById('group-bg-color');
    themeBgColorInput = document.getElementById('theme-bg-color');
    groupBgVideoFx = document.getElementById('group-bg-video-fx');
    themeBrightness = document.getElementById('theme-video-brightness');
    themeBrightnessVal = document.getElementById('theme-video-brightness-val');
    themeVideoOpacity = document.getElementById('theme-video-opacity');
    themeVideoOpacityVal = document.getElementById('theme-video-opacity-val');
    themeVideoSpeed = document.getElementById('theme-video-speed');
    themeVideoSpeedVal = document.getElementById('theme-video-speed-val');

    // Acciones
    btnDeleteTheme = document.getElementById('btn-delete-theme');
    btnSaveTheme = document.getElementById('btn-save-theme');
    settingsSaveStatus = document.getElementById('settings-save-status');

    // Preview
    themePreviewBox = document.getElementById('theme-preview-box');
    previewBgVideo = document.getElementById('preview-bg-video');
    previewBgImage = document.getElementById('preview-bg-image');
    previewTextOverlay = document.getElementById('preview-text-overlay');
    previewTextContent = document.getElementById('preview-text-content');
    previewTextBox = document.getElementById('preview-text-box');
    previewTitleBarTop = document.getElementById('preview-title-bar-top');
    previewTitleBarBottom = document.getElementById('preview-title-bar-bottom');
    previewTitleInlineTop = document.getElementById('preview-title-inline-top');
    previewTitleInlineBottom = document.getElementById('preview-title-inline-bottom');

    // --- LISTENERS ---

    // Fuente
    themeNameInput.addEventListener('input', updatePreview);
    themeFontSelect.addEventListener('change', updatePreview);
    themeSizeSlider.addEventListener('input', () => { themeSizeVal.textContent = `${themeSizeSlider.value} vh`; updatePreview(); });
    themeLineHeight.addEventListener('input', () => { themeLineHeightVal.textContent = themeLineHeight.value; updatePreview(); });
    themeLetterSpacing.addEventListener('input', () => { themeLetterSpacingVal.textContent = `${themeLetterSpacing.value} px`; updatePreview(); });
    themeColorInput.addEventListener('input', updatePreview);

    // Toggle buttons tipografía
    [btnBold, btnItalic, btnUppercase].forEach(btn => {
        btn.addEventListener('click', () => {
            const isActive = btn.dataset.active === 'true';
            btn.dataset.active = String(!isActive);
            btn.classList.toggle('active', !isActive);
            updatePreview();
        });
    });

    // Sombra
    themeShadowColorInput.addEventListener('input', updatePreview);
    themeShadowOpacity.addEventListener('input', () => { themeShadowOpacityVal.textContent = `${Math.round(themeShadowOpacity.value * 100)}%`; updatePreview(); });
    themeShadowBlur.addEventListener('input', () => { themeShadowBlurVal.textContent = `${themeShadowBlur.value} px`; updatePreview(); });

    // Glow
    btnToggleGlow.addEventListener('click', () => toggleFeature(btnToggleGlow, glowControls));
    themeGlowColor.addEventListener('input', updatePreview);
    themeGlowBlur.addEventListener('input', () => { themeGlowBlurVal.textContent = `${themeGlowBlur.value} px`; updatePreview(); });

    // Contorno
    btnToggleStroke.addEventListener('click', () => toggleFeature(btnToggleStroke, strokeControls));
    themeStrokeColor.addEventListener('input', updatePreview);
    themeStrokeWidth.addEventListener('input', () => { themeStrokeWidthVal.textContent = `${themeStrokeWidth.value} px`; updatePreview(); });

    // Caja de relleno
    btnToggleFillbox.addEventListener('click', () => toggleFeature(btnToggleFillbox, fillboxControls));
    themeFillboxColor.addEventListener('input', updatePreview);
    themeFillboxOpacity.addEventListener('input', () => { themeFillboxOpacityVal.textContent = `${Math.round(themeFillboxOpacity.value * 100)}%`; updatePreview(); });
    themeFillboxPadding.addEventListener('input', () => { themeFillboxPaddingVal.textContent = `${themeFillboxPadding.value} px`; updatePreview(); });

    // Margen de pantalla
    themePadding.addEventListener('input', () => { themePaddingVal.textContent = `${themePadding.value} px`; updatePreview(); });

    // Título Biblia
    themeTitlePos.addEventListener('change', () => {
        titleBarControls.classList.toggle('hidden', !themeTitlePos.value.startsWith('bar-'));
        updatePreview();
    });
    themeTitleBarColor.addEventListener('input', updatePreview);
    themeTitleBarOpacity.addEventListener('input', () => { themeTitleBarOpacityVal.textContent = `${Math.round(themeTitleBarOpacity.value * 100)}%`; updatePreview(); });
    btnToggleComments.addEventListener('click', () => {
        const isActive = btnToggleComments.dataset.active === 'true';
        btnToggleComments.dataset.active = String(!isActive);
        btnToggleComments.classList.toggle('active', !isActive);
    });

    // Fondo
    themeBgTypeSelect.addEventListener('change', handleBgTypeChange);
    themeBgMediaSelect.addEventListener('change', updatePreview);
    themeBgColorInput.addEventListener('input', updatePreview);
    themeBrightness.addEventListener('input', () => { themeBrightnessVal.textContent = `${themeBrightness.value}%`; updatePreview(); });
    themeVideoOpacity.addEventListener('input', () => { themeVideoOpacityVal.textContent = `${themeVideoOpacity.value}%`; updatePreview(); });
    themeVideoSpeed.addEventListener('input', () => { themeVideoSpeedVal.textContent = `${themeVideoSpeed.value}×`; updatePreview(); });

    // Alineación
    document.querySelectorAll('#align-h-grid .btn-align').forEach(btn => btn.addEventListener('click', () => setAlignH(btn.dataset.align)));
    document.querySelectorAll('#align-v-grid .btn-align').forEach(btn => btn.addEventListener('click', () => setAlignV(btn.dataset.align)));

    // Acciones
    btnCreateTheme.addEventListener('click', createNewTheme);
    btnSaveTheme.addEventListener('click', saveActiveTheme);
    btnDeleteTheme.addEventListener('click', deleteActiveTheme);
    selectGlobalBible.addEventListener('change', saveGlobalThemeAssociations);
    selectGlobalSongs.addEventListener('change', saveGlobalThemeAssociations);
    selectGlobalNotes.addEventListener('change', saveGlobalThemeAssociations);

    // Cargar datos
    await loadPortableFonts();
    await loadPortableMedia();
    await loadSettingsAndRender();
}

// ================= UTILIDADES =================

function hexToRgba(hex, opacity) {
    const num = parseInt(hex.replace('#', ''), 16);
    return `rgba(${num >> 16}, ${(num >> 8) & 0xFF}, ${num & 0xFF}, ${opacity})`;
}

function toggleFeature(btn, controlsEl) {
    const isActive = btn.dataset.active === 'true';
    btn.dataset.active = String(!isActive);
    btn.classList.toggle('active', !isActive);
    controlsEl.classList.toggle('hidden', isActive);
    updatePreview();
}

function setToggleBtn(btn, active) {
    btn.dataset.active = String(active);
    btn.classList.toggle('active', active);
}

// ================= CARGA DE RECURSOS =================

async function loadPortableFonts() {
    themeFontSelect.innerHTML = '';
    const defaultFonts = ['Segoe UI', 'Arial', 'Georgia', 'Times New Roman', 'Impact', 'Monospace'];
    defaultFonts.forEach(font => {
        const opt = document.createElement('option');
        opt.value = font; opt.textContent = font;
        themeFontSelect.appendChild(opt);
    });
    try {
        const result = await window.api.getFonts();
        if (result?.success && result.fonts.length > 0) {
            for (const font of result.fonts) {
                try {
                    const face = new FontFace(font.name, `url("${font.url}")`);
                    document.fonts.add(await face.load());
                    const opt = document.createElement('option');
                    opt.value = font.name; opt.textContent = `📂 ${font.name}`;
                    themeFontSelect.appendChild(opt);
                } catch (e) {}
            }
        }
    } catch (e) {}
}

async function loadPortableMedia() {
    themeBgMediaSelect.innerHTML = '';
    try {
        const result = await window.api.scanMedia();
        if (result?.success) {
            const media = result.files.filter(f => f.type === 'image' || f.type === 'video');
            if (media.length > 0) {
                media.forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m.url;
                    opt.textContent = `${m.type === 'image' ? '🖼️' : '🎥'} ${m.name}`;
                    themeBgMediaSelect.appendChild(opt);
                });
            } else {
                const opt = document.createElement('option');
                opt.textContent = 'No hay medios en tu USB';
                themeBgMediaSelect.appendChild(opt);
            }
        }
    } catch (e) {}
}

async function loadSettingsAndRender() {
    try {
        settingsData = await window.api.getSettings();
        if (!settingsData.themes) settingsData.themes = [];
        if (!settingsData.songThemes) settingsData.songThemes = {};
        renderThemesList();
        renderGlobalSelectors();
        if (settingsData.themes.length > 0) loadThemeForEditing(settingsData.themes[0].id);
    } catch (e) {}
}

function renderThemesList() {
    themesList.innerHTML = '';
    settingsData.themes.forEach(theme => {
        const li = document.createElement('li');
        li.textContent = theme.name;
        li.dataset.id = theme.id;
        if (theme.id === selectedThemeId) li.className = 'active';
        li.addEventListener('click', () => loadThemeForEditing(theme.id));
        themesList.appendChild(li);
    });
}

function renderGlobalSelectors() {
    [selectGlobalBible, selectGlobalSongs, selectGlobalNotes].forEach(sel => {
        sel.innerHTML = '';
        settingsData.themes.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id; opt.textContent = t.name;
            sel.appendChild(opt);
        });
    });
    selectGlobalBible.value = settingsData.defaultBibleTheme || 'default';
    selectGlobalSongs.value = settingsData.defaultSongsTheme || 'default';
    selectGlobalNotes.value = settingsData.defaultNotesTheme || 'default';
}

async function saveGlobalThemeAssociations() {
    settingsData.defaultBibleTheme = selectGlobalBible.value;
    settingsData.defaultSongsTheme = selectGlobalSongs.value;
    settingsData.defaultNotesTheme = selectGlobalNotes.value;
    try {
        await window.api.saveSettings(settingsData);
        showStatus('✓ Temas predeterminados guardados.');
    } catch (e) {}
}

// ================= EDITOR =================

function loadThemeForEditing(themeId) {
    selectedThemeId = themeId;
    renderThemesList();
    const t = settingsData.themes.find(th => th.id === themeId);
    if (!t) return;

    editorHeaderTitle.textContent = `Editar: ${t.name}`;
    themeNameInput.value = t.name;
    themeFontSelect.value = t.fontFamily;
    themeSizeSlider.value = t.fontSize;
    themeSizeVal.textContent = `${t.fontSize} vh`;
    themeLineHeight.value = t.lineHeight || 1.4;
    themeLineHeightVal.textContent = t.lineHeight || 1.4;
    themeLetterSpacing.value = t.letterSpacing || 0;
    themeLetterSpacingVal.textContent = `${t.letterSpacing || 0} px`;

    setToggleBtn(btnBold, !!t.isBold);
    setToggleBtn(btnItalic, !!t.isItalic);
    setToggleBtn(btnUppercase, !!t.isUppercase);

    themeColorInput.value = t.fontColor || '#ffffff';

    // Sombra
    themeShadowColorInput.value = t.textShadowColor || '#000000';
    themeShadowOpacity.value = t.textShadowOpacity ?? 0.8;
    themeShadowOpacityVal.textContent = `${Math.round((t.textShadowOpacity ?? 0.8) * 100)}%`;
    themeShadowBlur.value = t.textShadowBlur ?? 8;
    themeShadowBlurVal.textContent = `${t.textShadowBlur ?? 8} px`;

    // Glow
    const hasGlow = !!t.hasGlow;
    setToggleBtn(btnToggleGlow, hasGlow);
    glowControls.classList.toggle('hidden', !hasGlow);
    themeGlowColor.value = t.glowColor || '#ffffff';
    themeGlowBlur.value = t.glowBlur ?? 10;
    themeGlowBlurVal.textContent = `${t.glowBlur ?? 10} px`;

    // Contorno
    const hasStroke = !!t.hasStroke;
    setToggleBtn(btnToggleStroke, hasStroke);
    strokeControls.classList.toggle('hidden', !hasStroke);
    themeStrokeColor.value = t.strokeColor || '#000000';
    themeStrokeWidth.value = t.strokeWidth || 1;
    themeStrokeWidthVal.textContent = `${t.strokeWidth || 1} px`;

    // Caja de relleno
    const hasFillBox = !!t.hasFillBox;
    setToggleBtn(btnToggleFillbox, hasFillBox);
    fillboxControls.classList.toggle('hidden', !hasFillBox);
    themeFillboxColor.value = t.fillBoxColorHex || '#000000';
    themeFillboxOpacity.value = t.fillBoxOpacity ?? 0.5;
    themeFillboxOpacityVal.textContent = `${Math.round((t.fillBoxOpacity ?? 0.5) * 100)}%`;
    themeFillboxPadding.value = t.fillBoxPadding ?? 15;
    themeFillboxPaddingVal.textContent = `${t.fillBoxPadding ?? 15} px`;

    // Margen
    themePadding.value = t.textPadding ?? 40;
    themePaddingVal.textContent = `${t.textPadding ?? 40} px`;

    setAlignH(t.alignH || 'center');
    setAlignV(t.alignV || 'center');

    // Título Biblia
    themeTitlePos.value = t.verseTitlePos || 'top';
    titleBarControls.classList.toggle('hidden', !themeTitlePos.value.startsWith('bar-'));
    themeTitleBarColor.value = t.titleBarColorHex || '#000000';
    themeTitleBarOpacity.value = t.titleBarOpacity ?? 0.6;
    themeTitleBarOpacityVal.textContent = `${Math.round((t.titleBarOpacity ?? 0.6) * 100)}%`;
    const hideComments = t.hideComments !== undefined ? t.hideComments : true;
    setToggleBtn(btnToggleComments, hideComments);

    // Fondo
    themeBgTypeSelect.value = t.bgType || 'color';
    handleBgTypeChange();
    if (t.bgType === 'color') {
        themeBgColorInput.value = t.bgPath || '#131316';
    } else {
        themeBgMediaSelect.value = t.bgPath || '';
    }

    // Video fx
    themeBrightness.value = t.videoBrightness ?? 100;
    themeBrightnessVal.textContent = `${t.videoBrightness ?? 100}%`;
    themeVideoOpacity.value = t.videoOpacity ?? 100;
    themeVideoOpacityVal.textContent = `${t.videoOpacity ?? 100}%`;
    themeVideoSpeed.value = t.videoSpeed ?? 1;
    themeVideoSpeedVal.textContent = `${t.videoSpeed ?? 1}×`;

    btnDeleteTheme.disabled = t.id === 'default';
    updatePreview();
}

function handleBgTypeChange() {
    const type = themeBgTypeSelect.value;
    groupBgColor.style.display = type === 'color' ? 'flex' : 'none';
    groupBgMedia.style.display = type !== 'color' ? 'flex' : 'none';
    groupBgVideoFx.style.display = type === 'video' ? 'block' : 'none';
    updatePreview();
}

function setAlignH(align) {
    activeAlignH = align;
    document.querySelectorAll('#align-h-grid .btn-align').forEach(btn => btn.classList.toggle('active', btn.dataset.align === align));
    updatePreview();
}
function setAlignV(align) {
    activeAlignV = align;
    document.querySelectorAll('#align-v-grid .btn-align').forEach(btn => btn.classList.toggle('active', btn.dataset.align === align));
    updatePreview();
}

// ================= VISTA PREVIA =================

function updatePreview() {
    const padding = parseInt(themePadding.value);
    themePreviewBox.style.setProperty('--theme-font-size', themeSizeSlider.value);
    themePreviewBox.style.setProperty('--theme-line-height', themeLineHeight.value);
    themePreviewBox.style.setProperty('--theme-letter-spacing', `${themeLetterSpacing.value}px`);
    themePreviewBox.style.setProperty('--theme-padding', padding);

    // Fuente
    previewTextContent.style.fontFamily = themeFontSelect.value;
    previewTextContent.style.color = themeColorInput.value;
    previewTextContent.style.fontWeight = btnBold.dataset.active === 'true' ? 'bold' : 'normal';
    previewTextContent.style.fontStyle = btnItalic.dataset.active === 'true' ? 'italic' : 'normal';
    previewTextContent.style.textTransform = btnUppercase.dataset.active === 'true' ? 'uppercase' : 'none';

    // Sombra + Glow combinados en text-shadow
    const shadowColor = hexToRgba(themeShadowColorInput.value, parseFloat(themeShadowOpacity.value));
    const blur = themeShadowBlur.value;
    let shadows = `2px 2px ${blur}px ${shadowColor}`;

    if (btnToggleGlow.dataset.active === 'true') {
        const glowColor = themeGlowColor.value;
        const glowB = themeGlowBlur.value;
        shadows += `, 0 0 ${glowB}px ${glowColor}, 0 0 ${parseInt(glowB) * 2}px ${glowColor}`;
    }
    previewTextContent.style.textShadow = shadows;

    // Contorno
    previewTextContent.style.webkitTextStroke = btnToggleStroke.dataset.active === 'true'
        ? `${themeStrokeWidth.value}px ${themeStrokeColor.value}`
        : '0px transparent';

    // Caja de relleno
    if (btnToggleFillbox.dataset.active === 'true') {
        previewTextBox.style.backgroundColor = hexToRgba(themeFillboxColor.value, parseFloat(themeFillboxOpacity.value));
        previewTextBox.style.padding = `${themeFillboxPadding.value}px`;
        previewTextBox.style.borderRadius = '6px';
    } else {
        previewTextBox.style.backgroundColor = 'transparent';
        previewTextBox.style.padding = '0';
    }

    // Título
    [previewTitleBarTop, previewTitleBarBottom, previewTitleInlineTop, previewTitleInlineBottom].forEach(el => el.style.display = 'none');
    const tPos = themeTitlePos.value;
    if (tPos === 'top') {
        previewTitleInlineTop.style.display = 'block';
        previewTitleInlineTop.style.color = themeColorInput.value;
    } else if (tPos === 'bottom') {
        previewTitleInlineBottom.style.display = 'block';
        previewTitleInlineBottom.style.color = themeColorInput.value;
    } else if (tPos.startsWith('bar-')) {
        const barColor = hexToRgba(themeTitleBarColor.value, parseFloat(themeTitleBarOpacity.value));
        const el = tPos === 'bar-top' ? previewTitleBarTop : previewTitleBarBottom;
        el.style.display = 'block';
        el.style.backgroundColor = barColor;
        el.style.color = '#ffffff';
    }

    // Alineación
    previewTextOverlay.style.justifyContent = activeAlignH === 'left' ? 'flex-start' : activeAlignH === 'right' ? 'flex-end' : 'center';
    previewTextOverlay.style.alignItems = activeAlignV === 'top' ? 'flex-start' : activeAlignV === 'bottom' ? 'flex-end' : 'center';
    previewTextContent.style.textAlign = activeAlignH;

    // Fondo
    const bgType = themeBgTypeSelect.value;
    previewBgImage.style.display = 'none';
    previewBgVideo.style.display = 'none';
    previewBgVideo.pause();

    if (bgType === 'color') {
        themePreviewBox.style.backgroundColor = themeBgColorInput.value;
    } else {
        themePreviewBox.style.backgroundColor = '#000';
        const url = themeBgMediaSelect.value;
        if (url) {
            if (bgType === 'image') {
                previewBgImage.src = url;
                previewBgImage.style.display = 'block';
                previewBgImage.style.filter = `brightness(${themeBrightness.value}%)`;
                previewBgImage.style.opacity = themeVideoOpacity.value / 100;
            } else if (bgType === 'video') {
                if (previewBgVideo.src !== url) previewBgVideo.src = url;
                previewBgVideo.style.display = 'block';
                previewBgVideo.style.filter = `brightness(${themeBrightness.value}%)`;
                previewBgVideo.style.opacity = themeVideoOpacity.value / 100;
                previewBgVideo.playbackRate = parseFloat(themeVideoSpeed.value);
                previewBgVideo.play().catch(() => {});
            }
        }
    }
}

// ================= GUARDADO =================

function createNewTheme() {
    const newId = `theme-${Date.now()}`;
    settingsData.themes.push({
        id: newId, name: 'Nuevo Tema',
        fontFamily: 'Segoe UI', fontSize: 5,
        lineHeight: 1.4, letterSpacing: 0,
        isBold: false, isItalic: false, isUppercase: false,
        fontColor: '#ffffff',
        textShadowColor: '#000000', textShadowOpacity: 0.8, textShadowBlur: 8,
        hasGlow: false, glowColor: '#ffffff', glowBlur: 10,
        hasStroke: false, strokeColor: '#000000', strokeWidth: 1,
        hasFillBox: false, fillBoxColorHex: '#000000', fillBoxOpacity: 0.5, fillBoxPadding: 15,
        textPadding: 40,
        verseTitlePos: 'top', titleBarColorHex: '#000000', titleBarOpacity: 0.6,
        hideComments: true, alignH: 'center', alignV: 'center',
        bgType: 'color', bgPath: '#131316',
        videoBrightness: 100, videoOpacity: 100, videoSpeed: 1
    });
    loadThemeForEditing(newId);
    showStatus('✓ Tema creado.');
}

async function saveActiveTheme() {
    const idx = settingsData.themes.findIndex(t => t.id === selectedThemeId);
    if (idx === -1) return;
    const t = settingsData.themes[idx];

    t.name = themeNameInput.value.trim() || 'Tema sin nombre';
    t.fontFamily = themeFontSelect.value;
    t.fontSize = parseFloat(themeSizeSlider.value);
    t.lineHeight = parseFloat(themeLineHeight.value);
    t.letterSpacing = parseInt(themeLetterSpacing.value);
    t.isBold = btnBold.dataset.active === 'true';
    t.isItalic = btnItalic.dataset.active === 'true';
    t.isUppercase = btnUppercase.dataset.active === 'true';
    t.fontColor = themeColorInput.value;

    t.textShadowColor = themeShadowColorInput.value;
    t.textShadowOpacity = parseFloat(themeShadowOpacity.value);
    t.textShadowBlur = parseInt(themeShadowBlur.value);

    t.hasGlow = btnToggleGlow.dataset.active === 'true';
    t.glowColor = themeGlowColor.value;
    t.glowBlur = parseInt(themeGlowBlur.value);

    t.hasStroke = btnToggleStroke.dataset.active === 'true';
    t.strokeColor = themeStrokeColor.value;
    t.strokeWidth = parseFloat(themeStrokeWidth.value);

    t.hasFillBox = btnToggleFillbox.dataset.active === 'true';
    t.fillBoxColorHex = themeFillboxColor.value;
    t.fillBoxOpacity = parseFloat(themeFillboxOpacity.value);
    t.fillBoxPadding = parseInt(themeFillboxPadding.value);

    t.textPadding = parseInt(themePadding.value);
    t.alignH = activeAlignH;
    t.alignV = activeAlignV;

    t.verseTitlePos = themeTitlePos.value;
    t.titleBarColorHex = themeTitleBarColor.value;
    t.titleBarOpacity = parseFloat(themeTitleBarOpacity.value);
    t.hideComments = btnToggleComments.dataset.active === 'true';

    t.bgType = themeBgTypeSelect.value;
    t.bgPath = t.bgType === 'color' ? themeBgColorInput.value : themeBgMediaSelect.value;

    t.videoBrightness = parseInt(themeBrightness.value);
    t.videoOpacity = parseInt(themeVideoOpacity.value);
    t.videoSpeed = parseFloat(themeVideoSpeed.value);

    try {
        const result = await window.api.saveSettings(settingsData);
        if (result?.success) {
            window.dispatchEvent(new CustomEvent('settings-updated'));
            renderThemesList();
            renderGlobalSelectors();
            showStatus('✓ Tema guardado con éxito.');
        }
    } catch (e) {
        showStatus('✗ Error al guardar el tema.');
    }
}

async function deleteActiveTheme() {
    if (selectedThemeId === 'default') return;
    if (!confirm('¿Eliminar permanentemente este tema?')) return;
    settingsData.themes = settingsData.themes.filter(t => t.id !== selectedThemeId);
    if (settingsData.defaultBibleTheme === selectedThemeId) settingsData.defaultBibleTheme = 'default';
    if (settingsData.defaultSongsTheme === selectedThemeId) settingsData.defaultSongsTheme = 'default';
    if (settingsData.defaultNotesTheme === selectedThemeId) settingsData.defaultNotesTheme = 'default';
    for (const id in settingsData.songThemes) {
        if (settingsData.songThemes[id] === selectedThemeId) delete settingsData.songThemes[id];
    }
    try {
        await window.api.saveSettings(settingsData);
        window.dispatchEvent(new CustomEvent('settings-updated'));
        loadThemeForEditing('default');
        showStatus('✓ Tema eliminado.');
    } catch (e) {}
}

function showStatus(msg) {
    settingsSaveStatus.textContent = msg;
    setTimeout(() => { settingsSaveStatus.textContent = ''; }, 3000);
}
