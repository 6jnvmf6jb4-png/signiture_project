let currentMode = 'draw'; // 기본값을 'draw'로 설정// [1] 파이어베이스 연결 (에러가 나도 화면이 죽지 않도록 방어막 씌움)
let db;
try {
  const firebaseConfig = {
    apiKey: "AIzaSyCVUgHcYFsWfPi-Xm_T1FdvgTAUmzTdsYc",
    authDomain: "signiture-1bf46.firebaseapp.com",
    projectId: "signiture-1bf46",
    storageBucket: "signiture-1bf46.firebasestorage.app",
    messagingSenderId: "692434929950",
    appId: "1:692434929950:web:695650db09b0b7effe610f",
    measurementId: "G-3LCCD3R1Z0"
  };

  // 파이어베이스가 중복 실행되지 않도록 안전장치 추가
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  db = firebase.firestore();
  console.log("시스템: 파이어베이스 연결 성공");
} catch (e) {
  console.log("시스템: 파이어베이스 연결 실패 (화면은 계속 출력됩니다). 원인:", e);
}

// [2] 캔버스 및 그리기 변수들
let totalDistance = 0;      
let activeFrames = 0;       
let currentStroke = [];     
let allStrokes = [];

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight); 
  
  // 위치를 좌상단(0,0)에 고정
  canvas.position(0, 0); 
  
  // CSS로 스타일 강제 지정 (절대 위치 사용)
  canvas.style('position', 'absolute');
  canvas.style('display', 'block');
  canvas.style('z-index', '1');
  
  background(224, 224, 224); 
  
  // ... (이후 버튼들 생성 코드)
  // 초기 안내 텍스트
  fill(50);
  noStroke();
  textAlign(CENTER);
  textSize(28);
  textStyle(BOLD);
  text("PLEASE INPUT YOUR DATA.", width / 2, height / 2 - 150);

  // [버튼 1: 확인]
  let btn = createButton('확인');
  btn.position(20, 20); 
  btn.style('padding', '10px 20px');
  btn.style('z-index', '10'); 
  btn.mousePressed(evaluateSignature);
  
  // [버튼 2: 갤러리 보기]
  let galleryBtn = createButton('갤러리 보기');
  galleryBtn.position(90, 20); 
  galleryBtn.style('padding', '10px 20px');
  galleryBtn.style('z-index', '10'); 
  galleryBtn.mousePressed(() => {
    currentMode = 'gallery';
    background(255);
    fetchAndDrawSignatures();
  });

  // [버튼 3: 그리기 화면으로]
  let backBtn = createButton('그리기 화면으로');
  backBtn.position(190, 20); 
  backBtn.style('padding', '10px 20px');
  backBtn.style('z-index', '10'); 
  backBtn.mousePressed(() => {
    currentMode = 'draw';
    resetCanvas(); 
  });
}
function draw() {
  // 1. 그리기 모드일 때만 실시간으로 그림을 그립니다.
  if (currentMode === 'draw') {
    if (mouseIsPressed) {
      stroke(0);
      strokeWeight(2);
      line(pmouseX, pmouseY, mouseX, mouseY);

      // 데이터 기록 (나중에 저장하기 위함)
      currentStroke.push({x: mouseX, y: mouseY});
      totalDistance += dist(pmouseX, pmouseY, mouseX, mouseY);
      activeFrames++;
    }
  } 
  // 2. 갤러리 모드일 때는 아무것도 하지 않습니다.
  // (그림은 '갤러리 보기' 버튼을 눌렀을 때만 한 번에 그려집니다)
}

function mouseReleased() {
  if (currentStroke.length > 0) {
    allStrokes.push(currentStroke);
    currentStroke = []; 
  }
}

function evaluateSignature() {
  if (activeFrames === 0) {
    alert("내용을 입력해주세요.");
    return;
  }

  let avgSpeed = totalDistance / activeFrames;
  setTimeout(resetCanvas, 2000);

  // [수정 포인트 1] 최소 길이를 150에서 50으로 낮춤 (짧게 그려도 인정)
  if (totalDistance < 50) {
    background(245, 245, 245);
    fill(100);
    noStroke();
    textSize(20);
    textAlign(CENTER);
    text("인식 실패: 너무 조금 그리셨어요.", width / 2, height / 2);
  } 
  // [수정 포인트 2] 속도 기준을 25에서 15로 낮춤 (조금 느리게 그려도 휘갈긴 것으로 인정)
  else if (avgSpeed >= 15) {
    background(245, 245, 245); 
    fill(0, 150, 0);    
    noStroke();       
    textSize(24);
    textAlign(CENTER);
    text("입력값 확인됨", width / 2, height / 2 - 20);
    fill(100);
    textSize(16);
    text("데이터가 성공적으로 저장소로 이동했습니다.", width / 2, height / 2 + 20);

    if (db) {
      try {
        db.collection("signatures").add({
          path: JSON.stringify(allStrokes), 
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
          console.log("시스템 저장 완료");
        }).catch((error) => {
          console.log("파이어베이스 전송 실패:", error);
        });
      } catch (e) {
        console.log("파이어베이스 연결 오류:", e);
      }
    }
  } 
  // 위 두 조건에 해당하지 않으면 (속도가 느림 = 정성스럽게 씀)
  // 위 조건들에 해당하지 않을 때 (너무 정성스럽게 쓴 경우)
  else {
    background(245, 245, 245); 
    fill(255, 0, 0);           
    noStroke();
    textSize(24);
    textAlign(CENTER);
    // 아래 텍스트만 표시되도록 수정했습니다.
    text("인식 불가 - 오류", width / 2, height / 2);
  }
}
function resetCanvas() {
  background(224, 224, 224); 
  
  fill(50);
  noStroke();
  textAlign(CENTER);
  textSize(28);
  textStyle(BOLD);
  text("PLEASE INPUT YOUR DATA.", width / 2, height / 2 - 150);

  totalDistance = 0;
  activeFrames = 0;
  allStrokes = [];
}// 코드 맨 아래에 이 함수를 통째로 복사해서 붙여넣으세요.
function fetchAndDrawSignatures() {
  db.collection("signatures").get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      let strokes = JSON.parse(doc.data().path);
      
      // 1. 그림의 경계값 계산
      let minX = Infinity, minY = Infinity;
      let maxX = -Infinity, maxY = -Infinity;

      for (let s of strokes) {
        for (let p of s) {
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.y > maxY) maxY = p.y;
        }
      }

      let drawW = maxX - minX;
      let drawH = maxY - minY;

      // 2. 랜덤 위치 선정 (좌우/상하로 50px씩 여유를 줌 = 잘림 방지)
      let targetX = random(50, width - drawW - 50);
      let targetY = random(50, height - drawH - 50);
      
      stroke(0, 150); 
      strokeWeight(2);
      strokeJoin(ROUND);
      strokeCap(ROUND);
      noFill();
      
      // 3. translate 없이 직접 좌표 계산해서 그리기 (가장 확실함)
      for (let s of strokes) {
        beginShape();
        for (let p of s) {
          // 원래 좌표(p.x)에서 minX를 빼서 0으로 만들고, 
          // 타겟 위치(targetX)를 더해서 원하는 위치로 이동시킴
          vertex(p.x - minX + targetX, p.y - minY + targetY);
        }
        endShape();
      }
    });
  });
}
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // 크기 조절 후 배경색 다시 칠하기
  if (currentMode === 'gallery') {
    background(255);
    fetchAndDrawSignatures();
  } else {
    background(224, 224, 224);
    // 필요하다면 안내 문구 다시 그리기
  }
}