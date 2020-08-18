require('dotenv').config();
const fetch = require('node-fetch');
const _ = require('lodash');

const { LOL_API } = process.env;

/**
 * Function to get the rank of a player for solo/duo queue
 *
 * @param {*} id
 */
exports.getRank = async id => {
  const getRank = await fetch(`https://na1.api.riotgames.com/lol/league/v4/entries/by-summoner/${id}`, {
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
      'X-Riot-Token': LOL_API,
    },
  });

  const userRank = await getRank.json();
  userRank.forEach(async (val, index) => {
    if (userRank[index].queueType !== 'RANKED_SOLO_5x5') {
      userRank.splice(index, 1);
      return false;
    }
  });

  if (_.isEmpty(userRank)) {
    return false;
  }

  return userRank;
};
