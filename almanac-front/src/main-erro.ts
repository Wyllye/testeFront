// Types
interface Habit {
  id: number;
  name: string;
  description?: string;
  category: string;
  completedToday: boolean;
  streak: number;
  createdAt: string;
}

interface CreateHabitDto {
  name: string;
  description?: string;
  category: string;
}

interface UpdateHabitDto {
  name?: string;
  description?: string;
  category?: string;
}

interface Offensive {
  id: number;
  name: string;
  description: string;
  duration: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'failed';
  habits: number[];
  progress: number;
  completedDays: number;
}

interface CreateOffensiveDto {
  name: string;
  description: string;
  duration: number;
  habits: number[];
}

interface Statistics {
  totalHabits: number;
  currentStreak: number;
  completedToday: number;
  achievements: number;
  weeklyProgress: number[];
  categoryStats: { [key: string]: number };
}

// Main Application Class
class AlmanacApp {
  private habits: Habit[] = [];
  private offensives: Offensive[] = [];
  private statistics: Statistics | null = null;
  private currentEditingHabit: Habit | null = null;
  private currentTab: string = 'dashboard';
  private readonly API_BASE_URL = 'http://localhost:3000';
 

  constructor( ) {
    this.init();
  }

  private async init(): Promise<void> {
    this.setupEventListeners();
    this.setupTabNavigation();
    await this.loadInitialData();
  }

  // Event Listeners Setup
  private setupEventListeners(): void {
    // Modal events
    const fab = document.getElementById('fab');
    const modal = document.getElementById('modal');
    const overlay = document.getElementById('overlay');
    const closeModal = document.getElementById('close-modal');
    const cancelBtn = document.getElementById('cancel-btn');
    const saveBtn = document.getElementById('save-btn');
    const createFirstHabit = document.getElementById('create-first-habit');

    if (fab) fab.addEventListener('click', () => this.openModal());
    if (createFirstHabit) createFirstHabit.addEventListener('click', () => this.openModal());
    if (closeModal) closeModal.addEventListener('click', () => this.closeModal());
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeModal());
    if (overlay) overlay.addEventListener('click', () => this.closeModal());
    if (saveBtn) saveBtn.addEventListener('click', () => this.saveHabit());

    // Form validation
    const nameInput = document.getElementById('habit-name') as HTMLInputElement;
    if (nameInput) {
      nameInput.addEventListener('input', () => this.validateForm());
    }

    // Offensive form events
    const createOffensiveBtn = document.getElementById('create-offensive-btn');
    if (createOffensiveBtn) {
      createOffensiveBtn.addEventListener('click', () => this.createOffensive());
    }
  }

  // Tab Navigation Setup
  private setupTabNavigation(): void {
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement;
        const tabName = target.getAttribute('data-tab');
        if (tabName) {
          this.switchTab(tabName);
        }
      });
    });
  }

  private switchTab(tabName: string): void {
    // Update active nav button
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');

    // Update active tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabName)?.classList.add('active');

    this.currentTab = tabName;

    // Load tab-specific data
    switch (tabName) {
      case 'statistics':
        this.loadStatistics();
        break;
      case 'offensives':
        this.loadOffensives();
        break;
      case 'dashboard':
        this.loadHabits();
        break;
    }
  }

  // Data Loading Methods
  private async loadInitialData(): Promise<void> {
    this.showLoading();
    try {
      await this.loadHabits();
      this.updateStats();
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      this.showNotification('Erro ao carregar dados', 'error');
    } finally {
      this.hideLoading();
    }
  }

  private async loadHabits(): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/hobbies`);
      if (!response.ok) throw new Error('Falha ao carregar hábitos');
      
      this.habits = await response.json();
      this.renderHabits();
      this.updateStats();
    } catch (error) {
      console.error('Erro ao carregar hábitos:', error);
      this.showNotification('Erro ao carregar hábitos', 'error');
    }
  }

  private async loadStatistics(): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/statistics`);
      if (!response.ok) throw new Error('Falha ao carregar estatísticas');
      
      this.statistics = await response.json();
      this.renderStatistics();
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      this.showNotification('Erro ao carregar estatísticas', 'error');
    }
  }

  private async loadOffensives(): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/offensives`);
      if (!response.ok) throw new Error('Falha ao carregar ofensivas');
      
      this.offensives = await response.json();
      // Garante que os hábitos estejam carregados antes de renderizar as ofensivas
      await this.loadHabits(); 
      this.renderOffensives();
      this.renderOffensiveForm();
    } catch (error) {
      console.error('Erro ao carregar ofensivas:', error);
      this.showNotification('Erro ao carregar ofensivas', 'error');
    }
  }

  // Rendering Methods
  public renderHabits(): void {
    const habitsList = document.getElementById('habits-list');
    const emptyState = document.getElementById('empty-state');
    
    if (!habitsList || !emptyState) return;

    if (this.habits.length === 0) {
      habitsList.classList.add('hidden');
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    habitsList.classList.remove('hidden');

    habitsList.innerHTML = this.habits.map(habit => `
      <div class="habit-card ${habit.completedToday ? 'completed' : ''}" data-habit-id="${habit.id}">
        <div class="habit-card-content">
          <div class="habit-info">
            <div class="habit-icon ${habit.category}">
              ${this.getCategoryIcon(habit.category)}
            </div>
            <div class="habit-details">
              <h3>${this.escapeHtml(habit.name)}</h3>
              ${habit.description ? `<p>${this.escapeHtml(habit.description)}</p>` : ''}
            </div>
          </div>
          <div class="habit-actions">
            <button class="action-btn check" onclick="app.toggleHabit(${habit.id})" title="Marcar como concluído">
              ${habit.completedToday ? '✓' : '○'}
            </button>
            <button class="action-btn edit" onclick="app.editHabit(${habit.id})" title="Editar hábito">
              ✏️
            </button>
            <button class="action-btn delete" onclick="app.deleteHabitById(${habit.id})" title="Excluir hábito">
              🗑️
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  private renderStatistics(): void {
    if (!this.statistics) return;

    // Update basic stats
    const statsTotal = document.getElementById('stats-total');
    const statsStreak = document.getElementById('stats-streak');
    const statsAchievements = document.getElementById('stats-achievements');

    if (statsTotal) statsTotal.textContent = this.statistics.totalHabits.toString();
    if (statsStreak) statsStreak.textContent = this.statistics.currentStreak.toString();
    if (statsAchievements) statsAchievements.textContent = this.statistics.achievements.toString();

    // Render weekly progress chart
    this.renderWeeklyChart();

    // Render category stats
    this.renderCategoryStats();
  }

  private renderWeeklyChart(): void {
    const canvas = document.getElementById('weekly-progress-chart') as HTMLCanvasElement;
    if (!canvas || !this.statistics) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const data = this.statistics.weeklyProgress;
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set up chart dimensions
    const padding = 40;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;
    const barWidth = chartWidth / data.length;
    const maxValue = Math.max(...data, 1);

    // Draw bars
    data.forEach((value, index) => {
      const barHeight = (value / maxValue) * chartHeight;
      const x = padding + index * barWidth + barWidth * 0.2;
      const y = canvas.height - padding - barHeight;
      const width = barWidth * 0.6;

      // Draw bar
      ctx.fillStyle = '#667eea';
      ctx.fillRect(x, y, width, barHeight);

      // Draw day label
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(days[index], x + width / 2, canvas.height - 10);

      // Draw value label
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(value.toString(), x + width / 2, y - 5);
    });
  }

  private renderCategoryStats(): void {
    const categoryGrid = document.getElementById('category-stats-grid');
    if (!categoryGrid || !this.statistics) return;

    const categories = {
      saude: { icon: '🏥', name: 'Saúde' },
      exercicio: { icon: '💪', name: 'Exercício' },
      estudo: { icon: '📚', name: 'Estudo' },
      trabalho: { icon: '💼', name: 'Trabalho' },
      lazer: { icon: '🎮', name: 'Lazer' },
      outros: { icon: '⭐', name: 'Outros' }
    };

    categoryGrid.innerHTML = Object.entries(categories).map(([key, category]) => {
      const count = this.statistics?.categoryStats[key] || 0;
      return `
        <div class="category-item">
          <span class="category-icon">${category.icon}</span>
          <div class="category-name">${category.name}</div>
          <div class="category-count">${count}</div>
        </div>
      `;
    }).join('');
  }

  private renderOffensives(): void {
    const activeOffensives = document.getElementById('active-offensives');
    const offensivesHistory = document.getElementById('offensives-history');

    if (!activeOffensives || !offensivesHistory) return;

    // Render active offensives
    const active = this.offensives.filter(o => o.status === 'active');
    if (active.length === 0) {
      activeOffensives.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 2rem;">Nenhuma ofensiva ativa no momento.</p>';
    } else {
      activeOffensives.innerHTML = active.map(offensive => this.renderOffensiveCard(offensive)).join('');
    }

    // Render history
    const history = this.offensives.filter(o => o.status !== 'active');
    if (history.length === 0) {
      offensivesHistory.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 2rem;">Nenhuma ofensiva no histórico.</p>';
    } else {
      offensivesHistory.innerHTML = history.map(offensive => this.renderHistoryCard(offensive)).join('');
    }
  }

  private renderOffensiveCard(offensive: Offensive): string {
    const habitNames = offensive.habits.map(habitId => {
      const habit = this.habits.find(h => h.id === habitId);
      return habit ? habit.name : 'Hábito não encontrado';
    });

    return `
      <div class="offensive-card">
        <div class="offensive-header">
          <div>
            <h3 class="offensive-title">${this.escapeHtml(offensive.name)}</h3>
            <p style="color: #6b7280; font-size: 0.9rem;">${this.escapeHtml(offensive.description)}</p>
          </div>
          <span class="offensive-status ${offensive.status}">${offensive.status}</span>
        </div>
        
        <div class="offensive-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${offensive.progress}%"></div>
          </div>
          <p class="progress-text">${offensive.completedDays} de ${offensive.duration} dias (${offensive.progress.toFixed(1)}%)</p>
        </div>

        <div class="offensive-habits">
          <h4 style="font-size: 0.9rem; color: #374151; margin-bottom: 0.5rem;">Hábitos:</h4>
          <div class="habits-list-small">
            ${habitNames.map(name => `<span class="habit-tag">${this.escapeHtml(name)}</span>`).join('')}
          </div>
        </div>

        <div class="offensive-actions">
          <button class="btn-secondary btn-small" onclick="app.pauseOffensive(${offensive.id})">Pausar</button>
          <button class="btn-primary btn-small" onclick="app.completeOffensive(${offensive.id})">Concluir</button>
        </div>
      </div>
    `;
  }

  private renderHistoryCard(offensive: Offensive): string {
    const endDate = new Date(offensive.endDate).toLocaleDateString('pt-BR');
    const resultClass = offensive.status === 'completed' ? 'success' : 'failure';
    const resultText = offensive.status === 'completed' ? 'Concluída com Sucesso!' : 'Não Concluída';

    return `
      <div class="history-card">
        <div class="history-header">
          <h4 class="history-title">${this.escapeHtml(offensive.name)}</h4>
          <span class="history-date">${endDate}</span>
        </div>
        <div class="history-result ${resultClass}">
          ${resultText}
        </div>
        <p style="color: #6b7280; font-size: 0.9rem; margin-top: 1rem;">
          ${offensive.completedDays} de ${offensive.duration} dias completados
        </p>
      </div>
    `;
  }

  private renderOffensiveForm(): void {
    const habitsSelector = document.getElementById('offensive-habits-selector');
    if (!habitsSelector) return;

    habitsSelector.innerHTML = this.habits.map(habit => `
      <label class="habit-checkbox">
        <input type="checkbox" value="${habit.id}" name="offensive-habits">
        <span>${this.getCategoryIcon(habit.category)} ${this.escapeHtml(habit.name)}</span>
      </label>
    `).join('');

    // Add event listeners for checkbox selection
    habitsSelector.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const label = target.closest('.habit-checkbox');
        if (label) {
          if (target.checked) {
            label.classList.add('selected');
          } else {
            label.classList.remove('selected');
          }
        }
      });
    });
  }

  // API Methods
  private async createHabit(habitData: CreateHabitDto): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/hobbies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(habitData)
      });

      if (!response.ok) throw new Error('Falha ao criar hábito');

      const newHabit = await response.json();
      this.habits.push(newHabit);
      this.renderHabits();
      this.updateStats();
      this.showNotification('Hábito criado com sucesso! 🎉', 'success');
    } catch (error) {
      console.error('Erro ao criar hábito:', error);
      this.showNotification('Erro ao criar hábito', 'error');
    }
  }

  private async updateHabit(id: number, habitData: UpdateHabitDto): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/hobbies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(habitData)
      });

      if (!response.ok) throw new Error('Falha ao atualizar hábito');

      const updatedHabit = await response.json();
      const index = this.habits.findIndex(h => h.id === id);
      if (index !== -1) {
        this.habits[index] = updatedHabit;
        this.renderHabits();
        this.updateStats();
        this.showNotification('Hábito atualizado com sucesso! ✨', 'success');
      }
    } catch (error) {
      console.error('Erro ao atualizar hábito:', error);
      this.showNotification('Erro ao atualizar hábito', 'error');
    }
  }

  private async deleteHabit(id: number): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/hobbies/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Falha ao excluir hábito');

      this.habits = this.habits.filter(habit => habit.id !== id);
      this.renderHabits();
      this.updateStats();
      this.showNotification('Hábito excluído com sucesso! 🗑️', 'success');
    } catch (error) {
      console.error('Erro ao excluir hábito:', error);
      this.showNotification('Erro ao excluir hábito', 'error');
    }
  }

  private async createOffensive(): Promise<void> {
    const nameInput = document.getElementById('offensive-name') as HTMLInputElement;
    const durationInput = document.getElementById('offensive-duration') as HTMLInputElement;
    const descriptionInput = document.getElementById('offensive-description') as HTMLTextAreaElement;
    const selectedHabits = Array.from(document.querySelectorAll('input[name="offensive-habits"]:checked'))
      .map(input => parseInt((input as HTMLInputElement).value));

    if (!nameInput || !durationInput || !descriptionInput) return;

    const name = nameInput.value.trim();
    const duration = parseInt(durationInput.value);
    const description = descriptionInput.value.trim();

    if (!name || !duration || selectedHabits.length === 0) {
      this.showNotification('Preencha todos os campos e selecione pelo menos um hábito', 'error');
      return;
    }

    const offensiveData: CreateOffensiveDto = {
      name,
      description,
      duration,
      habits: selectedHabits
    };

    try {
      const response = await fetch(`${this.API_BASE_URL}/offensives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(offensiveData)
      });

      if (!response.ok) throw new Error('Falha ao criar ofensiva');

      const newOffensive = await response.json();
      this.offensives.push(newOffensive);
      this.renderOffensives();
      
      // Clear form
      nameInput.value = '';
      durationInput.value = '';
      descriptionInput.value = '';
      document.querySelectorAll('input[name="offensive-habits"]:checked').forEach(input => {
        (input as HTMLInputElement).checked = false;
        input.closest('.habit-checkbox')?.classList.remove('selected');
      });

      this.showNotification('Ofensiva criada com sucesso! ⚔️', 'success');
    } catch (error) {
      console.error('Erro ao criar ofensiva:', error);
      this.showNotification('Erro ao criar ofensiva', 'error');
    }
  }

  // UI Helper Methods
  private showLoading(): void {
    const loading = document.getElementById('loading');
    if (loading) loading.classList.remove('hidden');
  }

  private hideLoading(): void {
    const loading = document.getElementById('loading');
    if (loading) loading.classList.add('hidden');
  }

  private updateStats(): void {
    const currentStreak = document.getElementById('current-streak');
    const completedToday = document.getElementById('completed-today');
    const totalHabits = document.getElementById('total-habits');

    const completed = this.habits.filter(h => h.completedToday).length;
    const maxStreak = Math.max(...this.habits.map(h => h.streak), 0);

    if (currentStreak) currentStreak.textContent = maxStreak.toString();
    if (completedToday) completedToday.textContent = completed.toString();
    if (totalHabits) totalHabits.textContent = this.habits.length.toString();
  }

  // Modal Methods
  private openModal(habit?: Habit): void {
    const modal = document.getElementById('modal');
    const overlay = document.getElementById('overlay');
    const modalTitle = document.getElementById('modal-title');
    const saveBtnText = document.getElementById('save-btn-text');

    if (!modal || !overlay) return;

    this.currentEditingHabit = habit || null;

    if (modalTitle) {
      modalTitle.textContent = habit ? 'Editar Hábito' : 'Novo Hábito';
    }
    if (saveBtnText) {
      saveBtnText.textContent = habit ? 'Salvar' : 'Criar';
    }

    if (habit) {
      this.populateForm(habit);
    } else {
      this.clearForm();
    }

    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
    this.validateForm();
  }

  private closeModal(): void {
    const modal = document.getElementById('modal');
    const overlay = document.getElementById('overlay');

    if (modal) modal.classList.add('hidden');
    if (overlay) overlay.classList.add('hidden');

    this.currentEditingHabit = null;
    this.clearForm();
  }

  private populateForm(habit: Habit): void {
    const nameInput = document.getElementById('habit-name') as HTMLInputElement;
    const descInput = document.getElementById('habit-description') as HTMLTextAreaElement;
    const categorySelect = document.getElementById('habit-category') as HTMLSelectElement;

    if (nameInput) nameInput.value = habit.name;
    if (descInput) descInput.value = habit.description || '';
    if (categorySelect) categorySelect.value = habit.category;
  }

  private clearForm(): void {
    const nameInput = document.getElementById('habit-name') as HTMLInputElement;
    const descInput = document.getElementById('habit-description') as HTMLTextAreaElement;
    const categorySelect = document.getElementById('habit-category') as HTMLSelectElement;
    
    if (nameInput) nameInput.value = '';
    if (descInput) descInput.value = '';
    if (categorySelect) categorySelect.value = 'saude';
  }

  private validateForm(): void {
    const nameInput = document.getElementById('habit-name') as HTMLInputElement;
    const saveBtn = document.getElementById('save-btn') as HTMLButtonElement;
    
    if (!nameInput || !saveBtn) return;
    
    const isValid = nameInput.value.trim().length > 0;
    saveBtn.disabled = !isValid;
    saveBtn.style.opacity = isValid ? '1' : '0.5';
    saveBtn.style.cursor = isValid ? 'pointer' : 'not-allowed';
  }

  private async saveHabit(): Promise<void> {
    const nameInput = document.getElementById('habit-name') as HTMLInputElement;
    const descInput = document.getElementById('habit-description') as HTMLTextAreaElement;
    const categorySelect = document.getElementById('habit-category') as HTMLSelectElement;
    
    if (!nameInput || !descInput || !categorySelect) return;
    
    const name = nameInput.value.trim();
    const description = descInput.value.trim();
    const category = categorySelect.value;

    if (!name) {
      this.showNotification('Nome do hábito é obrigatório', 'error');
      return;
    }

    const habitData: CreateHabitDto = {
      name,
      description: description || undefined,
      category
    };

    if (this.currentEditingHabit) {
      await this.updateHabit(this.currentEditingHabit.id, habitData);
    } else {
      await this.createHabit(habitData);
    }

    this.closeModal();
  }

  // Public Methods (called from HTML onclick)
  public async toggleHabit(id: number): Promise<void> {
    const habit = this.habits.find(h => h.id === id);
    if (!habit) return;
    
    const newCompletedToday = !habit.completedToday;

    try {
      const response = await fetch(`${this.API_BASE_URL}/hobbies/${id}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: newCompletedToday })
      });

      if (!response.ok) throw new Error('Falha ao atualizar status do hábito');

      const updatedHabit = await response.json();
      const index = this.habits.findIndex(h => h.id === id);
      if (index !== -1) {
        this.habits[index] = updatedHabit;
      }

      // Add success animation
      const card = document.querySelector(`[data-habit-id="${id}"]`);
      if (card) {
        card.classList.add('success-animation');
        setTimeout(() => card.classList.remove('success-animation'), 600);
      }
      
      this.renderHabits();
      this.updateStats();
      
      const message = updatedHabit.completedToday ? 'Parabéns! Hábito concluído! 🎉' : 'Hábito desmarcado';
      this.showNotification(message, updatedHabit.completedToday ? 'success' : 'info');
    } catch (error) {
      console.error('Erro ao alternar status do hábito:', error);
      this.showNotification('Erro ao alternar status do hábito', 'error');
    }
  }

  public editHabit(id: number): void {
    const habit = this.habits.find(h => h.id === id);
    if (habit) {
      this.openModal(habit);
    }
  }

  public async deleteHabitById(id: number): Promise<void> {
    await this.deleteHabit(id);
  }

  public async pauseOffensive(id: number): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/offensives/${id}/pause`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error('Falha ao pausar ofensiva');

      const updatedOffensive = await response.json();
      const index = this.offensives.findIndex(o => o.id === id);
      if (index !== -1) {
        this.offensives[index] = updatedOffensive;
        this.renderOffensives();
        this.showNotification('Ofensiva pausada com sucesso! ⏸️', 'success');
      }
    } catch (error) {
      console.error('Erro ao pausar ofensiva:', error);
      this.showNotification('Erro ao pausar ofensiva', 'error');
    }
  }

  public async completeOffensive(id: number): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/offensives/${id}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error('Falha ao completar ofensiva');

      const updatedOffensive = await response.json();
      const index = this.offensives.findIndex(o => o.id === id);
      if (index !== -1) {
        this.offensives[index] = updatedOffensive;
        this.renderOffensives();
        this.showNotification('Ofensiva completada com sucesso! 🎉', 'success');
      }
    } catch (error) {
      console.error('Erro ao completar ofensiva:', error);
      this.showNotification('Erro ao completar ofensiva', 'error');
    }
  }

  // Utility Methods
  private getCategoryIcon(category: string): string {
    const icons = {
      saude: '🏥',
      exercicio: '💪',
      estudo: '📚',
      trabalho: '💼',
      lazer: '🎮',
      outros: '⭐'
    };
    return icons[category as keyof typeof icons] || '⭐';
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const notification = document.createElement('div');
    
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      info: '#3b82f6'
    };
    
    notification.style.cssText = `
      position: fixed;
      top: 2rem;
      right: 2rem;
      padding: 1rem 1.5rem;
      background: ${colors[type]};
      color: white;
      border-radius: 12px;
      font-weight: 600;
      z-index: 2000;
      animation: slideInRight 0.3s ease;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      max-width: 300px;
    `;
    
    notification.textContent = message;
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    
    if (!document.head.querySelector('style[data-notifications]')) {
      style.setAttribute('data-notifications', 'true');
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}

// Initialize the app
const app = new AlmanacApp();

// Make app available globally for onclick handlers
(window as any).app = app;
