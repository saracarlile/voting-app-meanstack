var express = require('express');
var router = express.Router();

function getOptionByID(req, res){
    var query  = Option.where({ _id: req.params.option_id }); // <-- Use the correct param name
    query.findOne(function (err, option) {
        if (err)
            return res.send(err)
        res.json(option);
        });
    };

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

var mongoose = require('mongoose');
var Poll = mongoose.model('Poll');
var Option = mongoose.model('Option');

router.get('/polls', function(req, res, next) {  // load all polls

  Poll.find(function(err, polls){
    if(err){ return next(err); }

    res.json(polls);
  });
});

router.post('/polls', function(req, res, next) {  //add new polls
  var poll = new Poll(req.body);

  poll.save(function(err, poll){
    if(err){ return next(err); }

    res.json(poll);
  });
});

router.param('poll', function(req, res, next, id) {  //Express's param() function used to load an object by ID (:poll in route)
  var query = Poll.findById(id);

  query.exec(function (err, poll){
    if (err) { return next(err); }
    if (!poll) { return next(new Error('can\'t find poll')); }

    req.poll = poll;
    return next();
  });
}); 



router.get('/polls/:poll', function(req, res) { //get poll by ID
  req.poll.populate('options', function(err, poll) {
    if (err) { return next(err); }

    res.json(poll);
  });
});

router.post('/polls/:poll/options', function(req, res, next) {  //add poll option
  var option = new Option(req.body);
  option.poll = req.poll;

  option.save(function(err, option){
    if(err){ return next(err); }

    req.poll.options.push(option);
    req.poll.save(function(err, poll) {
      if(err){ return next(err); }

      res.json(option);
    });
  });
});


router.put('/polls/:poll/options/:option_id/upvote', function(req, res) {  //upvote/vote for an option
  getOptionByID(req, res); // <-- sending both req and res to the function
});




module.exports = router;
