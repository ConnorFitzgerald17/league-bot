require('dotenv').config();
const Discord = require('discord.js');

const { getUserInfo } = require('./utils/get-user-info');
const { getRank } = require('./utils/get-rank');
const { getLiveMatch } = require('./utils/get-live-match');
const { isRanked } = require('./utils/is-ranked');
const { getWinRate } = require('./utils/get-winrate');

const client = new Discord.Client();
const { TOKEN } = process.env;
const prefix = '!';

const commands = {
  help: 'List commands that are currently available',
  rank: 'Get the rank of a given player',
  match: 'Get the live game for a given plater',
};

client.once('ready', () => {
  // eslint-disable-next-line
  console.info('League Stats Bot Started Successfully!');
});

client.on('message', async message => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);

  const command = args.shift().toLowerCase();
  if (command === 'help') {
    let commandList = '';
    Object.keys(commands).forEach(key => {
      commandList += `\n${key} - ${commands[key]}`;
    });

    const embed = new Discord.MessageEmbed().setColor('#8c52ff').setTitle('List of commands').addFields({
      name: 'Commands',
      value: commandList,
    });
    return message.channel.send(embed);
  }

  const escapedArgs = escape(args.join(' '));
  const userData = await getUserInfo(escapedArgs);
  const argsId = userData.id;
  const argsName = userData.name;

  if (!args.length) {
    return message.reply('you need to supply a search term!');
  }

  if (!userData) {
    return message.reply('please provide a valid username.');
  }

  if (command === 'rank') {
    const userRank = await getRank(argsId);

    if (isRanked(userRank)) {
      const [ranking] = userRank;

      const winRate = getWinRate(ranking.wins, ranking.losses);
      const embed = new Discord.MessageEmbed()
        .setColor('#8c52ff')
        .setTitle(`${ranking.summonerName} - Solo/Duo Queue`)
        .setURL(`https://na.op.gg/summoner/userName=${escape(argsName)}`)
        .addFields(
          {
            name: 'Rank',
            value: ` ${ranking.tier} ${ranking.rank} - ${ranking.leaguePoints}LP`,
          },
          { name: 'Wins', value: ranking.wins },
          {
            name: 'Losses',
            value: ranking.losses,
          },
          { name: 'Win Rate', value: `${winRate}%` }
        );

      message.channel.send(embed);
    } else {
      message.reply('that summoner is "Unranked".');
    }
  }

  if (command === 'match') {
    const gameData = await getLiveMatch(argsId);

    if (!gameData) {
      return message.reply(`${argsName} is currently not in a game.`);
    }
    const { blueTeam, redTeam } = gameData;

    let blueTeamString = '';
    blueTeam.forEach(async ({ name, rank }) => {
      const string = `\n[${name}](https://na.op.gg/summoner/userName=${escape(name)}) - ${rank}`;
      blueTeamString += string;
    });

    let redTeamString = '';
    redTeam.forEach(async ({ name, rank }) => {
      const string = `\n[${name}](https://na.op.gg/summoner/userName=${escape(name)}) - ${rank}`;

      redTeamString += string;
    });

    const embed = await new Discord.MessageEmbed().setColor('#8c52ff').setTitle(`${argsName}'s - Live Game`).addFields(
      {
        name: 'Blue Team',
        value: blueTeamString,
      },
      {
        name: 'Red Team',
        value: redTeamString,
      }
    );

    await message.channel.send(embed);
  }
});

client.login(TOKEN);
