const onMessage = obj => console.log(obj);

// Read stream from lichess
const readStream = processLine => response => {
    const stream = response.body.getReader();
    const matcher = /\r?\n/;
    const decoder = new TextDecoder();
    let buf = '';
  
    const loop = () =>
      stream.read().then(({ done, value }) => {
        if (done) {
          if (buf.length > 0) processLine(JSON.parse(buf));
        } else {
          const chunk = decoder.decode(value, {
            stream: true
          });
          buf += chunk;
  
          const parts = buf.split(matcher);
          buf = parts.pop();
          for (const i of parts.filter(p => p)) processLine(JSON.parse(i));
          return loop();
        }
      });
  
    return loop();
  }

// Export games of a user
const exportGames = (root, username, readStream) => {
  const searchParams = new URLSearchParams({
    "finished": false,
  });
  fetch(`${root}/api/games/user/${username}?${searchParams}`, {
    method: "GET",
    headers: {
      "Accept": "application/x-ndjson",
    },
  }).then((res) => {
    if (res.ok) {
      return res;
    } else {
      console.error(res.statusText);
      throw new Error('Network response was not ok');
    }
  }
  ).then(readStream(onMessage));
}

// Get daily puzzle
const getPuzzle = (root, token) => {
  fetch(`${root}/api/puzzle/daily`, {
    method: "GET",
    headers: {
      "Accept": "application/x-ndjson",
      "Authorization": `Bearer ${token}`,
    },
  }).then((res)=> 
      res.json()
  ).then((puzzleData) => {
      console.log("Puzzle: ", puzzleData);
  })
}

module.exports = {readStream, exportGames, getPuzzle};
