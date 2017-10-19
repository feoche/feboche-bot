/* outa[bot] // app.js
	Copyright (c) 2012-2013 outa[dev].

   Modified by feoche (with YoruNoHikage agreement)
*/

(function () {

  var SEARCHWORDS = [
    'digital',
    'digitale',
    'digitales'
  ];

  var PROHIBITEDWORDS = {
      small: [
        /digital/,
        /digitale/,
        /digitales/
      ],
      medium: [],
      hard: [
        /transformation\sdigitale/,
        /#transformationdigitale/
      ]
    },

    EXCEPTIONS = [
      /dispositif\sdigital/,
      /empreinte\sdigital/,
      /affichage\sdigital/,
      /Digital/,
      /[_.\/#]digital/,
      /digital\snative/,
      /@\w*digital/
    ],

    RESPONSES = {
      small: [
        'Vive le #digital !',
        'Le #digital c\'est la vie.',
        'Le #digital est notre ami.',
        'Si y\'a du #digital, c\'est légal',
        'Un #digital, et ça repart !',
        '#Digital un jour, #digital toujours !',
        'Tu l\'as dit, gital !',
        'Que la force du #digital soit avec toi !',
        'Un certain doigté dans votre tweet !',
        '#Digitalement vôtre.',
        '#Digitalisatioooon ! /o/',
        'On croise les doigts pour que le #digital perdure !',
        'Oh, on a mis le doigt sur quelque chose?',
        'Avec le #digital, non seulement on peut, mais on doigt.',
        '- Vous voulez du #digital? - Juste un doigt.',
        'Avec le #digital, on se met le doigt dans l\'œil',
        'Le #digital, c\'est mon p\'tit doigt qui me l\'a dit !',
        'Le #digital vous obéit au doigt et à l\'œil !',
        'Aujourd\'hui, grâce à vous, le #digital est montré du doigt.',
        'Un effort, vous touchez du doigt le numérique !',
        'On peut aussi ne rien faire de ses dix doigts, avec le #digital',
        'Le #digital et le numérique, ils sont comme les doigts de la main',
        'Attention, d\'ici je peux voir vos doigts de fée du #digital ;)',
        'Là, clairement, vous mettez le doigt sur la plaie.',
        'Popopo ! Carton jaune monsieur l\'arbitre !',
        'Le #digital, vous connaissez ça sur le bout des doigts.',
        '"Le #digital? C\'est trop génial !" - Louis XVI',
        '"Le #digital? SWAG !" - Victor Hugo',
        'On est passé à deux doigts du numérique ;)'
      ],
      medium: [
        'https://cdn.firstwefeast.com/assets/2014/06/Homemade-Twix-Bars.jpg'
      ],
      hard: [
        'https://i.imgur.com/38Cs6G0.jpg',
        'https://i.imgur.com/hIwO2mF.jpg',
        'https://i.imgur.com/YALJMd8.jpg'
      ]
    },

    EMOJIS = ['👐', '🙌', '👏', '🙏', '🤝', '👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌', '🤘', '👌', '👈', '👉', '👆', '👇', '☝', '✋', '🤚', '🖐', '🖖', '👋', '🤙', '✍', '💅', '🤳', '🤗'];

  //the twitter api module
  var ntwitter = require('ntwitter'),

    //the username of the bot. not set to begin with, we'll get it when authenticating
    botUsername = null,
    hasNotifiedTL = false,

    //create an object using the keys we just determined
    twitterAPI = new ntwitter({
      "consumer_key": process.env.CONSUMER_TOKEN,
      "consumer_secret": process.env.CONSUMER_SECRET,
      "access_token_key": process.env.ACCESS_TOKEN_KEY,
      "access_token_secret": process.env.ACCESS_TOKEN_SECRET
    });

  //check if we have the rights to do anything
  twitterAPI.verifyCredentials(function (error, userdata) {
    if (error) {
      //if we don't, we'd better stop here anyway
      console.log(error);
      process.exit(1);
    } else {
      //the credentials check returns the username, so we can store it here
      botUsername = userdata.screen_name;
      console.log("logged in as [" + userdata.screen_name + "]");

      //start listening to tweets that contain the bot's username using the streaming api
      initStreaming();
    }
  });

  function contains(text, array) {
    return array.indexOf(text) > -1;
  }

  function containsRegExp(text, array) {
    return array.some(function (rx) {
      return rx.test(text)
    });
  }

  function streamCallback(stream) {
    console.log("streaming");

    stream.on('data', function (data) {
      // If text exists & only french tweets
      if (data.text && data.lang === 'fr') {
        var result = '',
          text = data.text;

        // If tweet contains any 'digital' subject
        if (containsRegExp(text, PROHIBITEDWORDS.small.concat(PROHIBITEDWORDS.medium).concat(PROHIBITEDWORDS.hard))) {

          //a few checks to see if we should reply
          if (data.user.screen_name.toLowerCase() !== botUsername.toLowerCase() &&
            // if it wasn't sent by the bot itself
            data.retweeted_status === undefined) {

            /*
            // RETWEET
            // and if it isn't a retweet of one of our tweets
            console.log("[" + data.id_str + "] tweet from [" + data.user.screen_name + "]");
            // retweet
            console.log("Trying to retweet [" + data.id + "]");
            twitterAPI.retweetStatus(data.id_str,
              function (error, statusData) {
                //when we got a response from twitter, check for an error (which can occur pretty frequently)
                if (error) {
                  errorTwitter(error, statusData);
                } else {
                  //if we could send the tweet just fine
                  console.log("[" + statusData.retweeted_status.id_str + "] ->retweeted from [" + statusData.retweeted_status.user.screen_name + "]");
                  //check if there's "[TL]" in the name of the but
                  var tweetLimitCheck = statusData.user.name.match(/(\[TL\]) (.*)/);
                  //if we just got out of tweet limit, we need to update the bot's name
                  if (tweetLimitCheck !== null) {
                    //DO EET
                    twitterAPI.updateProfile({name: tweetLimitCheck[2]}, function (error, data) {
                      if (error) {
                        console.log("error while trying to change username (going OUT of TL)");
                      } else {
                        hasNotifiedTL = true;
                        console.log("gone OUT of tweet limit");
                      }
                    });
                  }
                }
              }
            );*/

            var followers = (data.user && data.user.followers_count) || 0,
              minfollowers = 100,
              maxfollowers = 200000,
              minprobability = 50, // 1/50 chance
              maxprobability = 1, // 1/1 chance
              probability = minprobability + ((followers - minfollowers) / (maxfollowers - minfollowers) * (maxprobability - minprobability));

            probability = followers < minfollowers ? minprobability * 2 : followers > maxfollowers ? maxprobability : probability;

            var random = Math.floor(Math.random() * probability);

            console.log((data.user && '@' + data.user.name) + '(' + followers + 'follows)');

            if (!random) {

              // If tweet doesn't contain any of the excluded terms
              if (!containsRegExp(text, EXCEPTIONS)) {

                // If they want to learn it the hard way
                if (containsRegExp(text, PROHIBITEDWORDS.hard)) {
                  result = RESPONSES.hard[Math.floor(Math.random() * RESPONSES.hard.length)];
                }
                // If they are brave enough to tweet that, 100% sure they'll get that
                else if (containsRegExp(text, PROHIBITEDWORDS.medium)) {
                  // Need to randomize the number of tweets we are checking
                  result = RESPONSES.small[Math.floor(Math.random() * RESPONSES.small.length)];
                }
                // If the tweet severity is not that harmful
                else {
                  // Need to randomize the number of tweets we are checking
                  result = RESPONSES.small[Math.floor(Math.random() * RESPONSES.small.length)];
                }
                // TWEET
                console.log('text:', data.text);
                var tweetDone = '@' + data.user.screen_name + " " + result + ' \n' + EMOJIS[Math.floor(Math.random() * EMOJIS.length)] + ' http://www.academie-francaise.fr/digital ' + EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
                setTimeout(function () {
                  //reply to the tweet that mentionned us
                  twitterAPI.updateStatus(tweetDone.substring(0, 139), {in_reply_to_status_id: data.id_str},
                    function (error, statusData) {
                      //when we got a response from twitter, check for an error (which can occur pretty frequently)
                      if (error) {
                        console.log(error);
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
                                twitterAPI.updateProfile({name: '[TL] ' + data[0].name}, function (error) {
                                  if (error) {
                                    console.log("error while trying to change username (going IN TL)");
                                  } else {
                                    console.log("gone IN tweet limit");
                                  }
                                });
                              }
                            }
                          });
                        }
                      } else {
                        //check if there's "[TL]" in the name of the but
                        //if we just got out of tweet limit, we need to update the bot's name
                        if (statusData.user.name.match(/(\[TL\]) (.*)/) !== null) {
                          //DO EET
                          twitterAPI.updateProfile({name: tweetLimitCheck[2]}, function (error) {
                            if (error) {
                              console.log("error while trying to change username (going OUT of TL)");
                            } else {
                              hasNotifiedTL = true;
                              console.log("gone OUT of tweet limit");
                            }
                          });
                        }
                      }
                    }
                  );
                }, 30000);
              }
            }
          }
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
    console.log("Streaming ended (" + e.code || "unknown" + ")");
    setTimeout(initStreaming, 5000);
  }

  function initStreaming() {
    //initialize the stream and everything else
    twitterAPI.stream('statuses/filter', {track: SEARCHWORDS.join(',')}, streamCallback);
  }

})();