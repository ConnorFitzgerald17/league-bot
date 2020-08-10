require("dotenv").config();
const champs = require("lol-champions");

const Discord = require("discord.js");
const fetch = require("node-fetch");

const client = new Discord.Client();
const TOKEN = process.env.TOKEN;
const lol_api = process.env.LOL_API;
const prefix = "!";

client.once("ready", () => {
  console.log("League Stats Bot Started!");
});

client.on("message", async (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);

  const command = args.shift().toLowerCase();
  const escapedArgs = escape(args.join(" "));

  if (command === "rank") {
    if (!args.length) {
      return message.channel.send("You need to supply a search term!");
    }
    const getUser = await fetch(
      `https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${escapedArgs}`,
      {
        method: "get",
        headers: {
          "Content-Type": "application/json",
          "X-Riot-Token": lol_api,
        },
      }
    );

    const userInfo = await getUser.json();
    const sumId = userInfo.id;

    const getRank = await fetch(
      `https://na1.api.riotgames.com/lol/league/v4/entries/by-summoner/${userInfo.id}`,
      {
        method: "get",
        headers: {
          "Content-Type": "application/json",
          "X-Riot-Token": lol_api,
        },
      }
    );

    const userRank = await getRank.json();
    userRank.forEach(async function (val, index) {
      if (userRank[index].queueType !== "RANKED_SOLO_5x5") {
        userRank.splice(index, 1);
        return false;
      }
    });
    const [ranking] = userRank;

    const winRate = getWinRate(ranking.wins, ranking.losses);
    const embed = new Discord.MessageEmbed()
      .setColor("#EFFF00")
      .setTitle(`${ranking.summonerName} - Solo/Duo Queue`)
      .setURL(
        `https://na.op.gg/summoner/userName=${escape(ranking.summonerName)}`
      )
      .addFields(
        {
          name: "Rank",
          value: ` ${ranking.tier} ${ranking.rank} - ${ranking.leaguePoints}LP`,
        },
        { name: "Wins", value: ranking.wins },
        {
          name: "Losses",
          value: ranking.losses,
        },
        { name: "Win Rate", value: `${winRate}%` }
      );

    message.channel.send(embed);
  }
});

client.login(TOKEN);

const getWinRate = (wins, losses) => {
  const winRate = (wins / (losses + wins)) * 100;

  return Math.round(winRate);
};
