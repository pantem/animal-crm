// Main Application Controller
const App = {
    currentPage: 'dashboard',
    speciesChart: null,
    feedingChart: null,

    init() {
        this.initTheme();
        this.bindNavigation();
        this.bindThemeToggle();
        this.bindSettings();
        this.initModules();
        this.handleHashChange();
        window.addEventListener('hashchange', () => this.handleHashChange());
    },

    // Theme Management
    initTheme() {
        const savedTheme = localStorage.getItem('animalcrm_theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme || (prefersDark ? 'dark' : 'dark'); // Default to dark
        this.setTheme(theme);
    },

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('animalcrm_theme', theme);
        this.updateThemeToggleUI(theme);
    },

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        Toast.show(`Tema cambiado a ${newTheme === 'dark' ? 'oscuro' : 'claro'}`, 'success');
    },

    updateThemeToggleUI(theme) {
        const icon = document.getElementById('themeIcon');
        const text = document.getElementById('themeText');
        if (icon) {
            icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
        }
        if (text) {
            text.textContent = theme === 'dark' ? 'Tema Oscuro' : 'Tema Claro';
        }
    },

    bindThemeToggle() {
        document.getElementById('themeToggle')?.addEventListener('click', () => this.toggleTheme());
    },

    initModules() {
        SpeciesManager.init();
        AnimalsManager.init();
        VaccinationsManager.init();
        FeedingManager.init();
        ReproductionManager.init();
    },

    bindNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.navigateTo(page);
            });
        });
    },

    handleHashChange() {
        const hash = window.location.hash.slice(1) || 'dashboard';
        this.navigateTo(hash);
    },

    navigateTo(page) {
        this.currentPage = page;
        window.location.hash = page;

        // Update nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        // Render page content
        this.renderPage(page);
    },

    renderPage(page) {
        const mainContent = document.getElementById('mainContent');

        switch (page) {
            case 'dashboard':
                mainContent.innerHTML = this.getDashboardHTML();
                this.updateDashboard();
                break;
            case 'species':
                mainContent.innerHTML = this.getSpeciesHTML();
                SpeciesManager.bindEvents();
                SpeciesManager.render();
                break;
            case 'animals':
                mainContent.innerHTML = this.getAnimalsHTML();
                AnimalsManager.bindEvents();
                AnimalsManager.render();
                break;
            case 'vaccinations':
                mainContent.innerHTML = this.getVaccinationsHTML();
                VaccinationsManager.bindEvents();
                VaccinationsManager.render();
                break;
            case 'feeding':
                mainContent.innerHTML = this.getFeedingHTML();
                FeedingManager.bindEvents();
                FeedingManager.render();
                break;
            case 'reproduction':
                mainContent.innerHTML = this.getReproductionHTML();
                ReproductionManager.bindEvents();
                ReproductionManager.render();
                break;
            case 'settings':
                mainContent.innerHTML = this.getSettingsHTML();
                this.bindSettings();
                break;
        }
    },

    getDashboardHTML() {
        return `
            <section class="page active" id="dashboardPage">
                <header class="page-header">
                    <h1>Dashboard</h1>
                    <p class="page-subtitle">Resumen general de tu gestión ganadera</p>
                </header>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon animals"><span style="font-size:24px">🐄</span></div>
                        <div class="stat-info">
                            <span class="stat-value" id="totalAnimals">0</span>
                            <span class="stat-label">Total Animales</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon species"><span style="font-size:24px">📋</span></div>
                        <div class="stat-info">
                            <span class="stat-value" id="totalSpecies">0</span>
                            <span class="stat-label">Especies</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon vaccinations"><span style="font-size:24px">💉</span></div>
                        <div class="stat-info">
                            <span class="stat-value" id="pendingVaccinations">0</span>
                            <span class="stat-label">Vacunas Pendientes</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon reproduction"><span style="font-size:24px">❤️</span></div>
                        <div class="stat-info">
                            <span class="stat-value" id="upcomingHeat">0</span>
                            <span class="stat-label">Celos Próximos</span>
                        </div>
                    </div>
                </div>
                
                <div class="dashboard-grid">
                    <div class="card chart-card">
                        <h3 class="card-title">Distribución por Especie</h3>
                        <div class="chart-container"><canvas id="speciesChart"></canvas></div>
                    </div>
                    <div class="card chart-card">
                        <h3 class="card-title">Consumo de Alimento (Últimos 7 días)</h3>
                        <div class="chart-container"><canvas id="feedingChart"></canvas></div>
                    </div>
                    <div class="card upcoming-card">
                        <h3 class="card-title">Próximas Vacunaciones</h3>
                        <ul class="upcoming-list" id="upcomingVaccinationsList">
                            <li class="empty-state">No hay vacunaciones pendientes</li>
                        </ul>
                    </div>
                    <div class="card upcoming-card">
                        <h3 class="card-title">Eventos Reproductivos</h3>
                        <ul class="upcoming-list" id="reproductionEventsList">
                            <li class="empty-state">No hay eventos próximos</li>
                        </ul>
                    </div>
                </div>
            </section>
        `;
    },

    getSpeciesHTML() {
        return `
            <section class="page active" id="speciesPage">
                <header class="page-header">
                    <div>
                        <h1>Gestión de Especies</h1>
                        <p class="page-subtitle">Administra las especies y sus atributos personalizados</p>
                    </div>
                    <button class="btn btn-primary" id="addSpeciesBtn">➕ Nueva Especie</button>
                </header>
                <div class="species-grid" id="speciesGrid"></div>
            </section>
        `;
    },

    getAnimalsHTML() {
        return `
            <section class="page active" id="animalsPage">
                <header class="page-header">
                    <div>
                        <h1>Gestión de Animales</h1>
                        <p class="page-subtitle">Registro y seguimiento de todos tus animales</p>
                    </div>
                    <button class="btn btn-primary" id="addAnimalBtn">➕ Nuevo Animal</button>
                </header>
                <div class="filters-bar">
                    <div class="search-box">
                        <span>🔍</span>
                        <input type="text" id="animalSearch" placeholder="Buscar por nombre o identificador...">
                    </div>
                    <select id="speciesFilter" class="filter-select"><option value="">Todas las especies</option></select>
                    <select id="statusFilter" class="filter-select">
                        <option value="">Todos los estados</option>
                        <option value="active">Activo</option>
                        <option value="sold">Vendido</option>
                        <option value="deceased">Fallecido</option>
                    </select>
                </div>
                <div class="table-container">
                    <table class="data-table" id="animalsTable">
                        <thead>
                            <tr><th>ID</th><th>Nombre</th><th>Especie</th><th>Fecha Nacimiento</th><th>Estado</th><th>Acciones</th></tr>
                        </thead>
                        <tbody id="animalsTableBody"></tbody>
                    </table>
                </div>
            </section>
        `;
    },

    getVaccinationsHTML() {
        return `
            <section class="page active" id="vaccinationsPage">
                <header class="page-header">
                    <div>
                        <h1>Control de Vacunación</h1>
                        <p class="page-subtitle">Registro y seguimiento de vacunas aplicadas</p>
                    </div>
                    <button class="btn btn-primary" id="addVaccinationBtn">➕ Nueva Vacunación</button>
                </header>
                <div class="tabs">
                    <button class="tab active" data-tab="vaccinations-list">Historial</button>
                    <button class="tab" data-tab="vaccinations-calendar">Calendario</button>
                </div>
                <div class="tab-content active" id="vaccinations-list">
                    <div class="filters-bar">
                        <div class="search-box">
                            <span>🔍</span>
                            <input type="text" id="vaccinationSearch" placeholder="Buscar vacunación...">
                        </div>
                        <select id="vaccinationAnimalFilter" class="filter-select"><option value="">Todos los animales</option></select>
                    </div>
                    <div class="table-container">
                        <table class="data-table" id="vaccinationsTable">
                            <thead>
                                <tr><th>Animal</th><th>Vacuna</th><th>Fecha Aplicación</th><th>Próxima Dosis</th><th>Veterinario</th><th>Acciones</th></tr>
                            </thead>
                            <tbody id="vaccinationsTableBody"></tbody>
                        </table>
                    </div>
                </div>
                <div class="tab-content" id="vaccinations-calendar">
                    <div class="calendar-container">
                        <div class="calendar-header">
                            <button class="btn btn-icon" id="prevMonth">◀</button>
                            <h3 id="currentMonth">Diciembre 2025</h3>
                            <button class="btn btn-icon" id="nextMonth">▶</button>
                        </div>
                        <div class="calendar-legend">
                            <span class="legend-item"><span class="legend-dot vaccination"></span> Vacunación Programada</span>
                        </div>
                        <div class="calendar-grid" id="vaccinationCalendar"></div>
                    </div>
                </div>
            </section>
        `;
    },

    getFeedingHTML() {
        return `
            <section class="page active" id="feedingPage">
                <header class="page-header">
                    <div>
                        <h1>Control de Alimentación</h1>
                        <p class="page-subtitle">Registro de consumo de alimento</p>
                    </div>
                    <button class="btn btn-primary" id="addFeedingBtn">➕ Nuevo Registro</button>
                </header>
                <div class="stats-grid stats-small">
                    <div class="stat-card mini"><span class="stat-value" id="todayFeeding">0 kg</span><span class="stat-label">Consumo Hoy</span></div>
                    <div class="stat-card mini"><span class="stat-value" id="weekFeeding">0 kg</span><span class="stat-label">Esta Semana</span></div>
                    <div class="stat-card mini"><span class="stat-value" id="monthFeeding">0 kg</span><span class="stat-label">Este Mes</span></div>
                </div>
                <div class="card chart-card full-width">
                    <h3 class="card-title">Consumo por Día</h3>
                    <div class="chart-container large"><canvas id="feedingDetailChart"></canvas></div>
                </div>
                <div class="filters-bar">
                    <select id="feedingAnimalFilter" class="filter-select"><option value="">Todos los animales</option></select>
                    <input type="date" id="feedingDateFrom" class="filter-input">
                    <input type="date" id="feedingDateTo" class="filter-input">
                </div>
                <div class="table-container">
                    <table class="data-table" id="feedingTable">
                        <thead>
                            <tr><th>Animal</th><th>Tipo de Alimento</th><th>Cantidad</th><th>Fecha</th><th>Notas</th><th>Acciones</th></tr>
                        </thead>
                        <tbody id="feedingTableBody"></tbody>
                    </table>
                </div>
            </section>
        `;
    },

    getReproductionHTML() {
        return `
            <section class="page active" id="reproductionPage">
                <header class="page-header">
                    <div>
                        <h1>Ciclo Reproductivo</h1>
                        <p class="page-subtitle">Control de celo e inseminación</p>
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-primary" id="addHeatBtn">❤️ Registrar Celo</button>
                        <button class="btn btn-secondary" id="addInseminationBtn">🧬 Registrar Inseminación</button>
                    </div>
                </header>
                <div class="tabs">
                    <button class="tab active" data-tab="heat-records">Registros de Celo</button>
                    <button class="tab" data-tab="insemination-records">Inseminaciones</button>
                    <button class="tab" data-tab="reproduction-calendar">Calendario</button>
                </div>
                <div class="tab-content active" id="heat-records">
                    <div class="table-container">
                        <table class="data-table" id="heatTable">
                            <thead>
                                <tr><th>Animal</th><th>Fecha de Celo</th><th>Próximo Celo Estimado</th><th>Intensidad</th><th>Notas</th><th>Acciones</th></tr>
                            </thead>
                            <tbody id="heatTableBody"></tbody>
                        </table>
                    </div>
                </div>
                <div class="tab-content" id="insemination-records">
                    <div class="table-container">
                        <table class="data-table" id="inseminationTable">
                            <thead>
                                <tr><th>Animal</th><th>Fecha</th><th>Método</th><th>Semental/Código</th><th>Resultado</th><th>Acciones</th></tr>
                            </thead>
                            <tbody id="inseminationTableBody"></tbody>
                        </table>
                    </div>
                </div>
                <div class="tab-content" id="reproduction-calendar">
                    <div class="calendar-container">
                        <div class="calendar-header">
                            <button class="btn btn-icon" id="prevReproMonth">◀</button>
                            <h3 id="currentReproMonth">Diciembre 2025</h3>
                            <button class="btn btn-icon" id="nextReproMonth">▶</button>
                        </div>
                        <div class="calendar-legend">
                            <span class="legend-item"><span class="legend-dot heat"></span> Celo</span>
                            <span class="legend-item"><span class="legend-dot insemination"></span> Inseminación</span>
                            <span class="legend-item"><span class="legend-dot predicted"></span> Celo Estimado</span>
                        </div>
                        <div class="calendar-grid" id="reproductionCalendar"></div>
                    </div>
                </div>
            </section>
        `;
    },

    getSettingsHTML() {
        return `
            <section class="page active" id="settingsPage">
                <header class="page-header">
                    <h1>Configuración</h1>
                    <p class="page-subtitle">Administra tus datos y preferencias</p>
                </header>
                <div class="settings-grid">
                    <div class="card settings-card">
                        <h3 class="card-title">📥 Exportar Datos</h3>
                        <p class="card-description">Descarga todos tus datos en formato JSON para respaldo.</p>
                        <button class="btn btn-primary" id="exportDataBtn">Exportar JSON</button>
                    </div>
                    <div class="card settings-card">
                        <h3 class="card-title">📤 Importar Datos</h3>
                        <p class="card-description">Restaura tus datos desde un archivo JSON de respaldo.</p>
                        <input type="file" id="importFileInput" accept=".json" style="display: none;">
                        <button class="btn btn-secondary" id="importDataBtn">Importar JSON</button>
                    </div>
                    <div class="card settings-card danger">
                        <h3 class="card-title">⚠️ Eliminar Todos los Datos</h3>
                        <p class="card-description">Esta acción eliminará permanentemente todos los datos.</p>
                        <button class="btn btn-danger" id="clearDataBtn">Eliminar Todo</button>
                    </div>
                </div>
            </section>
        `;
    },

    bindSettings() {
        document.getElementById('exportDataBtn')?.addEventListener('click', () => {
            const data = DataManager.exportAll();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `animal-crm-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            Toast.show('Datos exportados correctamente', 'success');
        });

        document.getElementById('importDataBtn')?.addEventListener('click', () => {
            document.getElementById('importFileInput')?.click();
        });

        document.getElementById('importFileInput')?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (confirm('¿Está seguro de importar estos datos? Los datos actuales serán reemplazados.')) {
                        DataManager.importAll(data);
                        Toast.show('Datos importados correctamente', 'success');
                        this.renderPage(this.currentPage);
                    }
                } catch (err) {
                    Toast.show('Error al leer el archivo JSON', 'error');
                }
            };
            reader.readAsText(file);
        });

        document.getElementById('clearDataBtn')?.addEventListener('click', () => {
            if (confirm('⚠️ ¿Está seguro de eliminar TODOS los datos? Esta acción no se puede deshacer.')) {
                if (confirm('Esta es su última oportunidad. ¿Confirma la eliminación de todos los datos?')) {
                    DataManager.clearAll();
                    DataManager.initializeSampleData();
                    Toast.show('Todos los datos han sido eliminados', 'success');
                    this.renderPage(this.currentPage);
                }
            }
        });
    },

    updateDashboard() {
        // Stats
        const animals = DataManager.getAll(DB_KEYS.ANIMALS);
        const species = DataManager.getAll(DB_KEYS.SPECIES);
        const pendingVax = VaccinationsManager.getPendingVaccinations();
        const upcomingHeats = ReproductionManager.getUpcomingEvents();

        document.getElementById('totalAnimals').textContent = animals.filter(a => a.status === 'active').length;
        document.getElementById('totalSpecies').textContent = species.length;
        document.getElementById('pendingVaccinations').textContent = pendingVax.length;
        document.getElementById('upcomingHeat').textContent = upcomingHeats.length;

        // Upcoming vaccinations list
        const vaxList = document.getElementById('upcomingVaccinationsList');
        if (vaxList) {
            if (pendingVax.length === 0) {
                vaxList.innerHTML = '<li class="empty-state">No hay vacunaciones pendientes</li>';
            } else {
                vaxList.innerHTML = pendingVax.slice(0, 5).map(v => `
                    <li>
                        <span>${v.animal?.name || 'N/A'} - ${v.vaccineName}</span>
                        <span class="status-badge pending">${new Date(v.nextDoseDate).toLocaleDateString('es-ES')}</span>
                    </li>
                `).join('');
            }
        }

        // Upcoming reproduction events
        const reproList = document.getElementById('reproductionEventsList');
        if (reproList) {
            if (upcomingHeats.length === 0) {
                reproList.innerHTML = '<li class="empty-state">No hay eventos próximos</li>';
            } else {
                reproList.innerHTML = upcomingHeats.slice(0, 5).map(e => `
                    <li>
                        <span>${e.animal?.name || 'N/A'} - Celo estimado</span>
                        <span class="status-badge pending">${e.predictedDate.toLocaleDateString('es-ES')}</span>
                    </li>
                `).join('');
            }
        }

        // Charts
        this.renderSpeciesChart();
        this.renderFeedingChart();
    },

    renderSpeciesChart() {
        const canvas = document.getElementById('speciesChart');
        if (!canvas) return;

        const species = DataManager.getAll(DB_KEYS.SPECIES);
        const animals = DataManager.getAll(DB_KEYS.ANIMALS);

        const labels = [];
        const data = [];
        const colors = ['#10B981', '#6366F1', '#F59E0B', '#EC4899', '#8B5CF6', '#14B8A6'];

        species.forEach((s, i) => {
            const count = animals.filter(a => a.speciesId === s.id && a.status === 'active').length;
            if (count > 0) {
                labels.push(s.name);
                data.push(count);
            }
        });

        if (this.speciesChart) {
            this.speciesChart.destroy();
        }

        if (labels.length === 0) {
            canvas.parentElement.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 3rem;">No hay datos para mostrar</p>';
            return;
        }

        this.speciesChart = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: colors.slice(0, data.length),
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: '#94A3B8', padding: 15 }
                    }
                }
            }
        });
    },

    renderFeedingChart() {
        const canvas = document.getElementById('feedingChart');
        if (!canvas) return;

        const feedings = DataManager.getAll(DB_KEYS.FEEDING);
        const days = [];
        const data = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            days.push(date.toLocaleDateString('es-ES', { weekday: 'short' }));

            const total = feedings
                .filter(f => f.date === dateStr)
                .reduce((sum, f) => sum + (parseFloat(f.quantity) || 0), 0);
            data.push(total);
        }

        if (this.feedingChart) {
            this.feedingChart.destroy();
        }

        this.feedingChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: days,
                datasets: [{
                    label: 'Consumo (kg)',
                    data,
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#94A3B8' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#94A3B8' }
                    }
                }
            }
        });
    }
};

// Modal Controller
const Modal = {
    show({ title, content, onConfirm, showCancel = true, confirmText = 'Guardar' }) {
        const overlay = document.getElementById('modalOverlay');
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        const modalFooter = document.getElementById('modalFooter');

        modalTitle.textContent = title;
        modalBody.innerHTML = content;

        const cancelBtn = document.getElementById('modalCancel');
        const confirmBtn = document.getElementById('modalConfirm');

        cancelBtn.style.display = showCancel ? 'inline-flex' : 'none';
        confirmBtn.textContent = confirmText;

        overlay.classList.add('active');

        const close = () => overlay.classList.remove('active');

        document.getElementById('modalClose').onclick = close;
        cancelBtn.onclick = close;
        overlay.onclick = (e) => { if (e.target === overlay) close(); };

        confirmBtn.onclick = () => {
            if (onConfirm) {
                const result = onConfirm();
                if (result !== false) close();
            } else {
                close();
            }
        };
    }
};

// Toast Notifications
const Toast = {
    show(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️'}</span>
            <span>${message}</span>
        `;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => App.init());
