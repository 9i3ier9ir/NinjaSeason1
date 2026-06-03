const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const gamePanel = document.getElementById('gamePanel');
const storyPanel = document.getElementById('storyPanel');
const statusText = document.getElementById('statusText');
const currentLevelText = document.getElementById('currentLevel');
const currentWeaponText = document.getElementById('currentWeapon');
const currentItemText = document.getElementById('currentItem');
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
    sceneText: 'Rain fell in sheets over the Valley of Whispers. Kaelen moved through the bamboo forest, listening for the hum of the ancient Ki.',
    styleClass: 'bamboo',
    narrative: 'The rain lashes the Valley of Whispers. Kaelen moves through the bamboo forest, guarding the ancient secrets of the Obsidian Blade.',
    enemyCount: 2,
  },
  {
    id: 2,
    name: 'Frozen Peaks of Aethelgard',
    sceneTitle: 'The Spirit of Winter',
    sceneText: 'Above the frozen heights, the Spirit of Winter demanded stillness. Kaelen held his breath and became ice.',
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
    name: 'Shadow Ruins',
    sceneTitle: 'Guardian of the Void',
    sceneText: 'Within the shadowed ruins, a guardian of void energy stood between Kaelen and the next step of his journey.',
    styleClass: 'storm',
    narrative: 'The ruins conceal a guardian spirit. Kaelen must prove his balance before he can move on.',
    enemyCount: 2,
    boss: true,
    bossName: 'Guardian of the Void',
    bossHealth: 110,
    bossColor: '#9c5cff',
  },
  {
    id: 6,
    name: 'Ash Barrens',
    sceneTitle: 'Embers of War',
    sceneText: 'The ash barrens glowed with embers. Each step burned, but Kaelen pressed on, sword and Ki aligned.',
    styleClass: 'fire',
    narrative: 'The ash barrens stretch endless and hot. Kaelen pushes through the flames to earn his final power.',
    enemyCount: 4,
  },
  {
    id: 7,
    name: 'Valley of Whispers Final Battle',
    sceneTitle: 'Warlord of Ash',
    sceneText: 'The Warlord of Ash emerged at the valley’s edge, flanked by flame demons. Kaelen stood as the final guardian of balance.',
    styleClass: 'final',
    narrative: 'The Warlord of Ash arrives with a horde. Kaelen’s balance of wind, ice, fire and void will decide the fate of the world.',
    enemyCount: 4,
    boss: true,
    bossName: 'Warlord of Ash',
    bossHealth: 150,
    bossColor: '#ff6600',
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
  { key: 'ki', name: 'Ki Elixir', desc: 'Restore 35 Ki when used.' },
  { key: 'cloak', name: 'Shadow Cloak', desc: 'Activate temporary damage reduction.' },
  { key: 'storm', name: 'Storm Shard', desc: 'Blast nearby enemies with a surge of lightning.' },
];

const inventory = {
  ki: 4,
  cloak: 2,
  storm: 2,
};

let gameState = {
  levelIndex: 0,
  weaponIndex: 0,
  selectedItemIndex: 0,
  ki: 80,
  maxKi: 100,
  health: 100,
  enemiesRemaining: 0,
  inPause: false,
  cloakActive: false,
  cloakTimer: 0,
  unlockedWeapons: [0],
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
  q: false,
};

let enemies = [];
let effectParticles = [];
let cutsceneContinueAction = null;
let cutsceneTyping = false;
let cutsceneQueue = null;
let statusTimer = null;
let statusOverride = null;
const saveSlot = 'ninja-prism-edge-save';

function setStatus(message, duration = 1600) {
  statusOverride = message;
  statusText.textContent = message;
  if (statusTimer) {
    clearTimeout(statusTimer);
    statusTimer = null;
  }
  if (duration > 0) {
    statusTimer = setTimeout(() => {
      statusOverride = null;
      updateHud();
    }, duration);
  }
}

function openMenu(menuId) {
  document.querySelectorAll('.menu-panel').forEach(panel => {
    panel.classList.toggle('hidden', panel.id !== menuId);
  });
  overlay.classList.remove('hidden');
  gameState.inPause = true;
}

function closeOverlay() {
  document.querySelectorAll('.menu-panel').forEach(panel => panel.classList.add('hidden'));
  overlay.classList.add('hidden');
  gameState.inPause = false;
}

function typeCutsceneText(text, done) {
  if (cutsceneQueue && cutsceneQueue.interval) {
    clearInterval(cutsceneQueue.interval);
  }
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
  }, 24);
  cutsceneQueue = { text, interval, index };
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
  typeCutsceneText(scene.sceneText);
  cutsceneContinueAction = () => {
    closeOverlay();
    loadLevel(index);
  };
}

function showVictory() {
  cutsceneTitle.textContent = 'The Balance is Restored';
  cutsceneArt.className = 'scene-art final';
  cutsceneContinueButton.textContent = 'Main Menu';
  openMenu('cutsceneMenu');
  typeCutsceneText('Kaelen returned to the Valley of Whispers as a guardian of harmony. The Prism Edge sleeps with quiet promise, held by a warrior who knows true balance.');
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
  gameState.selectedItemIndex = 0;
  gameState.ki = 80;
  gameState.health = 100;
  gameState.cloakActive = false;
  gameState.cloakTimer = 0;
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

function selectWeapon(index) {
  if (!gameState.unlockedWeapons.includes(index)) {
    setStatus('This sword is not yet unlocked.');
    return;
  }
  gameState.weaponIndex = index;
  setStatus(`Equipped ${weapons[index].name}.`);
  populateMenu();
}

function selectItem(index) {
  if (inventory[items[index].key] <= 0) {
    setStatus(`No ${items[index].name} left.`);
    return;
  }
  gameState.selectedItemIndex = index;
  setStatus(`Selected ${items[index].name}.`);
  populateMenu();
}

function useItem() {
  if (gameState.inPause || gameState.health <= 0) return;
  const item = items[gameState.selectedItemIndex];
  const count = inventory[item.key] || 0;
  if (count <= 0) {
    setStatus(`No ${item.name} left.`);
    return;
  }
  inventory[item.key] = Math.max(0, count - 1);
  if (item.key === 'ki') {
    gameState.ki = Math.min(gameState.maxKi, gameState.ki + 35);
    setStatus('Ki Elixir restores your energy.');
  } else if (item.key === 'cloak') {
    gameState.cloakActive = true;
    gameState.cloakTimer = 240;
    setStatus('Shadow Cloak active. Damage reduced.');
  } else if (item.key === 'storm') {
    enemies.forEach(enemy => {
      if (!enemy.alive) return;
      enemy.health -= 16;
      enemy.color = '#78d9ff';
      if (enemy.health <= 0) {
        enemy.alive = false;
        gameState.enemiesRemaining -= 1;
      }
    });
    setStatus('Storm Shard blasts nearby enemies.');
    if (gameState.enemiesRemaining === 0) advanceLevel();
  }
  populateMenu();
}

function populateMenu() {
  const weaponList = document.getElementById('weaponList');
  weaponList.innerHTML = weapons.map((w, i) => {
    const unlocked = gameState.unlockedWeapons.includes(i);
    const selected = gameState.weaponIndex === i;
    return `<div class="item-card"><div class="menu-row"><button class="menu-select-button ${selected ? 'selected' : ''}" data-weapon="${i}">${w.name}</button><span>${unlocked ? w.desc : 'Locked until you unlock it in battle.'}</span></div></div>`;
  }).join('');
  weaponList.querySelectorAll('[data-weapon]').forEach(btn => {
    btn.addEventListener('click', () => selectWeapon(Number(btn.dataset.weapon)));
  });

  const itemList = document.getElementById('itemList');
  itemList.innerHTML = items.map((item, i) => {
    const selected = gameState.selectedItemIndex === i;
    const count = inventory[item.key] || 0;
    return `<div class="item-card"><div class="menu-row"><button class="menu-select-button ${selected ? 'selected' : ''}" data-item="${i}">${item.name}</button><span>${item.desc} x${count}</span></div></div>`;
  }).join('');
  itemList.querySelectorAll('[data-item]').forEach(btn => {
    btn.addEventListener('click', () => selectItem(Number(btn.dataset.item)));
  });

  const levelList = document.getElementById('levelList');
  levelList.innerHTML = levels.map(l => `<div class="item-card"><h3>Level ${l.id}: ${l.name}</h3><p>${l.narrative}</p></div>`).join('');
}

function loadLevel(index) {
  const level = levels[index];
  if (!level) return;
  gameState.levelIndex = index;
  player.x = 80;
  player.y = 220;
  enemies = [];
  const enemyBaseColor = level.styleClass === 'ice' ? '#9ce8ff' : level.styleClass === 'fire' ? '#ff9a53' : level.styleClass === 'storm' ? '#91e8ff' : '#ff6c78';

  if (level.boss) {
    enemies.push({
      x: 520,
      y: 130,
      width: 56,
      height: 68,
      color: level.bossColor,
      health: level.bossHealth,
      alive: true,
      isBoss: true,
      bossName: level.bossName,
      vx: 0.8,
      vy: 0.5,
      offset: 0,
    });
  }

  for (let i = 0; i < level.enemyCount; i += 1) {
    enemies.push({
      x: 480 + (i % 4) * 70,
      y: 100 + Math.floor(i / 4) * 90,
      width: 28,
      height: 32,
      color: enemyBaseColor,
      health: 28 + level.id * 14,
      alive: true,
      vx: Math.random() * 0.6 + 0.3,
      vy: Math.random() * 0.3 + 0.2,
      offset: Math.random() * Math.PI * 2,
    });
  }

  gameState.enemiesRemaining = enemies.filter(enemy => enemy.alive).length;
  storyPanel.textContent = `${level.name}: ${level.narrative}`;
  updateHud();
  createLevelEffects(level.styleClass);
}

function updateHud() {
  currentLevelText.textContent = `Level: ${levels[gameState.levelIndex].name}`;
  currentWeaponText.textContent = `Weapon: ${weapons[gameState.weaponIndex].name}`;
  currentItemText.textContent = `Item: ${items[gameState.selectedItemIndex].name}`;
  kiBar.textContent = `Ki: ${Math.floor(gameState.ki)} / ${gameState.maxKi}`;
  const baseStatus = gameState.health > 0 ? `Enemies remaining: ${gameState.enemiesRemaining}` : 'Defeated. Load or restart to continue.';
  statusText.textContent = statusOverride || baseStatus;
}

function attack() {
  if (player.attacking || gameState.inPause || gameState.health <= 0) return;
  player.attacking = true;
  player.attackTimer = 14;
  const damage = weapons[gameState.weaponIndex].damage;
  enemies.forEach(enemy => {
    if (!enemy.alive) return;
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 92) {
      enemy.health -= damage;
      enemy.color = enemy.isBoss ? '#ffba62' : '#ffd166';
      if (enemy.health <= 0) {
        enemy.alive = false;
        gameState.enemiesRemaining -= 1;
        if (enemy.isBoss) {
          setStatus(`Boss ${enemy.bossName} defeated!`, 2200);
        }
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
  const nextIndex = gameState.levelIndex + 1;
  if (!gameState.unlockedWeapons.includes(nextIndex)) {
    gameState.unlockedWeapons.push(nextIndex);
  }
  gameState.levelIndex = nextIndex;
  showCutscene(nextIndex);
}

function saveGame() {
  const state = {
    levelIndex: gameState.levelIndex,
    weaponIndex: gameState.weaponIndex,
    selectedItemIndex: gameState.selectedItemIndex,
    ki: gameState.ki,
    health: gameState.health,
    enemiesRemaining: gameState.enemiesRemaining,
    inventory,
    unlockedWeapons: gameState.unlockedWeapons,
  };
  localStorage.setItem(saveSlot, JSON.stringify(state));
  setStatus('Game saved successfully.', 1800);
}

function loadGame() {
  const raw = localStorage.getItem(saveSlot);
  if (!raw) {
    setStatus('No saved game found.', 1800);
    return;
  }
  const state = JSON.parse(raw);
  gameState = { ...gameState, ...state };
  if (state.inventory) {
    inventory.ki = state.inventory.ki ?? inventory.ki;
    inventory.cloak = state.inventory.cloak ?? inventory.cloak;
    inventory.storm = state.inventory.storm ?? inventory.storm;
  }
  gameState.unlockedWeapons = state.unlockedWeapons || gameState.unlockedWeapons;
  gameState.selectedItemIndex = state.selectedItemIndex ?? gameState.selectedItemIndex;
  loadLevel(gameState.levelIndex);
  gamePanel.classList.add('active');
  closeOverlay();
  setStatus('Game loaded. Continue your journey.', 1800);
}

function switchWeapon() {
  if (gameState.inPause) return;
  let next = (gameState.weaponIndex + 1) % weapons.length;
  while (!gameState.unlockedWeapons.includes(next)) {
    next = (next + 1) % weapons.length;
  }
  gameState.weaponIndex = next;
  setStatus(`Switched to ${weapons[next].name}.`, 1500);
}

function applyInput() {
  if (gameState.inPause || gameState.health <= 0) return;
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
    if (enemy.isBoss) {
      enemy.offset += 0.035;
      enemy.x += Math.sin(enemy.offset) * 1.2;
      enemy.y += Math.cos(enemy.offset * 1.3) * 0.8;
      enemy.x = Math.min(canvas.width - enemy.width - 20, Math.max(420, enemy.x));
      enemy.y = Math.min(canvas.height - enemy.height - 15, Math.max(20, enemy.y));
      if (Math.hypot(player.x - enemy.x, player.y - enemy.y) < 60 && Math.random() > 0.985) {
        const damage = gameState.cloakActive ? 1 : 4;
        gameState.health = Math.max(0, gameState.health - damage);
      }
      return;
    }
    enemy.x += enemy.vx * (Math.random() > 0.5 ? 1 : -1);
    enemy.y += enemy.vy * (Math.random() > 0.5 ? 1 : -1);
    enemy.x = Math.min(canvas.width - enemy.width - 10, Math.max(420, enemy.x));
    enemy.y = Math.min(canvas.height - enemy.height - 10, Math.max(10, enemy.y));
    if (Math.hypot(player.x - enemy.x, player.y - enemy.y) < 36 && Math.random() > 0.98) {
      const damage = gameState.cloakActive ? 1 : 3;
      gameState.health = Math.max(0, gameState.health - damage);
      if (!gameState.cloakActive) {
        gameState.ki = Math.max(0, gameState.ki - 1);
      }
    }
  });
  if (gameState.cloakActive) {
    gameState.cloakTimer -= 1;
    if (gameState.cloakTimer <= 0) {
      gameState.cloakActive = false;
      setStatus('Shadow Cloak faded.', 1400);
    }
  }
}

function createLevelEffects(style) {
  effectParticles = [];
  const count = 80;
  for (let i = 0; i < count; i += 1) {
    effectParticles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: Math.random() * 0.7 - 0.35,
      vy: Math.random() * 1.8 + 0.3,
      alpha: Math.random() * 0.55 + 0.18,
      size: Math.random() * 2.8 + 1.1,
      type: style,
      phase: Math.random() * Math.PI * 2,
    });
  }
}

function updateParticles() {
  effectParticles.forEach(p => {
    if (p.type === 'bamboo') {
      p.x += p.vx * 1.8;
      p.y += p.vy * 1.5;
      if (p.y > canvas.height) {
        p.y = -8;
        p.x = Math.random() * canvas.width;
      }
    }
    if (p.type === 'ice') {
      p.x += Math.cos(p.phase) * 0.3;
      p.y += p.vy * 0.82;
      p.phase += 0.018;
      if (p.y > canvas.height) {
        p.y = -10;
        p.x = Math.random() * canvas.width;
      }
    }
    if (p.type === 'fire') {
      p.x += p.vx * 0.9;
      p.y -= p.vy * 0.4;
      p.alpha -= 0.005;
      if (p.alpha <= 0) {
        p.alpha = Math.random() * 0.45 + 0.18;
        p.y = canvas.height;
        p.x = Math.random() * canvas.width;
      }
    }
    if (p.type === 'storm') {
      p.x += p.vx * 0.18;
      p.y += p.vy * 1.4;
      p.alpha = Math.max(0.12, Math.sin(p.phase + performance.now() * 0.002) * 0.4 + 0.47);
      p.phase += 0.04;
      if (p.y > canvas.height) {
        p.y = -10;
        p.x = Math.random() * canvas.width;
      }
    }
    if (p.type === 'final') {
      p.x += Math.cos(p.phase) * 0.45;
      p.y += Math.sin(p.phase * 1.2) * 0.35;
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
      ctx.lineTo(p.x + 4, p.y + 14);
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
      ctx.arc(p.x, p.y, p.size * 1.3, 0, Math.PI * 2);
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
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  switch (style) {
    case 'bamboo':
      gradient.addColorStop(0, '#102d3e');
      gradient.addColorStop(1, '#07121e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < 12; i += 1) {
        ctx.fillStyle = i % 2 === 0 ? 'rgba(14, 34, 40, 0.85)' : 'rgba(10, 24, 28, 0.72)';
        const x = i * 75 + (i % 2 ? 20 : 0);
        ctx.fillRect(x, 0, 18, canvas.height);
      }
      break;
    case 'ice':
      gradient.addColorStop(0, '#0d2134');
      gradient.addColorStop(1, '#08131f');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < 6; i += 1) {
        const x = i * 150 + 10;
        ctx.fillStyle = i % 2 === 0 ? 'rgba(183, 236, 255, 0.12)' : 'rgba(148, 220, 255, 0.08)';
        ctx.beginPath();
        ctx.moveTo(x, canvas.height);
        ctx.lineTo(x + 60, 140);
        ctx.lineTo(x + 120, canvas.height);
        ctx.closePath();
        ctx.fill();
      }
      break;
    case 'fire':
      gradient.addColorStop(0, '#2f110c');
      gradient.addColorStop(1, '#160905');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < 7; i += 1) {
        const x = i * 120 + 10;
        ctx.fillStyle = `rgba(255, ${90 + i * 8}, 70, 0.12)`;
        ctx.beginPath();
        ctx.moveTo(x, canvas.height);
        ctx.bezierCurveTo(x + 20, 280, x - 40, 190, x + 20, 120);
        ctx.lineTo(x + 30, canvas.height);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255, 110, 54, 0.12)';
      ctx.fillRect(0, canvas.height - 78, canvas.width, 78);
      break;
    case 'storm':
      gradient.addColorStop(0, '#061423');
      gradient.addColorStop(1, '#071520');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(140, 224, 255, 0.18)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i += 1) {
        const x = i * 140 + 20;
        ctx.beginPath();
        ctx.moveTo(x, 20);
        ctx.lineTo(x + 20, 90);
        ctx.lineTo(x - 10, 120);
        ctx.lineTo(x + 40, 180);
        ctx.stroke();
      }
      break;
    default:
      gradient.addColorStop(0, '#111822');
      gradient.addColorStop(1, '#070a12');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function drawPlayer() {
  const glowColor = ['#89d6ff', '#954af4', '#c3f1ff', '#ffb26b', '#b8ffd8'][gameState.weaponIndex] || '#89d6ff';
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.fillStyle = '#113247';
  ctx.fillRect(4, 6, 16, 22);
  ctx.fillStyle = '#0b1722';
  ctx.fillRect(0, 0, 24, 16);
  ctx.fillStyle = '#f8fbff';
  ctx.fillRect(7, 4, 4, 3);
  ctx.fillRect(13, 4, 4, 3);
  ctx.fillStyle = '#0a1220';
  ctx.fillRect(7, 5, 2, 2);
  ctx.fillRect(14, 5, 2, 2);
  if (player.attacking) {
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(24, 16);
    ctx.lineTo(92, 16);
    ctx.stroke();
  }
  if (gameState.cloakActive) {
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 4;
    ctx.strokeRect(-4, -4, 32, 40);
  }
  ctx.restore();
}

function drawEnemies() {
  enemies.forEach(enemy => {
    if (!enemy.alive) return;
    ctx.save();
    const wobble = Math.sin(performance.now() * 0.006 + enemy.offset) * 3;
    ctx.translate(enemy.x + wobble, enemy.y + wobble * 0.4);
    if (enemy.isBoss) {
      ctx.fillStyle = enemy.color;
      ctx.beginPath();
      ctx.ellipse(enemy.width / 2, enemy.height / 2, enemy.width / 2, enemy.height / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px Inter';
      ctx.fillText(enemy.bossName, -10, -10);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(0, enemy.height + 6, enemy.width, 8);
      ctx.fillStyle = '#90e0ff';
      ctx.fillRect(0, enemy.height + 6, (enemy.health / levels[gameState.levelIndex].bossHealth) * enemy.width, 8);
    } else {
      ctx.fillStyle = enemy.color;
      ctx.fillRect(0, 0, enemy.width, enemy.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(6, 8, 4, 4);
      ctx.fillRect(enemy.width - 10, 8, 4, 4);
    }
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
    if (statusOverride !== 'You were defeated. Load or restart to continue.') {
      setStatus('You were defeated. Load or restart to continue.', 0);
    }
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
    gameState.ki += 0.045;
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
  document.getElementById('useItemButton').addEventListener('click', useItem);
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
    if (event.key.toLowerCase() === 'q') {
      useItem();
    }
    if (event.key === 'Enter' && !overlay.classList.contains('hidden') && !document.getElementById('cutsceneMenu').classList.contains('hidden')) {
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
