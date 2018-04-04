import ntwitter from 'ntwitter'
import minimist from 'minimist'
import {data} from './data.js'

// Retrieve args
const args = minimist(process.argv.slice(2))

// the username of the bot. not set to begin with, we'll get it when authenticating
let botUsername = null
let hasNotifiedTL = false
let userTweets = []
let lastPostedTweet = Date.now()

// create an object using the keys we just determined
let twitterAPI = new ntwitter({
  consumer_key: process.env.CONSUMER_TOKEN || args.ctoken,
  consumer_secret: process.env.CONSUMER_SECRET || args.csecret,
  access_token_key: process.env.ACCESS_TOKEN_KEY || args.akey,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET || args.asecret
})

twitterAPI.verifyCredentials((error, userdata) => {
  if (error) {
    console.error(error)
    process.exit(1)
  } else {
    botUsername = userdata.screen_name
    console.log(`Logged in as [${botUsername}]`)
    initStreaming()
  }
})

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
        !containsRegExp(text, [/RT\s\@/]) &&                                      // Tweet is not a Retweet
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

        console.info(
          "\x1b[36m", ("[" + tweet.user.screen_name + "]").padStart(20),                             // User
          "\x1b[34m", ("[" + followers + "]").padStart(6),                             // Followers
          "\x1b[34m", ("[" + ((1 / probability) * 100).toFixed(0) + "%]").padStart(5), // Probability
          "\x1b[0m", (tweet.text.replace('\n', '')).padEnd(140)                        // Title
        );

        let random = Math.floor(Math.random() * probability)

        if (!random) {
          // If tweet doesn`t contain any of the excluded terms
          if (!containsRegExp(text, data.EXCEPTIONS)) {
            for (let item of data.PROHIBITEDWORDS) {
              if (containsRegExp(text, item.queries)) {
                result = item.responses[Math.floor(Math.random() * item.responses.length)]
              }
            }

            // Log it
            let response = `@${tweet.user.screen_name} ${result}`
            let tweetDone = `${response} \n${data.EMOJIS[Math.floor(Math.random() * data.EMOJIS.length)]} ${data.LINKS[Math.floor(Math.random() * data.LINKS.length)]} ${data.EMOJIS[Math.floor(Math.random() * data.EMOJIS.length)]}`
            console.log(`—> `, response)

            if (!args.test) { // TWEET
              twitterAPI.updateStatus(
                tweetDone.substring(0, data.MAXTWEETLIMIT),
                {in_reply_to_status_id: tweet.id_str},
                (error, statusData) => {
                  // when we got a response from twitter, check for an error (which can occur pretty frequently)
                  if (error) {
                    console.error(error)
                  } else {
                    // Reset number of tweets
                    if (userTweets[userName]) {
                      userTweets[userName].postedTweets = 0
                      userTweets[userName].lastTweet = Date.now()
                      lastPostedTweet = Date.now()
                    }
                  }
                }
              )
            }
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
  console.error(`Error (${code} - ${err}) - Reloading...`)
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
