console.log("¡HOLA! El archivo script.js de proyección se ha cargado con éxito.");

const displayTexto = document.getElementById('texto-proyectado');


// Escuchar el evento de actualización de proyección
window.api.alActualizarProyeccion((datos) => {
    console.log("4. Proyección recibió el texto:", datos); 
    // Desvanecer el texto viejo antes de mostrar el nuevo (transición fluida)
    displayTexto.classList.remove('active');
    
    setTimeout(() => {
        displayTexto.textContent = datos.texto;
        displayTexto.classList.add('active');
        console.log("5. Texto aplicado en el HTML y clase 'active' añadida.");
    }, 150); // Pequeño retraso para que ocurra la transición de salida
});


// Escuchar el evento para limpiar pantalla
window.api.alLimpiarPantalla(() => {
    displayTexto.classList.remove('active');
    setTimeout(() => {
        displayTexto.textContent = '';
    }, 300);
});