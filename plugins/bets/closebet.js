var common = require('../../common'),
    Command = common.Command,
    await = common.await,
    dkp = common.dkp,
    sprintf = common.sprintf;

module.exports = function(bets) {
  return new Command('!closebet', function() {
    if (this.user != this.channel) {
      return;
    }

    var doc = await(bets.close());
    if (!doc) {
      this.say('No bet is open. Use !openbet.');
      return;
    }

    var totals = {};

    for (var i = 0; i < doc.options.length; ++i) {
      var option = doc.options[i];
      totals[option] = { points: 0, count: 0 };
    }

    for (var i = 0; i < doc.bets.length; ++i) {
      var bet = doc.bets[i];
      totals[bet.option].points += bet.points;
      totals[bet.option].count++;
    }

    var betParts = [];
    for (var option in totals) {
      var totalBets = totals[option].count;
      var points = totals[option].points;

      if (totalBets > 0) {
        betParts.push(sprintf('★ %s: %d bet%s for %s', option, totalBets, totalBets == 1 ? '' : 's', dkp(points)));
      } else {
        betParts.push(sprintf('★ %s: no bets', option));
      }
    }

    this.say('Betting is now closed. Totals: %s', betParts.join(' — '));
  });
};
