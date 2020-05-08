import minimist from "minimist";
import MarkovChain from "markovchain";
import data from "./data.js";
import fs from "fs";

// Retrieve args
const args = minimist(process.argv.slice(2));

let tweets = data || [];

const generateMarkov = () => {
    const markov = new MarkovChain(tweets.join("\n"));

    let newTweet = markov.end(30).process(); // Set the word limit to 30

    // Prettify the output
    newTweet = newTweet.charAt(0).toUpperCase() + newTweet.slice(1);
    newTweet = newTweet.replace(/([,!] )(\w)/g, (match, $1, $2) => {
        return `${$1}\n${$2.toUpperCase()}`;
    }).substring(0, 280);

    console.info(
        "\x1b[0m", newTweet.padEnd(125)
    );
};

generateMarkov();
