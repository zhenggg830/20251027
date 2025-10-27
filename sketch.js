// 全域變數，用於儲存畫布的 90% 尺寸
let canvasWidth;
let canvasHeight;
// 儲存所有動態形狀物件的陣列
let objs = [];
// 顏色選擇
let colors = ['#f71735', '#f7d002', '#1A53C0', '#232323'];

function setup() {
    // 1. 設定畫布尺寸為全螢幕的 90%
    canvasWidth = windowWidth * 0.9;
    canvasHeight = windowHeight * 0.9;

    // 2. 建立畫布並設定 ID 供 CSS 置中
    let canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.id('center-canvas'); 
    
    // 3. 確保整個網頁背景為黑色
    document.body.style.backgroundColor = '#000000';
    
    rectMode(CENTER);
    objs.push(new DynamicShape());
}

function draw() {
    // 關鍵：使用 background(0) 確保畫布內容每一幀都被清空為黑色 (0 代表 RGB 0,0,0)
    background(0); 

    for (let i of objs) {
        i.run();
    }

    // 動態新增形狀的邏輯：每隔 15 到 30 幀隨機新增 1 到 30 個形狀
    if (frameCount % int(random([15, 30])) == 0) {
        let addNum = int(random(1, 30));
        for (let i = 0; i < addNum; i++) {
            objs.push(new DynamicShape());
        }
    }
    
    // 移除已死亡（完成所有動作點）的形狀
    for (let i = 0; i < objs.length; i++) {
        if (objs[i].isDead) {
            objs.splice(i, 1);
        }
    }
}

// 響應式調整：視窗大小變動時重新調整畫布尺寸
function windowResized() {
    // 重新計算 90% 尺寸
    canvasWidth = windowWidth * 0.9;
    canvasHeight = windowHeight * 0.9;
    
    // 重新調整畫布大小
    resizeCanvas(canvasWidth, canvasHeight);
    
    // 重新清除背景，避免殘影
    background(0);
}

// 緩動函式：InOutExpo，用於平滑的動畫過渡
function easeInOutExpo(x) {
    return x === 0 ? 0 :
        x === 1 ?
        1 :
        x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 :
        (2 - Math.pow(2, -20 * x + 10)) / 2;
}

/**
 * DynamicShape 類別：代表畫布上一個會動態變化的形狀
 */
class DynamicShape {
    constructor() {
        // 隨機初始位置 (畫布的 30% 到 70% 之間)
        this.x = random(0.3, 0.7) * canvasWidth;
        this.y = random(0.3, 0.7) * canvasHeight;
        this.reductionRatio = 1; // 縮放比例
        this.shapeType = int(random(4)); // 初始形狀類型 (0-3)
        this.animationType = 0; // 初始動畫類型
        this.maxActionPoints = int(random(2, 5)); // 生命週期 (動作點數)
        this.actionPoints = this.maxActionPoints;
        this.elapsedT = 0; // 已耗費時間
        this.size = 0;
        // 最大尺寸基於畫布寬度的 1% 到 5%
        this.sizeMax = canvasWidth * random(0.01, 0.05); 
        this.fromSize = 0;
        this.init();
        this.isDead = false;
        this.clr = random(colors); // 隨機選擇顏色
        this.changeShape = true;
        this.ang = int(random(2)) * PI * 0.25;
        this.lineSW = 0; // 拖曳線條粗細
    }

    show() {
        push();
        translate(this.x, this.y);
        if (this.animationType == 1) scale(1, this.reductionRatio); // 垂直縮放
        if (this.animationType == 2) scale(this.reductionRatio, 1); // 水平縮放
        
        let c = color(this.clr);
        strokeWeight(this.size * 0.05);
        
        if (this.shapeType == 0) { // 實心圓
            noStroke();
            fill(c);
            circle(0, 0, this.size);
        } else if (this.shapeType == 1) { // 空心圓
            noFill();
            stroke(c);
            circle(0, 0, this.size);
        } else if (this.shapeType == 2) { // 實心矩形
            noStroke();
            fill(c);
            rect(0, 0, this.size, this.size);
        } else if (this.shapeType == 3) { // 空心矩形
            noFill();
            stroke(c);
            rect(0, 0, this.size * 0.9, this.size * 0.9);
        } else if (this.shapeType == 4) { // 十字線
            strokeWeight(this.size * 0.1); 
            stroke(c);
            noFill();
            line(0, -this.size * 0.45, 0, this.size * 0.45);
            line(-this.size * 0.45, 0, this.size * 0.45, 0);
        }
        pop();
        
        // 繪製拖曳線條
        strokeWeight(this.lineSW);
        stroke(c);
        line(this.x, this.y, this.fromX, this.fromY);
    }

    move() {
        let n = easeInOutExpo(norm(this.elapsedT, 0, this.duration));
        
        if (0 < this.elapsedT && this.elapsedT < this.duration) {
            if (this.actionPoints == this.maxActionPoints) {
                // 首次出現：尺寸從 0 增長到最大
                this.size = lerp(0, this.sizeMax, n);
            } else if (this.actionPoints > 0) {
                // 進行中的動作：尺寸變化或移動
                if (this.animationType == 0) {
                    this.size = lerp(this.fromSize, this.toSize, n);
                } else if (this.animationType == 1) { // 垂直移動
                    this.x = lerp(this.fromX, this.toX, n);
                    this.lineSW = lerp(0, this.size / 5, sin(n * PI));
                } else if (this.animationType == 2) { // 水平移動
                    this.y = lerp(this.fromY, this.toY, n);
                    this.lineSW = lerp(0, this.size / 5, sin(n * PI));
                } else if (this.animationType == 3) { // 變換形狀
                    if (this.changeShape == true) {
                        this.shapeType = int(random(5));
                        this.changeShape = false;
                    }
                }
                this.reductionRatio = lerp(1, 0.3, sin(n * PI)); // 脈衝或擠壓效果
            } else {
                // 消失：尺寸從當前大小縮小到 0
                this.size = lerp(this.fromSize, 0, n);
            }
        }

        this.elapsedT++;
        if (this.elapsedT > this.duration) {
            this.actionPoints--;
            this.init();
        }
        if (this.actionPoints < 0) {
            this.isDead = true; // 動作點耗盡，標記死亡
        }
    }

    run() {
        this.show();
        this.move();
    }

    init() {
        this.elapsedT = 0;
        this.fromSize = this.size;
        this.toSize = this.sizeMax * random(0.5, 1.5);
        this.fromX = this.x;
        // 隨機移動到周圍範圍
        this.toX = this.fromX + (canvasWidth / 10) * random([-1, 1]) * int(random(1, 4)); 
        this.fromY = this.y;
        this.toY = this.fromY + (canvasHeight / 10) * random([-1, 1]) * int(random(1, 4));
        this.animationType = int(random(4)); 
        this.duration = random(20, 50);
        this.changeShape = true; // 重設變換旗標
    }
}

// ------------------------------------------------
// DOM 選單與 iframe 覆蓋層邏輯 (P5.js 畫布外部的元素)

// 新增：左側固定選單（四項，字體 32px）
const leftMenu = document.createElement('aside');
leftMenu.id = 'leftMenu';
leftMenu.innerHTML = `
    <nav>
        <ul>
            <li id="menu-item-works">第一單元作品</li>
            <li id="menu-item-notes">第一單元講義</li>
            <li id="menu-item-quiz">測驗系統</li>
            <li id="menu-item-home">回到首頁</li>
        </ul>
    </nav>
`;
document.body.appendChild(leftMenu);

// 新增 CSS 樣式 (將所有樣式集中在這裡)
const style = document.createElement('style');
style.innerHTML = `
    /* 畫布的置中和背景樣式 */
    body {
        display: flex;
        justify-content: center; /* 水平置中 */
        align-items: center;     /* 垂直置中 */
        min-height: 100vh;
        overflow: hidden;
    }
    #center-canvas {
        display: block;
        border-radius: 12px;
        box-shadow: 0 0 30px rgba(255, 255, 255, 0.15); 
    }
    
    #leftMenu {
        position: fixed;
        left: 0;
        top: 0;
        height: 100vh;
        width: 300px;
        background: rgba(18,18,32,0.98);
        color: #ffffff;
        padding: 40px 24px;
        box-sizing: border-box;
        z-index: 9999;
        -webkit-font-smoothing: antialiased;
        transition: transform 0.3s ease-out;
    }
    #leftMenu nav ul { list-style: none; margin: 0; padding: 0; }
    #leftMenu nav ul li {
        font-size: 32px; /* 32px */
        margin: 20px 0;
        cursor: pointer;
        user-select: none;
        transition: color 0.2s;
    }
    #leftMenu nav ul li:hover { 
        color: #f71735; /* 懸停效果 */
    }

    /* iframe overlay */
    #iframeOverlay {
        position: fixed;
        inset: 0;
        display: none;
        align-items: center;
        justify-content: center;
        background: rgba(0,0,0,0.8); 
        z-index: 10000;
        backdrop-filter: blur(5px);
    }
    #iframeOverlay.visible { display: flex; }
    #iframeOverlay .iframe-wrap {
        position: relative;
    }
    #contentIframe {
        width: 70vw;       /* 70% 視窗寬 */
        height: 85vh;      /* 85% 視窗高 */
        border: none;
        border-radius: 6px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.8);
        background: #fff;
    }
    #closeIframe {
        position: absolute;
        right: -12px;
        top: -12px;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 2px solid #fff;
        background: #f71735; 
        color: #fff;
        font-size: 20px;
        line-height: 32px;
        text-align: center;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    }
`;
document.head.appendChild(style);

// 新增：iframe overlay 組件（預設隱藏）
const overlay = document.createElement('div');
overlay.id = 'iframeOverlay';
overlay.innerHTML = `
    <div class="iframe-wrap">
        <button id="closeIframe" aria-label="關閉">×</button>
        <iframe id="contentIframe" src="about:blank" allowfullscreen></iframe>
    </div>
`;
document.body.appendChild(overlay);

// 點擊處理：取得 DOM 元素
const worksBtn = document.getElementById('menu-item-works');
const notesBtn = document.getElementById('menu-item-notes'); 
const iframeOverlay = document.getElementById('iframeOverlay');
const contentIframe = document.getElementById('contentIframe');
const closeBtn = document.getElementById('closeIframe');

// 點擊處理：第一單元作品 => 顯示 iframe
worksBtn.addEventListener('click', () => {
    contentIframe.src = 'https://cfchengit.github.io/20251020/';
    iframeOverlay.classList.add('visible');
});

// 點擊處理：第一單元講義 => 由於 HackMD 網站阻止內嵌 (X-Frame-Options)，改為在新視窗開啟
notesBtn.addEventListener('click', () => {
    // 修正：使用 window.open 在新分頁開啟連結，以避免 X-Frame-Options 錯誤
    window.open('https://hackmd.io/@fKWOBZpQQz-vgaa-V2eHdQ/ByCNKmCill', '_blank');
    // 注意：因為是在新視窗開啟，不需要顯示 iframe overlay
});

// 點擊處理：測驗系統
document.getElementById('menu-item-quiz').addEventListener('click', () => {
    contentIframe.src = 'https://www.google.com/search?q=測驗系統'; // 替換為實際的測驗系統連結
    iframeOverlay.classList.add('visible');
});

// 關閉按鈕
closeBtn.addEventListener('click', () => {
    iframeOverlay.classList.remove('visible');
    // 延遲清空 src，避免背景持續載入
    setTimeout(() => { contentIframe.src = 'about:blank'; }, 300);
});

// 回到首頁
document.getElementById('menu-item-home').addEventListener('click', () => {
    window.location.href = '/'; 
});
