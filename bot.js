import Twitter from 'twitter'
import minimist from 'minimist'
import {data} from './data.js'

// Retrieve args
const args = minimist(process.argv.slice(2))

// the username of the bot. not set to begin with, we'll get it when authenticating
let botUsername = null
let userTweets = []
let recordedTweets = []

// create an object using the keys we just determined
let twitterAPI = new Twitter({
  consumer_key: process.env.CONSUMER_TOKEN || args.consumer_key,
  consumer_secret: process.env.CONSUMER_SECRET || args.consumer_secret,
  access_token_key: process.env.ACCESS_TOKEN_KEY || args.access_token_key,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET || args.access_token_secret
})

console.log(`Logged in`)
initStreaming()

function containsRegExp (text, array) {
  let res = [];
  for (let regexp of array) {
    let match = text.match(regexp)
    if (match) {
      res.push(match);
    }
  }
  return res.length && res || false;
}

function pickRand (data) {
  return Math.floor(Math.random() * data)
}

function streamCallback (stream) {
  console.log(`streaming`)

  stream.on(`data`, tweet => {
    if (isAllowedTweet(tweet)) {
      let result = ``
      let userName = tweet.user && tweet.user.screen_name
      let text = tweet.text
      let followers = (tweet.user && tweet.user.followers_count) || 0

      userTweets[userName] = {postedTweets: (userTweets[userName] && userTweets[userName].postedTweets || 0) + 1}
      let probability =
        Math.max(
          (data.MINPROBABILITY +
          (followers - data.MINFOLLOWERS) *
          (data.MAXPROBABILITY - data.MINPROBABILITY)) /
          data.MAXFOLLOWERS,
          data.MAXPROBABILITY)

      probability = Math.min(probability, probability / (userTweets[userName].postedTweets / 2))
      console.info(
        '\x1b[36m', ('[' + userName + ']').padStart(20),                                   // User
        '\x1b[34m', ('[' + followers + 'f-' + ((1 / probability) * 100).toFixed(0) + '%]').padEnd(10),   // Followers + Probability
        '\x1b[0m', (tweet.text.replace('\n', '').trim().replace(/(\r\n\t|\n|\r\t)/gm, '')).padEnd(140)   // Title
      );

      if (!pickRand(probability)) {
        for (let item of data.PROHIBITEDWORDS) {
          if (containsRegExp(text, item.queries)) {
            result = item.responses[pickRand(item.responses.length)]
          }
        }
        // Log it
        let tweetDone = `@${userName} ${result} \n${data.EMOJIS[pickRand(data.EMOJIS.length)]} ${data.LINKS[pickRand(data.LINKS.length)]} ${data.EMOJIS[pickRand(data.EMOJIS.length)]}`
        console.log(`—> `, tweetDone.trim().replace(/(\r\n\t|\n|\r\t)/gm, ''))
        if (!args.test) { // TWEET
          debugger;
          twitterAPI.post('statuses/update', {
              status: tweetDone.substring(0, data.MAXTWEETLIMIT),
              in_reply_to_status_id: tweet.id_str
            },
            (error) => {
              if (error) {
                console.error('Error: ', error)
              } else {
                // Reset number of tweets
                if (userTweets[userName]) {
                  userTweets[userName].postedTweets = 0
                  userTweets[userName].lastTweet = Date.now()
                }
              }
            }
          )
        }
      }
    }
  })
  // if something happens, call the onStreamError function
  stream.on(`end`, onStreamError)
  stream.on(`error`, onStreamError)
}

function onStreamError (err) {
  console.error(`Error (${err}) - Reloading...`)
  setTimeout(initStreaming, 5000)
}

function initStreaming () {
  // initialize the stream and everything else
  twitterAPI.stream(
    `statuses/filter`,
    {
      track: data.SEARCHWORDS.join(`,`),
      language: `fr`
    },
    streamCallback
  )
}

function isAllowedTweet (tweet) {
  return tweet.text &&                                                      // Tweet contains text
    tweet.lang === `fr` &&                                                  // Tweet is in french
    containsRegExp(tweet.text, data.PROHIBITEDWORDS[0].queries) &&          // Tweet contains `prohibited` words
    !containsRegExp(tweet.text, data.EXCEPTIONS) &&                         // Tweet doesn`t contain any of the excluded terms
    !containsRegExp(tweet.text, [/RT\s\@/]) &&                              // Tweet is not a Retweet
    !recordedTweets.includes(tweet.text) &&                                 // Tweet has not been already answered
    tweet.retweeted_status === undefined                                    // If bot has not already tweeted this
}
