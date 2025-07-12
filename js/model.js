// --- Constantes y configuración ---
const STORAGE_KEY = 'financeProTransactions';
const SAVINGS_KEY = 'financeProSavings';
const NOTIFICATION_STORAGE_KEY = 'financeProNotifications';

// Mapa de colores por categoría (Fuente única de verdad)
const CATEGORY_COLORS = {
    'Alimentación': '#22c55e',
    'Vivienda': '#8b5cf6',
    'Transporte': '#3b82f6',
    'Entretenimiento': '#f59e0b',
    'Salud': '#10b981',
    'Educación': '#ec4899',
    'Ropa': '#a855f7',
    'Inversión': '#6366f1',
    'Servicios': '#e879f9',
    'Seguros': '#eab308',
    'Deudas': '#ef4444',
    'Otros': '#6b7280',
    'Salario': '#16a34a',
    'Ingresos Freelance': '#2563eb',
    'Inversiones': '#db2777',
    'Regalos': '#9333ea',
    'Reembolsos': '#0891b2',
    'Alquileres': '#4f46e5',
    'Ventas': '#d97706',
    'Ahorro': '#14b8a6', // Añadido color para categoría de Ahorro
    'Sin Categoría': '#9CA3AF' // Un color para transacciones sin categoría
};

// Categorías predefinidas para gastos e ingresos
const EXPENSE_CATEGORIES = [
    'Alimentación',
    'Vivienda',
    'Transporte',
    'Entretenimiento',
    'Salud',
    'Educación',
    'Ropa',
    'Inversión',
    'Servicios',
    'Seguros',
    'Deudas',
    'Ahorro', // Retiro de ahorros
    'Otros'
];

const INCOME_CATEGORIES = [
    'Salario',
    'Ingresos Freelance',
    'Inversiones',
    'Regalos',
    'Reembolsos',
    'Alquileres',
    'Ventas',
    'Ahorro', // Depósito a ahorros
    'Otros'
];

// Default data if localStorage is empty
const defaultTransactions = [
    { id: 1, icon: 'fas fa-home', name: 'Alquiler Mensual', category: 'Vivienda', date: '2025-03-15', amount: -1500.00, status: 'Completado', type: 'expense', isSavingsContribution: false, isBill: true, frequency: 'monthly' },
    { id: 2, icon: 'fas fa-briefcase', name: 'Depósito de Salario', category: 'Ingresos', date: '2025-03-10', amount: 4300.00, status: 'Completado', type: 'income', isSavingsContribution: false, isBill: false },
    { id: 3, icon: 'fas fa-film', name: 'Suscripción Netflix', category: 'Entretenimiento', date: '2025-03-08', amount: -14.99, status: 'Completado', type: 'expense', isSavingsContribution: false, isBill: true, frequency: 'monthly' },
    { id: 4, icon: 'fas fa-shopping-cart', name: 'Compras Supermercado', category: 'Alimentación', date: '2025-03-05', amount: -120.50, status: 'Completado', type: 'expense', isSavingsContribution: false, isBill: false },
    { id: 5, icon: 'fas fa-chart-line', name: 'Inversión en Acciones', category: 'Inversión', date: '2025-03-01', amount: -500.00, status: 'Pendiente', type: 'expense', isSavingsContribution: false, isBill: false },
    { id: 6, icon: 'fas fa-utensils', name: 'Restaurante Cena', category: 'Alimentación', date: '2025-02-18', amount: -65.00, status: 'Completado', type: 'expense', isSavingsContribution: false, isBill: false },
    { id: 7, icon: 'fas fa-gas-pump', name: 'Gasolina', category: 'Transporte', date: '2025-02-20', amount: -55.00, status: 'Completado', type: 'expense', isSavingsContribution: false, isBill: false },
    { id: 8, icon: 'fas fa-file-invoice-dollar', name: 'Pago Freelance', category: 'Ingresos', date: '2025-02-22', amount: 850.00, status: 'Completado', type: 'income', isSavingsContribution: false, isBill: false },
    { id: 9, icon: 'fas fa-briefcase', name: 'Depósito de Salario', category: 'Ingresos', date: '2025-02-10', amount: 4300.00, status: 'Completado', type: 'income', isSavingsContribution: false, isBill: false },
    { id: 10, icon: 'fas fa-piggy-bank', name: 'Aportación a Ahorro', category: 'Ahorro', date: '2025-03-10', amount: -500.00, status: 'Completado', type: 'expense', isSavingsContribution: true, isBill: false },
    { id: 11, icon: 'fas fa-wifi', name: 'Internet y Teléfono', category: 'Servicios', date: '2025-03-15', amount: -89.99, status: 'Completado', type: 'expense', isSavingsContribution: false, isBill: true, frequency: 'monthly' },
    { id: 12, icon: 'fas fa-bolt', name: 'Agua y Electricidad', category: 'Servicios', date: '2025-03-10', amount: -145.50, status: 'Completado', type: 'expense', isSavingsContribution: false, isBill: true, frequency: 'monthly' },
    { id: 13, icon: 'fas fa-credit-card', name: 'Tarjeta de Crédito', category: 'Deudas', date: '2025-03-05', amount: -1250.00, status: 'Completado', type: 'expense', isSavingsContribution: false, isBill: true, frequency: 'monthly' },
];

// Default Notifications
const defaultNotifications = [
    { id: Date.now() + 1, message: 'Nueva transacción: Depósito de Salario añadida.', type: 'info', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), read: false }, // 5 mins ago
    { id: Date.now() + 2, message: 'Factura "Tarjeta de Crédito" vence pronto.', type: 'warning', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), read: false }, // 2 hours ago
    { id: Date.now() + 3, message: 'Meta de ahorro actualizada.', type: 'success', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), read: true }, // 1 day ago
];

// Frecuencias disponibles para facturas
const BILL_FREQUENCIES = [
    { value: 'monthly', label: 'Mensual' },
    { value: 'bimonthly', label: 'Bimestral' },
    { value: 'quarterly', label: 'Trimestral' },
    { value: 'semiannual', label: 'Semestral' },
    { value: 'annual', label: 'Anual' }
];

// --- Estado Global ---
let allTransactions = [];
let filteredTransactions = [];
let isEditing = false;
let editingId = null;
let savingsGoal = 10000;
let currentSavings = 0; // Inicializado a 0, se calculará basado en las transacciones
let upcomingBills = []; // Se calculará basado en las transacciones

// --- Estado Notificaciones ---
let allNotifications = [];
let isNotificationPanelOpen = false;

// --- Funciones para localStorage ---
function loadTransactions() {
    const storedTransactions = localStorage.getItem(STORAGE_KEY);
    if (storedTransactions) {
        allTransactions = JSON.parse(storedTransactions);
    } else {
        // Use default data and save it if nothing is stored
        allTransactions = defaultTransactions.map(t => ({ ...t, id: t.id || Date.now() })); // Ensure IDs
        saveTransactions();
    }
    // Initialize filtered transactions
    filteredTransactions = [...allTransactions];

    // Cargar meta de ahorro guardada
    loadSavingsGoal();
    loadNotifications();

    // Calcular ahorro actual basado en transacciones
    calculateCurrentSavings();

    // Generar facturas próximas basadas en transacciones existentes
    generateUpcomingBills();
}

function saveTransactions() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allTransactions));
}

function loadNotifications() {
    const storedNotifications = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (storedNotifications) {
        allNotifications = JSON.parse(storedNotifications);
    } else {
        allNotifications = [...defaultNotifications]; // Use default if nothing stored
        saveNotifications();
    }
}

function saveNotifications() {
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(allNotifications));
}

function saveSavingsData(goal, current) {
    const savingsData = { goal, current };
    localStorage.setItem(SAVINGS_KEY, JSON.stringify(savingsData));
}

function loadSavingsGoal() {
    const savedData = localStorage.getItem(SAVINGS_KEY);
    if (savedData) {
        const { goal, current } = JSON.parse(savedData);
        // Actualizar variables globales
        savingsGoal = goal;
        // No establecemos currentSavings aquí, ya que se calculará basado en transacciones
    } else {
        // Si no hay datos guardados, usar el valor predeterminado y guardarlo
        saveSavingsData(savingsGoal, 0);
    }
}

function calculateCurrentSavings() {
    // Filtrar solo transacciones completadas y marcadas como contribuciones al ahorro
    const savingsTransactions = allTransactions.filter(t =>
        t.status === 'Completado' && t.isSavingsContribution === true);

    // Sumar las contribuciones (negativo para gastos, positivo para ingresos)
    currentSavings = savingsTransactions.reduce((total, transaction) => {
        // Los ingresos (depósitos a ahorro) suman positivo, los gastos (retiros) suman negativo
        return total + (transaction.type === 'income' ? Math.abs(transaction.amount) : -Math.abs(transaction.amount));
    }, 0);

    // Actualizar localStorage
    saveSavingsData(savingsGoal, currentSavings);
}

function updateSavingsGoal(newGoal, newCurrentSavings) {
    savingsGoal = newGoal;
    // Si se proporciona un valor manualmente, actualizamos currentSavings
    if (newCurrentSavings !== undefined) {
        currentSavings = newCurrentSavings;
    }
    saveSavingsData(savingsGoal, currentSavings);
    addNotification('Meta de ahorro actualizada.', 'success');
    renderDashboard();
}

// --- Funciones Helper ---
function getIconForCategory(category, type) {
    const lowerCategory = category.toLowerCase();
    if (type === 'income') {
        if (lowerCategory.includes('ahorro')) return 'fas fa-piggy-bank';
        return 'fas fa-briefcase'; // Default income icon
    }

    // Expense icons
    if (lowerCategory.includes('vivienda') || lowerCategory.includes('alquiler')) return 'fas fa-home';
    if (lowerCategory.includes('entretenimiento') || lowerCategory.includes('netflix')) return 'fas fa-film';
    if (lowerCategory.includes('alimentación') || lowerCategory.includes('supermercado') || lowerCategory.includes('restaurante')) return 'fas fa-utensils';
    if (lowerCategory.includes('inversión')) return 'fas fa-chart-line';
    if (lowerCategory.includes('transporte') || lowerCategory.includes('gasolina')) return 'fas fa-gas-pump';
    if (lowerCategory.includes('compras')) return 'fas fa-shopping-cart';
    if (lowerCategory.includes('otros')) return 'fas fa-tag'; // Icono para la categoría Otros
    if (lowerCategory.includes('salud')) return 'fas fa-medkit'; // Icono para Salud
    if (lowerCategory.includes('educación')) return 'fas fa-graduation-cap'; // Icono para Educación
    if (lowerCategory.includes('ropa')) return 'fas fa-tshirt'; // Icono para Ropa
    if (lowerCategory.includes('servicios')) return 'fas fa-tools'; // Icono para Servicios
    if (lowerCategory.includes('seguros')) return 'fas fa-shield-alt'; // Icono para Seguros
    if (lowerCategory.includes('deudas')) return 'fas fa-hand-holding-usd'; // Icono para Deudas
    if (lowerCategory.includes('ahorro')) return 'fas fa-piggy-bank'; // Icono para Ahorro
    return 'fas fa-dollar-sign'; // Default expense icon
}

// --- Funciones para facturas ---
function generateUpcomingBills() {
    const now = new Date();
    upcomingBills = []; // Limpiar lista de facturas próximas

    // Filtrar transacciones que son facturas
    const billTransactions = allTransactions.filter(t => t.isBill && t.frequency && t.type === 'expense');

    // Agrupar facturas por nombre para encontrar la más reciente de cada tipo
    const billGroups = {};
    billTransactions.forEach(bill => {
        const key = bill.name.toLowerCase().trim();
        if (!billGroups[key] || new Date(bill.date) > new Date(billGroups[key].date)) {
            billGroups[key] = bill;
        }
    });

    // Para cada factura recurrente, calcular la próxima fecha de vencimiento
    Object.values(billGroups).forEach(bill => {
        const lastDate = new Date(bill.date);
        let nextDate = new Date(lastDate);

        // Calcular próxima fecha según frecuencia
        switch (bill.frequency) {
            case 'monthly':
                nextDate.setMonth(nextDate.getMonth() + 1);
                break;
            case 'bimonthly':
                nextDate.setMonth(nextDate.getMonth() + 2);
                break;
            case 'quarterly':
                nextDate.setMonth(nextDate.getMonth() + 3);
                break;
            case 'semiannual':
                nextDate.setMonth(nextDate.getMonth() + 6);
                break;
            case 'annual':
                nextDate.setFullYear(nextDate.getFullYear() + 1);
                break;
        }

        // Solo incluir si la fecha es en el futuro
        if (nextDate > now) {
            // Calcular días restantes
            const daysRemaining = Math.ceil((nextDate - now) / (1000 * 60 * 60 * 24));

            // Formatear texto de vencimiento
            let dueText = '';
            if (daysRemaining === 0) {
                dueText = 'vence hoy';
            } else if (daysRemaining === 1) {
                dueText = 'vence mañana';
            } else if (daysRemaining <= 30) {
                dueText = `vence en ${daysRemaining} días`;
            } else {
                const dueDate = nextDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                dueText = `vence el ${dueDate}`;
            }

            upcomingBills.push({
                id: Date.now() + Math.random(), // Generar ID único
                name: bill.name,
                icon: bill.icon,
                amount: Math.abs(bill.amount),
                dueDate: dueText,
                daysRemaining: daysRemaining,
                frequency: bill.frequency,
                originalId: bill.id,
                nextDate: nextDate.toISOString().split('T')[0]
            });
        }
    });

    // Ordenar por días restantes (los más cercanos primero)
    upcomingBills.sort((a, b) => a.daysRemaining - b.daysRemaining);

    // Si hay facturas que vencen en menos de 5 días, generar notificaciones
    upcomingBills.forEach(bill => {
        if (bill.daysRemaining <= 5 && bill.daysRemaining > 0) {
            // Verificar si ya existe una notificación para esta factura
            const existingNotification = allNotifications.some(
                n => n.message.includes(bill.name) && n.type === 'warning' && !n.read
            );

            if (!existingNotification) {
                addNotification(`Factura "${bill.name}" ${bill.dueDate}.`, 'warning');
            }
        }
    });
}

// --- Funciones CRUD ---
function addTransaction(newTransaction) {
    const transactionToAdd = {
        ...newTransaction,
        id: Date.now(),
        icon: getIconForCategory(newTransaction.category, newTransaction.type),
        amount: newTransaction.type === 'expense' ? -Math.abs(newTransaction.amount) : Math.abs(newTransaction.amount),
        isSavingsContribution: newTransaction.isSavingsContribution || false,
        isBill: newTransaction.isBill || false,
        frequency: newTransaction.frequency || null
    };
    allTransactions.push(transactionToAdd);
    saveTransactions();

    // Recalcular ahorro actual si es una contribución al ahorro
    if (transactionToAdd.isSavingsContribution) {
        calculateCurrentSavings();
    }

    // Regenerar facturas próximas si es una factura
    if (transactionToAdd.isBill) {
        generateUpcomingBills();
    }

    addNotification(`Nueva transacción '${transactionToAdd.name}' añadida.`, 'success');
    renderDashboard();
}

function updateTransaction(updatedTransaction) {
    const index = allTransactions.findIndex(t => t.id === updatedTransaction.id);
    if (index !== -1) {
        const amount = updatedTransaction.type === 'expense'
            ? -Math.abs(updatedTransaction.amount)
            : Math.abs(updatedTransaction.amount);
        const icon = getIconForCategory(updatedTransaction.category, updatedTransaction.type);
        const oldName = allTransactions[index].name;
        const oldIsSavingsContribution = allTransactions[index].isSavingsContribution;
        const oldIsBill = allTransactions[index].isBill;

        allTransactions[index] = {
            ...allTransactions[index],
            ...updatedTransaction,
            amount,
            icon,
            isSavingsContribution: updatedTransaction.isSavingsContribution || false,
            isBill: updatedTransaction.isBill || false,
            frequency: updatedTransaction.isBill ? (updatedTransaction.frequency || 'monthly') : null
        };
        saveTransactions();

        // Recalcular ahorro si cambió el estado de contribución o es una contribución
        if (oldIsSavingsContribution !== updatedTransaction.isSavingsContribution || updatedTransaction.isSavingsContribution) {
            calculateCurrentSavings();
        }

        // Regenerar facturas próximas si cambió el estado de factura o es una factura
        if (oldIsBill !== updatedTransaction.isBill || updatedTransaction.isBill) {
            generateUpcomingBills();
        }

        addNotification(`Transacción '${oldName}' actualizada.`, 'info');
        renderDashboard();
    }
}

function deleteTransaction(id) {
    const transactionToDelete = allTransactions.find(t => t.id === id);
    if (transactionToDelete) {
        const deleteModal = document.getElementById('delete-confirmation-modal');
        const deleteTransactionIdInput = document.getElementById('delete-transaction-id');
        deleteTransactionIdInput.value = id;
        deleteModal.classList.add('show');
    }
}

function confirmDeleteTransaction() {
    const id = parseInt(document.getElementById('delete-transaction-id').value, 10);
    const transactionToDelete = allTransactions.find(t => t.id === id);
    if (transactionToDelete) {
        const name = transactionToDelete.name;
        const wasSavingsContribution = transactionToDelete.isSavingsContribution;
        const wasBill = transactionToDelete.isBill;

        allTransactions = allTransactions.filter(t => t.id !== id);
        saveTransactions();

        // Recalcular ahorro si era una contribución
        if (wasSavingsContribution) {
            calculateCurrentSavings();
        }

        // Regenerar facturas próximas si era una factura
        if (wasBill) {
            generateUpcomingBills();
        }

        addNotification(`Transacción '${name}' eliminada.`, 'warning');
        renderDashboard();
    }
    closeDeleteModal();
}

function closeDeleteModal() {
    const deleteModal = document.getElementById('delete-confirmation-modal');
    deleteModal.classList.remove('show');
}

// --- Notification Functions ---
function addNotification(message, type = 'info') {
    const newNotification = {
        id: Date.now(),
        message: message,
        type: type, // 'info', 'success', 'warning', 'error'
        timestamp: new Date().toISOString(),
        read: false
    };
    allNotifications.unshift(newNotification);
    if (allNotifications.length > 30) {
        allNotifications.pop();
    }
    saveNotifications();
    renderNotifications();
    updateNotificationBadge();
}

function markNotificationAsRead(id) {
    const index = allNotifications.findIndex(n => n.id === id);
    if (index !== -1 && !allNotifications[index].read) {
        allNotifications[index].read = true;
        saveNotifications();
        renderNotifications();
        updateNotificationBadge();
    }
}

function markAllNotificationsAsRead() {
    let changed = false;
    allNotifications.forEach(n => {
        if (!n.read) {
            n.read = true;
            changed = true;
        }
    });
    if (changed) {
        saveNotifications();
        renderNotifications();
        updateNotificationBadge();
    }
}

// Función para pagar una factura próxima
function payUpcomingBill(billId) {
    const bill = upcomingBills.find(b => b.id === billId);
    if (bill) {
        // Crear una nueva transacción basada en la factura
        const newTransaction = {
            name: bill.name,
            category: findCategoryForBill(bill.name),
            date: bill.nextDate, // Usar la fecha de vencimiento
            amount: bill.amount,
            status: 'Completado',
            type: 'expense',
            isSavingsContribution: false,
            isBill: true,
            frequency: bill.frequency,
            icon: bill.icon
        };

        addTransaction(newTransaction);
        addNotification(`Factura "${bill.name}" pagada.`, 'success');
    }
}

// Función para encontrar la categoría más probable para una factura
function findCategoryForBill(billName) {
    // Buscar transacciones anteriores con el mismo nombre para determinar la categoría
    const previousBill = allTransactions.find(t =>
        t.name.toLowerCase() === billName.toLowerCase() &&
        t.isBill === true
    );

    if (previousBill && previousBill.category) {
        return previousBill.category;
    }

    // Si es nueva, asignar una categoría basada en palabras clave
    const lowerName = billName.toLowerCase();
    if (lowerName.includes('alquiler') || lowerName.includes('hipoteca')) return 'Vivienda';
    if (lowerName.includes('luz') || lowerName.includes('electr') || lowerName.includes('agua')) return 'Servicios';
    if (lowerName.includes('internet') || lowerName.includes('teléfono') || lowerName.includes('móvil')) return 'Servicios';
    if (lowerName.includes('netflix') || lowerName.includes('spotify') || lowerName.includes('suscripción')) return 'Entretenimiento';
    if (lowerName.includes('crédito') || lowerName.includes('préstamo')) return 'Deudas';
    if (lowerName.includes('seguro')) return 'Seguros';

    return 'Otros'; // Categoría por defecto
}

// Hacer funciones disponibles globalmente
window.deleteTransaction = deleteTransaction;
window.addTransaction = addTransaction;
window.updateTransaction = updateTransaction;
window.confirmDeleteTransaction = confirmDeleteTransaction;
window.closeDeleteModal = closeDeleteModal;
window.markNotificationAsRead = markNotificationAsRead;
window.markAllNotificationsAsRead = markAllNotificationsAsRead;
window.updateSavingsGoal = updateSavingsGoal;
window.calculateCurrentSavings = calculateCurrentSavings;
window.generateUpcomingBills = generateUpcomingBills;
window.payUpcomingBill = payUpcomingBill;

// Exportar constantes a window para uso global en todos los módulos
window.CATEGORY_COLORS = CATEGORY_COLORS;
window.EXPENSE_CATEGORIES = EXPENSE_CATEGORIES;
window.INCOME_CATEGORIES = INCOME_CATEGORIES;
window.BILL_FREQUENCIES = BILL_FREQUENCIES;