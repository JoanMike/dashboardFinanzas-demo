// --- Funciones de formato y utilidad ---
function formatCurrency(amount, currency = "S/") {
    return amount >= 0 ? `${currency} ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}` : `-${currency} ${Math.abs(amount).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
}

// Exportar función formatCurrency globalmente
window.formatCurrency = formatCurrency;

function formatDate(dateString) {
    if (!dateString) return '';
    // Ensure dateString is in 'YYYY-MM-DD' format for consistent parsing
    const [year, month, day] = dateString.split('-');
    const date = new Date(year, month - 1, day); // Month is 0-indexed
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
}

function formatTimeAgo(isoTimestamp) {
    const date = new Date(isoTimestamp);
    const now = new Date();
    const seconds = Math.round((now - date) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return `hace ${seconds} seg`;
    if (minutes < 60) return `hace ${minutes} min`;
    if (hours < 24) return `hace ${hours} hr`;
    return `hace ${days} días`;
}

function normalizeText(text) {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

// --- Funciones de cálculo ---
function calculateTotalsForPeriod(transactionsList, startDate, endDate) {
    const periodTransactions = transactionsList.filter(t => {
        const transactionDate = new Date(t.date);
        // Ensure comparison is inclusive of start/end dates
        return t.status === 'Completado' && transactionDate >= startDate && transactionDate <= endDate;
    });

    const totalIncome = periodTransactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = periodTransactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0); // Sum absolute values

    // Balance calculation might need refinement depending on definition (e.g., starting balance + net change)
    // For simplicity here, we calculate net change within the period
    const netChange = totalIncome - totalExpenses;

    return { totalIncome, totalExpenses, netChange };
}

function calculatePercentageChange(current, previous) {
    // Si el valor previo es 0, maneja el caso especial para evitar división por cero
    if (previous === 0 || previous === null || previous === undefined) {
        if (current > 0) return 100; // En lugar de Infinity, muestra 100%
        if (current < 0) return -100; // En lugar de -Infinity, muestra -100%
        return 0; // Si ambos son cero, no hay cambio
    }
    // Usar Math.abs para el porcentaje base para evitar problemas de signo
    return ((current - previous) / Math.abs(previous)) * 100;
}

function updateSummaryPercentages() {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month

    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of previous month
    const prevMonthStart = new Date(now.getFullYear(), prevMonthEnd.getMonth(), 1);

    const currentTotals = calculateTotalsForPeriod(allTransactions, currentMonthStart, currentMonthEnd);
    const prevTotals = calculateTotalsForPeriod(allTransactions, prevMonthStart, prevMonthEnd);

    // Calculate overall balance (sum of all completed transactions up to now)
    const overallBalance = allTransactions
        .filter(t => t.status === 'Completado' && new Date(t.date) <= now)
        .reduce((sum, t) => sum + t.amount, 0);

    // Update DOM
    totalBalanceEl.textContent = formatCurrency(overallBalance); // Display overall balance
    totalIncomeEl.textContent = formatCurrency(currentTotals.totalIncome);
    totalExpensesEl.textContent = formatCurrency(currentTotals.totalExpenses);

    // Calculate and display percentages
    const incomePerc = calculatePercentageChange(currentTotals.totalIncome, prevTotals.totalIncome);
    const expensePerc = calculatePercentageChange(currentTotals.totalExpenses, prevTotals.totalExpenses);

    updatePercentageElement(incomePercentageEl, incomePerc);
    updatePercentageElement(expensePercentageEl, expensePerc);
    balancePercentageEl.textContent = `Mes actual: ${formatCurrency(currentTotals.netChange)}`;
}

function updatePercentageElement(element, percentage) {
    if (!isFinite(percentage) || isNaN(percentage)) {
        element.textContent = '--% respecto al mes anterior';
        element.className = 'text-xs text-gray-500'; // Neutral color
    } else {
        const sign = percentage >= 0 ? '+' : '';
        const colorClass = percentage >= 0 ? 'text-green-600' : 'text-red-600';
        element.textContent = `${sign}${percentage.toFixed(1)}% respecto al mes anterior`;
        element.className = `text-xs ${colorClass}`;
    }
}

// --- Funciones de renderizado UI ---
function renderTransactions(transactionsToRender, limit = 10) {
    transactionsTbody.innerHTML = ''; // Clear existing rows

    if (transactionsToRender.length === 0) {
        noTransactionsMsg.classList.remove('hidden');
        return;
    }
    noTransactionsMsg.classList.add('hidden');

    // Sort transactions by date descending before rendering
    transactionsToRender.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Si se proporciona un límite, tomar solo ese número de transacciones
    const transactionsToShow = limit ? transactionsToRender.slice(0, limit) : transactionsToRender;

    transactionsToShow.forEach(t => {
        const row = document.createElement('tr');
        row.classList.add('border-b', 'hover:bg-gray-50');
        row.dataset.id = t.id; // Add id for easier selection

        const amountColor = t.amount > 0 ? 'text-green-600' : 'text-red-600';
        const statusBadge = t.status === 'Completado'
            ? '<span class="px-2 py-1 text-xs font-medium rounded-full badge-success">Completado</span>'
            : '<span class="px-2 py-1 text-xs font-medium rounded-full badge-pending">Pendiente</span>';

        // Obtener color de la categoría desde CATEGORY_COLORS
        const categoryName = t.category || 'Sin Categoría';
        const categoryColor = CATEGORY_COLORS[categoryName] || '#6b7280'; // Color por defecto (gris)
        const categoryBadge = `<span class="category-badge" style="background-color: ${categoryColor};">${categoryName}</span>`;

        // Añadir indicador si es una contribución al ahorro
        const savingsBadge = t.isSavingsContribution ?
            '<span class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800"><i class="fas fa-piggy-bank mr-1"></i>Ahorro</span>' :
            '';

        row.innerHTML = `
            <td class="py-3 px-4">
                <div class="flex items-center">
                    <span class="mr-3 text-gray-500 w-5 text-center"><i class="${t.icon || 'fas fa-question-circle'}"></i></span>
                    <span>${t.name}${savingsBadge}</span>
                </div>
            </td>
            <td class="py-3 px-4">${categoryBadge}</td>
            <td class="py-3 px-4">${formatDate(t.date)}</td>
            <td class="py-3 px-4 text-right font-medium ${amountColor}">${formatCurrency(t.amount)}</td>
            <td class="py-3 px-4 text-center">${statusBadge}</td>
            <td class="py-3 px-4 text-center">
                <button class="action-btn edit-btn" onclick="openEditModal(${t.id})"><i class="fas fa-pencil-alt"></i></button>
                <button class="action-btn delete-btn" onclick="deleteTransaction(${t.id})"><i class="fas fa-trash-alt"></i></button>
            </td>
        `;
        transactionsTbody.appendChild(row);
    });
}

function renderSavingsGoal() {
    const percentage = Math.min(100, (currentSavings / savingsGoal) * 100);
    const remaining = Math.max(0, savingsGoal - currentSavings);

    savingsGoalTextEl.textContent = `${formatCurrency(currentSavings)} ahorrado de ${formatCurrency(savingsGoal)} meta`;
    savingsProgressBarEl.style.width = `${percentage}%`;
    savingsRemainingTextEl.textContent = `${formatCurrency(remaining)} restantes`;

    // Actualizar información adicional del panel de ahorro
    const recentContributionsEl = document.getElementById('recent-contributions');
    const estimatedCompletionEl = document.getElementById('estimated-completion');
    const savingsTipEl = document.getElementById('savings-tip');

    // Calcular contribuciones recientes (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSavingsTransactions = allTransactions.filter(t =>
        t.status === 'Completado' &&
        t.isSavingsContribution === true &&
        new Date(t.date) >= thirtyDaysAgo
    );

    // Calcular total de contribuciones recientes
    const recentContributionsTotal = recentSavingsTransactions.reduce((total, transaction) => {
        return total + (transaction.type === 'income' ? Math.abs(transaction.amount) : -Math.abs(transaction.amount));
    }, 0);

    // Mostrar contribuciones recientes
    if (recentSavingsTransactions.length > 0) {
        recentContributionsEl.textContent = `${formatCurrency(recentContributionsTotal)} en 30 días`;
    } else {
        recentContributionsEl.textContent = 'Sin contribuciones recientes';
    }

    // Calcular promedio mensual de ahorro para estimar tiempo
    let estimatedText = 'Por determinar';

    if (recentContributionsTotal > 0) {
        // Proyección mensual basada en las contribuciones recientes
        const monthlyRate = recentContributionsTotal; // Contribuciones en los últimos 30 días

        if (remaining > 0 && monthlyRate > 0) {
            // Calcular meses restantes
            const monthsRemaining = Math.ceil(remaining / monthlyRate);

            if (monthsRemaining < 1) {
                estimatedText = 'Menos de 1 mes';
            } else if (monthsRemaining === 1) {
                estimatedText = 'Aprox. 1 mes';
            } else if (monthsRemaining < 12) {
                estimatedText = `Aprox. ${monthsRemaining} meses`;
            } else {
                const years = Math.floor(monthsRemaining / 12);
                const months = monthsRemaining % 12;
                if (months === 0) {
                    estimatedText = `Aprox. ${years} ${years === 1 ? 'año' : 'años'}`;
                } else {
                    estimatedText = `Aprox. ${years} ${years === 1 ? 'año' : 'años'} y ${months} ${months === 1 ? 'mes' : 'meses'}`;
                }
            }
        } else if (remaining <= 0) {
            estimatedText = '¡Meta alcanzada!';
        }
    } else {
        estimatedText = 'Sin datos suficientes';
    }

    estimatedCompletionEl.textContent = estimatedText;

    // Personalizar el consejo según el progreso
    if (percentage < 10) {
        savingsTipEl.textContent = "Para empezar con tu meta de ahorro, marca tus transferencias a ahorro como 'Contribución al ahorro'.";
    } else if (percentage < 50) {
        savingsTipEl.textContent = "¡Buen comienzo! Considera automatizar tus contribuciones mensuales para mantener el progreso.";
    } else if (percentage < 80) {
        savingsTipEl.textContent = "¡Vas por buen camino! Mantén tu ritmo actual para alcanzar tu meta a tiempo.";
    } else if (percentage < 100) {
        savingsTipEl.textContent = "¡Estás muy cerca! Un último esfuerzo y alcanzarás tu objetivo de ahorro.";
    } else {
        savingsTipEl.textContent = "¡Felicidades por alcanzar tu meta! Considera establecer una nueva meta o invertir tu ahorro.";
    }
}

function renderUpcomingBills() {
    upcomingBillsListEl.innerHTML = '';

    const noBillsMsg = document.getElementById('no-bills-msg');

    if (upcomingBills.length === 0) {
        // Mostrar mensaje de "No hay facturas próximas"
        upcomingBillsListEl.appendChild(noBillsMsg || createNoBillsMessage());
        return;
    }

    // Ocultar mensaje si existe
    if (noBillsMsg) {
        noBillsMsg.remove();
    }

    upcomingBills.forEach(bill => {
        const li = document.createElement('li');
        li.classList.add('p-3', 'border', 'border-gray-200', 'rounded-lg', 'hover:bg-gray-50', 'transition');

        // Determinar clase de urgencia basada en días restantes
        let urgencyClass = '';
        if (bill.daysRemaining <= 3) {
            urgencyClass = 'text-red-600 font-medium';
        } else if (bill.daysRemaining <= 7) {
            urgencyClass = 'text-orange-500';
        }

        li.innerHTML = `
            <div class="flex justify-between items-center">
            <div class="flex items-center text-gray-700">
                <i class="${bill.icon} mr-3 text-gray-500"></i>
                <div>
                        <span class="font-medium">${bill.name}</span>
                        <span class="block text-xs ${urgencyClass}">${bill.dueDate}</span>
                </div>
            </div>
                <div class="flex items-center">
                    <span class="font-medium text-gray-900 mr-3">${formatCurrency(bill.amount)}</span>
                    <button class="pay-bill-btn px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700" 
                        data-bill-id="${bill.id}">
                        <i class="fas fa-check mr-1"></i> Pagado
                    </button>
                </div>
            </div>
            <div class="mt-2 text-xs text-gray-500">
                <span class="inline-block mr-3"><i class="fas fa-sync-alt mr-1"></i> ${getBillFrequencyLabel(bill.frequency)}</span>
            </div>
        `;

        // Añadir event listener al botón de pagar
        const payBtn = li.querySelector('.pay-bill-btn');
        payBtn.addEventListener('click', () => {
            payUpcomingBill(bill.id);
        });

        upcomingBillsListEl.appendChild(li);
    });
}

function createNoBillsMessage() {
    const li = document.createElement('li');
    li.id = 'no-bills-msg';
    li.className = 'text-center text-gray-500 py-2';
    li.textContent = 'No hay facturas próximas.';
    return li;
}

function getBillFrequencyLabel(frequency) {
    const frequencies = {
        'monthly': 'Mensual',
        'bimonthly': 'Bimestral',
        'quarterly': 'Trimestral',
        'semiannual': 'Semestral',
        'annual': 'Anual'
    };
    return frequencies[frequency] || 'Periódica';
}

function renderCategoryLegend(labels, colors, percentages) {
    categoryLegendEl.innerHTML = '';
    if (labels.length === 0) {
        categoryLegendEl.innerHTML = '<li class="text-gray-500">No hay gastos para mostrar.</li>';
        return;
    }

    // Asegurarse de que no haya duplicados en la leyenda
    const uniqueCategories = new Set();
    const legendItems = [];

    // Primero recopilamos los items únicos
    for (let i = 0; i < labels.length; i++) {
        const category = labels[i];

        // Si la categoría ya está en el conjunto, la saltamos
        if (uniqueCategories.has(category)) continue;

        uniqueCategories.add(category);
        legendItems.push({
            category,
            color: colors[i],
            percentage: percentages[i]
        });
    }

    // Ordenamos las categorías por porcentaje (mayor a menor)
    legendItems.sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage));

    // Ahora renderizamos los items
    for (const item of legendItems) {
        // Crear una etiqueta de categoría similar a la tabla para la leyenda
        const li = document.createElement('li');
        li.classList.add('flex', 'items-center', 'mb-2'); // Aumentado el margen para mejor legibilidad

        // Usar el estilo pill badge como en la tabla
        li.innerHTML = `
            <div class="flex items-center w-full justify-between">
                <div class="flex items-center">
                    <span class="inline-block w-3 h-3 mr-2 rounded-full" style="background-color: ${item.color}"></span>
                    <span class="font-medium">${item.category}</span>
                </div>
                <span class="font-medium">${item.percentage}%</span>
            </div>
        `;
        categoryLegendEl.appendChild(li);
    }
}

function renderNotifications() {
    notificationList.innerHTML = ''; // Clear previous items
    const unreadNotifications = allNotifications.filter(n => !n.read);
    const readNotifications = allNotifications.filter(n => n.read);

    // Sort each group by timestamp descending (newest first)
    unreadNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    readNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const notificationsToRender = [...unreadNotifications, ...readNotifications]; // Show unread first

    if (notificationsToRender.length === 0) {
        noNotificationsMsgEl.classList.remove('hidden');
        markAllReadBtn.disabled = true; // Disable button if no notifications
    } else {
        noNotificationsMsgEl.classList.add('hidden');
        markAllReadBtn.disabled = unreadNotifications.length === 0; // Disable if no unread

        notificationsToRender.forEach(n => {
            const li = document.createElement('li');
            li.classList.add('notification-item', 'border-b', 'border-gray-100');
            if (!n.read) {
                li.classList.add('unread');
            }
            li.dataset.id = n.id; // Add ID for click handling

            // Basic icon based on type (can be enhanced)
            let iconClass = 'fas fa-info-circle text-blue-500'; // Default info
            if (n.type === 'success') iconClass = 'fas fa-check-circle text-green-500';
            if (n.type === 'warning') iconClass = 'fas fa-exclamation-triangle text-yellow-500';
            if (n.type === 'error') iconClass = 'fas fa-times-circle text-red-500';

            li.innerHTML = `
                <div class="flex items-start">
                    <div class="flex-shrink-0 pt-1">
                        <i class="${iconClass} fa-fw"></i>
                    </div>
                    <div class="ml-3 flex-1">
                        <p class="text-sm ${!n.read ? 'font-medium text-gray-900' : 'text-gray-600'}">
                            ${n.message}
                            ${!n.read ? '<button class="mark-read-btn" title="Marcar como leído">✓</button>' : ''}
                        </p>
                        <span class="notification-timestamp">${formatTimeAgo(n.timestamp)}</span>
                    </div>
                </div>
            `;
            // Add click listener to the item *if* it's unread
            if (!n.read) {
                li.addEventListener('click', (e) => {
                    markNotificationAsRead(n.id);
                });
                // Listener for the checkmark button itself
                const markReadButton = li.querySelector('.mark-read-btn');
                if (markReadButton) {
                    markReadButton.addEventListener('click', (e) => {
                        e.stopPropagation(); // Prevent li click handler from firing too
                        markNotificationAsRead(n.id);
                    });
                }
            }

            notificationList.appendChild(li);
        });
    }
}

function updateNotificationBadge() {
    const unreadCount = allNotifications.filter(n => !n.read).length;
    const badgeElement = document.getElementById('notification-badge');
    if (unreadCount > 0) {
        badgeElement.style.display = 'flex'; // Show badge
    } else {
        badgeElement.style.display = 'none'; // Hide badge
    }
}

function toggleNotificationPanel() {
    const panel = document.getElementById('notification-panel');
    isNotificationPanelOpen = !isNotificationPanelOpen;

    if (isNotificationPanelOpen) {
        // Primero hacemos visible el panel pero con opacidad 0
        panel.classList.remove('hidden');
        // Permitimos que el navegador procese el cambio de display
        setTimeout(() => {
            panel.classList.add('show');
            renderNotifications(); // Ensure content is up-to-date
        }, 10);
    } else {
        panel.classList.remove('show');
        // Esperamos a que termine la transición antes de ocultarlo
        setTimeout(() => {
            panel.classList.add('hidden');
        }, 300); // Este valor debe ser igual a la duración de la transición en CSS
    }
}

// --- Funciones de modal ---
function openModal(mode = 'add', transactionData = null) {
    isEditing = mode === 'edit';
    editingId = isEditing ? transactionData.id : null;

    modalTitle.textContent = isEditing ? 'Editar Transacción' : 'Nueva Transacción';
    transactionForm.reset(); // Clear previous values

    // Set today's date as default for new transactions
    const today = new Date().toISOString().split('T')[0];
    transactionDateInput.value = today;

    // Referencia al checkbox de contribución al ahorro
    const contributionCheckbox = document.getElementById('savings-contribution');
    // Referencia al checkbox de factura periódica
    const billCheckbox = document.getElementById('is-bill');
    const billFrequencyContainer = document.getElementById('bill-frequency-container');
    const billFrequencySelect = document.getElementById('bill-frequency');

    // Configurar el evento para mostrar/ocultar la sección de frecuencia
    billCheckbox.addEventListener('change', function () {
        if (this.checked) {
            billFrequencyContainer.classList.remove('hidden');
            // Si es un ingreso, no permitir marcar como factura
            if (transactionTypeInput.value === 'income') {
                this.checked = false;
                billFrequencyContainer.classList.add('hidden');
                openAlertModal('Aviso', 'Las facturas periódicas solo pueden ser gastos, no ingresos.');
            }
        } else {
            billFrequencyContainer.classList.add('hidden');
        }
    });

    // Listener para tipo de transacción
    transactionTypeInput.addEventListener('change', function () {
        // Si cambia a ingreso, desmarcar la opción de factura
        if (this.value === 'income' && billCheckbox.checked) {
            billCheckbox.checked = false;
            billFrequencyContainer.classList.add('hidden');
            openAlertModal('Aviso', 'Las facturas periódicas solo pueden ser gastos, no ingresos.');
        }
    });

    if (isEditing && transactionData) {
        transactionIdInput.value = transactionData.id;
        transactionTypeInput.value = transactionData.type || (transactionData.amount > 0 ? 'income' : 'expense'); // Infer type if missing
        transactionNameInput.value = transactionData.name;
        updateCategoryOptions(transactionTypeInput.value); // Actualizar opciones de categoría según el tipo
        transactionCategoryInput.value = transactionData.category;
        transactionDateInput.value = transactionData.date; // Should be YYYY-MM-DD
        transactionAmountInput.value = Math.abs(transactionData.amount); // Show positive amount in form
        transactionStatusInput.value = transactionData.status;
        contributionCheckbox.checked = transactionData.isSavingsContribution || false; // Establecer estado del checkbox

        // Configurar opciones de factura periódica
        billCheckbox.checked = transactionData.isBill || false;
        if (transactionData.isBill) {
            billFrequencyContainer.classList.remove('hidden');
            billFrequencySelect.value = transactionData.frequency || 'monthly';
        } else {
            billFrequencyContainer.classList.add('hidden');
        }
    } else {
        transactionIdInput.value = ''; // Clear ID for adding
        updateCategoryOptions(transactionTypeInput.value); // Actualizar categorías para un nuevo registro
        contributionCheckbox.checked = false; // No marcado por defecto
        billCheckbox.checked = false; // No marcado por defecto
        billFrequencyContainer.classList.add('hidden');
    }

    // Si la categoría es "Ahorro", marcar el checkbox automáticamente
    if (transactionCategoryInput.value === 'Ahorro') {
        contributionCheckbox.checked = true;
    }

    // Añadir listener para categoría
    transactionCategoryInput.addEventListener('change', () => {
        if (transactionCategoryInput.value === 'Ahorro') {
            contributionCheckbox.checked = true;
        }
    });

    // Mostrar el modal con la nueva animación
    transactionModal.classList.add('show');
}

function closeModal() {
    transactionModal.classList.remove('show');
    transactionForm.reset();
    isEditing = false;
    editingId = null;
}

function openSavingsModal() {
    const savingsModal = document.getElementById('savings-goal-modal');
    const goalInput = document.getElementById('savings-goal-amount');
    const currentInput = document.getElementById('current-savings-amount');

    // Establecer los valores actuales
    goalInput.value = savingsGoal;
    currentInput.value = currentSavings;

    // Mostrar modal
    savingsModal.classList.add('show');
}

function closeSavingsModal() {
    const savingsModal = document.getElementById('savings-goal-modal');
    savingsModal.classList.remove('show');
}

function handleSavingsFormSubmit(event) {
    event.preventDefault();

    const goalInput = document.getElementById('savings-goal-amount');
    const currentInput = document.getElementById('current-savings-amount');

    const newGoal = parseFloat(goalInput.value);
    const newCurrent = parseFloat(currentInput.value);

    // Validación
    if (isNaN(newGoal) || newGoal <= 0) {
        // alert('Por favor, ingresa una meta de ahorro válida mayor que cero.');
        openAlertModal('Error de Validación', 'Por favor, ingresa una meta de ahorro válida mayor que cero.');
        goalInput.focus();
        return;
    }

    if (isNaN(newCurrent) || newCurrent < 0) {
        // alert('Por favor, ingresa un monto de ahorro actual válido (debe ser 0 o positivo).');
        openAlertModal('Error de Validación', 'Por favor, ingresa un monto de ahorro actual válido (debe ser 0 o positivo).');
        currentInput.focus();
        return;
    }

    // Actualizar meta
    updateSavingsGoal(newGoal, newCurrent);
    closeSavingsModal();
}

function handleFormSubmit(event) {
    event.preventDefault(); // Prevent default form submission

    const formData = new FormData(transactionForm);
    const transactionData = {
        type: formData.get('type'),
        name: formData.get('name').trim(),
        category: formData.get('category').trim(),
        date: formData.get('date'),
        amount: parseFloat(formData.get('amount')),
        status: formData.get('status'),
        isSavingsContribution: document.getElementById('savings-contribution').checked,
        isBill: document.getElementById('is-bill').checked,
        frequency: document.getElementById('is-bill').checked ? document.getElementById('bill-frequency').value : null
    };

    // Validación mejorada
    if (!transactionData.name) {
        // alert('Por favor, ingresa un nombre para la transacción.');
        openAlertModal('Error de Validación', 'Por favor, ingresa un nombre para la transacción.');
        transactionNameInput.focus();
        return;
    }

    if (!transactionData.category) {
        // alert('Por favor, ingresa una categoría para la transacción.');
        openAlertModal('Error de Validación', 'Por favor, ingresa una categoría para la transacción.');
        transactionCategoryInput.focus();
        return;
    }

    if (!transactionData.date) {
        // alert('Por favor, selecciona una fecha para la transacción.');
        openAlertModal('Error de Validación', 'Por favor, selecciona una fecha para la transacción.');
        transactionDateInput.focus();
        return;
    }

    if (isNaN(transactionData.amount) || transactionData.amount <= 0) {
        // alert('Por favor, ingresa un monto válido mayor que cero.');
        openAlertModal('Error de Validación', 'Por favor, ingresa un monto válido mayor que cero.');
        transactionAmountInput.focus();
        return;
    }

    // Validación adicional para facturas
    if (transactionData.isBill && transactionData.type === 'income') {
        // alert('Las facturas periódicas solo pueden ser gastos, no ingresos.');
        openAlertModal('Aviso', 'Las facturas periódicas solo pueden ser gastos, no ingresos.');
        document.getElementById('is-bill').checked = false;
        return;
    }

    if (isEditing) {
        transactionData.id = editingId; // Add the ID back for updating
        updateTransaction(transactionData);
    } else {
        addTransaction(transactionData);
    }

    closeModal();
}

function updateCategoryOptions(type) {
    const categorySelect = document.getElementById('transaction-category');
    categorySelect.innerHTML = ''; // Limpiar opciones existentes

    // Seleccionar el array de categorías según el tipo
    const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    // Crear y añadir opciones al selector
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
}

function openEditModal(id) {
    const transaction = allTransactions.find(t => t.id === id);
    if (transaction) {
        openModal('edit', transaction);
    }
}

// --- Búsqueda ---
function handleSearch(searchTerm) {
    const normalizedSearchTerm = normalizeText(searchTerm);

    if (normalizedSearchTerm === '') {
        filteredTransactions = [...allTransactions]; // Show all if search is empty
    } else {
        filteredTransactions = allTransactions.filter(t =>
            normalizeText(t.name).includes(normalizedSearchTerm) ||
            normalizeText(t.category).includes(normalizedSearchTerm) ||
            formatCurrency(t.amount).includes(normalizedSearchTerm) ||
            normalizeText(formatDate(t.date)).includes(normalizedSearchTerm)
        );
    }
    // Re-render only the table with filtered data
    renderTransactions(filteredTransactions);
}

// --- Filtros Avanzados ---
function populateCategoryFilter() {
    const categoryFilter = document.getElementById('filter-category');
    categoryFilter.innerHTML = '<option value="">Todas</option>';

    // Crear un conjunto de todas las categorías existentes en las transacciones
    const categories = new Set();
    allTransactions.forEach(t => {
        if (t.category) categories.add(t.category);
    });

    // Añadir opciones al selector
    Array.from(categories).sort().forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

function applyAdvancedFilters() {
    const dateFrom = document.getElementById('filter-date-from').value;
    const dateTo = document.getElementById('filter-date-to').value;
    const category = document.getElementById('filter-category').value;
    const type = document.getElementById('filter-transaction-type').value;

    // Convertir fechas a objetos Date para comparación
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo) : null;

    // Si hay una fecha "hasta", ajustar para incluir el día completo
    if (toDate) {
        toDate.setHours(23, 59, 59, 999);
    }

    // Aplicar filtros
    filteredTransactions = allTransactions.filter(t => {
        const transactionDate = new Date(t.date);
        const matchDate = (!fromDate || transactionDate >= fromDate) && (!toDate || transactionDate <= toDate);
        const matchCategory = !category || t.category === category;
        const matchType = !type ||
            (type === 'income' && t.amount > 0) ||
            (type === 'expense' && t.amount < 0);

        return matchDate && matchCategory && matchType;
    });

    // Aplicar búsqueda de texto si está activa
    const searchTerm = document.getElementById('search-input').value.trim();
    if (searchTerm) {
        const normalizedSearchTerm = normalizeText(searchTerm);
        filteredTransactions = filteredTransactions.filter(t =>
            normalizeText(t.name).includes(normalizedSearchTerm) ||
            normalizeText(t.category).includes(normalizedSearchTerm) ||
            formatCurrency(t.amount).includes(normalizedSearchTerm) ||
            normalizeText(formatDate(t.date)).includes(normalizedSearchTerm)
        );
    }

    renderTransactions(filteredTransactions);
}

function clearAdvancedFilters() {
    document.getElementById('filter-date-from').value = '';
    document.getElementById('filter-date-to').value = '';
    document.getElementById('filter-category').value = '';
    document.getElementById('filter-transaction-type').value = '';

    filteredTransactions = [...allTransactions];
    renderTransactions(filteredTransactions);
}

// --- Función principal de renderizado ---
function renderDashboard() {
    // Apply search filter before rendering table
    const searchTerm = searchInput.value.toLowerCase().trim(); // Use current search term
    if (searchTerm === '') {
        filteredTransactions = [...allTransactions];
    } else {
        filteredTransactions = allTransactions.filter(t =>
            t.name.toLowerCase().includes(searchTerm) ||
            t.category.toLowerCase().includes(searchTerm)
        );
    }

    updateSummaryPercentages(); // Recalculate summary cards and percentages
    renderTransactions(filteredTransactions, 10); // Render table with current filter and limit to 10
    renderSavingsGoal(); // Render savings goal
    renderUpcomingBills(); // Render upcoming bills

    // Re-initialize charts with potentially updated data
    initIncomeExpenseChart(document.querySelector('.filter-btn.active')?.dataset.period || 'monthly');
    initExpenseCategoryChart();
}

// --- Inicialización y Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos DOM
    window.totalBalanceEl = document.getElementById('total-balance');
    window.totalIncomeEl = document.getElementById('total-income');
    window.totalExpensesEl = document.getElementById('total-expenses');
    window.balancePercentageEl = document.getElementById('balance-percentage');
    window.incomePercentageEl = document.getElementById('income-percentage');
    window.expensePercentageEl = document.getElementById('expense-percentage');
    window.transactionsTbody = document.getElementById('transactions-tbody');
    window.noTransactionsMsg = document.getElementById('no-transactions-msg');
    window.savingsGoalTextEl = document.getElementById('savings-goal-text');
    window.savingsProgressBarEl = document.getElementById('savings-progress-bar');
    window.savingsRemainingTextEl = document.getElementById('savings-remaining-text');
    window.upcomingBillsListEl = document.getElementById('upcoming-bills-list');
    window.categoryLegendEl = document.getElementById('category-legend');
    window.sidebar = document.getElementById('sidebar');
    window.sidebarToggle = document.getElementById('sidebar-toggle');
    window.overlay = document.getElementById('overlay');
    window.searchInput = document.getElementById('search-input');
    window.searchInputMobile = document.getElementById('search-input-mobile');

    // Modal Elements
    window.transactionModal = document.getElementById('transaction-modal');
    window.closeModalBtn = document.getElementById('close-modal-btn');
    window.cancelBtn = document.getElementById('cancel-btn');
    window.addTransactionBtn = document.getElementById('add-transaction-btn');
    window.transactionForm = document.getElementById('transaction-form');
    window.modalTitle = document.getElementById('modal-title');
    window.transactionIdInput = document.getElementById('transaction-id');
    window.transactionTypeInput = document.getElementById('transaction-type');
    window.transactionNameInput = document.getElementById('transaction-name');
    window.transactionCategoryInput = document.getElementById('transaction-category');
    window.transactionDateInput = document.getElementById('transaction-date');
    window.transactionAmountInput = document.getElementById('transaction-amount');
    window.transactionStatusInput = document.getElementById('transaction-status');

    // Elementos del Modal de Todas las Transacciones
    window.allTransactionsModal = document.getElementById('all-transactions-modal');
    window.closeAllTransactionsModalBtn = document.getElementById('close-all-transactions-modal-btn');
    window.viewAllTransactionsBtn = document.getElementById('view-all-transactions-btn');
    window.closeAllTransactionsBottomBtn = document.getElementById('close-all-transactions-bottom-btn');
    window.modalApplyFiltersBtn = document.getElementById('modal-apply-filters-btn');
    window.modalClearFiltersBtn = document.getElementById('modal-clear-filters-btn');

    // Delete Confirmation Modal Elements
    window.deleteConfirmationModal = document.getElementById('delete-confirmation-modal');
    window.closeDeleteModalBtn = document.getElementById('close-delete-modal-btn');
    window.cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    window.confirmDeleteBtn = document.getElementById('confirm-delete-btn');

    // Notification Elements
    window.notificationButton = document.getElementById('notification-button');
    window.notificationPanel = document.getElementById('notification-panel');
    window.notificationList = document.getElementById('notification-list');
    window.noNotificationsMsgEl = document.getElementById('no-notifications-msg');
    window.markAllReadBtn = document.getElementById('mark-all-read-btn');

    // Savings Goal Modal Elements
    window.savingsGoalModal = document.getElementById('savings-goal-modal');
    window.closeSavingsModalBtn = document.getElementById('close-savings-modal-btn');
    window.cancelSavingsBtn = document.getElementById('cancel-savings-btn');
    window.savingsGoalForm = document.getElementById('savings-goal-form');
    window.editSavingsBtn = document.getElementById('edit-savings-btn');

    // Bills Report Modal Elements
    window.billsReportModal = document.getElementById('bills-report-modal');
    window.closeBillsReportModalBtn = document.getElementById('close-bills-report-modal-btn');
    window.closeBillsReportBottomBtn = document.getElementById('close-bills-report-bottom-btn');
    window.showBillsReportBtn = document.getElementById('show-bills-report-btn');
    window.billsReportMonthsSelect = document.getElementById('bills-report-months');
    window.billsReportYearSelect = document.getElementById('bills-report-year');
    window.billsReportCategorySelect = document.getElementById('bills-report-category');
    window.billsReportSearchInput = document.getElementById('bills-report-search');
    window.applyBillsReportFiltersBtn = document.getElementById('apply-bills-report-filters-btn');
    window.billsReportTbody = document.getElementById('bills-report-tbody');
    window.noBillsReportMsg = document.getElementById('no-bills-report-msg');

    // Alert Modal Elements
    window.alertModal = document.getElementById('alert-modal');
    window.closeAlertModalBtn = document.getElementById('close-alert-modal-btn');
    window.alertModalTitle = document.getElementById('alert-modal-title');
    window.alertModalMessage = document.getElementById('alert-modal-message');
    window.alertModalOkBtn = document.getElementById('alert-modal-ok-btn');

    // Elementos de Filtros
    window.filterDateFrom = document.getElementById('filter-date-from');
    window.filterDateTo = document.getElementById('filter-date-to');
    window.filterCategory = document.getElementById('filter-category');
    window.filterType = document.getElementById('filter-transaction-type');
    window.applyFiltersBtn = document.getElementById('apply-filters-btn');
    window.clearFiltersBtn = document.getElementById('clear-filters-btn');

    // Referencias para la navegación de secciones
    window.dashboardView = document.querySelector('body > div.flex-1.flex.flex-col.overflow-hidden'); // Contenedor del dashboard principal

    // Sidebar links
    window.sidebarDashboardLink = Array.from(document.querySelectorAll('#sidebar nav ul li a')).find(a => a.textContent.trim() === 'Panel Principal');

    // Event Listeners
    // Sidebar Toggle (Mobile)
    sidebarToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    });

    document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== sidebarToggle) {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        }
    });

    // Chart Filter Buttons
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active', 'bg-purple-100', 'text-purple-700'));
            button.classList.add('active', 'bg-purple-100', 'text-purple-700');
            const period = button.getAttribute('data-period');
            initIncomeExpenseChart(period);
        });
    });

    // Modal Listeners
    addTransactionBtn.addEventListener('click', () => openModal('add'));
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    transactionForm.addEventListener('submit', handleFormSubmit);

    // Modal de Todas las Transacciones Listeners
    viewAllTransactionsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openAllTransactionsModal();
    });

    closeAllTransactionsModalBtn.addEventListener('click', closeAllTransactionsModal);
    closeAllTransactionsBottomBtn.addEventListener('click', closeAllTransactionsModal);
    modalApplyFiltersBtn.addEventListener('click', applyModalAdvancedFilters);
    modalClearFiltersBtn.addEventListener('click', clearModalAdvancedFilters);

    // Delete Confirmation Modal Listeners
    closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
    cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    confirmDeleteBtn.addEventListener('click', confirmDeleteTransaction);

    // Notification Panel Listeners
    notificationButton.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleNotificationPanel();
    });

    markAllReadBtn.addEventListener('click', () => {
        markAllNotificationsAsRead();
    });

    // Close notification panel if clicked outside
    document.addEventListener('click', (e) => {
        if (isNotificationPanelOpen && !notificationPanel.contains(e.target) && e.target !== notificationButton && !notificationButton.contains(e.target)) {
            toggleNotificationPanel(); // Close it
        }
    });

    // Savings Goal Modal Listeners
    editSavingsBtn.addEventListener('click', openSavingsModal);
    closeSavingsModalBtn.addEventListener('click', closeSavingsModal);
    cancelSavingsBtn.addEventListener('click', closeSavingsModal);
    savingsGoalForm.addEventListener('submit', handleSavingsFormSubmit);

    // Bills Report Modal Listeners
    showBillsReportBtn.addEventListener('click', openBillsReportModal);
    closeBillsReportModalBtn.addEventListener('click', closeBillsReportModal);
    closeBillsReportBottomBtn.addEventListener('click', closeBillsReportModal);
    applyBillsReportFiltersBtn.addEventListener('click', refreshBillsReport);

    // Ordenamiento de tabla de facturas
    document.querySelectorAll('#bills-report-table th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const sortField = th.getAttribute('data-sort');
            sortBillsReport(sortField);
        });
    });

    // Input de búsqueda en facturas
    billsReportSearchInput.addEventListener('input', debounce(() => {
        refreshBillsReport();
    }, 300));

    // Actualizar categorías dinámicamente al cambiar el tipo de transacción
    transactionTypeInput.addEventListener('change', (e) => {
        updateCategoryOptions(e.target.value);
    });

    // Search Listeners
    searchInput.addEventListener('input', (e) => handleSearch(e.target.value));
    searchInputMobile.addEventListener('input', (e) => handleSearch(e.target.value));

    // Filtros Avanzados Listeners
    applyFiltersBtn.addEventListener('click', applyAdvancedFilters);
    clearFiltersBtn.addEventListener('click', clearAdvancedFilters);

    // Alert Modal Listeners
    closeAlertModalBtn.addEventListener('click', closeAlertModal);
    alertModalOkBtn.addEventListener('click', closeAlertModal);

    // Global functions
    window.openEditModal = openEditModal;
    window.openSavingsModal = openSavingsModal;
    window.openBillsReportModal = openBillsReportModal;

    // --- Initial Load ---
    loadTransactions(); // Load data from storage first
    if (typeof loadAccounts === 'function') loadAccounts(); // Cargar cuentas

    // Determinar la vista inicial (por defecto el Dashboard)
    // Esto podría extenderse para leer un hash de URL, por ejemplo #accounts
    if (window.location.hash === '#accounts') {
        navigateToAccountsView();
    } else {
        navigateToDashboardView(); // Asegura que el dashboard se renderice por defecto
    }

    updateNotificationBadge(); // Set initial state of the badge
    renderNotifications(); // Ensure notification panel content is rendered initially even if hidden
    initBillsReportYears(); // Initialize years dropdown for bills report

    // Set initial active state for monthly button (en dashboard)
    const monthlyButton = document.querySelector('.filter-btn[data-period="monthly"]');
    if (monthlyButton && dashboardView && !dashboardView.classList.contains('hidden')) { // Solo si estamos en dashboard
        monthlyButton.classList.add('active', 'bg-purple-100', 'text-purple-700');
        monthlyButton.classList.remove('text-gray-600', 'hover:bg-gray-100');
    }

    // Inicializar filtros del dashboard
    populateCategoryFilter();

    // Exportar funciones de navegación globalmente para su uso desde cualquier parte
    window.navigateToDashboardView = navigateToDashboardView;
    window.navigateToAccountsView = navigateToAccountsView;

    // La navegación por los enlaces de la sidebar ahora se maneja en el script personalizado
    // en index.html para centralizar y evitar conflictos
});

// Función para esperar un tiempo determinado (para debouncing)
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// --- Funciones para el Modal de Avisos ---
function openAlertModal(title, message) {
    alertModalTitle.textContent = title;
    alertModalMessage.textContent = message;
    alertModal.classList.add('show');
}

function closeAlertModal() {
    alertModal.classList.remove('show');
}

// --- Funciones para el Informe de Facturas Próximas ---
function openBillsReportModal() {
    populateBillsReportCategories();

    // Reiniciar el calendario al mes actual
    calendarCurrentMonth = new Date().getMonth();
    calendarCurrentYear = new Date().getFullYear();
    selectedDay = null;

    refreshBillsReport();
    billsReportModal.classList.add('show');

    // Asegurar que los botones de navegación del calendario tengan event listeners
    document.getElementById('prev-month-btn').addEventListener('click', prevMonth);
    document.getElementById('next-month-btn').addEventListener('click', nextMonth);

    // Añadir event listeners para los botones de exportación
    document.getElementById('export-excel-btn').addEventListener('click', exportToExcel);
    document.getElementById('export-pdf-btn').addEventListener('click', exportToPDF);

    // Añadir event listener para el botón de cierre al final del modal
    document.getElementById('close-bills-report-bottom-btn').addEventListener('click', closeBillsReportModal);
}

function closeBillsReportModal() {
    billsReportModal.classList.remove('show');
}

function initBillsReportYears() {
    const currentYear = new Date().getFullYear();
    billsReportYearSelect.innerHTML = ''; // Limpiar opciones existentes

    // Generar opciones para los próximos 5 años
    for (let year = currentYear; year <= currentYear + 5; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;

        if (year === currentYear) {
            option.selected = true;
        }

        billsReportYearSelect.appendChild(option);
    }
}

function populateBillsReportCategories() {
    // Limpiar opciones existentes, excepto la opción "Todas"
    const allOption = billsReportCategorySelect.querySelector('option[value=""]');
    billsReportCategorySelect.innerHTML = '';
    billsReportCategorySelect.appendChild(allOption);

    // Obtener categorías únicas de las facturas
    const categories = new Set();
    allTransactions.forEach(transaction => {
        if (transaction.isBill && transaction.category) {
            categories.add(transaction.category);
        }
    });

    // Ordenar categorías alfabéticamente
    const sortedCategories = Array.from(categories).sort();

    // Añadir cada categoría como opción
    sortedCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        billsReportCategorySelect.appendChild(option);
    });
}

function generateFutureBills() {
    const now = new Date();
    const selectedMonths = parseInt(billsReportMonthsSelect.value);
    const selectedYear = parseInt(billsReportYearSelect.value);
    const endDate = new Date(selectedYear, now.getMonth() + selectedMonths, now.getDate());
    const futureBills = [];

    // Filtrar transacciones que son facturas periódicas
    const billTransactions = allTransactions.filter(t => t.isBill && t.frequency && t.type === 'expense');

    // Agrupar facturas por nombre para encontrar la más reciente de cada tipo
    const billGroups = {};
    billTransactions.forEach(bill => {
        const key = bill.name.toLowerCase().trim();
        if (!billGroups[key] || new Date(bill.date) > new Date(billGroups[key].date)) {
            billGroups[key] = bill;
        }
    });

    // Para cada factura recurrente, calcular sus próximas ocurrencias dentro del período seleccionado
    Object.values(billGroups).forEach(bill => {
        let lastDate = new Date(bill.date);
        let projectionDate = new Date(lastDate);

        // Generar próximas facturas hasta la fecha final
        while (projectionDate <= endDate) {
            // Calcular próxima fecha según frecuencia
            switch (bill.frequency) {
                case 'monthly':
                    projectionDate = new Date(projectionDate.setMonth(projectionDate.getMonth() + 1));
                    break;
                case 'bimonthly':
                    projectionDate = new Date(projectionDate.setMonth(projectionDate.getMonth() + 2));
                    break;
                case 'quarterly':
                    projectionDate = new Date(projectionDate.setMonth(projectionDate.getMonth() + 3));
                    break;
                case 'semiannual':
                    projectionDate = new Date(projectionDate.setMonth(projectionDate.getMonth() + 6));
                    break;
                case 'annual':
                    projectionDate = new Date(projectionDate.setFullYear(projectionDate.getFullYear() + 1));
                    break;
            }

            // Si la fecha está dentro del período seleccionado, añadir a facturas futuras
            if (projectionDate > now && projectionDate <= endDate) {
                const daysRemaining = Math.ceil((projectionDate - now) / (1000 * 60 * 60 * 24));

                futureBills.push({
                    id: Date.now() + Math.random(), // ID único
                    name: bill.name,
                    category: bill.category,
                    icon: bill.icon,
                    amount: Math.abs(bill.amount),
                    date: projectionDate.toISOString().split('T')[0], // YYYY-MM-DD
                    daysRemaining: daysRemaining,
                    frequency: bill.frequency,
                    originalId: bill.id
                });
            }
        }
    });

    return futureBills;
}

let currentFutureBills = []; // Almacena las facturas generadas actualmente
let currentSortField = 'date'; // Campo por el que se están ordenando las facturas
let currentSortDirection = 'asc'; // Dirección del ordenamiento (asc/desc)

// Variables para los gráficos del informe de facturas
let billsCategoryChartInstance = null;
let billsTrendChartInstance = null;

function refreshBillsReport() {
    // Generar facturas futuras
    const allFutureBills = generateFutureBills();

    // Aplicar filtros
    let filteredBills = allFutureBills;

    // Filtrar por categoría si se seleccionó una
    const selectedCategory = billsReportCategorySelect.value;
    if (selectedCategory) {
        filteredBills = filteredBills.filter(bill => bill.category === selectedCategory);
    }

    // Filtrar por término de búsqueda
    const searchTerm = billsReportSearchInput.value.trim().toLowerCase();
    if (searchTerm) {
        filteredBills = filteredBills.filter(bill =>
            bill.name.toLowerCase().includes(searchTerm) ||
            bill.category.toLowerCase().includes(searchTerm)
        );
    }

    // Guardar las facturas filtradas para referencia
    currentFutureBills = [...filteredBills];

    // Ordenar facturas
    sortBillsReport(currentSortField, false);

    // Actualizar totales
    updateBillsTotals(allFutureBills);

    // Actualizar gráficos de análisis
    updateBillsCategoryChart(allFutureBills);
    updateBillsTrendChart(allFutureBills);

    // Generar insights sobre gastos
    generateSpendingInsights(allFutureBills);

    // Actualizar el calendario con las facturas
    updateBillsCalendar(allFutureBills);
}

function sortBillsReport(field, toggleDirection = true) {
    // Si se hace clic en el mismo campo, invertir dirección
    if (toggleDirection && field === currentSortField) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortField = field;
        // Por defecto, ordenar fechas y montos ascendente, texto descendente
        if (field === 'date' || field === 'amount') {
            currentSortDirection = 'asc';
        } else {
            currentSortDirection = 'desc';
        }
    }

    // Actualizar iconos de ordenamiento
    updateSortIcons();

    // Ordenar facturas
    currentFutureBills.sort((a, b) => {
        let comparison = 0;

        switch (field) {
            case 'date':
                comparison = new Date(a.date) - new Date(b.date);
                break;
            case 'name':
                comparison = a.name.localeCompare(b.name);
                break;
            case 'category':
                comparison = a.category.localeCompare(b.category);
                break;
            case 'frequency':
                comparison = getFrequencyWeight(a.frequency) - getFrequencyWeight(b.frequency);
                break;
            case 'amount':
                comparison = a.amount - b.amount;
                break;
        }

        return currentSortDirection === 'asc' ? comparison : -comparison;
    });

    // Renderizar tabla
    renderBillsReportTable();
}

function getFrequencyWeight(frequency) {
    const weights = {
        'monthly': 1,
        'bimonthly': 2,
        'quarterly': 3,
        'semiannual': 4,
        'annual': 5
    };
    return weights[frequency] || 0;
}

function updateSortIcons() {
    document.querySelectorAll('#bills-report-table th[data-sort]').forEach(th => {
        const sortField = th.getAttribute('data-sort');
        const iconElement = th.querySelector('i.fas');

        if (sortField === currentSortField) {
            iconElement.className = currentSortDirection === 'asc'
                ? 'fas fa-sort-up text-purple-600 ml-1'
                : 'fas fa-sort-down text-purple-600 ml-1';
        } else {
            iconElement.className = 'fas fa-sort text-gray-400 ml-1';
        }
    });
}

function renderBillsReportTable() {
    billsReportTbody.innerHTML = '';

    if (currentFutureBills.length === 0) {
        noBillsReportMsg.classList.remove('hidden');
        return;
    }

    noBillsReportMsg.classList.add('hidden');

    // Renderizar cada factura
    currentFutureBills.forEach(bill => {
        const row = document.createElement('tr');
        row.classList.add('border-b', 'hover:bg-gray-50');

        const formattedDate = formatDate(bill.date);
        const frequencyLabel = getBillFrequencyLabel(bill.frequency);

        // Determinar clase de urgencia basada en días restantes
        let urgencyClass = '';
        if (bill.daysRemaining <= 3) {
            urgencyClass = 'text-red-600 font-medium';
        } else if (bill.daysRemaining <= 7) {
            urgencyClass = 'text-orange-500';
        }

        // Obtener color para la categoría
        const categoryColor = CATEGORY_COLORS[bill.category] || '#6b7280'; // Color por defecto (gris)

        row.innerHTML = `
            <td class="py-3 px-4">
                <div class="flex items-center">
                    <span class="${urgencyClass}">${formattedDate}</span>
                    <span class="ml-2 text-xs text-gray-500">(${bill.daysRemaining} días)</span>
                </div>
            </td>
            <td class="py-3 px-4">
                <div class="flex items-center">
                    <span class="mr-3 text-gray-500 w-5 text-center"><i class="${bill.icon || 'fas fa-question-circle'}"></i></span>
                    <span class="font-medium">${bill.name}</span>
                </div>
            </td>
            <td class="py-3 px-4">
                <span class="category-badge" style="background-color: ${categoryColor};">${bill.category}</span>
            </td>
            <td class="py-3 px-4">${frequencyLabel}</td>
            <td class="py-3 px-4 text-right font-medium">${formatCurrency(bill.amount)}</td>
            <td class="py-3 px-4 text-center">
                <button class="pay-bill-btn px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700" 
                    data-bill-id="${bill.id}">
                    <i class="fas fa-check mr-1"></i> Pagado
                </button>
            </td>
        `;

        // Añadir event listener al botón de pagar
        const payBtn = row.querySelector('.pay-bill-btn');
        payBtn.addEventListener('click', () => {
            payFutureBill(bill);
        });

        billsReportTbody.appendChild(row);
    });
}

function payFutureBill(bill) {
    // Crear una nueva transacción basada en la factura futura
    const newTransaction = {
        name: bill.name,
        category: bill.category,
        date: bill.date,
        amount: bill.amount,
        status: 'Completado',
        type: 'expense',
        isSavingsContribution: false,
        isBill: true,
        frequency: bill.frequency,
        icon: bill.icon
    };

    // Añadir la transacción
    addTransaction(newTransaction);

    // Cerrar el modal de informe y refrescar el dashboard
    closeBillsReportModal();
    addNotification(`Factura "${bill.name}" pagada.`, 'success');

    // Animar la fila que se está pagando
    animatePaidBillRow(bill.id);
}

function animatePaidBillRow(billId) {
    const rows = billsReportTbody.querySelectorAll('tr');
    rows.forEach(row => {
        const payBtn = row.querySelector(`.pay-bill-btn[data-bill-id="${billId}"]`);
        if (payBtn) {
            const parentRow = payBtn.closest('tr');
            parentRow.classList.add('bill-paid');
        }
    });
}

function updateBillsTotals(allFutureBills) {
    const now = new Date();
    const selectedMonths = parseInt(billsReportMonthsSelect.value);

    // Calcular períodos
    const thirtyDaysLater = new Date(now);
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    const twoMonthsLater = new Date(now);
    twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);

    const threeMonthsLater = new Date(now);
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

    const sixMonthsLater = new Date(now);
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

    const oneYearLater = new Date(now);
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

    // Filtrar facturas por período y sumar montos
    const total30Days = allFutureBills
        .filter(bill => new Date(bill.date) <= thirtyDaysLater)
        .reduce((sum, bill) => sum + bill.amount, 0);

    const totalBimonthly = allFutureBills
        .filter(bill => new Date(bill.date) <= twoMonthsLater)
        .reduce((sum, bill) => sum + bill.amount, 0);

    const totalQuarterly = allFutureBills
        .filter(bill => new Date(bill.date) <= threeMonthsLater)
        .reduce((sum, bill) => sum + bill.amount, 0);

    // Calcular el total semestral solo si el período seleccionado es suficiente
    const totalSemiannual = selectedMonths >= 6
        ? allFutureBills
            .filter(bill => new Date(bill.date) <= sixMonthsLater)
            .reduce((sum, bill) => sum + bill.amount, 0)
        : null;

    // Calcular el total anual solo si el período seleccionado es suficiente
    const totalAnnual = selectedMonths >= 12
        ? allFutureBills
            .filter(bill => new Date(bill.date) <= oneYearLater)
            .reduce((sum, bill) => sum + bill.amount, 0)
        : null;

    // Actualizar elementos del DOM
    document.getElementById('total-30-days').textContent = formatCurrency(total30Days);
    document.getElementById('total-bimonthly').textContent = formatCurrency(totalBimonthly);
    document.getElementById('total-quarterly').textContent = formatCurrency(totalQuarterly);

    // Actualizar el total semestral o mostrar "N/A" si el período es insuficiente
    const totalSemiannualElement = document.getElementById('total-semiannual');
    if (totalSemiannual !== null) {
        totalSemiannualElement.textContent = formatCurrency(totalSemiannual);
        totalSemiannualElement.classList.remove('text-gray-400');
    } else {
        totalSemiannualElement.textContent = 'N/A';
        totalSemiannualElement.classList.add('text-gray-400');
    }

    // Actualizar el total anual o mostrar "N/A" si el período es insuficiente
    const totalAnnualElement = document.getElementById('total-annual');
    if (totalAnnual !== null) {
        totalAnnualElement.textContent = formatCurrency(totalAnnual);
        totalAnnualElement.classList.remove('text-gray-400');
    } else {
        totalAnnualElement.textContent = 'N/A';
        totalAnnualElement.classList.add('text-gray-400');
    }
}

function updateBillsCategoryChart(bills) {
    const ctx = document.getElementById('bills-category-chart');
    if (!ctx) return;

    // Si no hay facturas, mostrar mensaje
    if (bills.length === 0) {
        if (billsCategoryChartInstance) {
            billsCategoryChartInstance.destroy();
            billsCategoryChartInstance = null;
        }

        const ctxEmpty = ctx.getContext('2d');
        ctxEmpty.clearRect(0, 0, ctx.width, ctx.height);
        ctxEmpty.font = '14px Arial';
        ctxEmpty.fillStyle = '#6B7280';
        ctxEmpty.textAlign = 'center';
        ctxEmpty.fillText('No hay datos suficientes para el análisis', ctx.width / 2, ctx.height / 2);
        return;
    }

    // Agrupar facturas por categoría y sumar montos
    const categoriesMap = {};
    bills.forEach(bill => {
        const category = bill.category || 'Sin Categoría';
        if (!categoriesMap[category]) {
            categoriesMap[category] = 0;
        }
        categoriesMap[category] += bill.amount;
    });

    // Convertir a arrays para el gráfico
    const categories = Object.keys(categoriesMap);
    const amounts = categories.map(category => categoriesMap[category]);
    const totalAmount = amounts.reduce((a, b) => a + b, 0);

    // Calcular porcentajes
    const percentages = amounts.map(amount => ((amount / totalAmount) * 100).toFixed(1));

    // Obtener colores para cada categoría
    const colors = categories.map(category => CATEGORY_COLORS[category] || '#6b7280');

    // Destruir gráfico anterior si existe
    if (billsCategoryChartInstance) {
        billsCategoryChartInstance.destroy();
    }

    // Crear nuevo gráfico
    billsCategoryChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [{
                label: 'Porcentaje del Gasto Total',
                data: percentages,
                backgroundColor: colors,
                borderColor: colors.map(color => adjustColor(color, -20)),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => `${value}%`
                    },
                    title: {
                        display: true,
                        text: 'Porcentaje'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = context.raw;
                            const absoluteValue = amounts[context.dataIndex];
                            return `${value}% (${formatCurrency(absoluteValue)})`;
                        }
                    }
                }
            }
        }
    });
}

function updateBillsTrendChart(currentBills) {
    const ctx = document.getElementById('bills-trend-chart');
    if (!ctx) return;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Crear array con los últimos 6 meses
    const months = [];
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    for (let i = 5; i >= 0; i--) {
        let monthIndex = currentMonth - i;
        let year = currentYear;

        if (monthIndex < 0) {
            monthIndex += 12;
            year--;
        }

        months.push({
            name: monthNames[monthIndex],
            index: monthIndex,
            year: year,
            fullName: `${monthNames[monthIndex]} ${year}`
        });
    }

    // Agrupar las facturas actuales proyectadas por mes
    const projectedData = Array(6).fill(0);

    currentBills.forEach(bill => {
        const billDate = new Date(bill.date);
        const billMonth = billDate.getMonth();
        const billYear = billDate.getFullYear();

        // Encontrar el índice del mes en nuestro array
        const monthIndex = months.findIndex(m => m.index === billMonth && m.year === billYear);
        if (monthIndex !== -1) {
            projectedData[monthIndex] += bill.amount;
        }
    });

    // Obtener datos históricos (transacciones pasadas que eran facturas)
    const historicalData = Array(6).fill(0);

    allTransactions.forEach(transaction => {
        if (transaction.isBill && transaction.type === 'expense' && transaction.status === 'Completado') {
            const txDate = new Date(transaction.date);
            const txMonth = txDate.getMonth();
            const txYear = txDate.getFullYear();

            // Solo considerar los últimos 6 meses
            for (let i = 0; i < months.length; i++) {
                const month = months[i];
                if (month.index === txMonth && month.year === txYear) {
                    historicalData[i] += Math.abs(transaction.amount);
                    break;
                }
            }
        }
    });

    // Destruir gráfico anterior si existe
    if (billsTrendChartInstance) {
        billsTrendChartInstance.destroy();
    }

    // Crear nuevo gráfico
    billsTrendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months.map(m => m.name),
            datasets: [
                {
                    label: 'Facturas Históricas',
                    data: historicalData,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Facturas Proyectadas',
                    data: projectedData,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderDash: [5, 5],
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

function generateSpendingInsights(futureBills) {
    const insightsContainer = document.getElementById('spending-insights');
    if (!insightsContainer) return;

    insightsContainer.innerHTML = '';

    if (futureBills.length === 0) {
        insightsContainer.innerHTML = '<p class="text-gray-500">No hay datos suficientes para generar análisis.</p>';
        return;
    }

    // 1. Calcular categoría con mayor gasto
    const categoriesMap = {};
    futureBills.forEach(bill => {
        const category = bill.category || 'Sin Categoría';
        if (!categoriesMap[category]) {
            categoriesMap[category] = 0;
        }
        categoriesMap[category] += bill.amount;
    });

    let topCategory = '';
    let topAmount = 0;

    Object.entries(categoriesMap).forEach(([category, amount]) => {
        if (amount > topAmount) {
            topCategory = category;
            topAmount = amount;
        }
    });

    const topCategoryPercentage = ((topAmount / futureBills.reduce((sum, bill) => sum + bill.amount, 0)) * 100).toFixed(1);

    // 2. Calcular tendencia comparando con datos históricos
    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // Facturas históricas de los últimos 3 meses
    const recentBills = allTransactions.filter(tx =>
        tx.isBill &&
        tx.type === 'expense' &&
        tx.status === 'Completado' &&
        new Date(tx.date) >= threeMonthsAgo
    );

    const lastMonthBills = recentBills.filter(tx =>
        new Date(tx.date) >= oneMonthAgo
    );

    const avgMonthlyBill = lastMonthBills.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    // Facturas proyectadas para el próximo mes
    const nextMonthEnd = new Date(now);
    nextMonthEnd.setMonth(nextMonthEnd.getMonth() + 1);

    const projectedMonthlyBill = futureBills
        .filter(bill => new Date(bill.date) <= nextMonthEnd)
        .reduce((sum, bill) => sum + bill.amount, 0);

    let trend = 0;
    if (avgMonthlyBill > 0) {
        trend = ((projectedMonthlyBill - avgMonthlyBill) / avgMonthlyBill) * 100;
    }

    // Generar insights
    let insights = '';

    insights += `<p class="mb-2 flex items-start"><i class="fas fa-chart-pie text-purple-500 mr-2 mt-0.5"></i>La categoría con mayor gasto es <strong class="mx-1">${topCategory}</strong> representando el&nbsp; <strong>${topCategoryPercentage}% </strong>&nbsp;del total.</p>`;

    if (lastMonthBills.length > 0) {
        const trendIcon = trend > 0 ? 'fa-arrow-up text-red-500' : 'fa-arrow-down text-green-500';
        const trendText = trend > 0 ? 'aumentarán' : 'disminuirán';
        const trendAbs = Math.abs(trend).toFixed(1);

        if (Math.abs(trend) >= 5) {
            insights += `<p class="mb-2 flex items-start"><i class="fas ${trendIcon} mr-2 mt-0.5"></i>Tus gastos recurrentes ${trendText} un <strong>${trendAbs}%</strong> respecto al mes anterior.</p>`;
        } else {
            insights += `<p class="mb-2 flex items-start"><i class="fas fa-equals text-blue-500 mr-2 mt-0.5"></i>Tus gastos recurrentes se mantienen estables respecto al mes anterior.</p>`;
        }
    }

    // Frecuencia más común
    const frequencyCounts = {};
    futureBills.forEach(bill => {
        if (!frequencyCounts[bill.frequency]) {
            frequencyCounts[bill.frequency] = 0;
        }
        frequencyCounts[bill.frequency]++;
    });

    let topFrequency = '';
    let topCount = 0;

    Object.entries(frequencyCounts).forEach(([frequency, count]) => {
        if (count > topCount) {
            topFrequency = frequency;
            topCount = count;
        }
    });

    const frequencyLabel = getBillFrequencyLabel(topFrequency);
    const frequencyPercentage = ((topCount / futureBills.length) * 100).toFixed(1);

    insights += `<p class="flex items-start"><i class="fas fa-sync-alt text-blue-500 mr-2 mt-0.5"></i>El&nbsp; <strong>${frequencyPercentage}%</strong>&nbsp;de tus facturas son de frecuencia&nbsp; <strong>${frequencyLabel}</strong>.</p>`;

    insightsContainer.innerHTML = insights;
}

// Función de utilidad para ajustar el color (oscurecer/aclarar)
function adjustColor(hex, percent) {
    // Validar formato de color
    hex = hex.replace(/^\s*#|\s*$/g, '');
    if (hex.length === 3) {
        hex = hex.replace(/(.)/g, '$1$1');
    }

    // Convertir a RGB
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    // Ajustar valores
    r = Math.max(0, Math.min(255, r + percent));
    g = Math.max(0, Math.min(255, g + percent));
    b = Math.max(0, Math.min(255, b + percent));

    // Convertir de vuelta a hex
    return '#' +
        ((1 << 24) + (r << 16) + (g << 8) + b)
            .toString(16).slice(1);
}

// --- Funciones para el calendario de pagos ---
let calendarCurrentMonth = new Date().getMonth();
let calendarCurrentYear = new Date().getFullYear();
let selectedDay = null;

function updateBillsCalendar(bills) {
    // Actualizar título del mes
    updateCalendarTitle();

    // Generar días del calendario
    generateCalendarDays(bills);

    // Si hay un día seleccionado previamente, intentar mantener la selección
    if (selectedDay) {
        const dayElement = document.querySelector(`.calendar-day[data-date="${selectedDay}"]`);
        if (dayElement) {
            selectDay(dayElement);
        } else {
            // Si el día seleccionado ya no está visible, limpiar la selección
            selectedDay = null;
            updateDayDetail(null, bills);
        }
    } else {
        // Por defecto mostrar los eventos del día actual si está en el mes visible
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const todayElement = document.querySelector(`.calendar-day[data-date="${todayStr}"]`);

        if (todayElement && !todayElement.classList.contains('inactive')) {
            selectDay(todayElement);
        } else {
            // Si hoy no está en el mes actual, mostrar mensaje predeterminado
            updateDayDetail(null, bills);
        }
    }
}

function updateCalendarTitle() {
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const monthTitle = document.getElementById('calendar-month-year');
    monthTitle.textContent = `${monthNames[calendarCurrentMonth]} ${calendarCurrentYear}`;
}

function generateCalendarDays(bills) {
    const calendarDays = document.getElementById('calendar-days');
    calendarDays.innerHTML = '';

    // Obtener primer día del mes (0 = Domingo, 1 = Lunes, etc)
    const firstDayOfMonth = new Date(calendarCurrentYear, calendarCurrentMonth, 1).getDay();

    // Obtener último día del mes
    const lastDayOfMonth = new Date(calendarCurrentYear, calendarCurrentMonth + 1, 0).getDate();

    // Obtener último día del mes anterior
    const lastDayOfPrevMonth = new Date(calendarCurrentYear, calendarCurrentMonth, 0).getDate();

    // Crear array para almacenar facturas por día en formato YYYY-MM-DD
    const billsByDay = {};

    // Agrupar facturas por día
    bills.forEach(bill => {
        const dateKey = bill.date; // Asumimos que bill.date está en formato YYYY-MM-DD
        if (!billsByDay[dateKey]) {
            billsByDay[dateKey] = [];
        }
        billsByDay[dateKey].push(bill);
    });

    // Días del mes anterior
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
        const day = lastDayOfPrevMonth - i;
        const dayElement = document.createElement('div');

        // Crear fecha en formato YYYY-MM-DD para el día del mes anterior
        const year = calendarCurrentMonth === 0 ? calendarCurrentYear - 1 : calendarCurrentYear;
        const month = calendarCurrentMonth === 0 ? 11 : calendarCurrentMonth - 1;
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        dayElement.className = 'calendar-day inactive';
        dayElement.textContent = day;
        dayElement.dataset.date = dateStr;

        // Verificar si hay facturas para esta fecha
        if (billsByDay[dateStr]?.length) {
            markDayWithBills(dayElement, billsByDay[dateStr]);
        }

        dayElement.addEventListener('click', () => selectDay(dayElement));
        calendarDays.appendChild(dayElement);
    }

    // Días del mes actual
    const today = new Date();
    const isCurrentMonth = today.getMonth() === calendarCurrentMonth && today.getFullYear() === calendarCurrentYear;
    const currentDay = today.getDate();

    for (let day = 1; day <= lastDayOfMonth; day++) {
        const dayElement = document.createElement('div');

        // Crear fecha en formato YYYY-MM-DD
        const dateStr = `${calendarCurrentYear}-${String(calendarCurrentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        dayElement.dataset.date = dateStr;

        // Marcar si es hoy
        if (isCurrentMonth && day === currentDay) {
            dayElement.classList.add('today');
        }

        // Verificar si hay facturas para esta fecha
        if (billsByDay[dateStr]?.length) {
            markDayWithBills(dayElement, billsByDay[dateStr]);
        }

        dayElement.addEventListener('click', () => selectDay(dayElement));
        calendarDays.appendChild(dayElement);
    }

    // Calcular cuántos días se necesitan para llenar la cuadrícula (42 = 7 columnas x 6 filas)
    const daysAdded = firstDayOfMonth + lastDayOfMonth;
    const daysNeeded = 42 - daysAdded;

    // Días del mes siguiente
    for (let day = 1; day <= daysNeeded; day++) {
        const dayElement = document.createElement('div');

        // Crear fecha en formato YYYY-MM-DD para el día del mes siguiente
        const year = calendarCurrentMonth === 11 ? calendarCurrentYear + 1 : calendarCurrentYear;
        const month = calendarCurrentMonth === 11 ? 0 : calendarCurrentMonth + 1;
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        dayElement.className = 'calendar-day inactive';
        dayElement.textContent = day;
        dayElement.dataset.date = dateStr;

        // Verificar si hay facturas para esta fecha
        if (billsByDay[dateStr]?.length) {
            markDayWithBills(dayElement, billsByDay[dateStr]);
        }

        dayElement.addEventListener('click', () => selectDay(dayElement));
        calendarDays.appendChild(dayElement);
    }
}

function markDayWithBills(dayElement, bills) {
    dayElement.classList.add('has-bills');

    // Si hay más de una factura, mostrar contador
    if (bills.length > 1) {
        const countElement = document.createElement('span');
        countElement.className = 'bill-count';
        countElement.textContent = bills.length;
        dayElement.appendChild(countElement);
    }
}

function selectDay(dayElement) {
    // Quitar selección anterior
    const prevSelected = document.querySelector('.calendar-day.selected');
    if (prevSelected) {
        prevSelected.classList.remove('selected');
    }

    // Añadir selección al día actual
    dayElement.classList.add('selected');
    selectedDay = dayElement.dataset.date;

    // Actualizar detalle del día
    updateDayDetail(selectedDay, currentFutureBills);
}

function updateDayDetail(dateStr, bills) {
    const dayDetailContainer = document.getElementById('day-bills-list');
    const selectedDateTitle = document.getElementById('selected-date');

    // Limpiar contenido anterior
    dayDetailContainer.innerHTML = '';

    if (!dateStr) {
        selectedDateTitle.textContent = 'Selecciona un día para ver sus facturas';
        dayDetailContainer.innerHTML = '<p class="text-gray-500 text-sm">No hay un día seleccionado.</p>';
        return;
    }

    // Filtrar facturas del día seleccionado
    const dayBills = bills.filter(bill => bill.date === dateStr);

    if (dayBills.length === 0) {
        // No hay facturas para este día
        const dateParts = dateStr.split('-');
        const displayDate = new Date(dateParts[0], parseInt(dateParts[1]) - 1, dateParts[2]);
        const formattedDate = displayDate.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        selectedDateTitle.textContent = `Facturas para el ${formattedDate}`;
        dayDetailContainer.innerHTML = '<p class="text-gray-500 text-sm">No hay facturas para este día.</p>';
        return;
    }

    // Hay facturas para mostrar
    const dateParts = dateStr.split('-');
    const displayDate = new Date(dateParts[0], parseInt(dateParts[1]) - 1, dateParts[2]);
    const formattedDate = displayDate.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    selectedDateTitle.textContent = `Facturas para el ${formattedDate}`;

    // Renderizar cada factura
    dayBills.forEach(bill => {
        const billElement = document.createElement('div');
        billElement.className = 'day-bill-item';

        // Obtener color para la categoría
        const categoryColor = CATEGORY_COLORS[bill.category] || '#6b7280';

        billElement.innerHTML = `
            <div class="flex-1">
                <div class="flex items-center">
                    <i class="${bill.icon || 'fas fa-file-invoice-dollar'} text-gray-500 mr-2"></i>
                    <div>
                        <div class="font-medium">${bill.name}</div>
                        <div class="text-xs flex items-center mt-1">
                            <span class="inline-block w-2 h-2 rounded-full mr-1" style="background-color: ${categoryColor};"></span>
                            <span class="text-gray-600">${bill.category}</span>
                            <span class="mx-1">•</span>
                            <span class="text-gray-600">${getBillFrequencyLabel(bill.frequency)}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="flex items-center">
                <span class="font-medium text-gray-900">${formatCurrency(bill.amount)}</span>
                <button class="pay-bill-btn ml-2 px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700" 
                    data-bill-id="${bill.id}">
                    <i class="fas fa-check mr-1"></i> Pagado
                </button>
            </div>
        `;

        // Añadir event listener al botón de pagar
        const payBtn = billElement.querySelector('.pay-bill-btn');
        payBtn.addEventListener('click', () => {
            payFutureBill(bill);
        });

        dayDetailContainer.appendChild(billElement);
    });
}

function prevMonth() {
    calendarCurrentMonth--;
    if (calendarCurrentMonth < 0) {
        calendarCurrentMonth = 11;
        calendarCurrentYear--;
    }
    updateBillsCalendar(currentFutureBills);
}

function nextMonth() {
    calendarCurrentMonth++;
    if (calendarCurrentMonth > 11) {
        calendarCurrentMonth = 0;
        calendarCurrentYear++;
    }
    updateBillsCalendar(currentFutureBills);
}

// --- Funciones de exportación ---

// Función para exportar a Excel
function exportToExcel() {
    // Mostrar indicador de carga
    addNotification('Generando archivo Excel...', 'info');

    // Dar tiempo para que se muestre la notificación
    setTimeout(() => {
        try {
            // Crear un nuevo libro de trabajo
            const wb = XLSX.utils.book_new();

            // Configurar propiedades del documento
            wb.Props = {
                Title: "Informe de Facturas Próximas",
                Subject: "Informe Financiero",
                Author: "FinancePro",
                CreatedDate: new Date()
            };

            // --- HOJA: RESUMEN ---
            // Generar datos para la hoja de resumen
            const summaryData = generateSummarySheetData();
            const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

            // Configurar anchos de columna para la hoja de resumen
            const summaryColWidths = [
                { wch: 25 },  // Título
                { wch: 15 },  // Valor
            ];
            summarySheet['!cols'] = summaryColWidths;

            // Combinar celdas para el título
            summarySheet['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }
            ];

            // Añadir la hoja de resumen primero
            XLSX.utils.book_append_sheet(wb, summarySheet, 'Resumen');

            // --- HOJA: FACTURAS ---
            // Generar datos para la hoja de facturas detalladas
            const billsData = generateBillsSheetData();
            const billsSheet = XLSX.utils.aoa_to_sheet(billsData);

            // Aplicar estilos a través de configuración de columnas
            const billsColWidths = [
                { wch: 15 },  // Fecha
                { wch: 35 },  // Nombre
                { wch: 20 },  // Categoría
                { wch: 15 },  // Frecuencia
                { wch: 15 },  // Monto
            ];
            billsSheet['!cols'] = billsColWidths;

            // Combinar celdas para el título de la hoja
            billsSheet['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }
            ];

            // Añadir la hoja de facturas
            XLSX.utils.book_append_sheet(wb, billsSheet, 'Facturas Próximas');

            // --- HOJA: DISTRIBUCIÓN ---
            // Generar datos para la hoja de distribución por categoría
            const distributionData = generateDistributionSheetData();
            const distributionSheet = XLSX.utils.aoa_to_sheet(distributionData);

            // Configurar anchos de columna
            const distributionColWidths = [
                { wch: 25 },  // Categoría
                { wch: 15 },  // Monto
                { wch: 15 },  // Porcentaje
            ];
            distributionSheet['!cols'] = distributionColWidths;

            // Combinar celdas para el título de la hoja
            distributionSheet['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }
            ];

            // Añadir la hoja de distribución
            XLSX.utils.book_append_sheet(wb, distributionSheet, 'Distribución');

            // Obtener fecha actual para el nombre del archivo
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            const fileName = `Facturas_Proximas_${dateStr}.xlsx`;

            // Exportar el archivo
            XLSX.writeFile(wb, fileName);

            // Notificar éxito
            addNotification('El informe se ha exportado correctamente a Excel', 'success');
        } catch (error) {
            console.error('Error al exportar a Excel:', error);
            addNotification('Error al exportar a Excel. Por favor, inténtalo de nuevo.', 'error');
        }
    }, 500);
}

// Función para generar datos de la hoja de facturas
function generateBillsSheetData() {
    // Crear título con estilo
    const title = 'INFORME DETALLADO DE FACTURAS PRÓXIMAS';
    const dateInfo = `Generado el ${new Date().toLocaleDateString('es-ES')}`;
    const data = [
        [title],
        [dateInfo],
        []
    ];

    // Crear cabeceras con estilo en negrita
    const headers = ['Fecha', 'Nombre', 'Categoría', 'Frecuencia', 'Monto'];
    data.push(headers);

    // Añadir filas de datos
    currentFutureBills.forEach(bill => {
        const formattedDate = formatDate(bill.date);
        const frequencyLabel = getBillFrequencyLabel(bill.frequency);
        const formattedAmount = formatCurrency(bill.amount).replace('S/ ', ''); // Quitar prefijo de moneda para Excel

        data.push([
            formattedDate,
            bill.name,
            bill.category,
            frequencyLabel,
            formattedAmount
        ]);
    });

    // Añadir fila vacía y totales
    data.push([]);
    data.push(['Total Facturas', '', '', '', calculateTotalAmount()]);

    return data;
}

// Función para calcular el monto total de todas las facturas
function calculateTotalAmount() {
    const totalAmount = currentFutureBills.reduce((sum, bill) => sum + bill.amount, 0);
    return formatCurrency(totalAmount).replace('S/ ', ''); // Quitar prefijo de moneda para Excel
}

// Función para generar datos de la hoja de resumen
function generateSummarySheetData() {
    // Crear título con estilo
    const title = 'RESUMEN DE FACTURAS PRÓXIMAS';
    const data = [[title], []];

    // Información general
    const now = new Date();
    data.push(['Fecha de generación', now.toLocaleDateString('es-ES')]);
    data.push(['Total de facturas', currentFutureBills.length]);

    const totalAmount = currentFutureBills.reduce((sum, bill) => sum + bill.amount, 0);
    data.push(['Monto total proyectado', formatCurrency(totalAmount).replace('S/ ', '')]);

    // Calcular promedios
    const avgAmount = totalAmount / (currentFutureBills.length || 1);
    data.push(['Monto promedio por factura', formatCurrency(avgAmount).replace('S/ ', '')]);

    // Añadir espacio
    data.push([]);
    data.push(['DISTRIBUCIÓN POR PERÍODO']);
    data.push([]);

    // Obtener los valores de los elementos del DOM
    const total30Days = document.getElementById('total-30-days').textContent;
    const totalBimonthly = document.getElementById('total-bimonthly').textContent;
    const totalQuarterly = document.getElementById('total-quarterly').textContent;
    const totalSemiannual = document.getElementById('total-semiannual').textContent;
    const totalAnnual = document.getElementById('total-annual').textContent;

    // Añadir filas de datos por período
    data.push(['Próximos 30 días', total30Days.replace('S/ ', '')]);
    data.push(['Próximo bimestre', totalBimonthly.replace('S/ ', '')]);
    data.push(['Próximo trimestre', totalQuarterly.replace('S/ ', '')]);
    data.push(['Próximo semestre', totalSemiannual.replace('S/ ', '')]);
    data.push(['Próximo año', totalAnnual.replace('S/ ', '')]);

    return data;
}

// Función para generar datos de la hoja de distribución por categoría
function generateDistributionSheetData() {
    // Crear título con estilo
    const title = 'DISTRIBUCIÓN DE GASTOS POR CATEGORÍA';
    const data = [[title], []];

    // Crear cabeceras
    data.push(['Categoría', 'Monto', 'Porcentaje']);

    // Obtener distribución por categoría
    const distribution = getCategoryDistributionData();

    // Añadir filas de datos
    distribution.forEach(row => {
        data.push(row);
    });

    // Añadir espacio y resumen de frecuencias
    data.push([]);
    data.push(['DISTRIBUCIÓN POR FRECUENCIA']);
    data.push([]);
    data.push(['Frecuencia', 'Cantidad', 'Porcentaje']);

    // Calcular distribución por frecuencia
    const freqCount = {};
    currentFutureBills.forEach(bill => {
        const freq = bill.frequency || 'sin-frecuencia';
        if (!freqCount[freq]) {
            freqCount[freq] = 0;
        }
        freqCount[freq]++;
    });

    // Calcular porcentajes y añadir a datos
    Object.entries(freqCount).forEach(([freq, count]) => {
        const percentage = ((count / currentFutureBills.length) * 100).toFixed(1) + '%';
        const freqLabel = getBillFrequencyLabel(freq);
        data.push([freqLabel, count, percentage]);
    });

    return data;
}

// Función para exportar a PDF
function exportToPDF() {
    // Mostrar indicador de carga
    addNotification('Generando archivo PDF...', 'info');

    // Dar tiempo para que se muestre la notificación
    setTimeout(() => {
        try {
            // Crear documento PDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // Añadir encabezado con logo (simulado)
            const pageWidth = doc.internal.pageSize.getWidth();

            // Rectángulo morado en la parte superior como "logo"
            doc.setFillColor(139, 92, 246);
            doc.rect(0, 0, pageWidth, 25, 'F');

            // Logo FinancePro (texto)
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('FinancePro', 14, 10);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Panel Financiero', 14, 16);

            // Añadir título 
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            const title = 'Informe de Facturas Próximas';
            doc.text(title, 14, 35);

            // Añadir fecha y hora
            const now = new Date();
            const dateTimeStr = now.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            }) + ' - ' + now.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            });
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text(`Generado el ${dateTimeStr}`, 14, 42);

            // Generar tabla de facturas
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Detalle de Facturas', 14, 50);

            // Preparar datos para la tabla de facturas
            const tableHeaders = [['Fecha', 'Nombre', 'Categoría', 'Frecuencia', 'Monto']];
            const tableData = currentFutureBills.map(bill => [
                formatDate(bill.date),
                bill.name,
                bill.category,
                getBillFrequencyLabel(bill.frequency),
                formatCurrency(bill.amount)
            ]);

            // Crear tabla de facturas con AutoTable
            doc.autoTable({
                startY: 55,
                head: tableHeaders,
                body: tableData,
                theme: 'grid',
                headStyles: {
                    fillColor: [139, 92, 246],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold'
                },
                alternateRowStyles: { fillColor: [245, 247, 250] },
                styles: {
                    cellPadding: 2,
                    fontSize: 9,
                    lineColor: [200, 200, 200]
                },
                columnStyles: {
                    0: { cellWidth: 25 },
                    1: { cellWidth: 'auto' },
                    2: { cellWidth: 30 },
                    3: { cellWidth: 25 },
                    4: { cellWidth: 25, halign: 'right' }
                },
                margin: { top: 55 }
            });

            // Obtener la posición Y donde terminó la tabla
            const finalY = (doc.previousAutoTable?.finalY || 55) + 15;

            // Añadir sección de resumen
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Resumen de Totales', 14, finalY);

            // Datos del resumen
            const summaryHeaders = [['Período', 'Monto']];
            const summaryData = [
                ['Próximos 30 días', document.getElementById('total-30-days').textContent],
                ['Próximo bimestre', document.getElementById('total-bimonthly').textContent],
                ['Próximo trimestre', document.getElementById('total-quarterly').textContent],
                ['Próximo semestre', document.getElementById('total-semiannual').textContent],
                ['Próximo año', document.getElementById('total-annual').textContent]
            ];

            // Crear tabla de resumen
            doc.autoTable({
                startY: finalY + 5,
                head: summaryHeaders,
                body: summaryData,
                theme: 'grid',
                headStyles: {
                    fillColor: [139, 92, 246],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold'
                },
                alternateRowStyles: { fillColor: [245, 247, 250] },
                styles: {
                    cellPadding: 2,
                    fontSize: 9
                },
                columnStyles: {
                    1: { halign: 'right' }
                },
                margin: { top: finalY + 5 }
            });

            // Añadir una nueva página para la visualización de datos
            doc.addPage();

            // Encabezado para la segunda página
            doc.setFillColor(139, 92, 246);
            doc.rect(0, 0, pageWidth, 25, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('FinancePro', 14, 10);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Panel Financiero', 14, 16);

            // Título de visualización
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Visualización de Datos', 14, 35);

            // Agregar tabla con distribución de categorías
            doc.setFontSize(12);
            doc.text('Distribución por Categoría', 14, 45);

            // Obtener datos de distribución por categoría
            const categoryDistribution = getCategoryDistributionData();
            const categoryHeaders = [['Categoría', 'Monto', 'Porcentaje']];

            // Crear tabla de distribución por categoría
            doc.autoTable({
                startY: 50,
                head: categoryHeaders,
                body: categoryDistribution,
                theme: 'grid',
                headStyles: {
                    fillColor: [139, 92, 246],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold'
                },
                alternateRowStyles: { fillColor: [245, 247, 250] },
                styles: {
                    cellPadding: 2,
                    fontSize: 9
                },
                columnStyles: {
                    1: { halign: 'right' },
                    2: { halign: 'right' }
                }
            });

            // Espacio para un segundo gráfico o más información
            const distTableY = (doc.previousAutoTable?.finalY || 50) + 15;

            // Agregar insights de gasto
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Insights sobre Gastos Recurrentes', 14, distTableY);

            // Obtener los insights del DOM y formatearlos para PDF
            const insightsElement = document.getElementById('spending-insights');
            const insights = [];

            if (insightsElement) {
                const insightParagraphs = insightsElement.querySelectorAll('p');
                insightParagraphs.forEach(p => {
                    insights.push([p.textContent.trim().replace(/^\s*[•●]\s*/, '')]);
                });
            }

            // Si no hay insights, añadir mensaje por defecto
            if (insights.length === 0) {
                insights.push(['No hay suficientes datos para generar insights.']);
            }

            // Crear tabla de insights (sin cabecera)
            doc.autoTable({
                startY: distTableY + 5,
                body: insights,
                theme: 'plain',
                styles: {
                    cellPadding: 2,
                    fontSize: 9,
                    lineColor: [255, 255, 255]
                }
            });

            // Añadir pie de página con número de página
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setDrawColor(200, 200, 200);
                doc.line(14, doc.internal.pageSize.height - 15, pageWidth - 14, doc.internal.pageSize.height - 15);
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
            }

            // Guardar PDF
            const pdfFileName = `Facturas_Proximas_${now.toISOString().split('T')[0]}.pdf`;
            doc.save(pdfFileName);

            // Notificar éxito
            addNotification('El informe se ha exportado correctamente a PDF', 'success');
        } catch (error) {
            console.error('Error al exportar a PDF:', error);
            addNotification('Error al exportar a PDF. Por favor, inténtalo de nuevo.', 'error');
        }
    }, 500);
}

// Función para obtener datos de distribución por categoría
function getCategoryDistributionData() {
    // Agrupar facturas por categoría
    const categoryTotals = {};
    let totalAmount = 0;

    // Calcular total por categoría y total general
    currentFutureBills.forEach(bill => {
        const category = bill.category || 'Sin categoría';
        if (!categoryTotals[category]) {
            categoryTotals[category] = 0;
        }
        categoryTotals[category] += bill.amount;
        totalAmount += bill.amount;
    });

    // Convertir a array y calcular porcentajes
    const result = Object.entries(categoryTotals).map(([category, amount]) => {
        const percentage = ((amount / totalAmount) * 100).toFixed(1) + '%';
        return [category, formatCurrency(amount), percentage];
    });

    // Ordenar por monto descendente
    result.sort((a, b) => {
        // Extraer los valores numéricos de las cadenas de moneda
        const amountA = parseFloat(a[1].replace(/[^0-9.-]+/g, ""));
        const amountB = parseFloat(b[1].replace(/[^0-9.-]+/g, ""));
        return amountB - amountA;
    });

    return result;
}

// --- Funciones para el Modal de Todas las Transacciones ---
function openAllTransactionsModal() {
    const allTransactionsModal = document.getElementById('all-transactions-modal');

    // Limpiar y copiar los filtros actuales al modal
    document.getElementById('modal-filter-date-from').value = document.getElementById('filter-date-from').value;
    document.getElementById('modal-filter-date-to').value = document.getElementById('filter-date-to').value;

    // Rellenar el selector de categorías si está vacío
    const modalCategorySelect = document.getElementById('modal-filter-category');
    if (modalCategorySelect.options.length <= 1) {
        populateModalCategoryFilter();
    }

    // Mostrar todas las transacciones en el modal
    renderModalTransactions(filteredTransactions);

    // Mostrar el modal
    allTransactionsModal.classList.add('show');
}

function closeAllTransactionsModal() {
    const allTransactionsModal = document.getElementById('all-transactions-modal');
    allTransactionsModal.classList.remove('show');
}

// Función para exportar transacciones a PDF
function exportTransactionsToPDF() {
    // Mostrar indicador de carga
    addNotification('Generando archivo PDF...', 'info');

    // Dar tiempo para que se muestre la notificación
    setTimeout(() => {
        try {
            // Crear documento PDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // Añadir encabezado con logo (simulado)
            const pageWidth = doc.internal.pageSize.getWidth();

            // Rectángulo morado en la parte superior como "logo"
            doc.setFillColor(139, 92, 246); // Color morado del tema
            doc.rect(0, 0, pageWidth, 25, 'F');

            // Logo FinancePro (texto)
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('FinancePro', 14, 10);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Panel Financiero', 14, 16);

            // Añadir título 
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            const title = 'Listado de Transacciones';
            doc.text(title, 14, 35);

            // Añadir fecha y hora
            const now = new Date();
            const dateTimeStr = now.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            }) + ' - ' + now.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            });
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text(`Generado el ${dateTimeStr}`, 14, 42);

            // Obtener las transacciones que se están mostrando en el modal
            const modalTransactionsTbody = document.getElementById('modal-transactions-tbody');
            const transactionsToExport = getModalTransactions();

            // Preparar datos para la tabla
            const tableHeaders = [['Transacción', 'Categoría', 'Fecha', 'Monto', 'Estado']];
            const tableData = [];

            transactionsToExport.forEach(t => {
                // Crear array de datos para cada fila
                const categoryName = t.category || 'Sin Categoría';
                const statusLabel = t.status === 'Completado' ? 'Completado' : 'Pendiente';

                tableData.push([
                    t.name,
                    categoryName,
                    formatDate(t.date),
                    formatCurrency(t.amount),
                    statusLabel
                ]);
            });

            // Definir estilos de colores para categorías y estados
            const cellStyles = {
                // Función para aplicar estilos personalizados a las celdas
                styles: { cellPadding: 3 },
                cellCallback: function (cell, data) {
                    // Solo aplicar a celdas de datos (no cabeceras)
                    if (data.section === 'body') {
                        // Estilizar categorías (columna 1)
                        if (data.column.index === 1) {
                            const categoryName = cell.raw;
                            const categoryColor = CATEGORY_COLORS[categoryName] || '#6b7280';

                            // Usar un color de fondo más claro (transparencia)
                            const bgColor = hexToRgb(categoryColor, 0.2);

                            cell.styles.fillColor = bgColor;
                            cell.styles.textColor = darkenColor(categoryColor, 50);
                            cell.styles.fontStyle = 'bold';
                        }

                        // Estilizar montos (columna 3)
                        else if (data.column.index === 3) {
                            const amount = cell.raw;
                            if (amount.includes('-')) {
                                cell.styles.textColor = '#EF4444'; // Rojo para gastos
                            } else {
                                cell.styles.textColor = '#10B981'; // Verde para ingresos
                            }
                            cell.styles.fontStyle = 'bold';
                            cell.styles.halign = 'right';
                        }

                        // Estilizar estado (columna 4)
                        else if (data.column.index === 4) {
                            const status = cell.raw;
                            if (status === 'Completado') {
                                cell.styles.fillColor = [209, 250, 229]; // Verde claro
                                cell.styles.textColor = [6, 95, 70]; // Verde oscuro
                            } else {
                                cell.styles.fillColor = [254, 243, 199]; // Amarillo claro
                                cell.styles.textColor = [146, 64, 14]; // Naranja oscuro
                            }
                            cell.styles.fontStyle = 'bold';
                        }
                    }
                }
            };

            // Crear tabla de transacciones con AutoTable
            doc.autoTable({
                startY: 50,
                head: tableHeaders,
                body: tableData,
                theme: 'grid',
                headStyles: {
                    fillColor: [139, 92, 246], // Color morado del tema
                    textColor: [255, 255, 255],
                    fontStyle: 'bold'
                },
                columnStyles: {
                    0: { cellWidth: 'auto' }, // Transacción
                    1: { cellWidth: 'auto', minCellWidth: 35 }, // Categoría - ajustado a auto con mínimo
                    2: { cellWidth: 'auto', minCellWidth: 30 }, // Fecha - ajustado a auto con mínimo
                    3: { cellWidth: 'auto', minCellWidth: 30, halign: 'right' }, // Monto - ajustado a auto con mínimo
                    4: { cellWidth: 'auto', minCellWidth: 25, halign: 'center' } // Estado
                },
                alternateRowStyles: { fillColor: [249, 250, 251] }, // Color gris muy claro
                margin: { top: 50 },
                ...cellStyles
            });

            // Añadir resumen de transacciones
            const finalY = doc.previousAutoTable?.finalY || 50;

            const incomeTotal = transactionsToExport.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
            const expenseTotal = transactionsToExport.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
            const balanceTotal = incomeTotal - expenseTotal;

            // Añadir resumen de totales
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Resumen de Transacciones', 14, finalY + 15);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(16, 185, 129); // Verde
            doc.text(`Ingresos Totales: ${formatCurrency(incomeTotal)}`, 14, finalY + 25);

            doc.setTextColor(239, 68, 68); // Rojo
            doc.text(`Gastos Totales: ${formatCurrency(expenseTotal)}`, 14, finalY + 32);

            doc.setTextColor(0, 0, 0); // Negro
            doc.text(`Balance: ${formatCurrency(balanceTotal)}`, 14, finalY + 39);

            // Si balance es positivo o negativo, indicarlo con un color
            if (balanceTotal > 0) {
                doc.setTextColor(16, 185, 129); // Verde
                doc.text(' (Superávit)', 50, finalY + 39);
            } else if (balanceTotal < 0) {
                doc.setTextColor(239, 68, 68); // Rojo
                doc.text(' (Déficit)', 50, finalY + 39);
            }

            // Añadir pie de página con número de página
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setDrawColor(200, 200, 200);
                doc.line(14, doc.internal.pageSize.height - 15, pageWidth - 14, doc.internal.pageSize.height - 15);
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);

                // Añadir marca de tiempo en el pie de página
                doc.text(`Generado por FinancePro - ${now.toLocaleDateString()}`, 14, doc.internal.pageSize.height - 10);
            }

            // Guardar PDF
            const pdfFileName = `Transacciones_${now.toISOString().split('T')[0]}.pdf`;
            doc.save(pdfFileName);

            // Notificar éxito
            addNotification('El informe se ha exportado correctamente a PDF', 'success');
        } catch (error) {
            console.error('Error al exportar a PDF:', error);
            addNotification('Error al exportar a PDF. Por favor, inténtalo de nuevo.', 'error');
        }
    }, 500);
}

// Función auxiliar para obtener las transacciones mostradas en el modal
function getModalTransactions() {
    // Si hay filtros aplicados, devolver las transacciones filtradas
    const dateFrom = document.getElementById('modal-filter-date-from').value;
    const dateTo = document.getElementById('modal-filter-date-to').value;
    const category = document.getElementById('modal-filter-category').value;
    const type = document.getElementById('modal-filter-transaction-type').value;

    // Si no hay filtros, devolver todas las transacciones
    if (!dateFrom && !dateTo && !category && !type) {
        return filteredTransactions;
    }

    // Convertir fechas a objetos Date para comparación
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo) : null;

    // Si hay una fecha "hasta", ajustar para incluir el día completo
    if (toDate) {
        toDate.setHours(23, 59, 59, 999);
    }

    // Aplicar filtros
    return allTransactions.filter(t => {
        const transactionDate = new Date(t.date);
        const matchDate = (!fromDate || transactionDate >= fromDate) && (!toDate || transactionDate <= toDate);
        const matchCategory = !category || t.category === category;
        const matchType = !type ||
            (type === 'income' && t.amount > 0) ||
            (type === 'expense' && t.amount < 0);

        return matchDate && matchCategory && matchType;
    });
}

// Función auxiliar para convertir color hex a rgb con transparencia
function hexToRgb(hex, alpha = 1) {
    // Expandir shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return [255, 255, 255]; // Blanco por defecto si hay error

    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);

    // Si alpha es 1, devolver como array de enteros
    if (alpha === 1) {
        return [r, g, b];
    }

    // Si hay transparencia, devolver como array [r,g,b] con valores ajustados para transparencia
    // Mezclamos con fondo blanco (255,255,255) según el valor alpha
    const mixWithWhite = (color) => Math.round(color * alpha + 255 * (1 - alpha));
    return [mixWithWhite(r), mixWithWhite(g), mixWithWhite(b)];
}

// Función auxiliar para oscurecer un color hex
function darkenColor(hex, percent) {
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);

    r = Math.max(0, Math.min(255, r - percent));
    g = Math.max(0, Math.min(255, g - percent));
    b = Math.max(0, Math.min(255, b - percent));

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function renderModalTransactions(transactionsToRender) {
    const modalTransactionsTbody = document.getElementById('modal-transactions-tbody');
    const modalNoTransactionsMsg = document.getElementById('modal-no-transactions-msg');

    modalTransactionsTbody.innerHTML = ''; // Limpiar filas existentes

    if (transactionsToRender.length === 0) {
        modalNoTransactionsMsg.classList.remove('hidden');
        return;
    }
    modalNoTransactionsMsg.classList.add('hidden');

    // Ordenar transacciones por fecha descendente antes de renderizar
    transactionsToRender.sort((a, b) => new Date(b.date) - new Date(a.date));

    transactionsToRender.forEach(t => {
        const row = document.createElement('tr');
        row.classList.add('border-b', 'hover:bg-gray-50');
        row.dataset.id = t.id; // Añadir id para selección más fácil

        const amountColor = t.amount > 0 ? 'text-green-600' : 'text-red-600';
        const statusBadge = t.status === 'Completado'
            ? '<span class="px-2 py-1 text-xs font-medium rounded-full badge-success">Completado</span>'
            : '<span class="px-2 py-1 text-xs font-medium rounded-full badge-pending">Pendiente</span>';

        // Obtener color de la categoría desde CATEGORY_COLORS
        const categoryName = t.category || 'Sin Categoría';
        const categoryColor = CATEGORY_COLORS[categoryName] || '#6b7280'; // Color por defecto (gris)
        const categoryBadge = `<span class="category-badge" style="background-color: ${categoryColor};">${categoryName}</span>`;

        // Añadir indicador si es una contribución al ahorro
        const savingsBadge = t.isSavingsContribution ?
            '<span class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800"><i class="fas fa-piggy-bank mr-1"></i>Ahorro</span>' :
            '';

        row.innerHTML = `
            <td class="py-3 px-4">
                <div class="flex items-center">
                    <span class="mr-3 text-gray-500 w-5 text-center"><i class="${t.icon || 'fas fa-question-circle'}"></i></span>
                    <span>${t.name}${savingsBadge}</span>
                </div>
            </td>
            <td class="py-3 px-4">${categoryBadge}</td>
            <td class="py-3 px-4">${formatDate(t.date)}</td>
            <td class="py-3 px-4 text-right font-medium ${amountColor}">${formatCurrency(t.amount)}</td>
            <td class="py-3 px-4 text-center">${statusBadge}</td>
            <td class="py-3 px-4 text-center">
                <button class="action-btn edit-btn" onclick="openEditModal(${t.id})"><i class="fas fa-pencil-alt"></i></button>
                <button class="action-btn delete-btn" onclick="deleteTransaction(${t.id})"><i class="fas fa-trash-alt"></i></button>
            </td>
        `;
        modalTransactionsTbody.appendChild(row);
    });
}

function populateModalCategoryFilter() {
    const modalCategoryFilter = document.getElementById('modal-filter-category');
    modalCategoryFilter.innerHTML = '<option value="">Todas</option>';

    // Crear un conjunto de todas las categorías existentes en las transacciones
    const categories = new Set();
    allTransactions.forEach(t => {
        if (t.category) categories.add(t.category);
    });

    // Añadir opciones al selector
    Array.from(categories).sort().forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        modalCategoryFilter.appendChild(option);
    });
}

function applyModalAdvancedFilters() {
    const dateFrom = document.getElementById('modal-filter-date-from').value;
    const dateTo = document.getElementById('modal-filter-date-to').value;
    const category = document.getElementById('modal-filter-category').value;
    const type = document.getElementById('modal-filter-transaction-type').value;

    // Convertir fechas a objetos Date para comparación
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo) : null;

    // Si hay una fecha "hasta", ajustar para incluir el día completo
    if (toDate) {
        toDate.setHours(23, 59, 59, 999);
    }

    // Aplicar filtros
    let filteredModalTransactions = allTransactions.filter(t => {
        const transactionDate = new Date(t.date);
        const matchDate = (!fromDate || transactionDate >= fromDate) && (!toDate || transactionDate <= toDate);
        const matchCategory = !category || t.category === category;
        const matchType = !type ||
            (type === 'income' && t.amount > 0) ||
            (type === 'expense' && t.amount < 0);

        return matchDate && matchCategory && matchType;
    });

    renderModalTransactions(filteredModalTransactions);
}

function clearModalAdvancedFilters() {
    document.getElementById('modal-filter-date-from').value = '';
    document.getElementById('modal-filter-date-to').value = '';
    document.getElementById('modal-filter-category').value = '';
    document.getElementById('modal-filter-transaction-type').value = '';

    renderModalTransactions(allTransactions);
}

// --- Inicialización y Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // ... existing code ...

    // Elementos del Modal de Todas las Transacciones
    window.allTransactionsModal = document.getElementById('all-transactions-modal');
    window.closeAllTransactionsModalBtn = document.getElementById('close-all-transactions-modal-btn');
    window.viewAllTransactionsBtn = document.getElementById('view-all-transactions-btn');
    window.closeAllTransactionsBottomBtn = document.getElementById('close-all-transactions-bottom-btn');
    window.modalApplyFiltersBtn = document.getElementById('modal-apply-filters-btn');
    window.modalClearFiltersBtn = document.getElementById('modal-clear-filters-btn');

    // ... existing code ...

    // Modal de Todas las Transacciones Listeners
    viewAllTransactionsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openAllTransactionsModal();
    });

    closeAllTransactionsModalBtn.addEventListener('click', closeAllTransactionsModal);
    closeAllTransactionsBottomBtn.addEventListener('click', closeAllTransactionsModal);
    modalApplyFiltersBtn.addEventListener('click', applyModalAdvancedFilters);
    modalClearFiltersBtn.addEventListener('click', clearModalAdvancedFilters);

    // Botón para exportar a PDF
    document.getElementById('export-transactions-pdf-btn').addEventListener('click', exportTransactionsToPDF);

    // ... existing code ...
});

// --- Funciones de Navegación de Secciones (globales para ser llamadas desde accountUI.js también si es necesario) ---
function navigateToDashboardView() {
    console.log("Navegando a vista del Panel Principal...");

    // Selecciona el <main> del dashboard y el contenedor de cuentas
    const dashboardView = document.querySelector('body > div.flex-1.flex.flex-col.overflow-hidden > main');
    const accountsView = document.getElementById('accounts-main-content');
    const sidebarDashboardLink = document.querySelector('a[href="#"]:has(i.fas.fa-home)') ||
        Array.from(document.querySelectorAll('#sidebar nav ul li a')).find(a => a.textContent.includes('Panel Principal'));
    const sidebarAccountsLink = Array.from(document.querySelectorAll('#sidebar nav ul li a')).find(a => a.textContent.includes('Mis Cuentas'));

    // Oculta la vista de cuentas
    if (accountsView) {
        accountsView.classList.add('hidden');
        console.log("Vista de cuentas ocultada");
    }

    // Muestra el <main> del dashboard
    if (dashboardView) {
        dashboardView.classList.remove('hidden');
        console.log("Dashboard <main> visible");
    }

    // Actualiza los links activos
    if (sidebarAccountsLink) sidebarAccountsLink.classList.remove('text-sidebar-link-active', 'bg-gray-700');
    if (sidebarDashboardLink) sidebarDashboardLink.classList.add('text-sidebar-link-active', 'bg-gray-700');

    // Renderiza el dashboard
    renderDashboard();

    // Cierra el sidebar en móvil
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if (window.innerWidth < 768 && sidebar && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
    }
}

function navigateToAccountsView() {
    console.log("Navegando a vista de cuentas...");

    // Elementos principales
    const dashboardView = document.querySelector('main.flex-1');
    const accountsView = document.getElementById('accounts-main-content');
    const sidebarDashboardLink = document.querySelector('a[href="#"]:has(i.fas.fa-home)');
    const sidebarAccountsLink = Array.from(document.querySelectorAll('#sidebar nav ul li a')).find(a => a.textContent.includes('Mis Cuentas'));

    if (!accountsView) {
        console.error("Error: No se encontró el elemento accounts-main-content");
        return;
    }

    // Cambiar visibilidad de vistas
    if (dashboardView) {
        dashboardView.classList.add('hidden');
        console.log("Vista de dashboard ocultada");
    }
    accountsView.classList.remove('hidden');
    console.log("Vista de cuentas mostrada");

    // Actualizar links activos
    if (sidebarDashboardLink) sidebarDashboardLink.classList.remove('text-sidebar-link-active', 'bg-gray-700');
    if (sidebarAccountsLink) sidebarAccountsLink.classList.add('text-sidebar-link-active', 'bg-gray-700');

    // Intentar cargar y renderizar las cuentas
    if (typeof window.loadAndRenderAccountsPage === 'function') {
        console.log("Llamando a loadAndRenderAccountsPage...");
        window.loadAndRenderAccountsPage();
    } else {
        console.warn('loadAndRenderAccountsPage no está definida. Verificando si los archivos JS están cargados correctamente.');

        // Verificar carga de archivos JavaScript
        const scriptPaths = [
            'js/model.js',
            'js/accounts.js',
            'js/accountUI.js'
        ];

        let missingScripts = [];
        scriptPaths.forEach(path => {
            const script = Array.from(document.querySelectorAll('script')).find(s => s.src.includes(path));
            if (!script) missingScripts.push(path);
        });

        if (missingScripts.length > 0) {
            console.error('Faltan scripts necesarios:', missingScripts);
            // Intentar cargar scripts faltantes
            missingScripts.forEach(path => {
                const script = document.createElement('script');
                script.src = path;
                script.onload = () => console.log(`Script ${path} cargado correctamente`);
                script.onerror = () => console.error(`Error al cargar ${path}`);
                document.body.appendChild(script);
            });
        }

        // Intentar cargar cuentas directamente
        try {
            if (typeof loadAccounts === 'function') {
                loadAccounts();
                console.log("Cuentas cargadas, renderizando manualmente...");

                // Mostrar información básica
                const totals = typeof calculateAccountsTotal === 'function' ? calculateAccountsTotal() : { assets: 0, liabilities: 0, netWorth: 0 };
                const assetsEl = document.getElementById('accounts-total-assets');
                const liabilitiesEl = document.getElementById('accounts-total-liabilities');
                const netWorthEl = document.getElementById('accounts-net-worth');

                if (assetsEl) assetsEl.textContent = typeof formatCurrency === 'function' ? formatCurrency(totals.assets) : totals.assets;
                if (liabilitiesEl) liabilitiesEl.textContent = typeof formatCurrency === 'function' ? formatCurrency(totals.liabilities) : totals.liabilities;
                if (netWorthEl) netWorthEl.textContent = typeof formatCurrency === 'function' ? formatCurrency(totals.netWorth) : totals.netWorth;

                // Disparar evento personalizado
                const event = new CustomEvent('accountsViewActive');
                document.dispatchEvent(event);
            } else {
                console.error("No se puede cargar las cuentas: loadAccounts no está definida");
            }
        } catch (error) {
            console.error("Error al cargar cuentas:", error);
        }
    }

    // Cerrar sidebar en móvil
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if (window.innerWidth < 768 && sidebar && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
    }
}

// Registrar event listener para el evento personalizado
document.addEventListener('accountsViewActive', function () {
    console.log("Evento accountsViewActive recibido");
    // Intento alternativo para renderizar cuentas
    setTimeout(() => {
        try {
            if (typeof allAccounts !== 'undefined' &&
                document.getElementById('accounts-main-content') &&
                !document.getElementById('accounts-main-content').classList.contains('hidden')) {

                console.log("Renderizando cuentas (desde evento)...", allAccounts.length);

                // Actualizar interfaz visual de las cuentas si es posible
                if (typeof renderAccountsList === 'function') {
                    renderAccountsList();
                    console.log("Lista de cuentas renderizada desde evento");
                }
            }
        } catch (error) {
            console.error("Error al renderizar cuentas desde evento:", error);
        }
    }, 100);
});

function addAccount(accountData) {
    // Crear nueva cuenta con ID único
    const newAccount = {
        ...accountData,
        id: Date.now(),
        balance: 0, // El balance real se calculará por las transacciones
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

    // Si el balance inicial es distinto de 0, crear una transacción de apertura
    const initialBalance = parseFloat(accountData.balance || 0);
    if (initialBalance !== 0) {
        addAccountTransaction({
            accountId: newAccount.id,
            type: initialBalance > 0 ? 'income' : 'expense',
            name: 'Saldo Inicial',
            amount: Math.abs(initialBalance),
            date: newAccount.createdAt,
            category: 'Apertura',
            status: 'Completado'
        });
    }

    // Agregar notificación
    if (typeof addNotification === 'function') {
        addNotification(`Nueva cuenta "${newAccount.name}" añadida.`, 'success');
    }

    return newAccount;
}