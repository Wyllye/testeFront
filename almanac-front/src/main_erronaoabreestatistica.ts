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

  private setupTabNavigation(): void {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
        if (tabName) this.showTab(tabName);
      });
    });
  }

  // Data Loading
  private async loadInitialData(): Promise<void> {
    this.showLoading();
    try {
      await Promise.all([
        this.loadHabits(),
        this.loadStatistics(),
        this.loadOffensives()
      ]);
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
    if (statsStreak) statsStreak.textContent = `${this.statistics.currentStreak} dias`;
    if (statsAchievements) statsAchievements.textContent = this.statistics.achievements.toString();

    // Render weekly progress chart
    const weeklyCtx = (document.getElementById('weekly-progress-chart') as HTMLCanvasElement)?.getContext('2d');
    if (weeklyCtx) {
      new (window as any).Chart(weeklyCtx, {
        type: 'bar',
        data: {
          labels: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
          datasets: [{
            label: 'Hábitos Concluídos',
            data: this.statistics.weeklyProgress,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          }
        }
      });
    }

    // Render category stats chart
    const categoryCtx = (document.getElementById('category-stats-chart') as HTMLCanvasElement)?.getContext('2d');
    if (categoryCtx) {
      const categoryLabels = Object.keys(this.statistics.categoryStats);
      const categoryData = Object.values(this.statistics.categoryStats);

      new (window as any).Chart(categoryCtx, {
        type: 'doughnut',
        data: {
          labels: categoryLabels,
          datasets: [{
            data: categoryData,
            backgroundColor: [
              '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
            ]
          }]
        }
      });
    }
  }

  private renderOffensives(): void {
    const activeOffensivesList = document.getElementById('active-offensives');
    const offensiveHistoryList = document.getElementById('offensive-history');

    if (!activeOffensivesList || !offensiveHistoryList) return;

    const activeOffensives = this.offensives.filter(o => o.status === 'active');
    const pastOffensives = this.offensives.filter(o => o.status !== 'active');

    activeOffensivesList.innerHTML = activeOffensives.length > 0 ? activeOffensives.map(this.createOffensiveCard).join('') : '<p>Nenhuma ofensiva ativa.</p>';
    offensiveHistoryList.innerHTML = pastOffensives.length > 0 ? pastOffensives.map(this.createOffensiveCard).join('') : '<p>Nenhuma ofensiva no histórico.</p>';
  }

  private createOffensiveCard(offensive: Offensive): string {
    return `
      <div class="offensive-card ${offensive.status}">
        <h4>${this.escapeHtml(offensive.name)}</h4>
        <p>${this.escapeHtml(offensive.description)}</p>
        <p><strong>Status:</strong> ${offensive.status}</p>
        <p><strong>Progresso:</strong> ${offensive.progress.toFixed(1)}%</p>
        <div class="progress-bar-container">
          <div class="progress-bar" style="width: ${offensive.progress}%"></div>
        </div>
      </div>
    `;
  }

  private renderOffensiveForm(): void {
    const habitSelection = document.getElementById('offensive-habit-selection');
    if (!habitSelection) return;

    habitSelection.innerHTML = this.habits.map(habit => `
      <label>
        <input type="checkbox" name="offensive-habits" value="${habit.id}">
        ${this.escapeHtml(habit.name)}
      </label>
    `).join('');
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
      this.closeModal();
      this.showNotification('Hábito criado com sucesso!', 'success');
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
      }
      this.renderHabits();
      this.updateStats();
      this.closeModal();
      this.showNotification('Hábito atualizado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao atualizar hábito:', error);
      this.showNotification('Erro ao atualizar hábito', 'error');
    }
  }

  private async deleteHabit(id: number): Promise<void> {
    if (!confirm('Tem certeza que deseja excluir este hábito?')) return;

    try {
      const response = await fetch(`${this.API_BASE_URL}/hobbies/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Falha ao excluir hábito');

      this.habits = this.habits.filter(h => h.id !== id);
      this.renderHabits();
      this.updateStats();
      this.showNotification('Hábito excluído com sucesso', 'info');
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

    if (!nameInput.value || !durationInput.value || selectedHabits.length === 0) {
      this.showNotification('Preencha todos os campos obrigatórios da ofensiva', 'error');
      return;
    }

    const dto: CreateOffensiveDto = {
      name: nameInput.value,
      duration: parseInt(durationInput.value),
      description: descriptionInput.value,
      habits: selectedHabits
    };

    try {
      const response = await fetch(`${this.API_BASE_URL}/offensives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto)
      });

      if (!response.ok) throw new Error('Falha ao criar ofensiva');

      const newOffensive = await response.json();
      this.offensives.push(newOffensive);
      this.renderOffensives();
      this.showNotification('Ofensiva criada com sucesso!', 'success');
      // Reset form
      nameInput.value = '';
      durationInput.value = '';
      descriptionInput.value = '';
      document.querySelectorAll('input[name="offensive-habits"]:checked').forEach(input => (input as HTMLInputElement).checked = false);
    } catch (error) {
      console.error('Erro ao criar ofensiva:', error);
      this.showNotification('Erro ao criar ofensiva', 'error');
    }
  }

  // UI Interaction
  private openModal(habit?: Habit): void {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const nameInput = document.getElementById('habit-name') as HTMLInputElement;
    const descriptionInput = document.getElementById('habit-description') as HTMLTextAreaElement;
    const categoryInput = document.getElementById('habit-category') as HTMLSelectElement;
    const saveBtn = document.getElementById('save-btn');

    if (!modal || !modalTitle || !nameInput || !descriptionInput || !categoryInput || !saveBtn) return;

    this.currentEditingHabit = habit || null;

    modalTitle.textContent = habit ? 'Editar Hábito' : 'Novo Hábito';
    nameInput.value = habit ? habit.name : '';
    descriptionInput.value = habit ? habit.description || '' : '';
    categoryInput.value = habit ? habit.category : 'saude';
    saveBtn.textContent = habit ? 'Salvar Alterações' : 'Criar ✨';

    modal.classList.remove('hidden');
    document.getElementById('overlay')?.classList.remove('hidden');
    this.validateForm();
  }

  private closeModal(): void {
    const modal = document.getElementById('modal');
    modal?.classList.add('hidden');
    document.getElementById('overlay')?.classList.add('hidden');
    this.currentEditingHabit = null;
  }

  private async saveHabit(): Promise<void> {
    const nameInput = document.getElementById('habit-name') as HTMLInputElement;
    const descriptionInput = document.getElementById('habit-description') as HTMLTextAreaElement;
    const categoryInput = document.getElementById('habit-category') as HTMLSelectElement;

    const habitData = {
      name: nameInput.value,
      description: descriptionInput.value,
      category: categoryInput.value
    };

    if (this.currentEditingHabit) {
      await this.updateHabit(this.currentEditingHabit.id, habitData);
    } else {
      await this.createHabit(habitData);
    }
  }

  private validateForm(): void {
    const nameInput = document.getElementById('habit-name') as HTMLInputElement;
    const saveBtn = document.getElementById('save-btn') as HTMLButtonElement;
    if (nameInput && saveBtn) {
      saveBtn.disabled = !nameInput.value.trim();
    }
  }

  private showTab(tabName: string): void {
    this.currentTab = tabName;
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
      if (tab.id === `${tabName}-content`) {
        tab.classList.remove('hidden');
      } else {
        tab.classList.add('hidden');
      }
    });

    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
      if (button.getAttribute('data-tab') === tabName) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
  }

  private updateStats(): void {
    const totalHabits = this.habits.length;
    const completedToday = this.habits.filter(h => h.completedToday).length;
    const currentStreak = this.habits.reduce((max, h) => h.streak > max ? h.streak : max, 0);

    const totalHabitsEl = document.getElementById('total-habits-stat');
    const completedTodayEl = document.getElementById('completed-today-stat');
    const currentStreakEl = document.getElementById('current-streak-stat');

    if (totalHabitsEl) totalHabitsEl.textContent = totalHabits.toString();
    if (completedTodayEl) completedTodayEl.textContent = completedToday.toString();
    if (currentStreakEl) currentStreakEl.textContent = `${currentStreak} dias`;
  }

  private getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      saude: '🏥',
      exercicio: '💪',
      estudo: '📚',
      trabalho: '💼',
      lazer: '🎮',
      outros: '⭐'
    };
    return icons[category] || '⭐';
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Public methods for onclick handlers
  public async toggleHabit(id: number): Promise<void> {
    const habit = this.habits.find(h => h.id === id);
    if (!habit) return;

    const completed = !habit.completedToday;

    try {
      const response = await fetch(`${this.API_BASE_URL}/hobbies/${id}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed })
      });

      if (!response.ok) throw new Error('Falha ao marcar hábito');

      habit.completedToday = completed;
      // Recalcular streak
      await this.loadHabits(); // Recarrega para obter streak atualizado
      this.showNotification(`Hábito ${completed ? 'concluído' : 'desmarcado'}!`, 'success');
    } catch (error) {
      console.error('Erro ao marcar hábito:', error);
      this.showNotification('Erro ao marcar hábito', 'error');
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
    // Implementation for pausing offensive
    this.showNotification('Funcionalidade em desenvolvimento', 'info');
  }

  public async resumeOffensive(id: number): Promise<void> {
    // Implementation for resuming offensive
    this.showNotification('Funcionalidade em desenvolvimento', 'info');
  }

  // Utility
  private showLoading(): void {
    document.getElementById('loading-indicator')?.classList.remove('hidden');
  }

  private hideLoading(): void {
    document.getElementById('loading-indicator')?.classList.add('hidden');
  }

  private showNotification(message: string, type: 'info' | 'success' | 'error'): void {
    const notification = document.getElementById('notification');
    if (!notification) return;

    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.remove('hidden');

    setTimeout(() => {
      notification.classList.add('hidden');
    }, 3000);
  }
}

// Initialize the app
const app = new AlmanacApp();

// Make app available globally for onclick handlers
(window as any).app = app;

