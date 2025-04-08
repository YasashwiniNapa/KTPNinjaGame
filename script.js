const ninja = document.getElementById("ninja");
const obstacle = document.getElementById("obstacle");
const scoreDisplay = document.getElementById("score");

let isJumping = false;
let score = 0;

function jump() {
  if (isJumping) return;
  isJumping = true;

  let position = 0;

  const upInterval = setInterval(() => {
    if (position >= 100) {
      clearInterval(upInterval);

      const downInterval = setInterval(() => {
        if (position <= 0) {
          clearInterval(downInterval);
          isJumping = false;
        } else {
          position -= 5;
          ninja.style.bottom = position + "px";
        }
      }, 20);
    } else {
      position += 5;
      ninja.style.bottom = position + "px";
    }
  }, 20);
}

function startGame() {
  let obstaclePosition = -50;

  const gameLoop = setInterval(() => {
    if (obstaclePosition >= 850) {
      obstaclePosition = -50;
      score++;
      scoreDisplay.textContent = "Score: " + score;
    } else {
      obstaclePosition += 5;
    }
    obstacle.style.right = obstaclePosition + "px";

    const ninjaBottom = parseInt(window.getComputedStyle(ninja).bottom);

    if (
      obstaclePosition > 650 &&
      obstaclePosition < 700 &&
      ninjaBottom < 50
    ) {
      clearInterval(gameLoop);
      alert("Game Over. Final Score: " + score);
      location.reload();
    }
  }, 20);
}

document.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.key === " " || e.key === "Spacebar") {
    jump();
  }
});

startGame();
