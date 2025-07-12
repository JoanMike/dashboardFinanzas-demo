// --- Constantes y configuración ---
const ACCOUNTS_STORAGE_KEY = 'financeProAccounts';
const ACCOUNT_TRANSACTIONS_STORAGE_KEY = 'financeProAccountTransactions';

// Tipos de cuentas disponibles
const ACCOUNT_TYPES = [
    { value: 'checking', label: 'Cuenta Corriente', icon: 'fas fa-wallet' },
    { value: 'savings', label: 'Cuenta de Ahorro', icon: 'fas fa-piggy-bank' },
    { value: 'credit', label: 'Tarjeta de Crédito', icon: 'fas fa-credit-card' },
    { value: 'investment', label: 'Inversión', icon: 'fas fa-chart-line' },
    { value: 'cash', label: 'Efectivo', icon: 'fas fa-money-bill-wave' },
    { value: 'loan', label: 'Préstamo', icon: 'fas fa-hand-holding-usd' }
];

// Data predeterminada si localStorage está vacío
const defaultAccounts = [
    {
        id: 1,
        name: 'Cuenta Principal',
        type: 'checking',
        balance: 2500.00,
        currency: 'PEN',
        color: '#3b82f6',
        isMain: true,
        isActive: true,
        createdAt: '2025-01-01'
    },
    {
        id: 2,
        name: 'Ahorros',
        type: 'savings',
        balance: 8500.00,
        currency: 'PEN',
        color: '#10b981',
        isMain: false,
        isActive: true,
        createdAt: '2025-01-05'
    },
    {
        id: 3,
        name: 'Tarjeta VISA',
        type: 'credit',
        balance: -350.50,
        currency: 'PEN',
        color: '#ef4444',
        isMain: false,
        isActive: true,
        limit: 2000.00,
        createdAt: '2025-01-10'
    }
];

// Transacciones predeterminadas para las cuentas
const defaultAccountTransactions = [
    {
        id: 1,
        accountId: 1,
        name: 'Depósito de Salario',
        amount: 4300.00,
        date: '2025-03-10',
        category: 'Salario',
        type: 'income',
        status: 'Completado'
    },
    {
        id: 2,
        accountId: 1,
        name: 'Alquiler Mensual',
        amount: -1500.00,
        date: '2025-03-15',
        category: 'Vivienda',
        type: 'expense',
        status: 'Completado'
    },
    {
        id: 3,
        accountId: 1,
        name: 'Transferencia a Ahorros',
        amount: -500.00,
        date: '2025-03-10',
        category: 'Transferencia',
        type: 'transfer',
        status: 'Completado',
        transferToAccountId: 2
    },
    {
        id: 4,
        accountId: 2,
        name: 'Transferencia desde Principal',
        amount: 500.00,
        date: '2025-03-10',
        category: 'Transferencia',
        type: 'transfer',
        status: 'Completado',
        transferFromAccountId: 1
    },
    {
        id: 5,
        accountId: 3,
        name: 'Compra Electrónica',
        amount: -350.50,
        date: '2025-03-12',
        category: 'Tecnología',
        type: 'expense',
        status: 'Completado'
    }
];

// --- Estado Global ---
let allAccounts = [];
let accountTransactions = [];
let currentAccountId = null;

// --- Funciones para localStorage ---
function loadAccounts() {
    const storedAccounts = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (storedAccounts) {
        allAccounts = JSON.parse(storedAccounts);
    } else {
        // Usar datos predeterminados
        allAccounts = [...defaultAccounts];
        saveAccounts();
    }

    // Cargar transacciones de cuentas
    loadAccountTransactions();

    // Si hay una cuenta principal, establecerla como actual
    const mainAccount = allAccounts.find(acc => acc.isMain);
    if (mainAccount) {
        currentAccountId = mainAccount.id;
    } else if (allAccounts.length > 0) {
        // Si no hay cuenta principal, usar la primera
        currentAccountId = allAccounts[0].id;
    }
}

function saveAccounts() {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(allAccounts));
}

function loadAccountTransactions() {
    const storedTransactions = localStorage.getItem(ACCOUNT_TRANSACTIONS_STORAGE_KEY);
    if (storedTransactions) {
        accountTransactions = JSON.parse(storedTransactions);
    } else {
        // Usar datos predeterminados
        accountTransactions = [...defaultAccountTransactions];
        saveAccountTransactions();
    }
}

function saveAccountTransactions() {
    localStorage.setItem(ACCOUNT_TRANSACTIONS_STORAGE_KEY, JSON.stringify(accountTransactions));
}

// Actualizar saldo de cuenta basado en transacciones
function updateAccountBalances() {
    // Crear copia para mantener propiedades personalizadas
    const updatedAccounts = allAccounts.map(account => ({ ...account }));

    // Para cada cuenta, calcular balance basado en transacciones
    updatedAccounts.forEach(account => {
        // Filtrar transacciones de esta cuenta
        const accountTxs = accountTransactions.filter(tx =>
            tx.accountId === account.id && tx.status === 'Completado');

        // Sumar/restar del balance
        const calculatedBalance = accountTxs.reduce((balance, tx) => {
            return balance + tx.amount;
        }, 0);

        // Si es una cuenta de tipo crédito, el balance típicamente es negativo
        if (account.type === 'credit' || account.type === 'loan') {
            account.balance = -Math.abs(calculatedBalance);
        } else {
            account.balance = calculatedBalance;
        }
    });

    // Actualizar estado global
    allAccounts = updatedAccounts;
    saveAccounts();
}

// --- Funciones CRUD para cuentas ---
function addAccount(accountData) {
    // Crear nueva cuenta con ID único
    const newAccount = {
        ...accountData,
        id: Date.now(),
        balance: accountData.type === 'credit' || accountData.type === 'loan'
            ? -Math.abs(accountData.balance || 0)
            : Math.abs(accountData.balance || 0),
        currency: accountData.currency || 'PEN',
        isActive: true,
        createdAt: new Date().toISOString().split('T')[0]
    };

    // Si es la primera cuenta, hacerla principal
    if (allAccounts.length === 0) {
        newAccount.isMain = true;
    }

    allAccounts.push(newAccount);
    saveAccounts();

    // Si es la primera cuenta, establecerla como actual
    if (allAccounts.length === 1) {
        currentAccountId = newAccount.id;
    }

    // Agregar notificación
    if (typeof addNotification === 'function') {
        addNotification(`Nueva cuenta "${newAccount.name}" añadida.`, 'success');
    }

    return newAccount;
}

function updateAccount(accountData) {
    const index = allAccounts.findIndex(acc => acc.id === accountData.id);
    if (index !== -1) {
        // Mantener balance calculado y otras propiedades importantes
        const updatedAccount = {
            ...allAccounts[index],
            ...accountData
        };

        // Si era la cuenta principal y ahora no lo es, asegurar que haya otra principal
        if (allAccounts[index].isMain && !accountData.isMain) {
            const otherActiveAccount = allAccounts.find(acc =>
                acc.id !== accountData.id && acc.isActive);

            if (otherActiveAccount) {
                // Hacer otra cuenta principal
                const mainIndex = allAccounts.findIndex(acc => acc.id === otherActiveAccount.id);
                allAccounts[mainIndex].isMain = true;
            } else {
                // Si no hay otra cuenta activa, mantener esta como principal
                updatedAccount.isMain = true;
            }
        }

        allAccounts[index] = updatedAccount;
        saveAccounts();

        // Agregar notificación
        if (typeof addNotification === 'function') {
            addNotification(`Cuenta "${updatedAccount.name}" actualizada.`, 'info');
        }

        return updatedAccount;
    }
    return null;
}

function deleteAccount(accountId) {
    const accountToDelete = allAccounts.find(acc => acc.id === accountId);
    if (!accountToDelete) return false;

    // Si hay transacciones asociadas, no permitir eliminar
    const hasTransactions = accountTransactions.some(tx =>
        tx.accountId === accountId ||
        tx.transferToAccountId === accountId ||
        tx.transferFromAccountId === accountId);

    if (hasTransactions) {
        if (typeof addNotification === 'function') {
            addNotification(
                `No se puede eliminar la cuenta "${accountToDelete.name}" porque tiene transacciones asociadas.`,
                'error'
            );
        }
        return false;
    }

    // Si es la cuenta principal, asignar otra como principal
    if (accountToDelete.isMain) {
        const nextActiveAccount = allAccounts.find(acc =>
            acc.id !== accountId && acc.isActive);

        if (nextActiveAccount) {
            const mainIndex = allAccounts.findIndex(acc => acc.id === nextActiveAccount.id);
            allAccounts[mainIndex].isMain = true;
            currentAccountId = nextActiveAccount.id;
        } else {
            currentAccountId = null;
        }
    }

    // Eliminar la cuenta
    allAccounts = allAccounts.filter(acc => acc.id !== accountId);
    saveAccounts();

    // Notificar
    if (typeof addNotification === 'function') {
        addNotification(`Cuenta "${accountToDelete.name}" eliminada.`, 'warning');
    }

    return true;
}

function setMainAccount(accountId) {
    const index = allAccounts.findIndex(acc => acc.id === accountId);
    if (index !== -1) {
        // Quitar estado principal de todas las cuentas
        allAccounts.forEach(acc => {
            acc.isMain = false;
        });

        // Establecer nueva cuenta principal
        allAccounts[index].isMain = true;
        currentAccountId = accountId;
        saveAccounts();

        // Notificar
        if (typeof addNotification === 'function') {
            addNotification(`${allAccounts[index].name} establecida como cuenta principal.`, 'info');
        }

        return true;
    }
    return false;
}

// --- Funciones CRUD para transacciones de cuentas ---
function addAccountTransaction(transactionData) {
    // Asegurarse de que la cantidad tenga el signo correcto
    const amount = transactionData.type === 'expense' || transactionData.type === 'transfer' && !transactionData.transferToAccountId
        ? -Math.abs(transactionData.amount)
        : Math.abs(transactionData.amount);

    // Crear nueva transacción
    const newTransaction = {
        ...transactionData,
        id: Date.now(),
        amount,
        date: transactionData.date || new Date().toISOString().split('T')[0],
        status: transactionData.status || 'Completado'
    };

    accountTransactions.push(newTransaction);
    saveAccountTransactions();

    // Actualizar balances
    updateAccountBalances();

    // Si es una transacción que afecta al ahorro global
    if (transactionData.affectsSavingsGoal && typeof calculateCurrentSavings === 'function') {
        // Sincronizar con transacciones principales si está marcada como contribución de ahorro
        const mainTransaction = {
            id: Date.now() + 1,
            name: transactionData.name,
            category: transactionData.category,
            date: transactionData.date || new Date().toISOString().split('T')[0],
            amount: amount,
            status: transactionData.status || 'Completado',
            type: transactionData.type,
            isSavingsContribution: true,
            isBill: false
        };

        if (typeof addTransaction === 'function') {
            addTransaction(mainTransaction);
        }
    }

    // Notificar
    if (typeof addNotification === 'function') {
        addNotification(`Nueva transacción añadida a ${getAccountNameById(transactionData.accountId)}.`, 'success');
    }

    return newTransaction;
}

function updateAccountTransaction(transactionData) {
    const index = accountTransactions.findIndex(tx => tx.id === transactionData.id);
    if (index !== -1) {
        // Asegurar signo correcto en la cantidad
        const amount = transactionData.type === 'expense' || transactionData.type === 'transfer' && !transactionData.transferToAccountId
            ? -Math.abs(transactionData.amount)
            : Math.abs(transactionData.amount);

        const updatedTransaction = {
            ...accountTransactions[index],
            ...transactionData,
            amount
        };

        accountTransactions[index] = updatedTransaction;
        saveAccountTransactions();

        // Actualizar balances
        updateAccountBalances();

        // Notificar
        if (typeof addNotification === 'function') {
            addNotification(`Transacción actualizada en ${getAccountNameById(transactionData.accountId)}.`, 'info');
        }

        return updatedTransaction;
    }
    return null;
}

function deleteAccountTransaction(transactionId) {
    const transactionToDelete = accountTransactions.find(tx => tx.id === transactionId);
    if (!transactionToDelete) return false;

    // Eliminar la transacción
    accountTransactions = accountTransactions.filter(tx => tx.id !== transactionId);
    saveAccountTransactions();

    // Actualizar balances
    updateAccountBalances();

    // Notificar
    if (typeof addNotification === 'function') {
        addNotification(`Transacción eliminada de ${getAccountNameById(transactionToDelete.accountId)}.`, 'warning');
    }

    return true;
}

// --- Funciones de transferencia entre cuentas ---
function transferBetweenAccounts(fromAccountId, toAccountId, amount, description, date) {
    if (fromAccountId === toAccountId) {
        if (typeof addNotification === 'function') {
            addNotification('No se puede transferir a la misma cuenta.', 'error');
        }
        return false;
    }

    const fromAccount = allAccounts.find(acc => acc.id === fromAccountId);
    const toAccount = allAccounts.find(acc => acc.id === toAccountId);

    if (!fromAccount || !toAccount) {
        if (typeof addNotification === 'function') {
            addNotification('Una o ambas cuentas no existen.', 'error');
        }
        return false;
    }

    const transactionDate = date || new Date().toISOString().split('T')[0];

    // Crear transacción de salida
    const outTransaction = {
        id: Date.now(),
        accountId: fromAccountId,
        name: description || `Transferencia a ${toAccount.name}`,
        amount: -Math.abs(amount), // Siempre negativo
        date: transactionDate,
        category: 'Transferencia',
        type: 'transfer',
        status: 'Completado',
        transferToAccountId: toAccountId
    };

    // Crear transacción de entrada
    const inTransaction = {
        id: Date.now() + 1,
        accountId: toAccountId,
        name: description || `Transferencia desde ${fromAccount.name}`,
        amount: Math.abs(amount), // Siempre positivo
        date: transactionDate,
        category: 'Transferencia',
        type: 'transfer',
        status: 'Completado',
        transferFromAccountId: fromAccountId
    };

    // Añadir ambas transacciones
    accountTransactions.push(outTransaction, inTransaction);
    saveAccountTransactions();

    // Actualizar balances
    updateAccountBalances();

    // Notificar
    if (typeof addNotification === 'function') {
        addNotification(
            `Transferencia de ${formatCurrency(amount)} realizada desde ${fromAccount.name} a ${toAccount.name}.`,
            'success'
        );
    }

    return true;
}

// --- Funciones Helper ---
function getAccountNameById(accountId) {
    const account = allAccounts.find(acc => acc.id === accountId);
    return account ? account.name : 'Cuenta Desconocida';
}

function getAccountTypeInfo(typeValue) {
    const accountType = ACCOUNT_TYPES.find(type => type.value === typeValue);
    return accountType || { value: 'unknown', label: 'Desconocido', icon: 'fas fa-question-circle' };
}

function getCurrentAccountId() {
    return currentAccountId;
}

function setCurrentAccountId(accountId) {
    const account = allAccounts.find(acc => acc.id === accountId);
    if (account) {
        currentAccountId = accountId;
        return true;
    }
    return false;
}

function calculateAccountsTotal() {
    const assets = allAccounts
        .filter(acc => acc.isActive && acc.type !== 'credit' && acc.type !== 'loan')
        .reduce((total, acc) => total + acc.balance, 0);

    const liabilities = allAccounts
        .filter(acc => acc.isActive && (acc.type === 'credit' || acc.type === 'loan'))
        .reduce((total, acc) => total + Math.abs(acc.balance), 0);

    const netWorth = assets - liabilities;

    return {
        assets,
        liabilities,
        netWorth
    };
}

function getAccountTransactionHistory(accountId, startDate, endDate, limit) {
    let filteredTransactions = accountTransactions.filter(tx => tx.accountId === accountId);

    if (startDate) {
        filteredTransactions = filteredTransactions.filter(tx => tx.date >= startDate);
    }

    if (endDate) {
        filteredTransactions = filteredTransactions.filter(tx => tx.date <= endDate);
    }

    // Ordenar por fecha (más reciente primero)
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (limit && limit > 0) {
        return filteredTransactions.slice(0, limit);
    }

    return filteredTransactions;
}

// --- Inicialización y exportación ---
// Funciones para hacer disponibles públicamente
window.loadAccounts = loadAccounts;
window.saveAccounts = saveAccounts;
window.updateAccountBalances = updateAccountBalances;
window.addAccount = addAccount;
window.updateAccount = updateAccount;
window.deleteAccount = deleteAccount;
window.setMainAccount = setMainAccount;
window.addAccountTransaction = addAccountTransaction;
window.updateAccountTransaction = updateAccountTransaction;
window.deleteAccountTransaction = deleteAccountTransaction;
window.getAccountNameById = getAccountNameById;
window.getAccountTypeInfo = getAccountTypeInfo;
window.getCurrentAccountId = getCurrentAccountId;
window.setCurrentAccountId = setCurrentAccountId;
window.calculateAccountsTotal = calculateAccountsTotal;
window.getAccountTransactionHistory = getAccountTransactionHistory;
window.transferBetweenAccounts = transferBetweenAccounts;

// Exportar variables globales
window.ACCOUNT_TYPES = ACCOUNT_TYPES;
window.allAccounts = allAccounts; // Exponer el array de cuentas para acceso desde otros módulos
window.accountTransactions = accountTransactions; // Exponer las transacciones de cuentas 