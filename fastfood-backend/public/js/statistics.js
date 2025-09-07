import { authFetch } from '/js/modules/auth.js';
import { showAlert } from '/js/modules/utils.js';
import Chart from "https://cdn.jsdelivr.net/npm/chart.js@4.5.0/auto/+esm";


export async function init() {
    try {
        setupEventListeners();

        const defaultPeriod = document.getElementById('statsRangeSelect').value;
        await loadStatistics(defaultPeriod);

    } catch (error) {
        console.error('Error initializing statistics page:', error);
        showAlert('Failed to initialize page', 'error');
    }
}


function setupEventListeners() {

    const btnApplyStatsRange = document.getElementById('btnApplyStatsRange');
    btnApplyStatsRange.addEventListener('click', async () => {
        const days = document.getElementById('statsRangeSelect').value;
        await loadStatistics(days);
    });

}

async function loadStatistics(days) {
    try {
        const res = await getStatisticsData(days);
        const data = await res.json();

        if (!data.success) 
            throw new Error(data.message || 'Failed to fetch statistics');

        updateStatisticsUI(data.data);
        updatePeriodLabels(data.data.period);

    } catch (error) {
        console.error('Error loading statistics:', error);
        showAlert('Failed to load statistics data', 'error');
    } 
}


async function getStatisticsData(days) {
    const response = await authFetch(`/api/statistics/summary?days=${days}`);

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch statistics');
    }

    return response;
}


function updateStatisticsUI(data) {
    updateMetrics(data);
    updateOrdersChart(data.ordersPerDay);
    updateProductLists(data.mostOrderedProducts, data.leastOrderedProducts);
}


function updateMetrics(data) {
    const totalRevenueEl = document.getElementById('totalRevenue');
    totalRevenueEl.textContent = 
        data.totalDelivered && data.totalDelivered.total !== undefined ?
        data.totalDelivered.total.toFixed(2) : '0.00';

    const avgOrderEl = document.getElementById('avgOrderAmount');
    avgOrderEl.textContent = 
        data.averageOrderPrice && data.averageOrderPrice.averagePrice !== undefined ?
        data.averageOrderPrice.averagePrice.toFixed(2) : '0.00';

    const totalOrdersAmountEl = document.getElementById('totalOrdersNumber');
    totalOrdersAmountEl.textContent = 
        data.averageOrderPrice && data.averageOrderPrice.count !== undefined ? 
        data.averageOrderPrice.count : '0';

}


function updateOrdersChart(ordersData) {
    const ordersChart = document.getElementById('ordersDailyChart');
    const emptyMessage = document.getElementById('ordersChartEmpty');

    if (!ordersData || ordersData.length === 0) {
        ordersChart.classList.add('d-none');
        emptyMessage.classList.remove('d-none');
        return;
    }

    ordersChart.classList.remove('d-none');
    emptyMessage.classList.add('d-none');

    const sortedData = [...ordersData].sort((a, b) =>
        new Date(a.date) - new Date(b.date)
    );

    const labels = sortedData.map(item => item.date);
    const counts = sortedData.map(item => item.count);

    if (window.ordersChart) window.ordersChart.destroy();

    window.ordersChart = new Chart(ordersChart, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Orders',
                data: counts,
                backgroundColor: 'rgba(13, 110, 253, 0.2)',
                borderColor: 'rgba(13, 110, 253, 1)',
                borderWidth: 2,
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}


function updateProductLists(mostOrdered, leastOrdered) {

    const mostList = document.getElementById('mostProductsList');
    const mostEmpty = document.getElementById('mostProductsEmpty');

    if (!mostOrdered || mostOrdered.length === 0) {
        mostList.classList.add('d-none');
        mostEmpty.classList.remove('d-none');
    } else {
        mostList.classList.remove('d-none');
        mostEmpty.classList.add('d-none');

        mostList.innerHTML = '';

        mostOrdered.forEach(product => {
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
            listItem.innerHTML = `
                <span>${product.dish}</span>
                <span class="badge bg-primary rounded-pill">${product.totalOrdered}</span>
            `;
            mostList.appendChild(listItem);
        });
    }

    const leastList = document.getElementById('leastProductsList');
    const leastEmpty = document.getElementById('leastProductsEmpty');

    if (!leastOrdered || leastOrdered.length === 0) {
        leastList.classList.add('d-none');
        leastEmpty.classList.remove('d-none');
    } else {
        leastList.classList.remove('d-none');
        leastEmpty.classList.add('d-none');

        leastList.innerHTML = '';

        leastOrdered.forEach(product => {
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
            listItem.innerHTML = `
                <span>${product.dish}</span>
                <span class="badge bg-secondary rounded-pill">${product.totalOrdered}</span>
            `;
            leastList.appendChild(listItem);
        });
    }
}


function updatePeriodLabels(periodText) {
    const labels = document.querySelectorAll('.metricRangeLabel');
    labels.forEach(label => {
        label.textContent = periodText;
    });
}


