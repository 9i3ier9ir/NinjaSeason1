const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const gamePanel = document.getElementById('gamePanel');
const storyPanel = document.getElementById('storyPanel');
const statusText = document.getElementById('statusText');
const currentLevelText = document.getElementById('currentLevel');
const currentWeaponText = document.getElementById('currentWeapon');
const kiBar = document.getElementById('kiBar');
const cutsceneTitle = document.getElementById('cutsceneTitle');
const cutsceneArt = document.getElementById('cutsceneArt');
const cutsceneText = document.getElementById('cutsceneText');
const cutsceneContinueButton = document.getElementById('cutsceneContinueButton');

const levels = [
  {
    id: 1,
    name: 'Bamboo Forest',
    sceneTitle: 'Echoes in the Bamboo',
    sceneText: 'The rain fell in sheets over the Valley of Whispers as Kaelen moved through the bamboo forest. His first trial was not against a blade, but against the pressure of destiny.',
    styleClass: 'bamboo',
    narrative: 'The rain lashes the Valley of Whispers. Kaelen moves through the bamboo forest, guarding the ancient secrets of the Obsidian Blade.',
    enemyCount: 2,
  },
  {
    id: 2,
    name: 'Frozen Peaks of Aethelgard',
    sceneTitle: 'The Spirit of Winter',
    sceneText: 'Above the frozen heights, the Spirit of Winter challenged Kaelen to become still. He learned that ice was not cold force, but patient silence.',
    styleClass: 'ice',
    narrative: 'The wind howls at the summit. Kaelen seeks the Spirit of Winter and learns the stillness needed to become ice itself.',
    enemyCount: 3,
  },
  {
    id: 3,
    name: 'Volcanic Caverns of Ignis',
    sceneTitle: 'The Heart of Fire',
    sceneText: 'Molten caverns roared around him. Kaelen embraced the consuming flame and reshaped his blade with the heat of his own resolve.',
    styleClass: 'fire',
    narrative: 'Heat and magma surround him. He embraces destruction and reshapes his blade into molten fire.',
    enemyCount: 4,
  },
  {
    id: 4,
    name: 'Stormy Isles of Tempest',
    sceneTitle: 'The Lightning Pact',
    sceneText: 'The storm screamed and lightning struck the island again and again. Kaelen became chaos itself, learning to move faster than fear.',
    styleClass: 'storm',
    narrative: 'Lightning strikes without warning. Kaelen becomes the chaos of the storm and unlocks the Prism Edge.',
    enemyCount: 5,
  },
  {
    id: 5,
    name: 'Valley of Whispers Final Battle',
    sceneTitle: 'The Warlord of Ash',
    sceneText: 'The Warlord of Ash descended with a horde of demons. Kaelen knew this was the true test of balance: to protect without becoming consumed.',
    styleClass: 'final',
    narrative: 'The Warlord of Ash arrives with a horde. Kaelen’s balance of wind, ice, fire and void will decide the fate of the world.',
    enemyCount: 6,
  },
];

const weapons = [
  { id: 0, name: 'Whisper', desc: 'A simple steel katana. Balanced but lacks spirit.', damage: 12 },
  { id: 1, name: 'Sword of the Azure Storm', desc: 'A crackling blue sword that channels wind.', damage: 18 },
  { id: 2, name: 'Ice Shard', desc: 'A pale blade chilled to absolute stillness.', damage: 22 },
  { id: 3, name: 'Blade of Embers', desc: 'A molten sword leaving trails of flame.', damage: 24 },
  { id: 4, name: 'Prism Edge', desc: 'A shifting element blade drawing from all four powers.', damage: 28 },
];

const items = [
  { name: 'Ki Elixir', desc: 'Restore 25 Ki when used.', uses: 2 },
  { name: 'Shadow Cloak', desc: 'Temporarily slow enemies and avoid damage.', uses: 1 },
];

let gameState = {
  levelIndex: 0,
  weaponIndex: 0,
  ki: 80,
  maxKi: 100,
  health: 100,
  enemiesRemaining: 0,
  manualMode: true,
  inPause: false,
};

const player = {
  x: 80,
  y: 220,
  width: 24,
  height: 32,
  speed: 2.6,
  attacking: false,
  attackTimer: 0,
};

const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
  w: false,
  a: false,
  s: false,
  d: false,
  ' ': false,
  e: false,
};

let enemies = [];
let effectParticles = [];
let cutsceneContinueAction = null;
let cutsceneTyping = false;
let cutsceneQueue = null;
let saveSlot = 'ninja-prism-edge-save';

function openMenu(menuId) {
  const menus = ['startMenu', 'weaponsMenu', 'itemsMenu', 'levelsMenu', 'creditsMenu', 'pauseMenu', 'cutsceneMenu'];
  menus.forEach(id => {
    document.getElementById(id).classList.toggle('hidden', id !== menuId);
  });
  overlay.classList.toggle('hidden', false);
  gameState.inPause = true;
}

function closeOverlay() {
  overlay.classList.add('hidden');
  gameState.inPause = false;
}

function typeCutsceneText(text, done) {
  cutsceneTyping = true;
  cutsceneText.textContent = '';
  cutsceneContinueButton.disabled = true;
  let index = 0;
  const interval = setInterval(() => {
    cutsceneText.textContent += text[index];
    index += 1;
    if (index >= text.length) {
      clearInterval(interval);
      cutsceneTyping = false;
      cutsceneContinueButton.disabled = false;
      if (typeof done === 'function') done();
    }
  }, 22);
  cutsceneQueue = {
    text,
    interval,
    index,
  };
}

function finishCutsceneText() {
  if (!cutsceneTyping || !cutsceneQueue) return;
  clearInterval(cutsceneQueue.interval);
  cutsceneText.textContent = cutsceneQueue.text;
  cutsceneTyping = false;
  cutsceneContinueButton.disabled = false;
}

function showCutscene(index) {
  const scene = levels[index];
  if (!scene) return;
  cutsceneTitle.textContent = scene.sceneTitle;
  cutsceneArt.className = `scene-art ${scene.styleClass}`;
  cutsceneContinueButton.textContent = 'Continue';
  openMenu('cutsceneMenu');
  typeCutsceneText(scene.sceneText, () => {
    cutsceneContinueButton.textContent = 'Continue';
  });
  cutsceneContinueAction = () => {
    closeOverlay();
    gameState.inPause = false;
    loadLevel(index);
  };
}

function showVictory() {
  cutsceneTitle.textContent = 'The Balance is Restored';
  cutsceneArt.className = 'scene-art final';
  cutsceneContinueButton.textContent = 'Main Menu';
  openMenu('cutsceneMenu');
  typeCutsceneText('Kaelen returned to the Valley of Whispers as a guardian of harmony. The Prism Edge sleeps with quiet promise, held by a warrior who knows true balance.', null);
  cutsceneContinueAction = () => {
    gamePanel.classList.remove('active');
    openMenu('startMenu');
    gameState.inPause = false;
  };
}

function cutsceneContinue() {
  if (cutsceneTyping) {
    finishCutsceneText();
    return;
  }
  if (typeof cutsceneContinueAction === 'function') {
    cutsceneContinueAction();
  }
}

function startGame() {
  gameState.levelIndex = 0;
  gameState.weaponIndex = 0;
  gameState.ki = 80;
  gameState.health = 100;
  gamePanel.classList.add('active');
  updateHud();
  showCutscene(0);
}

function pauseGame() {
  if (!gamePanel.classList.contains('active')) return;
  gameState.inPause = true;
  openMenu('pauseMenu');
}

function resumeGame() {
  closeOverlay();
}

function switchMenu(menuId) {
  openMenu(menuId);
}

function populateMenu() {
  const weaponList = document.getElementById('weaponList');
  weaponList.innerHTML = weapons.map(w => `<div class="item-card"><h3>${w.name}</h3><p>${w.desc}</p></div>`).join('');
  const itemList = document.getElementById('itemList');
  itemList.innerHTML = items.map(i => `<div class="item-card"><h3>${i.name}</h3><p>${i.desc} (Uses: ${i.uses})</p></div>`).join('');
  const levelList = document.getElementById('levelList');
  levelList.innerHTML = levels.map(l => `<div class="item-card"><h3>Level ${l.id}: ${l.name}</h3><p>${l.narrative}</p></div>`).join('');
}

function loadLevel(index) {
  const level = levels[index];
  if (!level) return;
  gameState.levelIndex = index;
  gameState.enemiesRemaining = level.enemyCount;
  player.x = 80;
  player.y = 220;
  enemies = [];
  const enemyColor = level.styleClass === 'ice' ? '#9ce8ff' : level.styleClass === 'fire' ? '#ff9a53' : level.styleClass === 'storm' ? '#91e8ff' : '#ff6c78';
  for (let i = 0; i < level.enemyCount; i += 1) {
    enemies.push({
      x: 520 + (i % 3) * 80,
      y: 120 + Math.floor(i / 3) * 90,
      width: 24,
      height: 28,
      color: enemyColor,
      health: 30 + level.id * 12,
      alive: true,
      vx: Math.random() * 0.8 + 0.4,
      vy: Math.random() * 0.4 + 0.2,
      offset: Math.random() * Math.PI * 2,
    });
  }
  storyPanel.textContent = `${level.name}: ${level.narrative}`;
  updateHud();
  createLevelEffects(level.styleClass);
}

function updateHud() {
  currentLevelText.textContent = `Level: ${levels[gameState.levelIndex].name}`;
  currentWeaponText.textContent = `Weapon: ${weapons[gameState.weaponIndex].name}`;
  kiBar.textContent = `Ki: ${Math.floor(gameState.ki)} / ${gameState.maxKi}`;
  statusText.textContent = gameState.health > 0 ? `Enemies remaining: ${gameState.enemiesRemaining}` : 'Defeated. Load or restart to continue.';
}

function attack() {
  if (player.attacking || gameState.inPause) return;
  player.attacking = true;
  player.attackTimer = 12;
  const damage = weapons[gameState.weaponIndex].damage;
  enemies.forEach(enemy => {
    if (!enemy.alive) return;
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 90) {
      enemy.health -= damage;
      enemy.color = '#ffd166';
      if (enemy.health <= 0) {
        enemy.alive = false;
        gameState.enemiesRemaining -= 1;
        if (gameState.enemiesRemaining === 0) {
          advanceLevel();
        }
      }
    }
  });
}

function advanceLevel() {
  if (gameState.levelIndex >= levels.length - 1) {
    showVictory();
    return;
  }
  gameState.levelIndex += 1;
  if (gameState.levelIndex > gameState.weaponIndex) {
    gameState.weaponIndex = gameState.levelIndex;
    statusText.textContent = `You unlocked ${weapons[gameState.weaponIndex].name}!`;
  }
  showCutscene(gameState.levelIndex);
}

function saveGame() {
  const state = {
    levelIndex: gameState.levelIndex,
    weaponIndex: gameState.weaponIndex,
    ki: gameState.ki,
    health: gameState.health,
    enemiesRemaining: gameState.enemiesRemaining,
  };
  localStorage.setItem(saveSlot, JSON.stringify(state));
  statusText.textContent = 'Game saved successfully.';
}

function loadGame() {
  const raw = localStorage.getItem(saveSlot);
  if (!raw) {
    statusText.textContent = 'No saved game found.';
    return;
  }
  const state = JSON.parse(raw);
  gameState = { ...gameState, ...state };
  gameState.weaponIndex = state.weaponIndex;
  gameState.ki = state.ki;
  gameState.health = state.health;
  loadLevel(gameState.levelIndex);
  gamePanel.classList.add('active');
  closeOverlay();
  statusText.textContent = 'Game loaded. Continue your journey.';
}

function switchWeapon() {
  if (gameState.inPause) return;
  gameState.weaponIndex = (gameState.weaponIndex + 1) % weapons.length;
  statusText.textContent = `Switched to ${weapons[gameState.weaponIndex].name}.`;
  updateHud();
}

function applyInput() {
  if (gameState.inPause) return;
  let dx = 0;
  let dy = 0;
  if (keys.ArrowUp || keys.w) dy -= 1;
  if (keys.ArrowDown || keys.s) dy += 1;
  if (keys.ArrowLeft || keys.a) dx -= 1;
  if (keys.ArrowRight || keys.d) dx += 1;
  if (dx !== 0 || dy !== 0) {
    const magnitude = Math.hypot(dx, dy);
    player.x += (dx / magnitude) * player.speed;
    player.y += (dy / magnitude) * player.speed;
  }
  player.x = Math.min(canvas.width - player.width - 8, Math.max(8, player.x));
  player.y = Math.min(canvas.height - player.height - 8, Math.max(8, player.y));
}

function updateEnemies() {
  enemies.forEach(enemy => {
    if (!enemy.alive) return;
    enemy.x += enemy.vx * (Math.random() > 0.5 ? 1 : -1);
    enemy.y += enemy.vy * (Math.random() > 0.5 ? 1 : -1);
    enemy.x = Math.min(canvas.width - enemy.width - 10, Math.max(420, enemy.x));
    enemy.y = Math.min(canvas.height - enemy.height - 10, Math.max(10, enemy.y));
    const px = player.x - enemy.x;
    const py = player.y - enemy.y;
    if (Math.hypot(px, py) < 34 && Math.random() > 0.98) {
      gameState.health -= 2;
      gameState.ki = Math.max(0, gameState.ki - 1);
    }
  });
}

function createLevelEffects(style) {
  effectParticles = [];
  const count = 70;
  for (let i = 0; i < count; i += 1) {
    effectParticles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: Math.random() * 0.6 - 0.3,
      vy: Math.random() * 1.5 + 0.4,
      alpha: Math.random() * 0.6 + 0.2,
      size: Math.random() * 2.4 + 1.2,
      type: style,
      phase: Math.random() * Math.PI * 2,
    });
  }
}

function updateParticles() {
  effectParticles.forEach(p => {
    if (p.type === 'bamboo') {
      p.x += p.vx * 1.6;
      p.y += p.vy * 1.8;
      if (p.y > canvas.height) {
        p.y = -10;
        p.x = Math.random() * canvas.width;
      }
    }
    if (p.type === 'ice') {
      p.x += Math.cos(p.phase) * 0.3;
      p.y += p.vy * 0.8;
      p.phase += 0.02;
      if (p.y > canvas.height) {
        p.y = -10;
        p.x = Math.random() * canvas.width;
      }
    }
    if (p.type === 'fire') {
      p.x += p.vx * 0.8;
      p.y -= p.vy * 0.6;
      p.alpha -= 0.005;
      if (p.alpha <= 0) {
        p.alpha = Math.random() * 0.4 + 0.2;
        p.y = canvas.height;
        p.x = Math.random() * canvas.width;
      }
    }
    if (p.type === 'storm') {
      p.x += p.vx * 0.2;
      p.y += p.vy * 1.6;
      p.alpha = Math.max(0.15, Math.sin(p.phase + performance.now() * 0.002) * 0.4 + 0.45);
      p.phase += 0.04;
      if (p.y > canvas.height) {
        p.y = -12;
        p.x = Math.random() * canvas.width;
      }
    }
    if (p.type === 'final') {
      p.x += Math.cos(p.phase) * 0.5;
      p.y += Math.sin(p.phase * 1.3) * 0.4;
      p.phase += 0.03;
    }
  });
}

function drawParticles() {
  effectParticles.forEach(p => {
    if (p.type === 'bamboo') {
      ctx.strokeStyle = `rgba(170, 226, 255, ${p.alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + 4, p.y + 12);
      ctx.stroke();
    }
    if (p.type === 'ice') {
      ctx.fillStyle = `rgba(196, 238, 255, ${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    if (p.type === 'fire') {
      ctx.fillStyle = `rgba(255, 175, 88, ${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    if (p.type === 'storm') {
      ctx.fillStyle = `rgba(142, 218, 255, ${p.alpha})`;
      ctx.fillRect(p.x, p.y, 2, 10);
    }
    if (p.type === 'final') {
      ctx.fillStyle = `rgba(139, 255, 213, ${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function drawEnvironment(style) {
  const base = ctx.createLinearGradient(0, 0, 0, canvas.height);
  if (style === 'bamboo') {
    base.addColorStop(0, '#112a37');
    base.addColorStop(1, '#07121f');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 10; i += 1) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(13, 31, 33, 0.8)' : 'rgba(11, 27, 29, 0.65)';
      const x = i * 90 + (i % 2 ? 30 : 0);
      ctx.fillRect(x, 0, 24, canvas.height);
    }
    ctx.strokeStyle = 'rgba(163, 255, 203, 0.08)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 24; i += 1) {
      const x = i * 35 + 18;
      ctx.beginPath();
      ctx.moveTo(x, 40);
      ctx.lineTo(x + 12, 20 + (i % 3) * 10);
      ctx.stroke();
    }
  } else if (style === 'ice') {
    base.addColorStop(0, '#0b1d2c');
    base.addColorStop(1, '#0a1220');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 6; i += 1) {
      const x = i * 140 + 30;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(185, 231, 254, 0.12)' : 'rgba(147, 217, 255, 0.08)';
      ctx.beginPath();
      ctx.moveTo(x, canvas.height);
      ctx.lineTo(x + 50, 140);
      ctx.lineTo(x + 110, canvas.height);
      ctx.closePath();
      ctx.fill();
    }
  } else if (style === 'fire') {
    base.addColorStop(0, '#2d0b0b');
    base.addColorStop(1, '#120504');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 8; i += 1) {
      const x = i * 110 + 20;
      ctx.fillStyle = `rgba(255, ${90 + i * 7}, 60, 0.12)`;
      ctx.beginPath();
      ctx.moveTo(x, canvas.height);
      ctx.bezierCurveTo(x + 20, 280, x - 30, 180, x + 30, 120);
      ctx.lineTo(x + 42, canvas.height);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255, 112, 73, 0.1)';
    ctx.fillRect(0, canvas.height - 70, canvas.width, 70);
  } else if (style === 'storm') {
    base.addColorStop(0, '#071223');
    base.addColorStop(1, '#07151f');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(139, 219, 255, 0.18)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i += 1) {
      const x = i * 150 + 40;
      ctx.beginPath();
      ctx.moveTo(x, 30);
      ctx.lineTo(x + 20, 90);
      ctx.lineTo(x - 10, 120);
      ctx.lineTo(x + 40, 180);
      ctx.stroke();
    }
  } else {
    base.addColorStop(0, '#111822');
    base.addColorStop(1, '#070a12');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function drawPlayer() {
  const glowColor = ['#9bd3ff', '#cdf0ff', '#ffccdb', '#99ddff', '#b2fff3'][gameState.weaponIndex] || '#9bd3ff';
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.fillStyle = '#112f40';
  ctx.fillRect(2, 6, 20, 24);
  ctx.fillStyle = '#08314a';
  ctx.fillRect(4, 0, 16, 16);
  ctx.fillStyle = '#f6f8ff';
  ctx.fillRect(7, 5, 10, 6);
  ctx.fillStyle = '#0f1720';
  ctx.fillRect(8, 6, 3, 2);
  ctx.fillRect(13, 6, 3, 2);
  if (player.attacking) {
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(24, 18);
    ctx.lineTo(84, 18);
    ctx.stroke();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(26, 18);
    ctx.lineTo(82, 18);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawEnemies() {
  enemies.forEach(enemy => {
    if (!enemy.alive) return;
    ctx.save();
    const wobble = Math.sin(performance.now() * 0.006 + enemy.offset) * 3;
    ctx.translate(enemy.x + wobble, enemy.y + wobble * 0.4);
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, enemy.width * 0.6, enemy.height * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-8, -6, 4, 5);
    ctx.fillRect(4, -6, 4, 5);
    ctx.fillStyle = '#002133';
    ctx.fillRect(-7, -5, 2, 2);
    ctx.fillRect(5, -5, 2, 2);
    ctx.restore();
  });
}

function drawScene() {
  drawEnvironment(levels[gameState.levelIndex].styleClass);
  updateParticles();
  drawParticles();
  drawEnemies();
  drawPlayer();
  ctx.fillStyle = '#7ad1ff';
  ctx.font = '18px Inter';
  ctx.fillText(`Weapon: ${weapons[gameState.weaponIndex].name}`, 18, 28);
  ctx.fillText(`Health: ${gameState.health}`, 18, 52);
  ctx.fillText(`Ki: ${Math.floor(gameState.ki)}`, 18, 76);
}

function gameLoop() {
  if (!gamePanel.classList.contains('active') || gameState.inPause) {
    requestAnimationFrame(gameLoop);
    return;
  }
  if (gameState.health <= 0) {
    statusText.textContent = 'You were defeated. Load or restart to continue.';
    requestAnimationFrame(gameLoop);
    return;
  }
  applyInput();
  updateEnemies();
  if (player.attacking) {
    player.attackTimer -= 1;
    if (player.attackTimer <= 0) {
      player.attacking = false;
    }
  }
  if (gameState.ki < gameState.maxKi) {
    gameState.ki += 0.04;
    gameState.ki = Math.min(gameState.ki, gameState.maxKi);
  }
  updateHud();
  drawScene();
  requestAnimationFrame(gameLoop);
}

function init() {
  populateMenu();
  openMenu('startMenu');
  document.getElementById('playButton').addEventListener('click', startGame);
  document.getElementById('weaponsButton').addEventListener('click', () => switchMenu('weaponsMenu'));
  document.getElementById('itemsButton').addEventListener('click', () => switchMenu('itemsMenu'));
  document.getElementById('levelsButton').addEventListener('click', () => switchMenu('levelsMenu'));
  document.getElementById('creditsButton').addEventListener('click', () => switchMenu('creditsMenu'));
  document.getElementById('saveButton').addEventListener('click', saveGame);
  document.getElementById('loadButton').addEventListener('click', loadGame);
  document.getElementById('resumeButton').addEventListener('click', resumeGame);
  document.getElementById('pauseSaveButton').addEventListener('click', saveGame);
  document.getElementById('pauseMainMenuButton').addEventListener('click', () => {
    gamePanel.classList.remove('active');
    openMenu('startMenu');
  });
  document.querySelectorAll('.backButton').forEach(btn => btn.addEventListener('click', () => openMenu('startMenu')));
  cutsceneContinueButton.addEventListener('click', cutsceneContinue);

  window.addEventListener('keydown', (event) => {
    if (event.key in keys) {
      keys[event.key] = true;
    }
    if (event.key === 'Escape') {
      if (overlay.classList.contains('hidden')) {
        pauseGame();
      } else if (document.getElementById('pauseMenu').classList.contains('hidden')) {
        openMenu('pauseMenu');
      }
    }
    if (event.key === ' ' || event.key === 'Spacebar') {
      attack();
    }
    if (event.key.toLowerCase() === 'e') {
      switchWeapon();
    }
    if (event.key === 'Enter' && !overlay.classList.contains('hidden') && document.getElementById('cutsceneMenu').classList.contains('hidden') === false) {
      cutsceneContinue();
    }
  });

  window.addEventListener('keyup', (event) => {
    if (event.key in keys) {
      keys[event.key] = false;
    }
  });

  loadLevel(0);
  updateHud();
  requestAnimationFrame(gameLoop);
}

init();
