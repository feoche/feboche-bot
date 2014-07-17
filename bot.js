/* outa[bot] // app.js
	Copyright (c) 2012-2013 outa[dev].
	
   Modified by YoruNoHikage (with outadoc's agreement)
*/

(function() {
	//the twitter api module
	var ntwitter = require('ntwitter'),
		LogUtils = require('./lib/LogUtils.js'),

		//the username of the bot. not set to begin with, we'll get it when authenticating
		botUsername = null,
		hasNotifiedTL = false,

		//get the config (API keys, etc.)
		config = require('./config.json'),

		//create an object using the keys we just determined
		twitterAPI = new ntwitter(config.keys);
	
	//check if we have the rights to do anything
	twitterAPI.verifyCredentials(function(error, userdata) {
		if (error) {
			//if we don't, we'd better stop here anyway
			LogUtils.logtrace(error, LogUtils.Colors.RED);
			process.exit(1);
		} else {
			//the credentials check returns the username, so we can store it here
			botUsername = userdata.screen_name;
			LogUtils.logtrace("logged in as [" + userdata.screen_name + "]", LogUtils.Colors.CYAN);

			//start listening to tweets that contain the bot's username using the streaming api
			initStreaming();
		}
	});
	
	function errorTwitter(error, statusData) {
		LogUtils.logtrace(error, LogUtils.Colors.RED);

		if(error.statusCode == 403 && !hasNotifiedTL) {
			//if we're in tweet limit, we will want to indicate that in the name of the bot
			//so, if we aren't sure we notified the users yet, get the current twitter profile of the bot
			twitterAPI.showUser(botUsername, function(error, data) {
				if(!error) {
					if(data[0].name.match(/(\[TL\]) (.*)/)) {
						//if we already changed the name but couldn't remember it (maybe it was during the previous session)
						hasNotifiedTL = true;
					} else {
						//if the name of the bot hasn't already been changed, do it: we add "[TL]" just before its normal name
						twitterAPI.updateProfile({name: '[TL] ' + data[0].name}, function(error, data) {
							if(error) {
								LogUtils.logtrace("error while trying to change username (going IN TL)", LogUtils.Colors.RED);
							} else {
								LogUtils.logtrace("gone IN tweet limit", LogUtils.Colors.RED);
							}
						});
					}
				}
			})
		}
	}
	
	function streamCallback(stream) {
		LogUtils.logtrace("streaming", LogUtils.Colors.CYAN);
		
		stream.on('data', function(data) {
			//if it's actually there
			if(data.text !== undefined) {
				
				//a few checks to see if we should reply
				if(data.user.screen_name.toLowerCase() != botUsername.toLowerCase() 			//if it wasn't sent by the bot itself
					&& config.blacklist.indexOf(data.user.screen_name) == -1 					//if the sender isn't in the blacklist
					&& data.retweeted_status === undefined) {									//and if it isn't a retweet of one of our tweets
					
					LogUtils.logtrace("[" + data.id_str + "] tweet from [" + data.user.screen_name + "]", LogUtils.Colors.GREEN);
					
					// retweet
					LogUtils.logtrace("Trying to retweet [" + data.id + "]", LogUtils.Colors.CYAN);
					twitterAPI.retweetStatus(data.id_str, 
						function(error, statusData) {
							//when we got a response from twitter, check for an error (which can occur pretty frequently)
							if(error) {
								errorTwitter(error, statusData);
							} else {
								//if we could send the tweet just fine
								LogUtils.logtrace("[" + statusData.retweeted_status.id_str + "] ->retweeted from [" + statusData.retweeted_status.user.screen_name + "]", LogUtils.Colors.GREEN);
								
								//check if there's "[TL]" in the name of the but
								var tweetLimitCheck = statusData.user.name.match(/(\[TL\]) (.*)/);	

								//if we just got out of tweet limit, we need to update the bot's name
								if(tweetLimitCheck != null) {
									//DO EET
									twitterAPI.updateProfile({name: tweetLimitCheck[2]}, function(error, data) {
										if(error) {
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

					if(data.text.indexOf('patate volante') != -1 ||
					data.text.indexOf('patate ailée') != -1 ||
					data.text.indexOf('patate avion') != -1 ||
					data.text.indexOf('patate fusée') != -1 ||
					data.text.indexOf('tubercule volant') != -1 ||
					data.text.indexOf('tubercule volant') != -1 ||
					data.text.indexOf('pomme de terre volante') != -1)
					{
							var rand = parseInt(Math.random() * (4 - 0) + 0);
							switch(rand) {
								case 3 :
									result = 'Patate volante oui c\'est moi ! La seule l\'unique !';
									break;
								case 2:
									result = "Patate volante un jour, patate volante toujours !";
									break;
								case 1:
									result = "Les patates volantes sont nos amies.";
									break;
								case 0:
									result = "Vive les patates volantes.";
									break;
								default:
									result = 'Take your stinking paws off me, you damn dirty human ! ';
									break;
							}
					}

					else if(data.text.indexOf('frite volante') != -1 ||
						data.text.indexOf('chips volante') != -1)
						data.text.indexOf('vodka volante') != -1)
						result = 'Le tout à base de patate volante bien sûr !!!';

					else if(data.text.indexOf('gratin dauphinois') != -1)
						result = 'Noooon ! Pas en gratin !';

					else if(data.text.indexOf('patates sautées') != -1)
						result = 'Les patates volantes sautées ne retombe pas dans la poêle !';

					else if(data.text.indexOf('pomme de terre rôtie') != -1)
						result = 'N\'essayez pas de nous rôtire, les patates volantes sont des dures à cuire.';

					else if(data.text.indexOf('patate farcie') != -1 ||
					data.text.indexOf('patates farcies') != -1)
						result = 'Éventrer des patates est interdit pas la convention de genève.';

					else if(data.text.indexOf('pomme de terre rôtie') != -1)
						result = 'N\'essayez pas de nous rôtire, les patates volantes sont des dures à cuire.';

					else if(data.text.indexOf(' CIPT ') != -1)
						result = 'Ici c\'est hachis http://tinyurl.com/o9a2ly7 #CIPT';

					else if(data.text.indexOf('axomama') != -1)
						result = 'Que la force de la toute puissante patate soit avec toi ! http://tinyurl.com/oa5jktv';

					else if(data.text.indexOf('pomme de terre en fête') != -1)
						result = 'La vie c\'est la fête ! http://www.belledulie.fr/';

					else
						result = 'Les patates volantes sont nos amies !'
					
					var tweetDone = '@' + data.user.screen_name + " " + result;
					
					//reply to the tweet that mentionned us
					twitterAPI.updateStatus(tweetDone.substring(0, 139), { in_reply_to_status_id: data.id_str }, 
						function(error, statusData) {
							//when we got a response from twitter, check for an error (which can occur pretty frequently)
							if(error) {
								errorTwitter(error, statusData);
							} else {
								//if we could send the tweet just fine
								LogUtils.logtrace("[" + statusData.in_reply_to_status_id_str + "] ->replied to [" + statusData.in_reply_to_screen_name + "]", LogUtils.Colors.GREEN);
								
								//check if there's "[TL]" in the name of the but
								var tweetLimitCheck = statusData.user.name.match(/(\[TL\]) (.*)/);	

								//if we just got out of tweet limit, we need to update the bot's name
								if(tweetLimitCheck != null) {
									//DO EET
									twitterAPI.updateProfile({name: tweetLimitCheck[2]}, function(error, data) {
										if(error) {
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
			} else {
				LogUtils.logtrace("data.text is not defined", LogUtils.Colors.RED);
				console.log("Data: %j", data);
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
		if(!e.code) e.code = "unknown";
		LogUtils.logtrace("streaming ended (" + e.code + ")", LogUtils.Colors.RED);
		setTimeout(initStreaming, 5000);
	}

	function initStreaming() {
		//initialize the stream and everything else

		var keyWords = [
			'patate volante',
			'patate ailée',
			'patate avion',
			'patate fusée',
			'pomme de terre volante',
			'frite volante',
			'chips volante',
			'gratin dauphinois',
			'pomme de terre rôtie',
			'patate farcie',
			'patate sautées',
			'tubercule volant',
			'solamacée',
			'CIPT',
			'axomania',
			'vodka volante',
			'pomme de terre en fête'
		];

		twitterAPI.stream('statuses/filter', {track: keyWords.join(', ')}, streamCallback);
	}

})();