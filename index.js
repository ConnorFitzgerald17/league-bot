require("dotenv").config();
const champs = require("lol-champions");

const Discord = require("discord.js");
const fetch = require("node-fetch");
const _ = require("lodash");

const client = new Discord.Client();
const TOKEN = process.env.TOKEN;
const lol_api = process.env.LOL_API;
const prefix = "!";

client.once("ready", () => {
  console.log("League Stats Bot Started Successfully!");
});

client.on("message", async (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);

  const command = args.shift().toLowerCase();
  const escapedArgs = escape(args.join(" "));
  const userData = await GetUserInfo(escapedArgs);
  const summonerId = userData.id;
  const argsName = args.join(" ");

  if (!userData) {
    return message.reply("Please provide a valid username.");
  }

  if (command === "rank") {
    if (!args.length) {
      return message.reply("You need to supply a search term!");
    }

    const userRank = await GetRank(summonerId);

    isRanked(userRank);
    if (isRanked(userRank)) {
      const [ranking] = userRank;

      const winRate = getWinRate(ranking.wins, ranking.losses);
      const embed = new Discord.MessageEmbed()
        .setColor("#8c52ff")
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
    } else {
      message.reply("That Summoner is Unranked.");
    }
  }

  if (command === "match") {
    if (!args.length) {
      return message.reply("You need to supply a search term!");
    }

    const gameData = await GetLiveMatch(summonerId);

    if (!gameData) {
      return message.reply(`${argsName} is currently not in a game.`);
    }
    const { blueTeam, redTeam } = gameData;

    var blueTeamString = "";
    blueTeam.forEach(async function ({ name, rank }) {
      const string = `\n[${name}](https://na.op.gg/summoner/userName=${escape(
        name
      )}) - ${rank}`;
      blueTeamString += string;
    });

    var redTeamString = "";
    redTeam.forEach(async function ({ name, rank }) {
      const string = `\n[${name}](https://na.op.gg/summoner/userName=${escape(
        name
      )}) - ${rank}`;

      redTeamString += string;
    });

    const embed = await new Discord.MessageEmbed()
      .setColor("#8c52ff")
      .setTitle(`${argsName}'s - Live Game`)
      .addFields(
        {
          name: "Blue Team",
          value: blueTeamString,
        },
        {
          name: "Red Team",
          value: redTeamString,
        }
      );

    await message.channel.send(embed);
  }
});

client.login(TOKEN);

/**
 * Function get the win/loss ratio of the platyer in solo/duo queue
 *
 * @param {*} wins
 * @param {*} losses
 */
const getWinRate = (wins, losses) => {
  const winRate = (wins / (losses + wins)) * 100;

  return Math.round(winRate);
};

/**
 * Function to get the rank of a player for solo/duo queue
 *
 * @param {*} id
 */
async function GetRank(id) {
  const getRank = await fetch(
    `https://na1.api.riotgames.com/lol/league/v4/entries/by-summoner/${id}`,
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

  if (_.isEmpty(userRank)) {
    return false;
  }

  return userRank;
}

/**
 * Function to get user data {summonerID} that is used to generate all other info
 *
 * @param {*} username
 */
async function GetUserInfo(username) {
  const getUser = await fetch(
    `https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${username}`,
    {
      method: "get",
      headers: {
        "Content-Type": "application/json",
        "X-Riot-Token": lol_api,
      },
    }
  );

  if (getUser.status !== 200) {
    return false;
  }

  const userInfo = await getUser.json();
  return userInfo;
}

const GetLiveMatch = async (summonerId) => {
  let blueTeam = [];
  const blueTeamId = 100;
  const redTeamId = 200;
  let redTeam = [];
  let gameInfo = [];

  const getLive = await fetch(
    `https://na1.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${summonerId}`,
    {
      method: "get",
      headers: {
        "Content-Type": "application/json",
        "X-Riot-Token": lol_api,
      },
    }
  );

  console.info(getLive.status);
  if (getLive.status !== 200) {
    return false;
  }

  const liveInfo = await getLive.json();

  console.info(liveInfo);
  await Promise.all(
    liveInfo["participants"].map(
      async ({ teamId, summonerName, summonerId }, index) => {
        const ranking = await GetRank(summonerId);
        let summonerRank = "Unranked";

        if (ranking) {
          const { rank, tier } = ranking[0];

          summonerRank = `${tier} ${rank}`;
        }

        if (teamId === blueTeamId) {
          blueTeam[index] = {
            name: summonerName,
            id: summonerId,
            rank: summonerRank,
          };
        } else if (teamId === redTeamId) {
          redTeam[index] = {
            name: summonerName,
            id: summonerId,
            rank: summonerRank,
          };
        }
      }
    )
  );

  gameInfo = { blueTeam, redTeam };

  return gameInfo;
};

/**
 * Function to check if the user is ranked or not
 *
 * @param {*} userRank
 */
function isRanked(userRank) {
  if (!userRank) {
    return false;
  }
  return true;
}
