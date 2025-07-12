# 📊 FinancePro - Dashboard Financiero

![FinancePro Dashboard](https://img.shields.io/badge/Version-1.0.0-blue) ![License](https://img.shields.io/badge/License-MIT-green) ![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.0+-blue)

**FinancePro** es una aplicación web moderna y responsive para la gestión personal de finanzas. Permite a los usuarios llevar un control detallado de sus ingresos, gastos, ahorros y facturas periódicas con una interfaz intuitiva y visualizaciones interactivas.

<img width="1911" height="1803" alt="dashboardFinanzas-demo-2025-07-12-00_32_09" src="https://github.com/user-attachments/assets/4afb0dad-0d00-4db9-87da-ceaeefd9916a" />

## ✨ Características Principales

### 🎯 **Panel Principal**
- **Dashboard interactivo** con métricas financieras en tiempo real
- **Gráficos dinámicos** de ingresos vs gastos (mensual, trimestral, anual)
- **Comparativas porcentuales** respecto al mes anterior
- **Balance total actualizado** automáticamente

### 💰 **Gestión de Transacciones**
- ✅ Registro de ingresos y gastos con categorización automática
- 🔍 **Sistema de búsqueda y filtrado avanzado** por fecha, categoría y tipo
- 📊 **Categorización inteligente** con colores distintivos
- 🔄 **Estados de transacciones** (Completado/Pendiente)
- 📈 **Contribuciones al ahorro** con seguimiento automático

### 📅 **Facturas Periódicas**
- 🔁 **Gestión de facturas recurrentes** (mensual, bimestral, trimestral, etc.)
- 📋 **Calendario interactivo** de pagos próximos
- 📊 **Análisis de gastos recurrentes** con gráficos de tendencias
- 🎯 **Proyecciones automáticas** de gastos futuros

### 🎯 **Metas de Ahorro**
- 🏦 **Establecimiento de objetivos** de ahorro personalizados
- 📈 **Seguimiento de progreso** con barras de progreso visuales
- 🕒 **Estimaciones de tiempo** para alcanzar metas
- 💡 **Consejos inteligentes** para mejorar el ahorro

### 📊 **Visualizaciones y Reportes**
- 🎨 **Gráficos de dona** para gastos por categoría
- 📈 **Gráficos de líneas** para tendencias temporales
- 📋 **Informes detallados** exportables a PDF y Excel
- 🎨 **Interfaz moderna** con Tailwind CSS

### 🔔 **Sistema de Notificaciones**
- 🚨 **Alertas automáticas** para facturas próximas
- 📱 **Panel de notificaciones** centralizado
- ✅ **Gestión de notificaciones** leídas/no leídas

## 🛠️ Tecnologías Utilizadas

### Frontend
- **HTML5** - Estructura semántica
- **CSS3** + **Tailwind CSS** - Diseño responsivo y moderno
- **JavaScript (ES6+)** - Lógica de aplicación
- **Chart.js** - Visualizaciones interactivas
- **Font Awesome** - Iconografía

### Librerías de Exportación
- **jsPDF** - Generación de reportes en PDF
- **xlsx.js** - Exportación a Excel
- **jsPDF-AutoTable** - Tablas en PDF

### Almacenamiento
- **LocalStorage** - Persistencia de datos en el navegador

## 🚀 Instalación y Uso

### Instalación Rápida

1. **Clona el repositorio:**
```bash
git clone https://github.com/JoanMike/dashboardFinanzas-demo.git
cd dashboardFinanzas-demo
```

2. **Abre en un servidor local:**
```bash
# Usando Python 3
python -m http.server 8000

# Usando Node.js con http-server
npx http-server

# O simplemente abre index.html en tu navegador
```

3. **Accede a la aplicación:**
```
http://localhost:8000
```

### 📱 **Uso Inmediato**
- ✅ **No requiere instalación** de dependencias
- 🌐 **Funciona offline** después de la primera carga
- 📱 **Totalmente responsive** - funciona en móviles y tablets
- 🎮 **Modo DEMO** incluido con datos de ejemplo

## 📁 Estructura del Proyecto

```
dashboardFinanzas-demo/
├── 📄 index.html           # Página principal
├── 📁 css/
│   └── 🎨 styles.css       # Estilos personalizados
├── 📁 js/
│   ├── 🧠 model.js         # Modelo de datos y lógica de negocio
│   ├── 📊 charts.js        # Configuración de gráficos
│   └── ⚡ main.js          # Lógica principal de la aplicación
├── 📄 README.md            # Documentación
└── 📄 LICENSE.md           # Licencia MIT
```

## 🎮 Funcionalidades Clave

### 💸 **Gestión de Transacciones**
```javascript
// Ejemplo de uso
const transaction = {
    name: "Salario Mensual",
    type: "income",
    category: "Salario",
    amount: 3000,
    date: "2025-07-01",
    status: "Completado"
};
```

### 📅 **Facturas Automáticas**
- **Frecuencias soportadas:** Mensual, Bimestral, Trimestral, Semestral, Anual
- **Cálculo automático** de próximos vencimientos
- **Alertas proactivas** 7 días antes del vencimiento

### 📊 **Métricas en Tiempo Real**
- Balance total actualizado instantáneamente
- Comparativas porcentuales automáticas
- Progreso de metas de ahorro en vivo

## 🔧 Configuración Avanzada

### 🎨 **Personalización de Categorías**
Las categorías están definidas en `js/model.js`:

```javascript
const EXPENSE_CATEGORIES = [
    'Alimentación', 'Vivienda', 'Transporte',
    'Entretenimiento', 'Salud', 'Educación'
    // Añade más categorías aquí
];
```

### 🌐 **Configuración de Moneda**
Por defecto usa Soles Peruanos (S/). Para cambiar:

```javascript
function formatCurrency(amount, currency = "$") {
    // Personaliza la moneda aquí
}
```

## 📊 **Ejemplos de Uso**

### Registrar una Nueva Transacción
1. Haz clic en "Nueva Transacción"
2. Selecciona el tipo (Ingreso/Gasto)
3. Completa los datos requeridos
4. Marca "Contribución al ahorro" si aplica
5. Para gastos recurrentes, marca "Factura periódica"

### Exportar Reportes
1. Ve a "Ver Todas las Transacciones"
2. Aplica los filtros deseados
3. Haz clic en "Exportar a PDF" o "Exportar a Excel"

### Configurar Meta de Ahorro
1. En el panel de "Meta de Ahorro", haz clic en "Editar Meta"
2. Establece tu objetivo y monto actual
3. El sistema calculará automáticamente el progreso

## 🎯 **Roadmap Futuro**

- [ ] 🔐 **Autenticación de usuarios**
- [ ] ☁️ **Sincronización en la nube**
- [ ] 📊 **Más tipos de gráficos**
- [ ] 💱 **Soporte multi-moneda**
- [ ] 📱 **Aplicación móvil nativa**
- [ ] 🤖 **Categorización automática con IA**
- [ ] 🔗 **Integración con bancos**
- [ ] 📈 **Análisis predictivo**

## 🤝 **Contribuir**

¡Las contribuciones son bienvenidas! Para contribuir:

1. **Fork** el proyecto
2. Crea una **branch** para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add: AmazingFeature'`)
4. **Push** a la branch (`git push origin feature/AmazingFeature`)
5. Abre un **Pull Request**

### 🐛 **Reportar Bugs**
Si encuentras un bug, por favor [abre un issue](https://github.com/JoanMike/dashboardFinanzas-demo/issues) con:
- Descripción detallada del problema
- Pasos para reproducir
- Screenshots si es aplicable

## 📄 **Licencia**

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE.md](LICENSE.md) para más detalles.

## 👨‍💻 **Autor**

**Jose Miguel**
- GitHub: [@JoanMike](https://github.com/JoanMike)
- Proyecto: [FinancePro Dashboard](https://github.com/JoanMike/dashboardFinanzas-demo)

## 🙏 **Agradecimientos**

- [Chart.js](https://www.chartjs.org/) por las visualizaciones
- [Tailwind CSS](https://tailwindcss.com/) por el framework de CSS
- [Font Awesome](https://fontawesome.com/) por los iconos
- [jsPDF](https://github.com/parallax/jsPDF) por la generación de PDFs

---

⭐ **¡Si te gusta este proyecto, no olvides darle una estrella!** ⭐

### 🎮 **Demo Live**
🔗 **[Ver Demo en Vivo](https://joanmike.github.io/dashboardFinanzas-demo)** *(Próximamente)*

---

*Hecho con ❤️ para ayudar a las personas a tomar control de sus finanzas personales.*
