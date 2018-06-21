import Twitter from 'twitter';
import minimist from 'minimist';
import MarkovChain from 'markovchain';
import { data } from './data.js';

// Retrieve args
const args = minimist(process.argv.slice(2));

let userTweets = '';

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

const generateMarkov = string => {
  // Filter tweets
  string = string.replace(/\@\w+|(?:https?|ftp):\/\/[\n\S]+/g, '');

  const markov = new MarkovChain(string);

  let newTweet = markov.end(30).process(); // Set the word limit to 30
  // If the new lyrics are too short or are over Twitter's 280 characters limit, we just generate some new ones
  if (newTweet.length < 20 || newTweet.length > 280) {
    generateMarkov(string);
  }

  // Prettify the output
  newTweet = newTweet.charAt(0).toUpperCase() + newTweet.slice(1);
  newTweet = newTweet.replace(/([,!] )(\w)/g, (match, $1, $2) => {
    return `${$1}\n${$2.toUpperCase()}`;
  });

  twitterAPI.post('statuses/update', {
      status: newTweet.substring(0, 280)
    },
    error => {
      if (error) {
        console.error('Error: ', error);
      }
    }
  );
};
generateMarkov(data.join('\n'));
setInterval(() => {
  generateMarkov(data.join('\n'));
}, 1000 * 60 * 60 * 24);

// twitterAPI.get('statuses/user_timeline', {
//   'screen_name': 'feoche',
//   'count': '200',
//   'exclude_replies': true,
//   'include_rts': false
// }, (err, data) => {
//   if(!err) {
//     for (let i = 0; i < data.length; i++) {
//       userTweets += data[i].text + '\n';
//     }
//     generateMarkov(userTweets);
//     setInterval(() => {
//       generateMarkov(userTweets);
//     }, 10000);
//   }
// })
