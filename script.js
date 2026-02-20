const genericQuotes = [
    "Become a high-quality cucumber.", 
    "Future you says thanks.", 
    "Executive function: ENGAGED.", 
    "Calm the internal vibrating.",
    "Dopamine pending...",
    "Go get 'em."
];

let habits = JSON.parse(localStorage.getItem('myHabits')) || [
    { id: 1, title: "Hydrate", quote: "Become a high-quality cucumber.", icon: "droplets", done: false },
    { id: 2, title: "Teeth Bones", quote: "Brush 'em like you mean it.", icon: "sparkles", done: false },
    { id: 3, title: "Movement", quote: "Calm the internal vibrating.", icon: "zap", done: false }
];

let xp = parseInt(localStorage.getItem('myXP')) || 0;
let lvl = parseInt(localStorage.getItem('myLVL')) || 1;
let streak = parseInt(localStorage.getItem('myStreak')) || 0;
let history = JSON.parse(localStorage.getItem('myHistory')) || []; 
let currentVibes = JSON.parse(localStorage.getItem('currentVibes')) || { mood: 'none', energy: 'none' };
let timerInterval = null;
let timeLeft = 300;
let historyChart = null;
let habitToDelete = null;

const moodColors = { slay: '#FAD0C4', meh: '#D1D9E0', chaos: '#A2D2FF', gremlin: '#BDB2FF', none: '#E6E1E8' };
const moodValues = { slay: 4, meh: 3, chaos: 2, gremlin: 1, none: 0 };

function playDing(freq = 880) {
    try {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.frequency.setValueAtTime(freq, context.currentTime);
        gain.gain.setValueAtTime(0.1, context.currentTime);
        osc.connect(gain); gain.connect(context.destination);
        osc.start(); osc.stop(context.currentTime + 0.1);
    } catch(e) {}
}

function setMood(value, btn) {
    currentVibes.mood = value;
    document.body.style.backgroundColor = moodColors[value];
    document.querySelectorAll('[data-mood]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    save();
}

function setEnergy(value, btn) {
    currentVibes.energy = value;
    document.querySelectorAll('[data-energy]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    save();
}

function openResetModal() { document.getElementById('resetModal').style.display = 'flex'; }
function closeResetModal() { document.getElementById('resetModal').style.display = 'none'; }

function openDeleteModal(id) {
    habitToDelete = id;
    document.getElementById('deleteModal').style.display = 'flex';
    document.getElementById('confirmDeleteBtn').onclick = () => {
        deleteHabit(habitToDelete);
        closeDeleteModal();
    };
}
function closeDeleteModal() { document.getElementById('deleteModal').style.display = 'none'; }

function confirmReset() {
    streak++;
    const entryLabel = `#${history.length + 1}`;
    history.push({ label: entryLabel, mood: moodValues[currentVibes.mood] });
    if (history.length > 7) history.shift();
    habits.forEach(h => h.done = false);
    resetTimer();
    save(); render(); updateXP(); drawHistoryChart();
    closeResetModal(); playDing(660); 
}

function render() {
    const list = document.getElementById('habit-list');
    list.innerHTML = habits.map(h => `
        <div class="habit-card ${h.done ? 'completed' : ''}" onclick="toggleHabit(${h.id})">
            <div class="icon-box" style="background: ${h.done ? 'var(--primary-purple)' : 'var(--primary-blue)'}">
                <i data-lucide="${h.icon || 'star'}" style="width:20px"></i>
            </div>
            <div class="habit-info">
                <h3>${h.title}</h3>
                <p>"${h.quote}"</p>
            </div>
            <button class="delete-btn" onclick="event.stopPropagation(); openDeleteModal(${h.id})">
                <i data-lucide="trash-2" style="width:16px"></i>
            </button>
        </div>
    `).join('');
    lucide.createIcons();
}

function addHabit() {
    const input = document.getElementById('habit-input');
    if (!input.value.trim()) return;
    habits.push({ id: Date.now(), title: input.value, quote: genericQuotes[Math.floor(Math.random() * genericQuotes.length)], icon: "star", done: false });
    input.value = ""; render(); save();
}

function deleteHabit(id) { 
    habits = habits.filter(h => h.id !== id); 
    render(); save(); 
}

function toggleHabit(id) {
    const h = habits.find(x => x.id === id);
    if (!h.done) { xp += 20; playDing(880); if (xp >= 100) { xp = 0; lvl++; } }
    else { xp -= 20; if (xp < 0) { if (lvl > 1) { lvl--; xp = 80; } else { xp = 0; } } }
    h.done = !h.done;
    updateXP(); render(); save();
}

function updateXP() {
    document.getElementById('xp-bar').style.width = xp + "%";
    document.getElementById('lvl').innerText = lvl;
    document.getElementById('streak-count').innerText = streak;
}

function save() {
    localStorage.setItem('myHabits', JSON.stringify(habits));
    localStorage.setItem('myXP', xp); 
    localStorage.setItem('myLVL', lvl);
    localStorage.setItem('myStreak', streak);
    localStorage.setItem('myHistory', JSON.stringify(history));
    localStorage.setItem('currentVibes', JSON.stringify(currentVibes));
}

function drawHistoryChart() {
    const ctx = document.getElementById('historyChart').getContext('2d');
    if (historyChart) historyChart.destroy();
    historyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: history.map(h => h.label),
            datasets: [{ 
                label: 'Mood', 
                data: history.map(h => h.mood), 
                borderColor: '#9B5DE5', 
                borderWidth: 4, 
                pointRadius: 5, 
                tension: 0.3, 
                fill: false 
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: { top: 10, bottom: 5 } },
            scales: { 
                y: { 
                    min: 0, 
                    max: 4.5, // Buffer so high moods aren't cut off
                    ticks: { display: false }, 
                    grid: { display: false } 
                }, 
                x: { grid: { display: false } } 
            },
            plugins: { legend: { display: false } }
        }
    });
}

function toggleTimer() {
    const btn = document.getElementById('timer-btn');
    if (timerInterval) {
        clearInterval(timerInterval); timerInterval = null;
        btn.innerText = "RESUME SESSION";
    } else {
        btn.innerText = "PAUSE";
        timerInterval = setInterval(() => {
            timeLeft--; updateTimerDisplay();
            if (timeLeft <= 0) {
                clearInterval(timerInterval); timerInterval = null;
                xp += 50; if (xp >= 100) { xp -= 100; lvl++; }
                playDing(1200); updateXP(); save();
            }
        }, 1000);
    }
}

function resetTimer() {
    clearInterval(timerInterval); timerInterval = null;
    timeLeft = 300; updateTimerDisplay();
    document.getElementById('timer-btn').innerText = "START SESSION";
}

function updateTimerDisplay() {
    const m = Math.floor(timeLeft / 60); const s = timeLeft % 60;
    document.getElementById('timer').innerText = `${m}:${s < 10 ? '0'+s : s}`;
}

// Initial Call
render(); updateXP(); drawHistoryChart();