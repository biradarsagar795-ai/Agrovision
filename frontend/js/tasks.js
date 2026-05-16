/**
 * FarmGuard — Task Scheduler Module
 */
function initTasks() {
  // Initialization logic if needed
}

function filterTasks(cat, btn) {
  document.querySelectorAll('.task-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  
  const tasks = document.querySelectorAll('.task-card:not(.done)');
  tasks.forEach(t => {
    if (cat === 'all' || t.dataset.cat === cat) {
      t.style.display = 'flex';
    } else {
      t.style.display = 'none';
    }
  });
}

async function markDone(id, btn) {
  const card = btn.closest('.task-card');
  card.classList.add('marking-done');
  
  try {
    // API call would go here
    // await apiFetch(`/tasks/${id}`, { method: 'PATCH', body: { status: 'completed' } });
  } catch (e) {
    console.log('Demo mode: task completed');
  }

  setTimeout(() => {
    const title = card.querySelector('h4').textContent;
    const priority = card.querySelector('.task-priority').className;
    
    // Add to completed list
    const compList = document.getElementById('completedList');
    const newCard = document.createElement('div');
    newCard.className = 'task-card glass done';
    newCard.innerHTML = `
      <div class="${priority}"></div>
      <div class="task-body">
        <h4 class="done-text">${title}</h4>
        <span class="done-date">Completed Just now</span>
      </div>
      <span class="done-check">✅</span>
    `;
    compList.insertBefore(newCard, compList.firstChild);
    
    // Remove original and update counts
    card.remove();
    updateProgress();
    showToast('Task completed! Great job! 🌟', 'success');
  }, 400);
}

function updateProgress() {
  const total = document.querySelectorAll('.task-card').length;
  const done = document.querySelectorAll('.task-card.done').length;
  const pct = total === 0 ? 100 : Math.round((done / total) * 100);
  
  document.getElementById('progressText').textContent = `${done} / ${total} completed`;
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('completedCount').textContent = done;
}

function openAddTask() {
  const modal = document.getElementById('addTaskModal');
  modal.classList.add('visible');
  document.getElementById('newTaskDate').valueAsDate = new Date();
}

function closeAddTask() {
  document.getElementById('addTaskModal').classList.remove('visible');
  document.getElementById('addTaskForm').reset();
}

function submitTask(e) {
  e.preventDefault();
  const name = document.getElementById('newTaskName').value;
  const cat = document.getElementById('newTaskCat').value;
  const date = document.getElementById('newTaskDate').value;
  
  const list = document.getElementById('taskList');
  const id = 't' + Date.now();
  
  const badges = {
    spraying: '<span class="task-badge badge-spray">Spraying</span>',
    ploughing: '<span class="task-badge badge-plough">Ploughing</span>',
    maintenance: '<span class="task-badge badge-maint">Maintenance</span>'
  };

  const newCard = document.createElement('div');
  newCard.className = 'task-card glass';
  newCard.dataset.cat = cat;
  newCard.dataset.id = id;
  newCard.innerHTML = `
    <div class="task-priority priority-amber"></div>
    <div class="task-body">
      <div class="task-top">
        <h4>${name}</h4>
        ${badges[cat] || ''}
      </div>
      <div class="task-details">
        <span class="task-due">📅 Due: ${date}</span>
      </div>
    </div>
    <button class="task-done-btn" onclick="markDone('${id}',this)" title="Mark as done">
      <span class="checkmark">✓</span>
    </button>
  `;
  
  list.appendChild(newCard);
  closeAddTask();
  updateProgress();
  showToast('New task added successfully', 'success');
  
  // Refresh filter
  const activeTab = document.querySelector('.task-tab.active');
  if(activeTab) filterTasks(activeTab.textContent.toLowerCase().includes('all') ? 'all' : cat, activeTab);
}
