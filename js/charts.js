// Variables para los gráficos
let incomeExpenseChartInstance = null;
let expenseCategoryChartInstance = null;

// Inicializar gráfico de ingresos vs gastos
function initIncomeExpenseChart(period = 'monthly') {
    const ctx = document.getElementById('incomeExpenseChart').getContext('2d');

    // Verificar si el canvas existe
    if (!ctx) {
        console.error('Canvas para el gráfico de ingresos/gastos no encontrado');
        return;
    }

    let labels, incomeData, expenseData;
    const now = new Date();
    const currentYear = now.getFullYear();

    // Filtrar transacciones del año actual para mejor rendimiento
    const currentYearTransactions = allTransactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getFullYear() === currentYear && t.status === 'Completado';
    });

    // Filter transactions based on the selected period
    if (period === 'monthly') {
        labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']; // Full year for context

        const monthlyTotals = currentYearTransactions.reduce((acc, t) => {
            const transactionDate = new Date(t.date);
            const month = transactionDate.getMonth(); // 0 = Jan
            if (!acc[month]) acc[month] = { income: 0, expense: 0 };
            if (t.amount > 0) acc[month].income += t.amount;
            if (t.amount < 0) acc[month].expense += Math.abs(t.amount);
            return acc;
        }, {});

        incomeData = labels.map((_, i) => monthlyTotals[i]?.income || 0);
        expenseData = labels.map((_, i) => monthlyTotals[i]?.expense || 0);

        // Show only up to current month
        const currentMonth = now.getMonth();
        labels = labels.slice(0, currentMonth + 1);
        incomeData = incomeData.slice(0, currentMonth + 1);
        expenseData = expenseData.slice(0, currentMonth + 1);

    } else if (period === 'quarterly') {
        labels = ['Q1', 'Q2', 'Q3', 'Q4'];

        const quarterlyTotals = currentYearTransactions.reduce((acc, t) => {
            const transactionDate = new Date(t.date);
            const quarter = Math.floor(transactionDate.getMonth() / 3); // 0=Q1, 1=Q2, etc.
            if (!acc[quarter]) acc[quarter] = { income: 0, expense: 0 };
            if (t.amount > 0) acc[quarter].income += t.amount;
            if (t.amount < 0) acc[quarter].expense += Math.abs(t.amount);
            return acc;
        }, {});

        incomeData = labels.map((_, i) => quarterlyTotals[i]?.income || 0);
        expenseData = labels.map((_, i) => quarterlyTotals[i]?.expense || 0);

        // Mostrar solo hasta el trimestre actual
        const currentQuarter = Math.floor(now.getMonth() / 3);
        labels = labels.slice(0, currentQuarter + 1);
        incomeData = incomeData.slice(0, currentQuarter + 1);
        expenseData = expenseData.slice(0, currentQuarter + 1);

    } else { // annual
        labels = [String(currentYear)]; // Label is the current year

        const annualTotals = currentYearTransactions.reduce((acc, t) => {
            if (t.amount > 0) acc.income += t.amount;
            if (t.amount < 0) acc.expense += Math.abs(t.amount);
            return acc;
        }, { income: 0, expense: 0 });

        incomeData = [annualTotals.income];
        expenseData = [annualTotals.expense];
    }

    if (incomeExpenseChartInstance) {
        incomeExpenseChartInstance.destroy();
    }

    const incomeGradient = ctx.createLinearGradient(0, 0, 0, 300);
    incomeGradient.addColorStop(0, 'rgba(16, 185, 129, 0.5)');
    incomeGradient.addColorStop(1, 'rgba(16, 185, 129, 0)');

    const expenseGradient = ctx.createLinearGradient(0, 0, 0, 300);
    expenseGradient.addColorStop(0, 'rgba(239, 68, 68, 0.5)');
    expenseGradient.addColorStop(1, 'rgba(239, 68, 68, 0)');

    incomeExpenseChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Ingresos',
                    data: incomeData,
                    borderColor: '#10B981',
                    backgroundColor: incomeGradient,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#10B981',
                    pointBorderColor: '#ffffff',
                    pointHoverBackgroundColor: '#ffffff',
                    pointHoverBorderColor: '#10B981',
                },
                {
                    label: 'Gastos',
                    data: expenseData,
                    borderColor: '#EF4444',
                    backgroundColor: expenseGradient,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#EF4444',
                    pointBorderColor: '#ffffff',
                    pointHoverBackgroundColor: '#ffffff',
                    pointHoverBorderColor: '#EF4444',
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
                        callback: (v) => v >= 1000 ? '$' + (v / 1000) + 'k' : '$' + v
                    },
                    grid: {
                        drawBorder: false,
                        color: '#E5E7EB'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    align: 'end',
                    labels: {
                        usePointStyle: true,
                        boxWidth: 8,
                        padding: 20
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: '#1F2937',
                    titleFont: { size: 14 },
                    bodyFont: { size: 12 },
                    padding: 12,
                    callbacks: {
                        label: (c) => `${c.dataset.label}: ${formatCurrency(c.parsed.y)}`
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

// Mapa de colores por categoría para mantener consistencia con los badges
// MOVING CATEGORY_COLORS to model.js

// Calcular categorías de gastos para gráfico circular
function calculateExpenseCategories(transactionsList) {
    const expenses = transactionsList.filter(t => t.amount < 0 && t.status === 'Completado');
    const categoryTotals = expenses.reduce((acc, t) => {
        const category = t.category || 'Sin Categoría'; // Handle undefined category
        acc[category] = (acc[category] || 0) + Math.abs(t.amount);
        return acc;
    }, {});

    const totalExpenses = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);

    const categoryData = Object.entries(categoryTotals).map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? ((amount / totalExpenses) * 100) : 0,
    }));

    // Sort categories by amount for better chart display
    categoryData.sort((a, b) => b.amount - a.amount);

    // Usar los colores definidos para las categorías
    const categoriesFormatted = categoryData.map(d => d.category);
    const categoryColors = categoriesFormatted.map(category => CATEGORY_COLORS[category] || '#6b7280'); // Color por defecto si no se encuentra

    return {
        labels: categoriesFormatted,
        data: categoryData.map(d => d.percentage.toFixed(1)), // Use percentages for chart
        colors: categoryColors,
        actualTotals: categoryTotals
    };
}

// Inicializar gráfico circular de categorías de gastos
function initExpenseCategoryChart() {
    const ctx = document.getElementById('expenseCategoryChart').getContext('2d');

    // Verificar si el canvas existe
    if (!ctx) {
        console.error('Canvas para el gráfico de categorías no encontrado');
        return;
    }

    // Filtrar solo gastos completados y del año actual para una vista más relevante
    const currentYear = new Date().getFullYear();
    const currentYearExpenses = allTransactions.filter(t => {
        const transactionDate = new Date(t.date);
        return t.amount < 0 &&
            t.status === 'Completado' &&
            transactionDate.getFullYear() === currentYear;
    });

    // Calcular usando solo los gastos completados para una vista más precisa
    const { labels: allLabels, data: allPercentages, colors: allColors } = calculateExpenseCategories(currentYearExpenses);

    if (expenseCategoryChartInstance) {
        expenseCategoryChartInstance.destroy();
    }

    if (allLabels.length === 0) {
        // Mostrar mensaje en el canvas si no hay datos
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#6B7280';
        ctx.fillText('No hay datos de gastos', ctx.canvas.width / 2, ctx.canvas.height / 2);
        renderCategoryLegend([], [], []); // Limpiar leyenda
        return;
    }

    let finalLabels = [];
    let finalPercentages = [];
    let finalColors = [];

    if (allLabels.length > 6) {
        // Agrupa las 5 categorías principales y el resto en "Otros"
        let tempCategories = allLabels.map((label, index) => ({
            label: label,
            percentage: parseFloat(allPercentages[index]),
            color: allColors[index]
        }));

        // Extraer las 5 principales (por monto, ya están ordenadas)
        const topCategories = tempCategories.slice(0, 5);
        const restCategories = tempCategories.slice(5);

        // Sumar el porcentaje de todas las categorías restantes (incluyendo "Otros" original si existe)
        let consolidatedOtrosPercentage = 0;
        restCategories.forEach(cat => {
            consolidatedOtrosPercentage += cat.percentage;
        });

        // Añadir las 5 principales
        topCategories.forEach(cat => {
            finalLabels.push(cat.label);
            finalPercentages.push(cat.percentage.toFixed(1));
            finalColors.push(cat.color);
        });

        // Añadir la categoría "Otros" consolidada si tiene valor
        if (consolidatedOtrosPercentage > 0) {
            finalLabels.push('Otros');
            finalPercentages.push(consolidatedOtrosPercentage.toFixed(1));
            finalColors.push(CATEGORY_COLORS['Otros'] || '#6b7280');
        }
    } else {
        // Si hay 6 o menos categorías, mostrarlas todas
        finalLabels = [...allLabels];
        finalPercentages = [...allPercentages];
        finalColors = [...allColors];
    }

    // Asegurar que los porcentajes sumen aproximadamente 100% si hay redondeos
    // Esto es opcional y puede ser complejo de ajustar perfectamente con toFixed(1)
    // Por ahora, lo dejamos así.

    expenseCategoryChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: finalLabels,
            datasets: [{
                label: 'Gasto por Categoría',
                data: finalPercentages,
                backgroundColor: finalColors,
                borderColor: '#ffffff',
                borderWidth: 2,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 500
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#1F2937',
                    titleFont: { size: 14 },
                    bodyFont: { size: 12 },
                    padding: 10,
                    callbacks: {
                        label: (c) => `${c.label}: ${c.parsed}%`
                    }
                }
            }
        }
    });

    // Para la leyenda usamos las etiquetas y datos finales del gráfico
    renderCategoryLegend(finalLabels, finalColors, finalPercentages);
}