/**
 * Project Management Dashboard
 * Main JavaScript functionality for task management, data visualization, and client presentation
 */

class ProjectDashboard {
    constructor() {
        this.tasks = [];
        this.projects = [];
        this.charts = {};
        this.filters = {
            status: '',
            priority: '',
            search: ''
        };
        
        this.init();
    }

    // Initialize the dashboard
    async init() {
        try {
            await this.loadData();
            this.setupEventListeners();
            this.renderDashboard();
            this.updateLastUpdated();
            this.startAutoRefresh();
        } catch (error) {
            console.error('Dashboard initialization failed:', error);
            this.showNotification('Failed to initialize dashboard', 'error');
        }
    }

    // Load data from API
    async loadData() {
        try {
            // Load tasks
            const tasksResponse = await fetch('tables/tasks?limit=1000');
            const tasksData = await tasksResponse.json();
            this.tasks = tasksData.data || [];

            // Load projects
            const projectsResponse = await fetch('tables/projects?limit=100');
            const projectsData = await projectsResponse.json();
            this.projects = projectsData.data || [];

            console.log('Data loaded successfully:', {
                tasks: this.tasks.length,
                projects: this.projects.length
            });
        } catch (error) {
            console.error('Failed to load data:', error);
            throw error;
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Refresh button
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.refreshData();
        });

        // Task form submission
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTaskSubmission();
        });

        // Search and filters
        document.getElementById('searchTasks').addEventListener('input', (e) => {
            this.filters.search = e.target.value;
            this.applyFilters();
        });

        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.filters.status = e.target.value;
            this.applyFilters();
        });

        document.getElementById('priorityFilter').addEventListener('change', (e) => {
            this.filters.priority = e.target.value;
            this.applyFilters();
        });

        // Modal close
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });

        // Close modal on background click
        document.getElementById('taskModal').addEventListener('click', (e) => {
            if (e.target.id === 'taskModal') {
                this.closeModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    // Render the complete dashboard
    renderDashboard() {
        this.renderProjectInfo();
        this.renderStatistics();
        this.renderCharts();
        this.renderTasks();
    }

    // Render project information
    renderProjectInfo() {
        const project = this.projects[0]; // Assuming first project is current
        if (project) {
            document.getElementById('projectName').textContent = project.project_name || 'No Project Selected';
            document.getElementById('clientName').textContent = project.client_name || 'Unknown Client';
            
            const startDate = new Date(project.start_date).toLocaleDateString();
            const endDate = new Date(project.end_date).toLocaleDateString();
            document.getElementById('projectTimeline').textContent = `${startDate} - ${endDate}`;
            
            document.getElementById('projectStatus').textContent = this.capitalizeFirst(project.status || 'Unknown');
            document.getElementById('projectStatus').className = `font-semibold status-${project.status}`;
        }
    }

    // Render statistics
    renderStatistics() {
        const totalTasks = this.tasks.filter(task => task.client_visible).length;
        const completedTasks = this.tasks.filter(task => task.status === 'completed' && task.client_visible).length;
        const ongoingTasks = this.tasks.filter(task => task.status === 'ongoing' && task.client_visible).length;
        const pendingTasks = this.tasks.filter(task => task.status === 'pending' && task.client_visible).length;

        document.getElementById('totalTasks').textContent = totalTasks;
        document.getElementById('completedTasks').textContent = completedTasks;
        document.getElementById('ongoingTasks').textContent = ongoingTasks;
        document.getElementById('pendingTasks').textContent = pendingTasks;
    }

    // Render charts
    renderCharts() {
        this.renderStatusChart();
        this.renderPriorityChart();
    }

    // Render status distribution chart
    renderStatusChart() {
        const ctx = document.getElementById('statusChart').getContext('2d');
        
        if (this.charts.statusChart) {
            this.charts.statusChart.destroy();
        }

        const clientVisibleTasks = this.tasks.filter(task => task.client_visible);
        const statusCounts = {
            completed: clientVisibleTasks.filter(t => t.status === 'completed').length,
            ongoing: clientVisibleTasks.filter(t => t.status === 'ongoing').length,
            pending: clientVisibleTasks.filter(t => t.status === 'pending').length
        };

        this.charts.statusChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Ongoing', 'Pending'],
                datasets: [{
                    data: [statusCounts.completed, statusCounts.ongoing, statusCounts.pending],
                    backgroundColor: ['#10b981', '#3b82f6', '#6b7280'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    // Render priority distribution chart
    renderPriorityChart() {
        const ctx = document.getElementById('priorityChart').getContext('2d');
        
        if (this.charts.priorityChart) {
            this.charts.priorityChart.destroy();
        }

        const clientVisibleTasks = this.tasks.filter(task => task.client_visible);
        const priorityCounts = {
            critical: clientVisibleTasks.filter(t => t.priority === 'critical').length,
            high: clientVisibleTasks.filter(t => t.priority === 'high').length,
            medium: clientVisibleTasks.filter(t => t.priority === 'medium').length,
            low: clientVisibleTasks.filter(t => t.priority === 'low').length
        };

        this.charts.priorityChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Critical', 'High', 'Medium', 'Low'],
                datasets: [{
                    label: 'Number of Tasks',
                    data: [priorityCounts.critical, priorityCounts.high, priorityCounts.medium, priorityCounts.low],
                    backgroundColor: ['#dc2626', '#f97316', '#eab308', '#22c55e'],
                    borderColor: ['#b91c1c', '#ea580c', '#ca8a04', '#16a34a'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
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

    // Render task lists
    renderTasks() {
        const filteredTasks = this.getFilteredTasks();
        
        this.renderTaskList('ongoingTasksList', filteredTasks.filter(t => t.status === 'ongoing'));
        this.renderTaskList('pendingTasksList', filteredTasks.filter(t => t.status === 'pending'));
        this.renderTaskList('completedTasksList', filteredTasks.filter(t => t.status === 'completed'));
    }

    // Render individual task list
    renderTaskList(containerId, tasks) {
        const container = document.getElementById(containerId);
        
        if (tasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tasks"></i>
                    <p>No tasks found</p>
                </div>
            `;
            return;
        }

        container.innerHTML = tasks.map(task => this.createTaskCard(task)).join('');
    }

    // Create task card HTML
    createTaskCard(task) {
        const dueDate = new Date(task.due_date);
        const now = new Date();
        const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
        
        let deadlineClass = 'deadline-future';
        if (daysUntilDue < 0) {
            deadlineClass = 'deadline-overdue';
        } else if (daysUntilDue <= 3) {
            deadlineClass = 'deadline-due-soon';
        }

        return `
            <div class="task-card p-6 cursor-pointer hover-lift" onclick="dashboard.showTaskDetails('${task.id}')">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex-1">
                        <h4 class="text-lg font-semibold text-gray-900 mb-1">${task.task_name}</h4>
                        <p class="text-gray-600 text-sm line-clamp-2">${task.description || 'No description'}</p>
                    </div>
                    <div class="ml-4 flex flex-col items-end space-y-2">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium priority-${task.priority}">
                            ${this.capitalizeFirst(task.priority)}
                        </span>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium category-${task.category}">
                            ${this.capitalizeFirst(task.category)}
                        </span>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4 mb-3 text-sm text-gray-600">
                    <div class="flex items-center">
                        <i class="fas fa-user mr-2"></i>
                        <span>${task.assignee}</span>
                    </div>
                    <div class="flex items-center ${deadlineClass}">
                        <i class="fas fa-calendar mr-2"></i>
                        <span>${dueDate.toLocaleDateString()}</span>
                        ${daysUntilDue < 0 ? '<span class="ml-1 text-red-600 font-medium">(Overdue)</span>' : ''}
                        ${daysUntilDue >= 0 && daysUntilDue <= 3 ? '<span class="ml-1 text-yellow-600 font-medium">(Due Soon)</span>' : ''}
                    </div>
                </div>

                ${task.status !== 'completed' ? `
                    <div class="mb-3">
                        <div class="flex items-center justify-between text-sm text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>${task.progress || 0}%</span>
                        </div>
                        <div class="progress-bar h-2">
                            <div class="progress-fill" style="width: ${task.progress || 0}%"></div>
                        </div>
                    </div>
                ` : ''}

                <div class="flex items-center justify-between">
                    <div class="text-sm text-gray-500">
                        ${task.estimated_hours ? `Est: ${task.estimated_hours}h` : ''}
                        ${task.actual_hours ? ` | Actual: ${task.actual_hours}h` : ''}
                    </div>
                    <div class="flex space-x-2">
                        ${task.status !== 'completed' ? `
                            <button onclick="event.stopPropagation(); dashboard.markTaskCompleted('${task.id}')" 
                                    class="text-green-600 hover:text-green-800 text-sm">
                                <i class="fas fa-check-circle"></i>
                            </button>
                        ` : ''}
                        <button onclick="event.stopPropagation(); dashboard.editTask('${task.id}')" 
                                class="text-blue-600 hover:text-blue-800 text-sm">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="event.stopPropagation(); dashboard.deleteTask('${task.id}')" 
                                class="text-red-600 hover:text-red-800 text-sm">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Show task details in modal
    showTaskDetails(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        const dueDate = new Date(task.due_date);
        const now = new Date();
        const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

        const modalContent = document.getElementById('modalContent');
        modalContent.innerHTML = `
            <div class="space-y-4">
                <div>
                    <h4 class="text-lg font-semibold text-gray-900">${task.task_name}</h4>
                    <p class="text-gray-600 mt-2">${task.description || 'No description available'}</p>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-500">Assignee</label>
                        <p class="text-gray-900">${task.assignee}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-500">Due Date</label>
                        <p class="text-gray-900">
                            ${dueDate.toLocaleDateString()}
                            ${daysUntilDue < 0 ? '<span class="text-red-600 ml-1">(Overdue)</span>' : ''}
                        </p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-500">Priority</label>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium priority-${task.priority}">
                            ${this.capitalizeFirst(task.priority)}
                        </span>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-500">Category</label>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium category-${task.category}">
                            ${this.capitalizeFirst(task.category)}
                        </span>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-500">Status</label>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium status-${task.status}">
                            ${this.capitalizeFirst(task.status)}
                        </span>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-500">Progress</label>
                        <p class="text-gray-900">${task.progress || 0}%</p>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-500">Estimated Hours</label>
                        <p class="text-gray-900">${task.estimated_hours || 'Not set'}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-500">Actual Hours</label>
                        <p class="text-gray-900">${task.actual_hours || 0}</p>
                    </div>
                </div>

                <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    ${task.status !== 'completed' ? `
                        <button onclick="dashboard.markTaskCompleted('${task.id}')" 
                                class="btn-success">
                            <i class="fas fa-check mr-2"></i>Mark Complete
                        </button>
                    ` : ''}
                    <button onclick="dashboard.editTask('${task.id}')" 
                            class="btn-primary">
                        <i class="fas fa-edit mr-2"></i>Edit Task
                    </button>
                    <button onclick="dashboard.deleteTask('${task.id}')" 
                            class="btn-danger">
                        <i class="fas fa-trash mr-2"></i>Delete Task
                    </button>
                </div>
            </div>
        `;

        this.showModal();
    }

    // Handle task form submission
    async handleTaskSubmission() {
        try {
            const formData = {
                task_name: document.getElementById('taskName').value,
                description: document.getElementById('taskDescription').value,
                assignee: document.getElementById('taskAssignee').value,
                due_date: document.getElementById('taskDueDate').value,
                priority: document.getElementById('taskPriority').value,
                category: document.getElementById('taskCategory').value,
                estimated_hours: parseFloat(document.getElementById('taskEstimatedHours').value) || 0,
                client_visible: document.getElementById('taskClientVisible').checked,
                status: 'pending',
                progress: 0,
                actual_hours: 0
            };

            const response = await fetch('tables/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const newTask = await response.json();
                this.tasks.push(newTask);
                
                // Reset form
                document.getElementById('taskForm').reset();
                document.getElementById('taskClientVisible').checked = true;
                
                // Refresh dashboard
                this.renderDashboard();
                this.showNotification('Task created successfully!', 'success');
            } else {
                throw new Error('Failed to create task');
            }
        } catch (error) {
            console.error('Task creation failed:', error);
            this.showNotification('Failed to create task', 'error');
        }
    }

    // Mark task as completed
    async markTaskCompleted(taskId) {
        try {
            const response = await fetch(`tables/tasks/${taskId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: 'completed',
                    progress: 100
                })
            });

            if (response.ok) {
                const updatedTask = await response.json();
                const taskIndex = this.tasks.findIndex(t => t.id === taskId);
                if (taskIndex !== -1) {
                    this.tasks[taskIndex] = updatedTask;
                }
                
                this.renderDashboard();
                this.closeModal();
                this.showNotification('Task marked as completed!', 'success');
            } else {
                throw new Error('Failed to update task');
            }
        } catch (error) {
            console.error('Task update failed:', error);
            this.showNotification('Failed to update task', 'error');
        }
    }

    // Delete task
    async deleteTask(taskId) {
        if (!confirm('Are you sure you want to delete this task?')) {
            return;
        }

        try {
            const response = await fetch(`tables/tasks/${taskId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.tasks = this.tasks.filter(t => t.id !== taskId);
                this.renderDashboard();
                this.closeModal();
                this.showNotification('Task deleted successfully!', 'success');
            } else {
                throw new Error('Failed to delete task');
            }
        } catch (error) {
            console.error('Task deletion failed:', error);
            this.showNotification('Failed to delete task', 'error');
        }
    }

    // Edit task (simplified version - could be expanded to show edit form)
    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        // For now, just populate the add form with task data
        document.getElementById('taskName').value = task.task_name;
        document.getElementById('taskDescription').value = task.description || '';
        document.getElementById('taskAssignee').value = task.assignee;
        document.getElementById('taskDueDate').value = task.due_date.split('T')[0]; // Format for date input
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskCategory').value = task.category;
        document.getElementById('taskEstimatedHours').value = task.estimated_hours || '';
        document.getElementById('taskClientVisible').checked = task.client_visible;

        this.closeModal();
        this.showNotification('Task data loaded in form. Update and submit to save changes.', 'info');
        
        // Scroll to form
        document.getElementById('taskForm').scrollIntoView({ behavior: 'smooth' });
    }

    // Apply filters to task list
    applyFilters() {
        this.renderTasks();
    }

    // Get filtered tasks based on current filters
    getFilteredTasks() {
        return this.tasks.filter(task => {
            // Only show client-visible tasks by default
            if (!task.client_visible) return false;

            // Status filter
            if (this.filters.status && task.status !== this.filters.status) {
                return false;
            }

            // Priority filter
            if (this.filters.priority && task.priority !== this.filters.priority) {
                return false;
            }

            // Search filter
            if (this.filters.search) {
                const searchTerm = this.filters.search.toLowerCase();
                return task.task_name.toLowerCase().includes(searchTerm) ||
                       task.description?.toLowerCase().includes(searchTerm) ||
                       task.assignee.toLowerCase().includes(searchTerm);
            }

            return true;
        });
    }

    // Refresh data from server
    async refreshData() {
        try {
            this.showNotification('Refreshing data...', 'info');
            await this.loadData();
            this.renderDashboard();
            this.updateLastUpdated();
            this.showNotification('Data refreshed successfully!', 'success');
        } catch (error) {
            console.error('Refresh failed:', error);
            this.showNotification('Failed to refresh data', 'error');
        }
    }

    // Show modal
    showModal() {
        const modal = document.getElementById('taskModal');
        modal.classList.remove('hidden');
        modal.querySelector('.bg-white').classList.add('modal-enter');
    }

    // Close modal
    closeModal() {
        const modal = document.getElementById('taskModal');
        modal.classList.add('hidden');
    }

    // Show notification
    showNotification(message, type = 'info') {
        const container = document.getElementById('notifications');
        const notification = document.createElement('div');
        
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="flex items-center">
                <div class="flex-shrink-0">
                    <i class="fas ${this.getNotificationIcon(type)} text-lg"></i>
                </div>
                <div class="ml-3">
                    <p class="text-sm font-medium text-gray-800">${message}</p>
                </div>
                <div class="ml-auto pl-3">
                    <button onclick="this.parentElement.parentElement.remove()" 
                            class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;

        container.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // Get notification icon based on type
    getNotificationIcon(type) {
        switch (type) {
            case 'success': return 'fa-check-circle text-green-500';
            case 'error': return 'fa-exclamation-circle text-red-500';
            case 'warning': return 'fa-exclamation-triangle text-yellow-500';
            default: return 'fa-info-circle text-blue-500';
        }
    }

    // Update last updated timestamp
    updateLastUpdated() {
        const now = new Date();
        document.getElementById('lastUpdated').textContent = now.toLocaleTimeString();
    }

    // Start auto-refresh timer
    startAutoRefresh() {
        // Refresh every 5 minutes
        setInterval(() => {
            this.refreshData();
        }, 300000);
    }

    // Utility function to capitalize first letter
    capitalizeFirst(str) {
        return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
    }
}

// Initialize dashboard when DOM is loaded
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new ProjectDashboard();
});

// Export for global access
window.dashboard = dashboard;