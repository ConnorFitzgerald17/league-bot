/**
 * Function get the win/loss ratio of the platyer in solo/duo queue
 *
 * @param {*} wins
 * @param {*} losses
 */
exports.getWinRate = (wins, losses) => {
  const winRate = (wins / (losses + wins)) * 100;

  return Math.round(winRate);
};
