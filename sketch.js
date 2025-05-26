// 必要變數
let video;
let handpose;
let predictions = [];
let gameState = "intro"; // intro, playing, ended
let startTime;
let timer = 60;
let score = 0;
let characters = [];
let heartPos;
let veilImg;
let characterImgs = [];
let charData = [
  { src: "IMG_6032-removebg-preview.png", score: 4 },
  { src: "IMG_6034-removebg-preview.png", score: 7 },
  { src: "IMG_6036-removebg-preview.png", score: 5 },
  { src: "IMG_6035-removebg-preview.png", score: 6 },
  { src: "IMG_6037-removebg-preview.png", score: 3 },
];

function preload() {
  veilImg = loadImage("veil.png"); // 需準備婚紗頭紗圖片
  for (let c of charData) {
    characterImgs.push(loadImage(c.src));
  }
}

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  handpose = ml5.handpose(video, () => console.log("Handpose model ready"));
  handpose.on("predict", results => predictions = results);

  heartPos = createVector(width / 2 - 100, height / 2 + 50);
  textAlign(CENTER, CENTER);
  textSize(18);
}

function draw() {
  image(video, 0, 0, width, height);

  drawHeart();
  drawVeil();
  if (gameState === "intro") {
    drawIntro();
    if (millis() > 10000) {
      gameState = "playing";
      startTime = millis();
    }
  } else if (gameState === "playing") {
    updateCharacters();
    drawCharacters();
    checkRejections();
    drawUI();
    checkHeartCollision();

    if (millis() - startTime > timer * 1000) {
      gameState = "ended";
    }
  } else if (gameState === "ended") {
    drawCharacters();
    drawUI();
    fill(255, 0, 0);
    textSize(32);
    text("遊戲結束！\n總分：" + score, width / 2, height / 2);
    textSize(18);
    text("點擊畫面重新開始", width / 2, height / 2 + 50);
  }
}

function mousePressed() {
  if (gameState === "ended") {
    gameState = "intro";
    score = 0;
    characters = [];
    predictions = [];
  }
}

function drawIntro() {
  fill(0, 150);
  rect(0, 0, width, height);
  fill(255);
  textSize(24);
  text("歡迎參加拒婚挑戰！\n舉起五指合併的手拒絕追求者！\n若角色靠近你的心會扣分！", width / 2, height / 2);
}

function drawUI() {
  fill(0);
  rect(0, 0, 150, 50);
  fill(255);
  text("剩餘時間：" + max(0, int(timer - (millis() - startTime) / 1000)), 75, 15);
  text("分數：" + score, 75, 35);
}

function drawHeart() {
  push();
  noStroke();
  fill(255, 0, 0, 127);
  let beat = 10 * sin(millis() / 200);
  translate(heartPos.x, heartPos.y);
  beginShape();
  for (let a = 0; a < TWO_PI; a += 0.1) {
    let r = 15 + beat;
    let x = r * 16 * pow(sin(a), 3);
    let y = -r * (13 * cos(a) - 5 * cos(2 * a) - 2 * cos(3 * a) - cos(4 * a));
    vertex(x, y);
  }
  endShape(CLOSE);
  pop();
}

function drawVeil() {
  if (predictions.length > 0) {
    let face = predictions[0].annotations;
    let topHead = face.midpoint[0];
    image(veilImg, topHead[0] - 100, topHead[1] - 150, 200, 200);
  }
}

function updateCharacters() {
  // 控制角色數量上限為10
  if (characters.length < 10 && frameCount % 30 === 0) {
    let idx = floor(random(characterImgs.length));
    let c = {
      img: characterImgs[idx],
      x: random(width),
      y: random(height),
      dx: random(-1, 1),
      dy: random(-1, 1),
      size: 40,
      score: charData[idx].score
    };
    characters.push(c);
  }

  for (let c of characters) {
    c.x += c.dx;
    c.y += c.dy;
    if (c.x < 0 || c.x > width) c.dx *= -1;
    if (c.y < 0 || c.y > height) c.dy *= -1;
  }
}

function drawCharacters() {
  for (let c of characters) {
    image(c.img, c.x, c.y, c.size, c.size);
  }
}

function checkRejections() {
  if (predictions.length > 0) {
    let hand = predictions[0].annotations;
    let tips = ["thumb", "indexFinger", "middleFinger", "ringFinger", "pinky"].map(f => hand[f][3]);

    let isClosed = tips.every((p, i, arr) => {
      if (i === 0) return true;
      return dist(p[0], p[1], arr[i - 1][0], arr[i - 1][1]) < 30;
    });

    if (isClosed) {
      for (let i = characters.length - 1; i >= 0; i--) {
        let c = characters[i];
        let hx = tips[2][0];
        let hy = tips[2][1];
        if (dist(hx, hy, c.x, c.y) < 40) {
          score += c.score;
          characters.splice(i, 1);
        }
      }
    }
  }
}

function checkHeartCollision() {
  for (let i = characters.length - 1; i >= 0; i--) {
    let c = characters[i];
    if (dist(c.x, c.y, heartPos.x, heartPos.y) < 40) {
      score -= 3;
      characters.splice(i, 1);
    }
  }
}
