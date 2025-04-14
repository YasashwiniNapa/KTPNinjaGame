import { useState, useEffect, useRef } from 'react';

export default function NinjaRunnerGame() {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [ninjaY, setNinjaY] = useState(250);
  const [obstacles, setObstacles] = useState([]);
  const [debug, setDebug] = useState(false);
  
  // Refs for animation and game state management
  const requestRef = useRef(null);
  const scoreIntervalRef = useRef(null);
  const obstacleIntervalRef = useRef(null);
  const jumpingRef = useRef(false);
  const jumpVelocityRef = useRef(0);
  const spriteFrameRef = useRef(0);
  
  // Game constants
  const GROUND_Y = 250;
  const JUMP_VELOCITY = -12;
  const GRAVITY = 0.6;
  const NINJA_WIDTH = 40;
  const NINJA_HEIGHT = 50;
  const OBSTACLE_WIDTH = 40;
  const OBSTACLE_HEIGHT = 60;
  const GAME_SPEED = 5;
  
  // Greek letters to use as obstacles
  const greekLetters = ['Κ', 'Θ', 'Π'];

  useEffect(() => {
    // Initial game setup
    return () => {
      // Cleanup on component unmount
      cancelAnimationFrame(requestRef.current);
      clearInterval(scoreIntervalRef.current);
      clearInterval(obstacleIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      // Start the game loop
      startGameLoop();
      
      // Setup keyboard event listeners
      window.addEventListener('keydown', handleKeyDown);
      
      // Start score counter
      scoreIntervalRef.current = setInterval(() => {
        setScore(prev => prev + 1);
      }, 100);
      
      // Start generating obstacles
      generateObstacles();
      
      return () => {
        // Cleanup when game state changes
        window.removeEventListener('keydown', handleKeyDown);
        cancelAnimationFrame(requestRef.current);
        clearInterval(scoreIntervalRef.current);
        clearInterval(obstacleIntervalRef.current);
      };
    }
  }, [gameStarted, gameOver]);

  const startGameLoop = () => {
    const animate = () => {
      // Update game state
      updateGameState();
      // Request next frame
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
  };

  const updateGameState = () => {
    // Update ninja position (jumping physics)
    if (jumpingRef.current) {
      setNinjaY(prev => {
        const newY = prev + jumpVelocityRef.current;
        jumpVelocityRef.current += GRAVITY;
        
        // Landing check
        if (newY >= GROUND_Y) {
          jumpingRef.current = false;
          return GROUND_Y;
        }
        return newY;
      });
    }
    
    // Update sprite animation frame
    spriteFrameRef.current = (spriteFrameRef.current + 0.2) % 8;
    
    // Update obstacles and check collisions
    setObstacles(prevObstacles => {
      // Move obstacles left
      const updatedObstacles = prevObstacles
        .map(obstacle => ({
          ...obstacle,
          x: obstacle.x - GAME_SPEED
        }))
        .filter(obstacle => obstacle.x > -OBSTACLE_WIDTH);
      
      // Calculate ninja feet position (the critical part for collision)
      const ninjaFeetY = ninjaY;
      
      // Ninja horizontal hitbox (only the body part that can collide)
      const ninjaHitboxX = 50;
      const ninjaHitboxWidth = NINJA_WIDTH - 20;
      
      for (const obstacle of updatedObstacles) {
        const obstacleHitboxX = obstacle.x;
        const obstacleHitboxWidth = OBSTACLE_WIDTH - 10;
        const obstacleTopY = GROUND_Y - OBSTACLE_HEIGHT;
        
        // Check horizontal overlap
        const horizontalOverlap = 
          ninjaHitboxX < obstacleHitboxX + obstacleHitboxWidth &&
          ninjaHitboxX + ninjaHitboxWidth > obstacleHitboxX;
        
        // Check vertical position - only collide if ninja's feet are below obstacle top
        // and the ninja is also overlapping horizontally
        // The +5 gives a small margin to make the collision feel natural
        const verticalCollision = ninjaFeetY - 5 > obstacleTopY;
        
        if (horizontalOverlap && verticalCollision) {
          handleGameOver();
          break;
        }
      }
      
      return updatedObstacles;
    });
  };

  const generateObstacles = () => {
    // Create new obstacles at random intervals
    const minInterval = 1500;
    const maxInterval = 3000;
    
    const createObstacle = () => {
      const randomLetter = greekLetters[Math.floor(Math.random() * greekLetters.length)];
      setObstacles(prev => [...prev, {
        x: 800,
        letter: randomLetter,
        id: Date.now()
      }]);
      
      // Schedule next obstacle
      const nextInterval = Math.random() * (maxInterval - minInterval) + minInterval;
      obstacleIntervalRef.current = setTimeout(createObstacle, nextInterval);
    };
    
    // Create first obstacle
    obstacleIntervalRef.current = setTimeout(createObstacle, 2000);
  };

  const handleKeyDown = (e) => {
    // Jump when space or up arrow is pressed
    if ((e.code === 'Space' || e.key === 'ArrowUp') && !jumpingRef.current && !gameOver) {
      jump();
    }
    
    // Restart game with Enter key
    if (e.key === 'Enter' && gameOver) {
      startGame();
    }
    
    // Toggle debug mode with 'D' key
    if (e.key === 'd' || e.key === 'D') {
      setDebug(prev => !prev);
    }
  };

  const jump = () => {
    if (!jumpingRef.current && !gameOver) {
      jumpingRef.current = true;
      jumpVelocityRef.current = JUMP_VELOCITY;
    }
  };

  const startGame = () => {
    // Reset game state
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setNinjaY(GROUND_Y);
    setObstacles([]);
    jumpingRef.current = false;
    spriteFrameRef.current = 0;
  };

  const handleGameOver = () => {
    setGameOver(true);
    
    // Update high score
    if (score > highScore) {
      setHighScore(score);
    }
    
    // Stop all game loops
    cancelAnimationFrame(requestRef.current);
    clearInterval(scoreIntervalRef.current);
    clearTimeout(obstacleIntervalRef.current);
  };

  // Determine sprite position based on game state
  const getNinjaSpritePosition = () => {
    if (gameOver) {
      // Death animation
      return `0 -150px`;
    } else if (jumpingRef.current) {
      // Jump animation
      return `0 -50px`;
    } else {
      // Run animation (cycle through frames)
      const frame = Math.floor(spriteFrameRef.current);
      return `${-30 * frame}px 0`;
    }
  };

  // Calculate ninja feet position for debug display
  const getNinjaFeetY = () => {
    return ninjaY;
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-4">Ninja Runner</h1>
      
      <div className="flex justify-between w-full max-w-2xl mb-2">
        <div className="text-lg">Score: {score}</div>
        <div className="text-lg">High Score: {highScore}</div>
      </div>
      
      <div 
        className="relative w-full max-w-2xl h-80 bg-gray-200 border-b-4 border-gray-400 overflow-hidden"
        onClick={() => {
          if (!gameStarted) {
            startGame();
          } else if (!gameOver) {
            jump();
          } else {
            startGame();
          }
        }}
      >
        {!gameStarted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-20">
            <div className="text-2xl font-bold mb-4">Click or press Space to start</div>
          </div>
        )}
        
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-20 z-10">
            <div className="text-2xl font-bold mb-4">Game Over</div>
            <div className="text-xl mb-4">Your score: {score}</div>
            <button 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={startGame}
            >
              Play Again
            </button>
          </div>
        )}
        
        {/* Debug hitbox visualizers */}
        {debug && gameStarted && !gameOver && (
          <>
            {/* Ninja hitbox */}
            <div 
              className="absolute border-2 border-red-500 opacity-50"
              style={{
                left: '50px', 
                top: `${ninjaY - 5}px`,
                width: `${NINJA_WIDTH - 20}px`,
                height: '5px',
              }}
            />
            
            {/* Obstacle hitboxes */}
            {obstacles.map(obstacle => (
              <div 
                key={`debug-${obstacle.id}`}
                className="absolute border-2 border-green-500 opacity-50"
                style={{
                  left: `${obstacle.x}px`,
                  top: `${GROUND_Y - OBSTACLE_HEIGHT}px`,
                  width: `${OBSTACLE_WIDTH - 10}px`,
                  height: `${OBSTACLE_HEIGHT}px`,
                }}
              />
            ))}
          </>
        )}
        
        {/* Ninja character */}
        {gameStarted && (
          <div 
            className="absolute left-12"
            style={{
              top: `${ninjaY - NINJA_HEIGHT}px`,
              width: `${NINJA_WIDTH}px`,
              height: `${NINJA_HEIGHT}px`,
              backgroundPosition: getNinjaSpritePosition(),
              backgroundSize: '240px 200px', // Adjust based on your sprite sheet
              backgroundImage: "url('/api/placeholder/240/200')", // Replace with actual sprite sheet
            }}
          />
        )}
        
        {/* Obstacles (Greek letters) */}
        {obstacles.map(obstacle => (
          <div 
            key={obstacle.id}
            className="absolute font-bold text-4xl flex items-center justify-center"
            style={{
              left: `${obstacle.x}px`,
              top: `${GROUND_Y - OBSTACLE_HEIGHT}px`,
              width: `${OBSTACLE_WIDTH}px`,
              height: `${OBSTACLE_HEIGHT}px`,
              color: '#1e40af'
            }}
          >
            {obstacle.letter}
          </div>
        ))}
        
        {/* Ground */}
        <div 
          className="absolute w-full h-1 bg-gray-600"
          style={{ top: `${GROUND_Y}px` }}
        />
      </div>
      
      <div className="mt-4 text-center text-gray-600">
        Press Space or Up Arrow to jump • Click to jump • Press Enter to restart
        {debug && 
          <div className="text-sm">
            DEBUG MODE: Ninja Y: {Math.round(ninjaY)} • Press D to toggle debug
          </div>
        }
      </div>
    </div>
  );
}