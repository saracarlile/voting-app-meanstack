var mongoose = require('mongoose');

var PollSchema = new mongoose.Schema({
  title: String,
  author: String,
  options: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Option' }]
});

mongoose.model('Poll', PollSchema);