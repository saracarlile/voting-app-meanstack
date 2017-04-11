var express = require('express');
var router = express.Router();

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

router.param('option', function(req, res, next, id) {
  var query = Option.findById(id);

  query.exec(function (err, option){
    if (err) { return next(err); }
    if (!option) { return next(new Error('can\'t find option')); }

    req.option = option;
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


router.put('/polls/:poll/options/:option/upvote', function(req, res, next) {
  req.option.upvote(function(err,option){
    if (err) { return next(err); }

    res.json(option);
  });


  
});




module.exports = router;
