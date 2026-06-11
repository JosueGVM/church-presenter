# church-display

Un centro de control y proyección multiplataforma optimizado para la presentación de pasajes bíblicos, letras de canciones y contenido multimedia en pantallas secundarias o proyectores.

Este proyecto ha sido rediseñado desde cero utilizando una arquitectura modular, escalable y segura bajo **Electron, HTML, CSS y JavaScript (Node.js)**.

## Características Principales

*   **Doble ventana (Escalable):** Interfaz del operador independiente de la ventana de proyección a pantalla completa.
*   **Bases de datos independientes:** Almacenamiento separado para Biblias, canciones y configuración del usuario para evitar la corrupción de datos y optimizar las consultas.
*   **Multiplataforma:** Capacidad de exportación a Windows (.exe), Linux y macOS.
*   **Bajo consumo:** Optimización de recursos para transiciones fluidas y reproducción de fondos de video.

## Arquitectura del Proyecto

La estructura de archivos está organizada para mantener la separación de responsabilidades:
*   `database/`: Contiene los archivos físicos de bases de datos locales (Biblias, música y configuración).
*   `src/main/`: Lógica del proceso principal de Node.js, control de las ventanas y gestión del motor de bases de datos.
*   `src/preload/`: Canales de comunicación segura (IPC) que comunican la interfaz visual con las funciones del sistema.
*   `src/renderer/`: Vistas e interfaces visuales de usuario divididas en dos entornos independientes:
    *   `control/`: Panel de administración del operador.
    *   `projection/`: Pantalla de salida limpia para el proyector.

## Tecnologías Utilizadas

*   [Electron](https://www.electronjs.org/)
*   [SQLite3](https://sqlite.org/) (Gestión local de bases de datos para Biblias y Música)
*   HTML5, CSS3, JavaScript (ES6+)

## Instalación y Configuración

1.  Clona este repositorio:
    ```bash
    git clone https://github.com/JosueGVM/church-display.git
    ```
2.  Entra al directorio del proyecto:
    ```bash
    cd church-display
    ```
3.  Instala las dependencias necesarias:
    ```bash
    npm install
    ```
4.  Inicia la aplicación en modo de desarrollo:
    ```bash
    npm start
    ```

## Licencia

Este proyecto se distribuye bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.