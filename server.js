const WIDTH = 1000;
const HEIGHT = 600;
const SPEED = 3;
const LENGTH_PADDLE = 100;
const X_PADDLE_1 = 10;
const X_PADDLE_2 = (WIDTH - 10);
const MAX_SCORE = 5;
const MAX_DISCONNECT_TIME = 5;

//Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');

var app = express();
var server = http.Server(app);
var io = socketIO(server);

app.set('port', process.argv[2]);
app.use('/static', express.static(__dirname + '/static'));

// Routing
app.get('/', function(request, response) {response.sendFile(path.join(__dirname, 'index.html'));});

// Starts the server
server.listen(process.argv[2], function() {console.log('Starting server on port ' + process.argv[2]);});

// Add the WebSocket handlers
io.on('connection', function(socket) {});

var stateGame = {};   //setup stateGame
stateGame.scoreP1 = 0;
stateGame.scoreP2 = 0;

stateGame.players = {};
stateGame.playerNumber = 0;
stateGame.playersID = {}

var ball = {};
ball.speed = SPEED;
stateGame.ball = ball;

stateGame.paused = 2; // 0 = unpaused, 1 = paused, 2 = round start, 3 = end game

var disconnectTime;
var disconnectedPlayerID;

io.on('connection', function(socket)
{
  socket.on('new player', function() {
    stateGame.playerNumber++;
    if (stateGame.playerNumber === 1) //place 1st paddle
    {
      stateGame.players[socket.id] = {
        x: X_PADDLE_1,
        y: (HEIGHT / 2)
      };
      stateGame.playersID[1] = socket.id;
    }
    if (stateGame.playerNumber === 2) //place 2nd paddle
    {
      stateGame.players[socket.id] = {
        x: X_PADDLE_2,
        y: (HEIGHT / 2)
      };
      stateGame.playersID[2] = socket.id;
    }
    //RECONNECT
    /*
    if (stateGame.paused === 4)
    {
        if (data.user === stateGame.PlayersUser[1] || data.user === stateGame.PlayersUser[2])
          stateGame.paused === 0;
    }
    */
  });

  socket.on('movement', function(data) {
    if (stateGame.paused === 1 || stateGame.paused === 4) //exits if game is paused or player disconnected
      return ;

    var player = stateGame.players[socket.id] || {};
    if (data.up && player.y != (0 + (LENGTH_PADDLE / 2))) // move paddle up
      player.y -= 5;
    if (data.down && player.y != (HEIGHT - (LENGTH_PADDLE / 2))) // move paddle down
      player.y += 5;
  });

  socket.on('pause', function() {
    if (socket.id != stateGame.playersID[1] && socket.id != stateGame.playersID[2]) //exits if spectator tries to pause
      return;

    if (stateGame.paused === 0)
      stateGame.paused = 1;
    else if (stateGame.paused === 1)
      stateGame.paused = 0;
  });

  socket.on('disconnect', function() {
    if (socket.id != stateGame.playersID[1] && socket.id != stateGame.playersID[2]) //exits if spectator tries to pause
      return;
    stateGame.paused = 4;
    disconnectedPlayerID = socket.id;
    disconnectTime = new Date();
  });
});


function ball_move()
{
  if (stateGame.paused > 0) //exits if game is paused or round hasn't started
    return ;
  
  ball.x += (ball.speed * ball.direction_x); //ball moves
  ball.y += (ball.speed * ball.direction_y);

  if (ball.y <= 0 || ball.y >= HEIGHT) //ball hits top or bottom
    ball.direction_y *= -1;

  //ball hits paddles
  if (stateGame.playersID[1])
  {
    if (ball.x <= (X_PADDLE_1 + 10) && ball.y >= (stateGame.players[stateGame.playersID[1]].y - LENGTH_PADDLE / 2) && ball.y <= stateGame.players[stateGame.playersID[1]].y + LENGTH_PADDLE / 2)
    {
      ball.direction_y = (ball.y - stateGame.players[stateGame.playersID[1]].y) / (LENGTH_PADDLE / 2);
      ball.direction_x *= -1;
      ball.speed++;
    }
  }
  if (stateGame.playersID[2])
  {
    if (ball.x >= (X_PADDLE_2 - 10) && ball.y >= (stateGame.players[stateGame.playersID[2]].y - LENGTH_PADDLE / 2) && ball.y <= stateGame.players[stateGame.playersID[2]].y + LENGTH_PADDLE / 2)
    {
      ball.direction_y = (ball.y - stateGame.players[stateGame.playersID[2]].y) / (LENGTH_PADDLE / 2);
      ball.direction_x *= -1;
      ball.speed++;
    }
  }

  if (ball.x <= 0) //ball hits left side
  {
    stateGame.scoreP2++;
    newRound();
  }
  if (ball.x >= WIDTH) //ball hits right side
  {
    stateGame.scoreP1++;
    newRound();
  }
}

function newRound()
{
  if (stateGame.scoreP1 === MAX_SCORE || stateGame.scoreP2 === MAX_SCORE)
    stateGame.paused = 3;
  else
    stateGame.paused = 2;
  
  stateGame.ball.x = WIDTH / 2; //place ball
  stateGame.ball.y = HEIGHT / 2;
  randomizeDirections(stateGame.ball);
  ball.speed = SPEED;

  if (stateGame.players[stateGame.playersID[1]] && stateGame.players[stateGame.playersID[2]])
  {
    stateGame.players[stateGame.playersID[1]].y = HEIGHT / 2;
    stateGame.players[stateGame.playersID[2]].y = HEIGHT / 2;
  }
}

function randomizeDirections(ball)
{
  var rand = Math.random() * 2;
  if (rand < 1)
    ball.direction_x = -1;
  else
    ball.direction_x = 1;
  ball.direction_y = 0;
}


newRound();

setInterval(function()
{
  //new round
  if (stateGame.paused === 2 && stateGame.players[stateGame.playersID[1]] && stateGame.players[stateGame.playersID[2]])
  {
    if (stateGame.players[stateGame.playersID[1]].y != HEIGHT / 2 && stateGame.players[stateGame.playersID[2]].y != HEIGHT / 2)
      stateGame.paused = 0;
  }

  //new game
  if (stateGame.paused === 3 && stateGame.players[stateGame.playersID[1]] && stateGame.players[stateGame.playersID[2]])
  {
    if (stateGame.players[stateGame.playersID[1]].y != HEIGHT / 2 && stateGame.players[stateGame.playersID[2]].y != HEIGHT / 2)
    {
      stateGame.paused = 0;
      stateGame.scoreP1 = 0;
      stateGame.scoreP2 = 0;
    }
  }

  //disconnect win
  if (stateGame.paused === 4 && new Date() - disconnectTime > (MAX_DISCONNECT_TIME * 1000))
  {
    if (disconnectedPlayerID === stateGame.playersID[1])
      stateGame.scoreP2 = MAX_SCORE;
    if (disconnectedPlayerID === stateGame.playersID[2])
      stateGame.scoreP1 = MAX_SCORE;
    stateGame.paused = 3;
    newRound();
  }

  ball_move();
  io.sockets.emit('stateGame', stateGame);
}, 1000 / 60);
