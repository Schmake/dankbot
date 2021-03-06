var common = require('../common'),
    async = common.async;
    await = common.await;

function User(db) {
  this.joins = db.collection('joins');
  this.parts = db.collection('parts');
  this.messages = db.collection('messages');
  this.options = db.collection('options');

  this.lastSeen = async(function(user) {
    var docs = {
      join: await(this.joins.findOneAsync({ u: user }, { d: 1 }, { sort: [['d', 'desc']] })),
      part: await(this.parts.findOneAsync({ u: user }, { d: 1 }, { sort: [['d', 'desc']] }))
    };

    var lastSeen = Math.max(
      docs.join ? docs.join.d.getTime() : 0,
      docs.part ? docs.part.d.getTime() : 0
    );

    return lastSeen == 0 ? null : lastSeen;
  });

  this.exists = async(function(user) {
    var docs = await({
      join: this.joins.findOneAsync({ u: user }, {}),
      part: this.parts.findOneAsync({ u: user }, {}),
      message: this.messages.findOneAsync({ u: user }, {})
    });

    return !!(docs.join || docs.part || docs.message);
  });

  this.getOptions = async(function(user) {
    return await(this.options.findOneAsync({ u: user }));
  });

  this.setOptions = async(function(user, options) {
    options.u = user.trim().toLowerCase();
    await(this.options.updateAsync({ u: user }, options, { upsert: true }));
  });
}

module.exports = function(db) {
  return new User(db);
};
