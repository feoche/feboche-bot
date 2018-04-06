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
  consumer_key: process.env.CONSUMER_TOKEN || args.ctoken,
  consumer_secret: process.env.CONSUMER_SECRET || args.csecret,
  access_token_key: process.env.ACCESS_TOKEN_KEY || args.akey,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET || args.asecret
})

console.log(`Logged in`)
initStreaming()

function containsRegExp (text, array) {
  return array.some(rx => rx.test(text))
}

function streamCallback (stream) {
  console.log(`streaming`)

  stream.on(`data`, tweet => {
    // If text exists & only french tweets
    if (tweet.text && tweet.lang === `fr`) {
      let result = ``
      let userName = tweet.user && tweet.user.screen_name
      let text = tweet.text

      if (containsRegExp(text, data.PROHIBITEDWORDS[0].queries) &&                // If tweet contains any `prohibited` subject
        !containsRegExp(text, data.EXCEPTIONS) &&                                 // If tweet doesn`t contain any of the excluded terms
        !containsRegExp(text, [/RT\s\@/]) &&                                      // Tweet is not a Retweet
        !recordedTweets.includes(tweet.text) &&                                   // Tweet has not been already answered
        tweet.user.screen_name.toLowerCase() !== botUsername.toLowerCase() &&     // If user is not the bot itself
        tweet.retweeted_status === undefined                                      // If bot has not already tweeted this
      ) {
        let followers = (tweet.user && tweet.user.followers_count) || 0

        let probability =
          data.MINPROBABILITY +
          (followers - data.MINFOLLOWERS) /
          (data.MAXFOLLOWERS - data.MINFOLLOWERS) *
          (data.MAXPROBABILITY - data.MINPROBABILITY)

        // Update the probability regarding the number of tweets
        userTweets[userName] = {
          postedTweets: (!containsRegExp(text, data.EXCEPTIONS) && ((userTweets[userName] && userTweets[userName].postedTweets + 1) || 1)) || 0
        }
        probability = Math.min(
          probability,
          probability / ((userTweets[userName] && userTweets[userName].postedTweets) / 2)
        )

        // Setting bounds if less than min (=1/30 chance) or more than max (=1/1 chance)
        if (followers < data.MINFOLLOWERS) {
          probability = Math.max(data.MINPROBABILITY, probability)
        } else if (followers > data.MAXFOLLOWERS) {
          probability = Math.min(data.MAXPROBABILITY, probability)
        }

        let random = Math.floor(Math.random() * probability)
        console.info(
          '\x1b[36m', ('[' + tweet.user.screen_name + ']').padStart(20),                                   // User
          '\x1b[34m', ('[' + followers + 'f-' + ((1 / probability) * 100).toFixed(0) + '%]').padEnd(10),   // Followers + Probability
          '\x1b[0m', (tweet.text.replace('\n', '').trim().replace(/(\r\n\t|\n|\r\t)/gm, '')).padEnd(140)   // Title
        );
        if (!random) {
          for (let item of data.PROHIBITEDWORDS) {
            if (containsRegExp(text, item.queries)) {
              result = item.responses[Math.floor(Math.random() * item.responses.length)]
            }
          }
          // Log it
          let tweetDone = `@${tweet.user.screen_name} ${result} \n${data.EMOJIS[Math.floor(Math.random() * data.EMOJIS.length)]} ${data.LINKS[Math.floor(Math.random() * data.LINKS.length)]} ${data.EMOJIS[Math.floor(Math.random() * data.EMOJIS.length)]}`
          console.log(`—> `, tweetDone.trim().replace(/(\r\n\t|\n|\r\t)/gm, ''))
          if (!args.test) { // TWEET
            console.info('tweetDone.substring(0, data.MAXTWEETLIMIT) : ', tweetDone.substring(0, data.MAXTWEETLIMIT));
            console.info('tweet.id_str : ', tweet.id_str);
            twitterAPI.post('statuses/update', {
                status:tweetDone.substring(0, data.MAXTWEETLIMIT),
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
    }
  })
  // if something happens, call the onStreamError function
  stream.on(`end`, onStreamError)
  stream.on(`error`, onStreamError)
}

function onStreamError (err, code) {
  console.error(`Error (${code} - ${JSON.stringify(err)}) - Reloading...`)
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
