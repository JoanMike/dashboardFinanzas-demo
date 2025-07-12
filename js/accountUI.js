document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias a Elementos DOM --- 
    // Contenedores principales
    const dashboardMainContent = document.querySelector('body > div.flex-1.flex.flex-col.overflow-hidden > main'); // Selector más específico para el main del dashboard
    const accountsMainContent = document.getElementById('accounts-main-content');

    // Barra lateral y enlaces
    const sidebarDashboardLink = document.querySelector('a[href="#"][class*="text-sidebar-link-active"]'); // Asumiendo que el link activo inicialmente es el Dashboard
    const sidebarAccountsLink = Array.from(document.querySelectorAll('#sidebar nav ul li a')).find(a => a.textContent.includes('Mis Cuentas'));
    const sidebarToggleAccounts = document.getElementById('sidebar-toggle-accounts');
    const sidebar = document.getElementById('sidebar'); // Referencia al sidebar
    const overlay = document.getElementById('overlay'); // Referencia al overlay

    // Usar las categorías definidas en model.js
    const INCOME_CATEGORIES = window.INCOME_CATEGORIES || [];
    const EXPENSE_CATEGORIES = window.EXPENSE_CATEGORIES || [];
    const CATEGORY_COLORS = window.CATEGORY_COLORS || {};

    // Elementos de la sección Mis Cuentas
    const accountsTotalAssetsEl = document.getElementById('accounts-total-assets');
    const accountsTotalLiabilitiesEl = document.getElementById('accounts-total-liabilities');
    const accountsNetWorthEl = document.getElementById('accounts-net-worth');
    const accountsListContainer = document.getElementById('accounts-list-container');
    const noAccountsMsg = document.getElementById('no-accounts-msg');
    const addAccountBtn = document.getElementById('add-account-btn');
    const transferFundsBtn = document.getElementById('transfer-funds-btn');

    // Detalles de cuenta seleccionada
    const accountDetailsSection = document.getElementById('account-details-section');
    const selectedAccountNameEl = document.getElementById('selected-account-name');
    const selectedAccountInfoEl = document.getElementById('selected-account-info');
    const addAccountTransactionBtn = document.getElementById('add-account-transaction-btn');
    const accountTransactionsTbody = document.getElementById('account-transactions-tbody');
    const noAccountTransactionsMsg = document.getElementById('no-account-transactions-msg');
    const accountTxMonthFilter = document.getElementById('account-tx-month-filter');
    const accountTxTypeFilter = document.getElementById('account-tx-type-filter');
    const accountTxSearchFilter = document.getElementById('account-tx-search-filter');


    // Modales para Cuentas
    const accountFormModal = document.getElementById('account-form-modal');
    const closeAccountFormModalBtn = document.getElementById('close-account-form-modal-btn');
    const cancelAccountFormBtn = document.getElementById('cancel-account-form-btn');
    const accountModalTitle = document.getElementById('account-modal-title');
    const accountForm = document.getElementById('account-form');
    const accountIdInput = document.getElementById('account-id-input');
    const accountNameInput = document.getElementById('account-name-input');
    const accountTypeInput = document.getElementById('account-type-input');
    const accountBalanceInput = document.getElementById('account-balance-input');
    const accountCurrencyInput = document.getElementById('account-currency-input');
    const accountColorInput = document.getElementById('account-color-input');
    const accountIsMainCheckbox = document.getElementById('account-is-main-checkbox');
    const accountLimitContainer = document.getElementById('account-limit-container');
    const accountLimitInput = document.getElementById('account-limit-input');

    // Modales para Transacciones de Cuenta
    const accountTransactionModal = document.getElementById('account-transaction-modal');
    const closeAccountTransactionModalBtn = document.getElementById('close-account-transaction-modal-btn');
    const cancelAccountTransactionBtn = document.getElementById('cancel-account-transaction-btn');
    const accountTransactionModalTitle = document.getElementById('account-transaction-modal-title');
    const accountTransactionForm = document.getElementById('account-transaction-form');
    const accountTransactionIdInput = document.getElementById('account-transaction-id-input');
    const accountTransactionAccountIdInput = document.getElementById('account-transaction-accountId-input');
    const modalAccountNameDisplay = document.getElementById('modal-account-name-display');
    const accountTransactionTypeInput = document.getElementById('account-transaction-type-input');
    const accountTransactionNameInput = document.getElementById('account-transaction-name-input');
    const accountTransactionAmountInput = document.getElementById('account-transaction-amount-input');
    const accountTransactionDateInput = document.getElementById('account-transaction-date-input');
    const accountTransactionCategoryInput = document.getElementById('account-transaction-category-input');
    const accountTransactionStatusInput = document.getElementById('account-transaction-status-input');
    const accountTransactionAffectsSavingsCheckbox = document.getElementById('account-transaction-affects-savings-checkbox');

    // Modal de Transferencia
    const transferFundsModal = document.getElementById('transfer-funds-modal');
    const closeTransferFundsModalBtn = document.getElementById('close-transfer-funds-modal-btn');
    const cancelTransferFundsBtn = document.getElementById('cancel-transfer-funds-btn');
    const transferFundsForm = document.getElementById('transfer-funds-form');
    const transferFromAccountSelect = document.getElementById('transfer-from-account-select');
    const transferToAccountSelect = document.getElementById('transfer-to-account-select');
    const transferAmountInput = document.getElementById('transfer-amount-input');
    const transferDateInput = document.getElementById('transfer-date-input');
    const transferDescriptionInput = document.getElementById('transfer-description-input');

    // Modales de Confirmación de Eliminación
    const deleteAccountConfirmationModal = document.getElementById('delete-account-confirmation-modal');
    const closeDeleteAccountModalBtn = document.getElementById('close-delete-account-modal-btn');
    const cancelDeleteAccountBtn = document.getElementById('cancel-delete-account-btn');
    const confirmDeleteAccountBtn = document.getElementById('confirm-delete-account-btn');
    const deleteAccountIdInput = document.getElementById('delete-account-id-input');
    const deleteAccountWarningMsg = document.getElementById('delete-account-warning-msg');

    const deleteAccountTransactionConfirmationModal = document.getElementById('delete-account-transaction-confirmation-modal');
    const closeDeleteAccountTransactionModalBtn = document.getElementById('close-delete-account-transaction-modal-btn');
    const cancelDeleteAccountTransactionBtn = document.getElementById('cancel-delete-account-transaction-btn');
    const confirmDeleteAccountTransactionBtn = document.getElementById('confirm-delete-account-transaction-btn');
    const deleteAccountTransactionIdInput = document.getElementById('delete-account-transaction-id-input');

    // --- Estado de la UI de Cuentas ---
    let currentEditingAccountId = null;
    let currentEditingAccountTransactionId = null;
    let selectedAccountIdForDetails = null;

    // --- Funciones de Navegación y UI Global ---
    // Estas funciones están definidas en main.js, se redefinen aquí para hacerlas disponibles en accountUI.js
    let navigateToAccountsView, navigateToDashboardView;
    if (typeof window.navigateToAccountsView === 'function') {
        navigateToAccountsView = window.navigateToAccountsView;
    } else {
        navigateToAccountsView = function () {
            if (dashboardMainContent) dashboardMainContent.parentElement.classList.add('hidden');
            if (accountsMainContent) accountsMainContent.classList.remove('hidden');

            // Actualizar enlaces activos en la barra lateral
            if (sidebarDashboardLink) sidebarDashboardLink.classList.remove('text-sidebar-link-active');
            if (sidebarAccountsLink) sidebarAccountsLink.classList.add('text-sidebar-link-active');

            window.loadAndRenderAccountsPage();
            if (window.innerWidth < 768 && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
                overlay.classList.remove('active');
            }
        };
    }

    if (typeof window.navigateToDashboardView === 'function') {
        navigateToDashboardView = window.navigateToDashboardView;
    } else {
        navigateToDashboardView = function () {
            if (accountsMainContent) accountsMainContent.classList.add('hidden');
            if (dashboardMainContent) dashboardMainContent.parentElement.classList.remove('hidden');

            if (sidebarAccountsLink) sidebarAccountsLink.classList.remove('text-sidebar-link-active');
            if (sidebarDashboardLink) sidebarDashboardLink.classList.add('text-sidebar-link-active');

            // Si el dashboard tiene su propia función de recarga, llamarla aquí
            if (typeof renderDashboard === 'function') renderDashboard();
            if (window.innerWidth < 768 && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
                overlay.classList.remove('active');
            }
        };
    }

    // -- Función de alerta modal si no está definida globalmente
    function openAlertModal(title, message) {
        if (typeof window.openAlertModal === 'function') {
            window.openAlertModal(title, message);
        } else {
            alert(`${title}: ${message}`);
        }
    }

    // --- Funciones de Renderizado --- 
    function loadAndRenderAccountsPage() {
        console.log("Cargando y renderizando la página de cuentas...");
        try {
            if (typeof loadAccounts === 'function') {
                loadAccounts();
                console.log("Cuentas cargadas:", allAccounts.length);

                updateAccountBalances(); // Asegurar que los balances estén calculados
                console.log("Balances actualizados");

                renderAccountsSummary();
                console.log("Resumen de cuentas renderizado");

                renderAccountsList();
                console.log("Lista de cuentas renderizada");

                if (selectedAccountIdForDetails) {
                    renderAccountDetails(selectedAccountIdForDetails);
                    console.log("Detalles de cuenta renderizados para ID:", selectedAccountIdForDetails);
                } else {
                    accountDetailsSection.classList.add('hidden');
                    console.log("Sección de detalles ocultada, no hay cuenta seleccionada");
                }

                // Asegurarse de que la sección de cuentas sea visible
                if (accountsMainContent) {
                    accountsMainContent.classList.remove('hidden');
                    console.log("Sección de cuentas hecha visible");
                }
            } else {
                console.error("La función loadAccounts no está definida");
            }
        } catch (error) {
            console.error("Error al cargar y renderizar la página de cuentas:", error);
        }
    }

    function renderAccountsSummary() {
        const totals = calculateAccountsTotal();
        accountsTotalAssetsEl.textContent = formatCurrency(totals.assets);
        accountsTotalLiabilitiesEl.textContent = formatCurrency(totals.liabilities);
        accountsNetWorthEl.textContent = formatCurrency(totals.netWorth);
    }

    function renderAccountsList() {
        accountsListContainer.innerHTML = ''; // Limpiar lista anterior
        if (allAccounts.length === 0) {
            noAccountsMsg.classList.remove('hidden');
            accountDetailsSection.classList.add('hidden');
            return;
        }
        noAccountsMsg.classList.add('hidden');

        allAccounts.forEach(account => {
            const accountTypeInfo = getAccountTypeInfo(account.type);
            const card = document.createElement('div');
            card.className = `p-4 rounded-lg shadow-md border-l-4 cursor-pointer hover:shadow-lg transition-shadow ${selectedAccountIdForDetails === account.id ? 'ring-2 ring-purple-500' : ''}`;
            card.style.borderColor = account.color || '#6B7280';
            card.dataset.accountId = account.id;

            card.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <div class="flex items-center">
                        <i class="${accountTypeInfo.icon} fa-lg mr-3" style="color: ${account.color || '#6B7280'}"></i>
                        <span class="font-semibold text-md text-gray-800">${account.name}</span>
                        ${account.isMain ? '<span class="ml-2 text-xs bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full">Principal</span>' : ''}
                    </div>
                    <div class="text-lg font-bold ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}">
                        ${formatCurrency(account.balance, account.currency)}
                    </div>
                </div>
                <div class="text-xs text-gray-500 mb-3">
                    <span>${accountTypeInfo.label}</span>
                    ${account.type === 'credit' && account.limit ? ` &bull; Límite: ${formatCurrency(account.limit, account.currency)}` : ''}
                </div>
                <div class="flex justify-end space-x-2">
                    <button class="edit-account-btn text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200" data-id="${account.id}"><i class="fas fa-edit"></i></button>
                    <button class="delete-account-btn text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200" data-id="${account.id}"><i class="fas fa-trash"></i></button>
                    ${!account.isMain ? `<button class="set-main-account-btn text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200" data-id="${account.id}" title="Establecer como principal"><i class="fas fa-star"></i></button>` : ''}
                </div>
            `;

            card.addEventListener('click', (e) => {
                if (!e.target.closest('button')) { // No seleccionar si se hace clic en un botón
                    selectedAccountIdForDetails = account.id;
                    renderAccountDetails(account.id);
                    renderAccountsList(); // Re-render para actualizar el anillo de selección
                }
            });

            card.querySelector('.edit-account-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                openAccountFormModal('edit', account.id);
            });
            card.querySelector('.delete-account-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                openDeleteAccountConfirmation(account.id);
            });
            if (!account.isMain) {
                card.querySelector('.set-main-account-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    handleSetMainAccount(account.id);
                });
            }
            accountsListContainer.appendChild(card);
        });
    }

    function renderAccountDetails(accountId) {
        const account = allAccounts.find(acc => acc.id === accountId);
        if (!account) {
            accountDetailsSection.classList.add('hidden');
            return;
        }
        accountDetailsSection.classList.remove('hidden');
        selectedAccountNameEl.textContent = account.name;
        const accountTypeInfo = getAccountTypeInfo(account.type);

        let detailsHTML = `
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mb-2">
                <div>
                    <p class="text-gray-500">Tipo:</p>
                    <p class="font-medium"><i class="${accountTypeInfo.icon} mr-1" style="color: ${account.color || '#6B7280'}"></i> ${accountTypeInfo.label}</p>
                </div>
                <div>
                    <p class="text-gray-500">Balance Actual:</p>
                    <p class="font-bold text-lg ${account.balance >= 0 ? 'text-green-700' : 'text-red-700'}">${formatCurrency(account.balance, account.currency)}</p>
                </div>
                <div>
                    <p class="text-gray-500">Moneda:</p>
                    <p class="font-medium">${account.currency}</p>
                </div>
                ${account.type === 'credit' && account.limit ?
                `<div>
                    <p class="text-gray-500">Límite de Crédito:</p>
                    <p class="font-medium">${formatCurrency(account.limit, account.currency)}</p>
                </div>
                <div>
                    <p class="text-gray-500">Disponible:</p>
                    <p class="font-medium">${formatCurrency(account.limit - Math.abs(account.balance), account.currency)}</p>
                </div>` : ''}
                <div>
                    <p class="text-gray-500">Creada el:</p>
                    <p class="font-medium">${formatDate(account.createdAt)}</p>
                </div>
            </div>
        `;
        selectedAccountInfoEl.innerHTML = detailsHTML;
        renderAccountTransactionsTable(accountId);
    }

    function renderAccountTransactionsTable(accountId, transactions = null) {
        accountTransactionsTbody.innerHTML = '';
        const account = allAccounts.find(acc => acc.id === accountId);
        if (!account) return;

        let txsToRender = transactions;
        if (!txsToRender) {
            const monthFilter = accountTxMonthFilter.value; // YYYY-MM
            const typeFilter = accountTxTypeFilter.value;
            const searchFilter = normalizeText(accountTxSearchFilter.value);

            let startDate, endDate;
            if (monthFilter) {
                const [year, month] = monthFilter.split('-');
                startDate = new Date(year, parseInt(month) - 1, 1).toISOString().split('T')[0];
                endDate = new Date(year, parseInt(month), 0).toISOString().split('T')[0]; // último día del mes
            }
            txsToRender = getAccountTransactionHistory(accountId, startDate, endDate);

            if (typeFilter) {
                txsToRender = txsToRender.filter(tx => tx.type === typeFilter);
            }
            if (searchFilter) {
                txsToRender = txsToRender.filter(tx =>
                    normalizeText(tx.name).includes(searchFilter) ||
                    normalizeText(tx.category).includes(searchFilter)
                );
            }
        }

        if (txsToRender.length === 0) {
            noAccountTransactionsMsg.classList.remove('hidden');
            return;
        }
        noAccountTransactionsMsg.classList.add('hidden');

        txsToRender.forEach(tx => {
            const row = document.createElement('tr');
            row.className = 'border-b hover:bg-gray-50';
            const amountColor = tx.amount >= 0 ? 'text-green-600' : 'text-red-600';
            const categoryColor = CATEGORY_COLORS[tx.category] || '#6b7280';

            row.innerHTML = `
                <td class="py-2 px-3">${formatDate(tx.date)}</td>
                <td class="py-2 px-3">${tx.name}</td>
                <td class="py-2 px-3"><span class="category-badge" style="background-color: ${categoryColor};">${tx.category}</span></td>
                <td class="py-2 px-3 text-right font-medium ${amountColor}">${formatCurrency(tx.amount, account.currency)}</td>
                <td class="py-2 px-3 text-center">
                    <button class="action-btn edit-account-tx-btn text-blue-600 hover:text-blue-800" data-id="${tx.id}" title="Editar"><i class="fas fa-pencil-alt"></i></button>
                    <button class="action-btn delete-account-tx-btn text-red-600 hover:text-red-800 ml-2" data-id="${tx.id}" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
            row.querySelector('.edit-account-tx-btn').addEventListener('click', () => openAccountTransactionFormModal('edit', accountId, tx.id));
            row.querySelector('.delete-account-tx-btn').addEventListener('click', () => openDeleteAccountTransactionConfirmation(tx.id));
            accountTransactionsTbody.appendChild(row);
        });
    }

    // --- Funciones de Modales ---
    // Modal Añadir/Editar Cuenta
    function openAccountFormModal(mode = 'add', accountId = null) {
        currentEditingAccountId = mode === 'edit' ? accountId : null;
        accountForm.reset();
        accountModalTitle.textContent = mode === 'edit' ? 'Editar Cuenta' : 'Nueva Cuenta';
        accountIdInput.value = '';
        accountLimitContainer.classList.add('hidden');

        // Llenar tipos de cuenta
        accountTypeInput.innerHTML = '';
        ACCOUNT_TYPES.forEach(type => {
            const option = document.createElement('option');
            option.value = type.value;
            option.textContent = type.label;
            accountTypeInput.appendChild(option);
        });

        if (mode === 'edit' && accountId) {
            const account = allAccounts.find(acc => acc.id === accountId);
            if (account) {
                accountIdInput.value = account.id;
                accountNameInput.value = account.name;
                accountTypeInput.value = account.type;
                accountBalanceInput.value = account.balance; // El balance se muestra como está, el modelo se encarga del signo.
                accountBalanceInput.disabled = true; // No se puede editar el balance directamente aquí, se ajusta con transacciones
                accountCurrencyInput.value = account.currency;
                accountColorInput.value = account.color || '#3b82f6';
                accountIsMainCheckbox.checked = account.isMain;
                if (account.type === 'credit') {
                    accountLimitContainer.classList.remove('hidden');
                    accountLimitInput.value = account.limit || '';
                }
            }
        } else {
            accountBalanceInput.disabled = false;
            accountColorInput.value = '#3b82f6'; // Default color
            accountIsMainCheckbox.checked = allAccounts.length === 0; // Marcar como principal si es la primera cuenta
        }
        accountFormModal.classList.add('show');
    }

    function closeAccountFormModal() {
        accountFormModal.classList.remove('show');
        currentEditingAccountId = null;
    }

    function handleAccountFormSubmit(event) {
        event.preventDefault();
        const formData = new FormData(accountForm);
        const data = {
            name: formData.get('name').trim(),
            type: formData.get('type'),
            balance: parseFloat(formData.get('balance') || 0),
            currency: formData.get('currency'),
            color: formData.get('color'),
            isMain: accountIsMainCheckbox.checked,
            limit: formData.get('type') === 'credit' ? parseFloat(formData.get('limit') || 0) : null
        };

        if (!data.name) {
            openAlertModal('Error', 'El nombre de la cuenta es obligatorio.');
            return;
        }

        if (currentEditingAccountId) {
            data.id = currentEditingAccountId;
            updateAccount(data);
        } else {
            addAccount(data);
        }
        closeAccountFormModal();
        loadAndRenderAccountsPage();
    }

    accountTypeInput.addEventListener('change', function () {
        if (this.value === 'credit') {
            accountLimitContainer.classList.remove('hidden');
        } else {
            accountLimitContainer.classList.add('hidden');
            accountLimitInput.value = '';
        }
    });

    // Modal Añadir/Editar Transacción de Cuenta
    function openAccountTransactionFormModal(mode = 'add', accountId, transactionId = null) {
        currentEditingAccountTransactionId = mode === 'edit' ? transactionId : null;
        accountTransactionForm.reset();
        const account = allAccounts.find(acc => acc.id === accountId);
        if (!account) {
            openAlertModal('Error', 'Cuenta no encontrada.');
            return;
        }

        accountTransactionModalTitle.textContent = mode === 'edit' ? 'Editar Transacción' : `Nueva Transacción (${account.name})`;
        modalAccountNameDisplay.textContent = account.name;
        accountTransactionAccountIdInput.value = accountId;
        accountTransactionIdInput.value = '';
        accountTransactionDateInput.value = new Date().toISOString().split('T')[0]; // Default to today

        // Llenar categorías según tipo de transacción
        populateAccountTransactionCategories(accountTransactionTypeInput.value);

        if (mode === 'edit' && transactionId) {
            const transaction = accountTransactions.find(tx => tx.id === transactionId);
            if (transaction) {
                accountTransactionIdInput.value = transaction.id;
                accountTransactionTypeInput.value = transaction.type;
                populateAccountTransactionCategories(transaction.type); // Re-populate for current type
                accountTransactionNameInput.value = transaction.name;
                accountTransactionAmountInput.value = Math.abs(transaction.amount); // Form shows positive
                accountTransactionDateInput.value = transaction.date;
                accountTransactionCategoryInput.value = transaction.category;
                accountTransactionStatusInput.value = transaction.status;
                accountTransactionAffectsSavingsCheckbox.checked = transaction.affectsSavingsGoal || false;
            }
        }
        accountTransactionModal.classList.add('show');
    }

    function closeAccountTransactionFormModal() {
        accountTransactionModal.classList.remove('show');
        currentEditingAccountTransactionId = null;
    }

    function populateAccountTransactionCategories(transactionType) {
        accountTransactionCategoryInput.innerHTML = '';
        const categories = transactionType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
        categories.forEach(cat => {
            if (cat === 'Ahorro' && transactionType === 'expense' && !accountTransactionAffectsSavingsCheckbox.checked) {
                // No añadir 'Ahorro' como gasto si no afecta la meta, para evitar confusión con contribución
            } else {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat;
                accountTransactionCategoryInput.appendChild(option);
            }
        });
    }
    accountTransactionTypeInput.addEventListener('change', (e) => populateAccountTransactionCategories(e.target.value));

    function handleAccountTransactionFormSubmit(event) {
        event.preventDefault();
        const formData = new FormData(accountTransactionForm);
        const data = {
            accountId: parseInt(formData.get('accountId')),
            type: formData.get('type'),
            name: formData.get('name').trim(),
            amount: parseFloat(formData.get('amount')),
            date: formData.get('date'),
            category: formData.get('category'),
            status: formData.get('status'),
            affectsSavingsGoal: accountTransactionAffectsSavingsCheckbox.checked
        };

        if (!data.name || isNaN(data.amount) || !data.date || !data.category) {
            openAlertModal('Error', 'Por favor, completa todos los campos obligatorios.');
            return;
        }
        if (data.amount <= 0) {
            openAlertModal('Error', 'El monto debe ser mayor que cero.');
            return;
        }

        if (currentEditingAccountTransactionId) {
            data.id = currentEditingAccountTransactionId;
            updateAccountTransaction(data);
        } else {
            addAccountTransaction(data);
        }
        closeAccountTransactionFormModal();
        if (selectedAccountIdForDetails === data.accountId) {
            renderAccountDetails(data.accountId);
        }
        renderAccountsSummary(); // Actualizar resumenes globales por si afecta el balance total
        renderAccountsList(); // Actualizar balances en la lista de cuentas
    }

    // Modal Transferencia
    function openTransferFundsModal() {
        transferFundsForm.reset();
        transferFromAccountSelect.innerHTML = '';
        transferToAccountSelect.innerHTML = '';

        allAccounts.filter(acc => acc.isActive).forEach(acc => {
            const optionFrom = document.createElement('option');
            optionFrom.value = acc.id;
            optionFrom.textContent = `${acc.name} (${formatCurrency(acc.balance, acc.currency)})`;
            transferFromAccountSelect.appendChild(optionFrom);

            const optionTo = document.createElement('option');
            optionTo.value = acc.id;
            optionTo.textContent = `${acc.name} (${formatCurrency(acc.balance, acc.currency)})`;
            transferToAccountSelect.appendChild(optionTo);
        });
        transferDateInput.value = new Date().toISOString().split('T')[0];
        transferFundsModal.classList.add('show');
    }

    function closeTransferFundsModal() {
        transferFundsModal.classList.remove('show');
    }

    function handleTransferFundsFormSubmit(event) {
        event.preventDefault();
        const fromAccountId = parseInt(transferFromAccountSelect.value);
        const toAccountId = parseInt(transferToAccountSelect.value);
        const amount = parseFloat(transferAmountInput.value);
        const date = transferDateInput.value;
        const description = transferDescriptionInput.value.trim();

        if (fromAccountId === toAccountId) {
            openAlertModal('Error', 'La cuenta de origen y destino no pueden ser la misma.');
            return;
        }
        if (isNaN(amount) || amount <= 0) {
            openAlertModal('Error', 'Ingresa un monto válido para la transferencia.');
            return;
        }

        const success = transferBetweenAccounts(fromAccountId, toAccountId, amount, description, date);
        if (success) {
            closeTransferFundsModal();
            loadAndRenderAccountsPage();
        }
    }

    // Funciones de Confirmación de Eliminación
    function openDeleteAccountConfirmation(accountId) {
        const account = allAccounts.find(acc => acc.id === accountId);
        if (account) {
            deleteAccountIdInput.value = accountId;
            const hasTransactions = accountTransactions.some(tx => tx.accountId === accountId || tx.transferToAccountId === accountId || tx.transferFromAccountId === accountId);
            if (hasTransactions) {
                deleteAccountWarningMsg.textContent = `La cuenta "${account.name}" tiene transacciones asociadas y no puede ser eliminada. Primero elimina o reasigna sus transacciones.`;
                confirmDeleteAccountBtn.disabled = true;
                confirmDeleteAccountBtn.classList.add('opacity-50', 'cursor-not-allowed');
            } else {
                deleteAccountWarningMsg.textContent = `¿Estás seguro de que deseas eliminar la cuenta "${account.name}"? Esta acción no se puede deshacer.`;
                confirmDeleteAccountBtn.disabled = false;
                confirmDeleteAccountBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
            deleteAccountConfirmationModal.classList.add('show');
        }
    }
    function closeDeleteAccountConfirmation() {
        deleteAccountConfirmationModal.classList.remove('show');
    }
    function handleConfirmDeleteAccount() {
        const accountId = parseInt(deleteAccountIdInput.value);
        const success = deleteAccount(accountId);
        if (success) {
            if (selectedAccountIdForDetails === accountId) {
                selectedAccountIdForDetails = null;
                accountDetailsSection.classList.add('hidden');
            }
            loadAndRenderAccountsPage();
        }
        closeDeleteAccountConfirmation();
    }

    function openDeleteAccountTransactionConfirmation(transactionId) {
        deleteAccountTransactionIdInput.value = transactionId;
        deleteAccountTransactionConfirmationModal.classList.add('show');
    }
    function closeDeleteAccountTransactionConfirmation() {
        deleteAccountTransactionConfirmationModal.classList.remove('show');
    }
    function handleConfirmDeleteAccountTransaction() {
        const transactionId = parseInt(deleteAccountTransactionIdInput.value);
        const tx = accountTransactions.find(t => t.id === transactionId);
        if (tx) {
            const accountIdForRefresh = tx.accountId;
            deleteAccountTransaction(transactionId);
            if (selectedAccountIdForDetails === accountIdForRefresh) {
                renderAccountDetails(accountIdForRefresh);
            }
            renderAccountsSummary();
            renderAccountsList(); // Para actualizar el balance en la lista
        }
        closeDeleteAccountTransactionConfirmation();
    }

    function handleSetMainAccount(accountId) {
        if (setMainAccount(accountId)) {
            loadAndRenderAccountsPage();
        }
    }

    // --- Event Listeners --- 
    // Los event listeners para navegación ahora están centralizados en index.html
    // para evitar duplicidades y conflictos

    addAccountBtn.addEventListener('click', () => openAccountFormModal('add'));
    closeAccountFormModalBtn.addEventListener('click', closeAccountFormModal);
    cancelAccountFormBtn.addEventListener('click', closeAccountFormModal);
    accountForm.addEventListener('submit', handleAccountFormSubmit);

    addAccountTransactionBtn.addEventListener('click', () => {
        if (selectedAccountIdForDetails) {
            openAccountTransactionFormModal('add', selectedAccountIdForDetails);
        } else {
            openAlertModal('Aviso', 'Por favor, selecciona una cuenta primero.');
        }
    });
    closeAccountTransactionModalBtn.addEventListener('click', closeAccountTransactionFormModal);
    cancelAccountTransactionBtn.addEventListener('click', closeAccountTransactionFormModal);
    accountTransactionForm.addEventListener('submit', handleAccountTransactionFormSubmit);

    transferFundsBtn.addEventListener('click', openTransferFundsModal);
    closeTransferFundsModalBtn.addEventListener('click', closeTransferFundsModal);
    cancelTransferFundsBtn.addEventListener('click', closeTransferFundsModal);
    transferFundsForm.addEventListener('submit', handleTransferFundsFormSubmit);

    confirmDeleteAccountBtn.addEventListener('click', handleConfirmDeleteAccount);
    closeDeleteAccountModalBtn.addEventListener('click', closeDeleteAccountConfirmation);
    cancelDeleteAccountBtn.addEventListener('click', closeDeleteAccountConfirmation);

    confirmDeleteAccountTransactionBtn.addEventListener('click', handleConfirmDeleteAccountTransaction);
    closeDeleteAccountTransactionModalBtn.addEventListener('click', closeDeleteAccountTransactionConfirmation);
    cancelDeleteAccountTransactionBtn.addEventListener('click', closeDeleteAccountTransactionConfirmation);

    // Filtros de transacciones de cuenta
    [accountTxMonthFilter, accountTxTypeFilter, accountTxSearchFilter].forEach(el => {
        el.addEventListener('input', () => {
            if (selectedAccountIdForDetails) renderAccountTransactionsTable(selectedAccountIdForDetails);
        });
        el.addEventListener('change', () => { // para select y month input
            if (selectedAccountIdForDetails) renderAccountTransactionsTable(selectedAccountIdForDetails);
        });
    });

    // --- Inicialización ---
    // La primera vez, si el hash es #accounts o algo similar, navegar a cuentas.
    // Por ahora, el dashboard es la vista por defecto.
    if (window.location.hash === '#accounts') {
        loadAndRenderAccountsPage(); // Cargar datos inicialmente si estamos en la sección de cuentas
    }

    // Exportar la función globalmente para ser accesible desde main.js
    window.loadAndRenderAccountsPage = loadAndRenderAccountsPage;
});

// Agregar un event listener para el evento personalizado
document.addEventListener('loadAndRenderAccountsPage', function () {
    const accountsMainContent = document.getElementById('accounts-main-content');
    if (accountsMainContent && !accountsMainContent.classList.contains('hidden')) {
        // Disparar la inicialización y renderizado de la vista de cuentas
        console.log('Iniciando renderizado de cuentas...');
        // Forzar la visibilidad de la sección de cuentas
        accountsMainContent.classList.remove('hidden');

        // Asegurarnos que el contenido del dashboard está oculto
        const dashboardView = document.querySelector('body > div.flex-1.flex.flex-col.overflow-hidden');
        if (dashboardView) dashboardView.classList.add('hidden');

        try {
            // Acceder a las funciones que deberían estar disponibles
            const renderFunctions = document.querySelectorAll('[id^="accounts"]');
            console.log('Elementos disponibles:', renderFunctions.length);

            // Intentar ejecutar la función renderAccountsSummary definida en el ámbito del DOMContentLoaded
            // Para hacerlo, creamos un script temporal
            const script = document.createElement('script');
            script.textContent = `
                (function() {
                    try {
                        // Refrescar la lista de cuentas
                        if (typeof allAccounts !== 'undefined') {
                            console.log('Cuentas disponibles:', allAccounts.length);
                            
                            // Actualizar los totales
                            const totals = calculateAccountsTotal();
                            const assetsEl = document.getElementById('accounts-total-assets');
                            const liabilitiesEl = document.getElementById('accounts-total-liabilities');
                            const netWorthEl = document.getElementById('accounts-net-worth');
                            
                            if (assetsEl) assetsEl.textContent = formatCurrency(totals.assets);
                            if (liabilitiesEl) liabilitiesEl.textContent = formatCurrency(totals.liabilities);
                            if (netWorthEl) netWorthEl.textContent = formatCurrency(totals.netWorth);
                            
                            // Mostrar las cuentas
                            const accountsListContainer = document.getElementById('accounts-list-container');
                            const noAccountsMsg = document.getElementById('no-accounts-msg');
                            
                            if (accountsListContainer) {
                                accountsListContainer.innerHTML = '';
                                if (allAccounts.length === 0) {
                                    if (noAccountsMsg) noAccountsMsg.classList.remove('hidden');
                                } else {
                                    if (noAccountsMsg) noAccountsMsg.classList.add('hidden');
                                    
                                    // Renderizar cada cuenta
                                    allAccounts.forEach(account => {
                                        const accountTypeInfo = getAccountTypeInfo(account.type);
                                        const card = document.createElement('div');
                                        card.className = 'p-4 rounded-lg shadow-md border-l-4 cursor-pointer hover:shadow-lg transition-shadow';
                                        card.style.borderColor = account.color || '#6B7280';
                                        card.dataset.accountId = account.id;
                                        
                                        card.innerHTML = \`
                                            <div class="flex justify-between items-center mb-2">
                                                <div class="flex items-center">
                                                    <i class="\${accountTypeInfo.icon} fa-lg mr-3" style="color: \${account.color || '#6B7280'}"></i>
                                                    <span class="font-semibold text-md text-gray-800">\${account.name}</span>
                                                    \${account.isMain ? '<span class="ml-2 text-xs bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full">Principal</span>' : ''}
                                                </div>
                                                <div class="text-lg font-bold \${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}">
                                                    \${formatCurrency(account.balance, account.currency)}
                                                </div>
                                            </div>
                                            <div class="text-xs text-gray-500 mb-3">
                                                <span>\${accountTypeInfo.label}</span>
                                                \${account.type === 'credit' && account.limit ? \` &bull; Límite: \${formatCurrency(account.limit, account.currency)}\` : ''}
                                            </div>
                                            <div class="flex justify-end space-x-2">
                                                <button class="edit-account-btn text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200" data-id="\${account.id}"><i class="fas fa-edit"></i></button>
                                                <button class="delete-account-btn text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200" data-id="\${account.id}"><i class="fas fa-trash"></i></button>
                                                \${!account.isMain ? \`<button class="set-main-account-btn text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200" data-id="\${account.id}" title="Establecer como principal"><i class="fas fa-star"></i></button>\` : ''}
                                            </div>
                                        \`;
                                        
                                        accountsListContainer.appendChild(card);
                                    });
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Error al renderizar cuentas:', error);
                    }
                })();
            `;
            document.head.appendChild(script);
            document.head.removeChild(script);

        } catch (error) {
            console.error('Error al ejecutar la función de renderizado:', error);
        }
    }
});
