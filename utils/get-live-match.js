require('dotenv').config();
const fetch = require('node-fetch');

const { getRank } = require('./get-rank');

const { LOL_API } = process.env;

exports.getLiveMatch = async argsId => {
  const blueTeam = [];
  const blueTeamId = 100;
  const redTeamId = 200;
  const redTeam = [];
  let gameInfo = [];

  const getLive = await fetch(`https://na1.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${argsId}`, {
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
      'X-Riot-Token': LOL_API,
    },
  });

  if (getLive.status !== 200) {
    return false;
  }

  const liveInfo = await getLive.json();

  await Promise.all(
    liveInfo.participants.map(async ({ teamId, summonerName, summonerId }, index) => {
      const ranking = await getRank(summonerId);
      let summonerRank = 'Unranked';

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
    })
  );

  gameInfo = { blueTeam, redTeam };

  return gameInfo;
};
