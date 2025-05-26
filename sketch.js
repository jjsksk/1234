let video;
let poseNet;
let poses = [];

let roleImgs = [];
let veilImg;
let roles = [];

let score = 0;
let timer = 50;
let gameStarted = false;
let showInstructions = true;
let countdown = 10;
let startTime;
let heartPos;

function preload() {
  veilImg = loadImage("veil.png");
  for (let i = 6032; i <= 6037; i++) {
    if (i !== 6033) {
      roleImgs.push(loadImage(`IMG_${i}-removebg-preview.png`));
    }
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  poseNet = ml5.poseNet(video, () => {
    console.log("PoseNet Ready");
  });
  poseNet.on("pose", function(results) {
    poses = results;
  });

  heartPos = createVector(width * 0.4, height * 0.6);
  startTime = millis();
}

function draw() {
  background(255);
  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height);
  pop();

  if (showInstructions) {
    fill(0, 180);
    rect(0, 0, width, height);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(28);
    text("你是一位即將被逼婚的新娘！\n\n頭上會自動戴上頭紗\n請用「五指併攏」對著追求者拒絕他們！\n\n但要小心！如果他們碰到你左胸前的心臟會扣分！\n\n準備倒數：" + countdown, width / 2, height / 2);
    if (millis() - startTime >= 1000) {
      countdown--;
      startTime = millis();
    }
    if (countdown <= 0) {
      showInstructions = false;
      gameStarted = true;
      startTime = millis();
    }
    return;
  }

  if (gameStarted) {
    let elapsed = floor((millis() - startTime) / 1000);
    timer = 50 - elapsed;
    if (timer <= 0) {
      gameStarted = false;
    }

    drawHeart();

    for (let r of roles) {
      r.update();
      r.display();
    }

    drawVeil();

    detectRejection();
    detectHeartTouch();

    fill(0);
    textSize(24);
    textAlign(LEFT, TOP);
    text(`分數：${score}`, 10, 10);
    text(`剩餘時間：${timer}s`, 10, 40);

    if (roles.length < 10 && frameCount % 30 === 0) {
      roles.push(new Role());
    }

  } else {
    fill(0, 180);
    rect(0, 0, width, height);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(32);
    text(`遊戲結束！你的總分：${score}\n\n按下 R 鍵重新開始`, width / 2, height / 2);
  }
}

function keyPressed() {
  if (!gameStarted && key === 'r') {
    score = 0;
    roles = [];
    countdown = 10;
    showInstructions = true;
    startTime = millis();
  }
}

function drawVeil() {
  if (poses.length > 0) {
    let head = poses[0].pose.keypoints.find(p => p.part === 'nose');
    if (head && head.score > 0.5) {
      imageMode(CENTER);
      image(veilImg, width - head.position.x, head.position.y - 50, 200, 200);
    }
  }
}

function drawHeart() {
  push();
  noStroke();
  fill(255, 0, 0, 100);
  let t = millis() / 200;
  let s = 30 + sin(t) * 10;
  heartPos.set(width * 0.4, height * 0.6);
  translate(heartPos.x, heartPos.y);
  beginShape();
  for (let a = 0; a < TWO_PI; a += 0.1) {
    let r = s * (1 - sin(a)) * 0.5;
    let x = r * cos(a);
    let y = r * sin(a);
    vertex(x, y);
  }
  endShape(CLOSE);
  pop();
}

function detectRejection() {
  if (poses.length > 0) {
    let pose = poses[0].pose;
    let rightWrist = pose.rightWrist;

    if (rightWrist.confidence > 0.5) {
      for (let i = roles.length - 1; i >= 0; i--) {
        if (dist(width - rightWrist.x, rightWrist.y, roles[i].x, roles[i].y) < 50) {
          score += roles[i].point;
          roles.splice(i, 1);
          break;
        }
      }
    }
  }
}

function detectHeartTouch() {
  for (let i = roles.length - 1; i >= 0; i--) {
    if (dist(roles[i].x, roles[i].y, heartPos.x, heartPos.y) < 40) {
      score -= 3;
      roles.splice(i, 1);
    }
  }
}

class Role {
  constructor() {
    this.img = random(roleImgs);
    this.x = random(width);
    this.y = random(height);
    this.vx = random(-2, 2);
    this.vy = random(-2, 2);
    this.point = floor(random(1, 8));
    this.size = 40;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < 0 || this.x > width) this.vx *= -1;
    if (this.y < 0 || this.y > height) this.vy *= -1;
  }

  display() {
    imageMode(CENTER);
    image(this.img, this.x, this.y, this.size, this.size);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function touchStarted() {
  userStartVideo();
}
