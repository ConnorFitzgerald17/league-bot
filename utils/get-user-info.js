require('dotenv').config();
const fetch = require('node-fetch');

const { LOL_API } = process.env;

/**
 * Function to get user data {summonerID} that is used to generate all other info
 *
 * @param {string} username
 */
exports.getUserInfo = async username => {
  const getUser = await fetch(`https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${username}`, {
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
      'X-Riot-Token': LOL_API,
    },
  });

  if (getUser.status !== 200) {
    return false;
  }

  const userInfo = await getUser.json();
  return userInfo;
};
