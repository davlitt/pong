
const WIDTH = 1000;
const HEIGHT = 600;

const LENGTH_PADDLE = 100;
const WIDTH_PADDLE = 10;

var socket = io();

var movement = {
    up: false,
    down: false,
  }
  document.addEventListener('keydown', function(event) {
    switch (event.keyCode) {
      case 38: // UP
        movement.up = true;
        break;
      case 40: // DOWN
        movement.down = true;
        break;
    }
  });
  document.addEventListener('keyup', function(event) {
    switch (event.keyCode) {
      case 38: // UP
        movement.up = false;
        break;
      case 40: // DOWN
        movement.down = false;
        break;
    }
  });

socket.emit('new player');
setInterval(function() { socket.emit('movement', movement); }, 1000 / 60);

document.addEventListener('keypress', function(event) {
  if (event.keyCode === 32)
  socket.emit('pause');
});

var canvas = document.getElementById('canvas');
canvas.width = WIDTH;
canvas.height = HEIGHT;
var context = canvas.getContext('2d');

socket.on('stateGame', function(stateGame)
{
  context.clearRect(0, 0, WIDTH, HEIGHT); //draw paddles
  context.fillStyle = 'green';
  for (var id in stateGame.players)
  {
    var player = stateGame.players[id];
    context.fillRect((player.x - (WIDTH_PADDLE / 2)), (player.y - (LENGTH_PADDLE / 2)), WIDTH_PADDLE, LENGTH_PADDLE);
  }

  context.fillStyle = 'red';  //draw ball
  context.beginPath();
  context.arc(stateGame.ball.x, stateGame.ball.y, 10, 0, 2 * Math.PI);
  context.fill();

  context.fillStyle = 'black'; //draw score
  context.textAlign = 'center';
  context.font = '40px Arial';
  context.fillText(stateGame.scoreP1 + " Score " + stateGame.scoreP2, WIDTH / 2, 40);

  if (stateGame.paused === 1) //game paused
  {
    context.font = '60px Arial';
    context.fillText("GAME PAUSED", WIDTH / 2, (HEIGHT / 2) - 20);
    context.font = '20px Arial';
    context.fillText("Press spacebar to resume", WIDTH / 2, (HEIGHT / 2) + 10);
  }

  if (stateGame.paused === 2) //round start
  {
    context.font = '50px Arial';
    context.fillText("Move to start round", WIDTH / 2, (HEIGHT / 2) - 30);
  }

  if (stateGame.paused === 3) //game end
  {
    context.font = '60px Arial';
    context.fillText(((stateGame.scoreP1 > stateGame.scoreP2) ? "PLAYER 1" : "PLAYER 2") + " WON", WIDTH / 2, (HEIGHT / 2) - 20);
    context.font = '30px Arial';
    context.fillText("Move to start new game", WIDTH / 2, (HEIGHT / 2) + 40);
  }
});
