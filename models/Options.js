var mongoose = require('mongoose');

var OptionSchema = new mongoose.Schema({
  upvotes: {type: Number, default: 0},
  label:  String,
  poll: { type: mongoose.Schema.Types.ObjectId, ref: 'Poll' },
});

OptionSchema.methods.upvote = function(cb) {
  this.upvotes += 1;
  this.save(cb);
};

mongoose.model('Option', OptionSchema);