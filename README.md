# What is it?
Just a Twitter bot that crawls for some keywords. It will answer wisely to some tweets mentionning something random you decided to say.

# Configure a Twitter bot
Begin by opening a new account for the bot on Twitter. Then, create an application for this account on [dev.twitter.com](http://dev.twitter.com), and get the API keys.

# Configure a remote NodeJS server
1) Create a new pipeline+app & attach it to a worker (instead of a web app)
2) Add Twitter API keys as env variables in 'Settings'
```
consumer_key: "YOUR_CONSUMER_TOKEN",
consumer_secret: "YOUR_CONSUMER_SECRET",
access_token_key: "YOUR_ACCESS_TOKEN_KEY",
access_token_secret: "YOUR_ACCESS_TOKEN_SECRET"
```
3) Deploy & Run using `node bot.js` command

# What if I want to test it locally?
You can launch this command locally: `npm start -- --test --ctoken <CONSUMER_TOKEN> --csecret <CONSUMER_SECRET> --akey <ACCESS_TOKEN_KEY> --asecret <ACCESS_TOKEN_SECRET>`
