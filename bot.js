import Twitter from 'twitter';
import minimist from 'minimist';
import MarkovChain from 'markovchain';
import data from './data.js';
import fs from 'fs';

// Retrieve args
const args = minimist(process.argv.slice(2));

let tweets = data || [];

// create an object using the keys we just determined
// let twitterAPI = new Twitter({
//   consumer_key: process.env.CONSUMER_TOKEN || args.consumer_key,
//   consumer_secret: process.env.CONSUMER_SECRET || args.consumer_secret,
//   access_token_key: process.env.ACCESS_TOKEN_KEY || args.access_token_key,
//   access_token_secret: process.env.ACCESS_TOKEN_SECRET || args.access_token_secret
// })
const twitterAPI = new Twitter({
  consumer_key: '82QnFpIsTCOmAxhlSVrbWC8XU',
  consumer_secret: 'gN999Z2fAyIpKQhi6H5V8zSx4AHMBsH2BTrtRtjiWcCmrCj1r7',
  access_token_key: '1009809110248849409-2pzcXZSQ6Q087suplTsT2Y4yDe1S43',
  access_token_secret: 'i6uiVmb6lgzU5OLcXB8mOsd2tA7QmWas0hFAhZ7Fc3Xbd'
});

const tweet = newTweet => {
  if (!args.test) {
    twitterAPI.post('statuses/update', {
        status: newTweet.substring(0, 280)
      },
      error => {
        if (error) {
          console.error('Error: ', error);
        }
      }
    );
  }
}

const generateMarkov = string => {
  // Filter tweets
  string = string.replace(/\@\w+|(?:https?|ftp):\/\/[\n\S]+/g, '');

  const markov = new MarkovChain(string);

  let newTweet = markov.end(30).process(); // Set the word limit to 30

  // Prettify the output
  newTweet = newTweet.charAt(0).toUpperCase() + newTweet.slice(1);
  newTweet = newTweet.replace(/([,!] )(\w)/g, (match, $1, $2) => {
    return `${$1}\n${$2.toUpperCase()}`;
  }).substring(0, 280);

  console.info(
    '\x1b[96m', ('[' + new Date().toLocaleTimeString() + ']').padStart(10),
    '\x1b[0m', newTweet.trim().replace(/(\r\n\t|\n|\r\t)/gm, '').padEnd(125)
  );

  tweet(newTweet.substring(0, 280));
};

const populateData = () => {
  twitterAPI.get('statuses/user_timeline', {
    'screen_name': 'feoche',
    'count': '200',
    'include_rts': false
  }, (err, data) => {
    if (!err) {
      console.info('tweets : ', tweets.length);
      for (let i = 0; i < data.length; i++) {
        tweets.push(data[i].text);
      }
    }
  })

  tweets = [...new Set(tweets.map(text => text.replace(/\s\s/g, ' ').replace(/(?:Cc\s)|(?:\.?\@)\w+|(?:https?|ftp):\/\/[\n\S]+/gmi, '').trim()).filter(elem => elem.length))];

  fs.writeFile('data.js', 'export default ' + JSON.stringify(tweets, 2, 2), err => console.error(err));
}

const onStreamError = err => {
  console.error(`Error (${err}) - Reloading...`)
  setTimeout(initStreaming, 10000)
}

const initStreaming = () => {
  // initialize the stream and everything else
  twitterAPI.stream(
    `statuses/filter`,
    {
      follow: `feoche`,
      language: `fr`
    },
    streamCallback
  )
}

const streamCallback = stream => {
  console.log(`streaming`)

  stream.on(`data`, tweet => {

  })
  // if something happens, call the onStreamError function
  stream.on(`end`, onStreamError)
  stream.on(`error`, onStreamError)

  // Start tweeting !
  generateMarkov(data.join('\n'));
  setInterval(() => {
    generateMarkov(data.join('\n'));
  }, 1000 * 60 * 60 * 24);
}

populateData();
initStreaming();
