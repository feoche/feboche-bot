/* outa[bot] // app.js
	Copyright (c) 2012-2013 outa[dev].

   Modified by feoche (with YoruNoHikage agreement)
*/

(function () {

  var SEARCHWORDS = [
      'digital',
      'digitale',
      'digitales',
      'digitalisation',
      'digitaux'
    ],

    PROHIBITEDWORDS = [
      // The more at the end of this array the object is, the highest priority it has
      {
        queries: [
          /digital/,
          /digitaux/
        ],
        responses: [
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
          'Ne mets pas tes doigts dans le #digital, tu risques de te faire pincer très fort !',
          'Militons pour la défense des doigts de l\'Homme',
          'Le #digital, le travail d\'un orthopédiste main ?',
          'Alors, on laisse son empreinte dans le #digital ?',
          'Le #digital, le travail d\'un dermatologue ?',
          '...Je vais faire une main courante.',
          '🎵 Je mets le doigt devant, je mets le doigt derrière ! 🎶',
          'Vous travaillez sur le digital d\'une main de maître.',
          'On est passé à deux doigts du numérique ;)'
        ]
      },
      {
        queries: [
          /transformation\sdigital/,
          /#transformationdigital/
        ],
        responses: [
          'https://i.imgur.com/38Cs6G0.jpg',
          'https://i.imgur.com/hIwO2mF.jpg',
          'https://i.imgur.com/YALJMd8.jpg'
        ]
      },
      {
        queries: [
          /campagne\sdigital/
        ],
        responses: [
          'https://pbs.twimg.com/profile_banners/920311532382277632/1508254739'
        ]
      }
    ],

    EXCEPTIONS = [
      /dispositifs?\sdigital/,
      /empreintes?\sdigital/,
      /affichages?\sdigital/,
      /Digital/,
      /[_.\/#\-]digital/,
      /digital\snative/,
      /@\w*digital/
    ],

    EMOJIS = ['👐', '🙌', '👏', '🙏', '🤝', '👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌', '🤘', '👌', '👈', '👉', '👆', '👇', '☝', '✋', '🤚', '🖐', '🖖', '👋', '🤙', '✍', '💅', '🤳', '🤗'];

  //the twitter api module
  var ntwitter = require('ntwitter'),

    //the username of the bot. not set to begin with, we'll get it when authenticating
    botUsername = null,
    hasNotifiedTL = false,

    // List
    userTweets = [],

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
          userName = data.user && data.user.name,
          text = data.text;

        // If tweet contains any 'prohibited' subject
        if (containsRegExp(text, PROHIBITEDWORDS[0].queries)) {

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
              minprobability = 30, // 1/30 chance
              maxprobability = 1, // 1/1 chance
              probability = minprobability + ((followers - minfollowers) / (maxfollowers - minfollowers) * (maxprobability - minprobability));

            // Setting bounds if less than min (=1/30 chance) or more than max (=1/1 chance)
            if(followers < minfollowers) {
              probability = Math.max(minprobability, probability);
            }
            else if(followers > maxfollowers) {
              probability = Math.min(maxprobability, probability);
            }

            // Update the probability regarding the number of tweets
            userTweets[userName] = (userTweets[userName] + 1) || 1;
            probability = Math.min(probability, probability / (userTweets[userName] / 2));

            console.log('@' + userName + ' (' + followers + ' follows) : \t\t\t1/' + probability.toFixed(2) + ' chance');

            var random = Math.floor(Math.random() * probability);

            if (!random) {

              // Reset number of tweets
              if(userTweets[userName]) {
                userTweets[userName] = 0;
              }

              // If tweet doesn't contain any of the excluded terms
              if (!containsRegExp(text, EXCEPTIONS)) {

                for (var i = 0; i < PROHIBITEDWORDS.length; i++) {
                  var item = PROHIBITEDWORDS[i];
                  if (containsRegExp(text, item.queries)) {
                    result = item.responses[Math.floor(Math.random() * item.responses.length)];
                  }
                }

                // TWEET
                console.log('• TWEET:', data.text);
                var response = '@' + data.user.screen_name + " " + result,
                 tweetDone = response + ' \n' + EMOJIS[Math.floor(Math.random() * EMOJIS.length)] + ' http://www.academie-francaise.fr/digital ' + EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
                console.log('==> ', response);

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