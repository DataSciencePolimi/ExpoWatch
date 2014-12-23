  var mongoose = require('mongoose');
  var debug = require('debug')('Account model');
  var AccountSchema = new mongoose.Schema({
    raw: {
      type: 'mixed'
    },
    social: String,
    likes: Number,
    followings: Number,
    followers: Number,
    followersList: {
      type: [{}],
      'default': []
    },
    post: Number,
    createdDate: {
      type: Date,
      'default': Date.now
    },
    media: {
      type: [{}],
      'default': []
    }

  });

  debug('Loading the schema');
  var Account = mongoose.model('account', AccountSchema);

  exports = module.exports = Account;