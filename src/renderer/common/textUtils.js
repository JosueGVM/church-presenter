/**
 * textUtils.js — Utilidades compartidas de procesamiento de texto para proyección.
 * Usadas por bible/script.js y songs/script.js
 */

/**
 * Divide un texto en chunks que no superen `limit` caracteres.
 * Nunca corta a mitad de una palabra — retrocede al último espacio.
 * Agrega "..." al final de cada chunk intermedio y "..." al inicio del siguiente.
 *
 * @param {string} text     — Texto a dividir
 * @param {number} limit    — Máximo de caracteres por chunk (0 = sin división)
 * @returns {string[]}      — Array de strings listos para proyectar
 */
export function splitTextByWords(text, limit) {
    if (!limit || limit === 0) return [text];

    const trimmed = text.trim();
    if (trimmed.length <= limit) return [trimmed];

    const chunks = [];
    let remaining = trimmed;

    while (remaining.length > 0) {
        const isFirst = chunks.length === 0;
        // El prefijo "..." del chunk de continuación ocupa 3 chars
        const effectiveLimit = isFirst ? limit : limit - 3;

        if (remaining.length <= effectiveLimit) {
            chunks.push(isFirst ? remaining : '...' + remaining);
            break;
        }

        // Buscar el último espacio dentro del límite para no cortar palabras
        let cutAt = effectiveLimit;
        while (cutAt > 0 && remaining[cutAt] !== ' ') {
            cutAt--;
        }
        // Si no encontramos espacio (palabra muy larga), cortar en duro
        if (cutAt === 0) cutAt = effectiveLimit;

        const slice = remaining.slice(0, cutAt).trimEnd();
        chunks.push(isFirst ? slice + '...' : '...' + slice + '...');
        remaining = remaining.slice(cutAt).trimStart();
    }

    return chunks;
}
