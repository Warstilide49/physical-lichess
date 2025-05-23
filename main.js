require('dotenv').config();
const readline = require('readline');
const {readStream} = require('./helperFunctions.js');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => {
  return new Promise(resolve => rl.question(query, resolve));
}


const root = "https://lichess.org";
const token = process.env.LICHESS_TOKEN;

const createAndStreamGame = async (color, timeInSeconds) => {
  const res = await fetch(`${root}/api/challenge/ai`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `level=2&clock.limit=${timeInSeconds}&clock.increment=0&color=${color}`
  });

  const json = await res.json();
  console.log(json);
  const gameId = json.id;

  console.log(`New game created: ${root}/${gameId}`);

  fetch(`${root}/api/board/game/stream/${gameId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }).then(readStream(event => {
    console.log('Event:', event);
    if (event.type === 'gameState' && event.status=== 'started') {
      console.log('Moves so far:', event.moves);
      if(event.moves.split(' ').length%2 === (color === 'white' ? 0 : 1)) {
        try {
          sendMoveTerminal(gameId);
        }
        catch (err) {
          if(err.message === 'draw') {
            // End the game by sending a draw request and wait for the response
          }
          else if(err.message === 'resign') {
            // End the game by sending a resign request
          }
          else {
            console.error('Error:', err);
          }
        }
      }
    }
    else if (event.type === 'mate') {
      console.log('Game over:', event);
    }
    
  }));
}

const sendMoveTerminal = async (gameId) => {
  // Need to handle if the player wants to offer a draw or resign
  const move = await askQuestion('Enter your next move: ');
  if (move === 'draw' || move === 'resign') {
    return Error(`${move}`);
  }
  sendMove(gameId, move)
  .catch(err => {
    console.error('Error sending move:', err);
  })
}

const sendMove = async (gameId, move) => {
  const res = await fetch(`${root}/api/board/game/${gameId}/move/${move}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  console.log(res);
  if (res.ok) {
    console.log('Move sent:', move);
  } else {
    console.error('Error sending move:', res.statusText);
  };

}

// const currentGameId = "BXuW7xsZ"

// sendMove(currentGameId, "b2b3")
// sendMoveTerminal(currentGameId);
createAndStreamGame("white", 300);