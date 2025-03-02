class Game {
    constructor() {
        this.player = {
            x: 300,
            y: 200,
            inventory: [],
            currentQuests: []
        };
        
        this.weapons = {
            revolver: {
                name: "左轮手枪",
                damage: 25,
                era: "western"
            },
            winchester: {
                name: "温彻斯特步枪",
                damage: 40,
                era: "western"
            }
        };
        
        this.quests = [
            {
                id: 1,
                title: "寻找失踪的马匹",
                description: "镇长的马不见了，帮助他找到它",
                completed: false
            },
            {
                id: 2,
                title: "清除土匪",
                description: "帮助治安官清除威胁小镇的土匪",
                completed: false
            }
        ];
        
        // 添加场景系统
        this.currentScene = 'town';
        this.scenes = {
            town: {
                name: '西部小镇',
                background: 'town.jpg',
                npcs: [
                    {
                        id: 'sheriff',
                        name: '治安官',
                        x: 100,
                        y: 150,
                        dialog: [
                            {
                                text: '这镇子最近不太平，有土匪在附近出没。',
                                choices: [
                                    {
                                        text: '我来帮您处理土匪',
                                        action: 'startQuest',
                                        questId: 2
                                    },
                                    {
                                        text: '我会小心的',
                                        action: 'close'
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'mayor',
                        name: '镇长',
                        x: 400,
                        y: 150,
                        dialog: [
                            {
                                text: '我的马不见了，你能帮我找找吗？',
                                choices: [
                                    {
                                        text: '我来帮您寻找',
                                        action: 'startQuest',
                                        questId: 1
                                    },
                                    {
                                        text: '抱歉，我现在很忙',
                                        action: 'close'
                                    }
                                ]
                            }
                        ]
                    }
                ],
                exits: {
                    saloon: { x: 500, y: 200, targetScene: 'saloon' },
                    ranch: { x: 200, y: 350, targetScene: 'ranch' }
                }
            },
            saloon: {
                name: '酒馆',
                background: 'saloon.jpg',
                npcs: [
                    {
                        id: 'bartender',
                        name: '酒保',
                        x: 300,
                        y: 100,
                        dialog: [
                            {
                                text: '要来一杯威士忌吗？',
                                choices: [
                                    {
                                        text: '来一杯',
                                        action: 'buyDrink'
                                    },
                                    {
                                        text: '不了，谢谢',
                                        action: 'close'
                                    }
                                ]
                            }
                        ]
                    }
                ],
                exits: {
                    town: { x: 300, y: 350, targetScene: 'town' }
                }
            }
        };

        // 添加精灵状态
        this.playerState = {
            direction: 'down',
            isMoving: false,
            lastMove: Date.now()
        };
        
        // 添加粒子系统
        this.particles = [];
        
        this.init();
    }

    init() {
        console.log('Game initializing...');
        
        // 获取所有需要的DOM元素
        this.playerElement = document.getElementById('player');
        this.dialogBox = document.getElementById('dialog-box');
        this.dialogText = document.getElementById('dialog-text');
        this.questLog = document.getElementById('current-quests');
        this.gameScreen = document.getElementById('game-screen');
        
        console.log('Game screen element:', this.gameScreen);
        console.log('Player element:', this.playerElement);
        
        // 确保玩家元素存在
        if (!this.playerElement) {
            console.log('Creating new player element');
            this.playerElement = document.createElement('div');
            this.playerElement.id = 'player';
            this.gameScreen.appendChild(this.playerElement);
        }
        
        // 设置玩家初始位置
        this.playerElement.style.left = `${this.player.x}px`;
        this.playerElement.style.top = `${this.player.y}px`;
        
        // 初始化粒子系统
        this.particlesContainer = document.getElementById('particles-container');
        
        // 设置初始场景
        this.loadScene(this.currentScene);
        
        // 设置事件监听器
        this.setupEventListeners();
        this.setupNPCInteraction();
        
        // 显示任务
        this.displayQuests();
        
        // 开始粒子循环
        this.startParticleLoop();
        
        console.log('Game initialization complete');
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            const speed = 5;
            let moved = false;
            
            switch(e.key) {
                case 'ArrowUp':
                    this.player.y = Math.max(0, this.player.y - speed);
                    this.playerState.direction = 'up';
                    moved = true;
                    break;
                case 'ArrowDown':
                    this.player.y = Math.min(352, this.player.y + speed);
                    this.playerState.direction = 'down';
                    moved = true;
                    break;
                case 'ArrowLeft':
                    this.player.x = Math.max(0, this.player.x - speed);
                    this.playerState.direction = 'left';
                    moved = true;
                    break;
                case 'ArrowRight':
                    this.player.x = Math.min(568, this.player.x + speed);
                    this.playerState.direction = 'right';
                    moved = true;
                    break;
            }
            
            if (moved) {
                this.playerState.isMoving = true;
                this.playerState.lastMove = Date.now();
                this.updatePlayerAnimation();
                this.updatePlayerPosition();
                this.createDustParticle();
                this.updateDebugInfo();
            }
        });

        document.addEventListener('keyup', () => {
            this.playerState.isMoving = false;
            this.updatePlayerAnimation();
        });
    }

    updatePlayerPosition() {
        this.playerElement.style.left = `${this.player.x}px`;
        this.playerElement.style.top = `${this.player.y}px`;
    }

    showDialog(text) {
        this.dialogText.textContent = text;
        this.dialogBox.classList.remove('hidden');
        setTimeout(() => {
            this.dialogBox.classList.add('hidden');
        }, 3000);
    }

    displayQuests() {
        this.questLog.innerHTML = this.quests
            .filter(quest => !quest.completed)
            .map(quest => `
                <div class="quest">
                    <h4>${quest.title}</h4>
                    <p>${quest.description}</p>
                </div>
            `).join('');
    }

    addQuest(quest) {
        this.quests.push(quest);
        this.displayQuests();
    }

    completeQuest(questId) {
        const quest = this.quests.find(q => q.id === questId);
        if (quest) {
            quest.completed = true;
            this.displayQuests();
            this.showDialog(`任务完成：${quest.title}`);
        }
    }

    loadScene(sceneName) {
        const scene = this.scenes[sceneName];
        if (!scene) return;

        // 添加过渡效果
        this.gameScreen.style.opacity = '0';
        
        setTimeout(() => {
            this.currentScene = sceneName;
            
            // 设置场景背景
            this.gameScreen.className = 'game-screen';
            this.gameScreen.classList.add(`${sceneName}-bg`);
            
            // 清除旧的NPC和出口，但保留玩家和粒子容器
            const npcs = document.querySelectorAll('.npc');
            const exits = document.querySelectorAll('.scene-exit');
            npcs.forEach(npc => npc.remove());
            exits.forEach(exit => exit.remove());
            
            // 创建新的NPC
            scene.npcs.forEach(npc => {
                const npcElement = document.createElement('div');
                npcElement.className = 'npc';
                npcElement.dataset.npcId = npc.id;
                npcElement.style.left = `${npc.x}px`;
                npcElement.style.top = `${npc.y}px`;
                npcElement.title = npc.name;
                this.gameScreen.appendChild(npcElement);
            });

            // 创建场景出口
            Object.entries(scene.exits).forEach(([exitName, exit]) => {
                const exitElement = document.createElement('div');
                exitElement.className = 'scene-exit';
                exitElement.dataset.targetScene = exit.targetScene;
                exitElement.style.left = `${exit.x}px`;
                exitElement.style.top = `${exit.y}px`;
                exitElement.innerHTML = `<span>去往${this.scenes[exit.targetScene].name}</span>`;
                
                exitElement.addEventListener('click', () => {
                    this.loadScene(exit.targetScene);
                });
                
                this.gameScreen.appendChild(exitElement);
            });

            // 确保玩家在最上层
            this.gameScreen.appendChild(this.playerElement);
            
            // 淡入效果
            this.gameScreen.style.opacity = '1';
            this.showDialog(`欢迎来到${scene.name}`);
        }, 300);
    }

    setupNPCInteraction() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.checkNPCInteraction();
            }
        });
    }

    checkNPCInteraction() {
        const scene = this.scenes[this.currentScene];
        scene.npcs.forEach(npc => {
            const distance = Math.sqrt(
                Math.pow(this.player.x - npc.x, 2) + 
                Math.pow(this.player.y - npc.y, 2)
            );
            
            if (distance < 50) { // 互动距离
                this.startDialog(npc);
            }
        });
    }

    startDialog(npc) {
        const dialog = npc.dialog[0]; // 简单起见，只使用第一段对话
        this.dialogText.textContent = dialog.text;
        
        const choicesDiv = document.getElementById('dialog-choices');
        choicesDiv.innerHTML = dialog.choices.map(choice => `
            <button class="dialog-choice" data-action="${choice.action}" 
                    data-quest-id="${choice.questId || ''}">${choice.text}</button>
        `).join('');

        this.dialogBox.classList.remove('hidden');
        
        // 添加选项点击事件
        choicesDiv.querySelectorAll('.dialog-choice').forEach(button => {
            button.addEventListener('click', () => {
                const action = button.dataset.action;
                const questId = button.dataset.questId;
                
                if (action === 'startQuest' && questId) {
                    this.startQuest(parseInt(questId));
                } else if (action === 'close') {
                    this.dialogBox.classList.add('hidden');
                }
            });
        });
    }

    startQuest(questId) {
        const quest = this.quests.find(q => q.id === questId);
        if (quest && !quest.completed) {
            this.player.currentQuests.push(questId);
            this.showDialog(`接受了新任务：${quest.title}`);
            this.dialogBox.classList.add('hidden');
            this.displayQuests();
        }
    }

    updatePlayerAnimation() {
        // 重置所有边框宽度
        this.playerElement.style.borderWidth = '2px';
        
        // 根据方向设置边框
        switch(this.playerState.direction) {
            case 'up':
                this.playerElement.style.borderBottomWidth = '4px';
                break;
            case 'down':
                this.playerElement.style.borderTopWidth = '4px';
                break;
            case 'left':
                this.playerElement.style.borderRightWidth = '4px';
                break;
            case 'right':
                this.playerElement.style.borderLeftWidth = '4px';
                break;
        }
    }

    createDustParticle() {
        const particle = document.createElement('div');
        particle.className = 'dust-particle';
        
        // 在玩家脚下生成粒子
        const x = this.player.x + Math.random() * 32;
        const y = this.player.y + 40;
        
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        
        this.particlesContainer.appendChild(particle);
        
        // 粒子动画
        const animation = particle.animate([
            { 
                transform: 'translate(0, 0) scale(1)',
                opacity: 0.6
            },
            {
                transform: `translate(${Math.random() * 20 - 10}px, -20px) scale(0)`,
                opacity: 0
            }
        ], {
            duration: 1000,
            easing: 'ease-out'
        });
        
        animation.onfinish = () => particle.remove();
    }

    // 添加缺失的方法
    startParticleLoop() {
        setInterval(() => {
            this.particles = this.particles.filter(particle => {
                const now = Date.now();
                return now - particle.created < 1000;
            });
        }, 1000);
    }

    updateDebugInfo() {
        const debugInfo = document.getElementById('debug-info');
        if (debugInfo) {
            debugInfo.innerHTML = `
                Player Position: (${this.player.x}, ${this.player.y})<br>
                Current Scene: ${this.currentScene}<br>
                Player Direction: ${this.playerState.direction}<br>
                Moving: ${this.playerState.isMoving}
            `;
        }
    }
}

// 启动游戏
window.onload = () => {
    const game = new Game();
}; 