/* outa[bot] // app.js
	Copyright (c) 2012-2013 outa[dev].

   Modified by feoche (with YoruNoHikage agreement)
*/

(function () {

  var PROHIBITEDWORDS = {
      small: [
        /digital/,
        /digitale/,
        /digitales/
      ],
      medium: [],
      hard: [
        /transformation\sdigitale/
      ]
    },

    EXCEPTIONS = [
      /affichage\sdigital/,
      /photo\sdigital/,
      /Digital\sFactory/,
      /@\w*digital/,
      /\/\/digital/
    ],

    RESPONSES = {
      small: [
        'Vive le digital !',
        'Le digital c\'est la vie.',
        'Le digital est notre ami.',
        'Si y\'a du digital, c\'est légal',
        'Un digital, et ça repart !',
        'Digital un jour, digital toujours !',
        'Tu l\'as dit, gital !',
        'Que le force du digital soit avec toi !',
        'Un certain doigté dans votre tweet !'
      ],
      medium: [],
      hard: [
        'https://i.imgur.com/38Cs6G0.jpg',
        'https://i.imgur.com/hIwO2mF.jpg',
        'https://i.imgur.com/YALJMd8.jpg'
      ]
    };

  //the twitter api module
  var twitter = require('twitter'),
    lngDetector = new (require('languagedetect')),
    LogUtils = require('./lib/LogUtils.js'),

    //the username of the bot. not set to begin with, we'll get it when authenticating
    botUsername = null,
    hasNotifiedTL = false;

  //create an object using the keys we just determined
  var twitterAPI = new twitter({
    consumer_key: process.env.CONSUMER_TOKEN,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token_key: process.env.ACCESS_TOKEN_KEY,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET
  });

  //check if we have the rights to do anything
  twitterAPI.verifyCredentials(function (userdata) {
    //the credentials check returns the username, so we can store it here
    botUsername = userdata.screen_name;
    LogUtils.logtrace("logged in as [" + userdata.screen_name + "]", LogUtils.Colors.CYAN);

    //start listening to tweets that contain the bot's username using the streaming api
    initStreaming();
  });

  function contains(text, array) {
    return array.some(function (rx) {
      return rx.test(text)
    });
  }

  function errorTwitter(error) {
    LogUtils.logtrace(error, LogUtils.Colors.RED);

    if (error.statusCode === 403 && !hasNotifiedTL) {
      //if we're in tweet limit, we will want to indicate that in the name of the bot
      //so, if we aren't sure we notified the users yet, get the current twitter profile of the bot
      twitterAPI.showUser(botUsername, function (error, data) {
        if (!error) {
          if (data[0].name.match(/(\[TL\]) (.*)/)) {
            //if we already changed the name but couldn't remember it (maybe it was during the previous session)
            hasNotifiedTL = true;
          } else {
            //if the name of the bot hasn't already been changed, do it: we add "[TL]" just before its normal name
            twitterAPI.updateProfile({name: '[TL] ' + data[0].name}, function (error, data) {
              if (error) {
                LogUtils.logtrace("error while trying to change username (going IN TL)", LogUtils.Colors.RED);
              } else {
                LogUtils.logtrace("gone IN tweet limit", LogUtils.Colors.RED);
              }
            });
          }
        }
      });
    }
  }

  function streamCallback(stream) {
    LogUtils.logtrace("streaming", LogUtils.Colors.CYAN);

    stream.on('data', function (data) {
      LogUtils.logtrace("data :", data);

      //if it's actually there
      if (data.text !== undefined) {

        //a few checks to see if we should reply
        if (data.user.screen_name.toLowerCase() !== botUsername.toLowerCase() && 			// if it wasn't sent by the bot itself
          data.retweeted_status === undefined) {									                    // and if it isn't a retweet of one of our tweets

          LogUtils.logtrace("[" + data.id_str + "] tweet from [" + data.user.screen_name + "]", LogUtils.Colors.GREEN);

          // retweet
          LogUtils.logtrace("Trying to retweet [" + data.id + "]", LogUtils.Colors.CYAN);
          twitterAPI.retweetStatus(data.id_str,
            function (error, statusData) {
              //when we got a response from twitter, check for an error (which can occur pretty frequently)
              if (error) {
                errorTwitter(error, statusData);
              } else {
                //if we could send the tweet just fine
                LogUtils.logtrace("[" + statusData.retweeted_status.id_str + "] ->retweeted from [" + statusData.retweeted_status.user.screen_name + "]", LogUtils.Colors.GREEN);

                //check if there's "[TL]" in the name of the but
                var tweetLimitCheck = statusData.user.name.match(/(\[TL\]) (.*)/);

                //if we just got out of tweet limit, we need to update the bot's name
                if (tweetLimitCheck !== null) {
                  //DO EET
                  twitterAPI.updateProfile({name: tweetLimitCheck[2]}, function (error, data) {
                    if (error) {
                      LogUtils.logtrace("error while trying to change username (going OUT of TL)", LogUtils.Colors.RED);
                    } else {
                      hasNotifiedTL = true;
                      LogUtils.logtrace("gone OUT of tweet limit", LogUtils.Colors.RED);
                    }
                  });
                }
              }
            }
          );

          var result = '';

          LogUtils.logtrace(data.text, LogUtils.Colors.CYAN);

          var text = data.text.toLowerCase();

          if (lngDetector.detect(text, 1)[0][0] === 'french') { // Only french tweets
            if (contains(text, PROHIBITEDWORDS.small.concat(PROHIBITEDWORDS.medium).concat(PROHIBITEDWORDS.hard))) { // If tweet contains 'digital'

              if (!contains(text, EXCEPTIONS)) { // If tweet doesn't contain any of the excluded terms

                if (contains(text, PROHIBITEDWORDS.small)) { // If the tweet severity is not that harmful
                  // Let's pick a random sentence to tweet
                  result = RESPONSES.small[Math.floor(Math.random() * RESPONSES.small.length)];
                }
                else if (contains(text, PROHIBITEDWORDS.medium)) { // If they are brave enough to tweet that, 100% sure they'll get that
                  result = RESPONSES.small[Math.floor(Math.random() * RESPONSES.small.length)];
                }
                else { // They'll learn it the hard way
                  result = RESPONSES.hard[Math.floor(Math.random() * RESPONSES.hard.length)];
                }

                var today = new Date();
                var tweetDone = '@' + data.user.screen_name + " " + result + " " + (today.getHours()) % 24 + "h" + ('0' + today.getMinutes()).slice(-2);
                LogUtils.logtrace(tweetDone, LogUtils.Colors.YELLOW);

                //reply to the tweet that mentionned us
                twitterAPI.updateStatus(tweetDone.substring(0, 139), {in_reply_to_status_id: data.id_str},
                  function (error, statusData) {
                    //when we got a response from twitter, check for an error (which can occur pretty frequently)
                    if (error) {
                      errorTwitter(error, statusData);
                    } else {
                      //if we could send the tweet just fine
                      LogUtils.logtrace("[" + statusData.in_reply_to_status_id_str + "] ->replied to [" + statusData.in_reply_to_screen_name + "]", LogUtils.Colors.GREEN);

                      //check if there's "[TL]" in the name of the but
                      //if we just got out of tweet limit, we need to update the bot's name
                      if (statusData.user.name.match(/(\[TL\]) (.*)/) !== null) {
                        //DO EET
                        twitterAPI.updateProfile({name: tweetLimitCheck[2]}, function (error, data) {
                          if (error) {
                            LogUtils.logtrace("error while trying to change username (going OUT of TL)", LogUtils.Colors.RED);
                          } else {
                            hasNotifiedTL = true;
                            LogUtils.logtrace("gone OUT of tweet limit", LogUtils.Colors.RED);
                          }
                        });
                      }
                    }
                  }
                );
              }
            }
          }
        } else {
          LogUtils.logtrace("data.text is not defined", LogUtils.Colors.RED);
          console.log("Data: %j", data);
        }
      }
    });

    //if something happens, call the onStreamError function
    stream.on('end', onStreamError);
    stream.on('error', onStreamError);

    //automatically disconnect every 30 minutes (more or less) to reset the stream
    setTimeout(stream.destroy, 1000 * 60 * 30);
  }

  function onStreamError(e) {
    //when the stream is disconnected, connect again
    LogUtils.logtrace("Streaming ended (" + e.code || "unknown" + ")", LogUtils.Colors.RED);
    setTimeout(initStreaming, 5000);
  }

  function initStreaming() {
    //initialize the stream and everything else
    var keyWords = PROHIBITEDWORDS.small.concat(PROHIBITEDWORDS.medium).concat(PROHIBITEDWORDS.hard);
    twitterAPI.stream('statuses/filter', {track: keyWords.join(', ')}, streamCallback);
  }

})();