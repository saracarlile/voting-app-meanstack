var express = require('express');
var jwt = require('express-jwt'); //node moduel that interacts with jwt tokens and Express framework
var router = express.Router();
var auth = jwt({ secret: 'SECRET', userProperty: 'payload' }); //change SECRET to ENV Variable at production



/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

var mongoose = require('mongoose');
var passport = require('passport');
var Poll = mongoose.model('Poll');
var Option = mongoose.model('Option');
var User = mongoose.model('User');

router.get('/polls', function (req, res, next) {  // load all polls

  Poll.find(function (err, polls) {
    if (err) { return next(err); }

    res.json(polls);
  });
});


router.get('/viewmypolls/:author', function (req, res, next) {  // load all polls for user
 var pollAuthor = req.params.author;
  console.log(pollAuthor);
  Poll.find({ 'author': pollAuthor}, function (err, mypolls) {
    if (err) { return next(err); }

    res.json(mypolls);
  });
}); 


router.post('/polls', auth, function (req, res, next) {  //add new polls
  var poll = new Poll(req.body);
  poll.author = req.payload.username;

  poll.save(function (err, poll) {
    if (err) { return next(err); }

    res.json(poll);
  });
});

router.param('poll', function (req, res, next, id) {  //Express's param() function used to load an object by ID (:poll in route)
  var query = Poll.findById(id);

  query.exec(function (err, poll) {
    if (err) { return next(err); }
    if (!poll) { return next(new Error('can\'t find poll')); }

    req.poll = poll;
    return next();
  });
});

router.param('option', function (req, res, next, id) {
  var query = Option.findById(id);

  query.exec(function (err, option) {
    if (err) { return next(err); }
    if (!option) { return next(new Error('can\'t find option')); }

    req.option = option;
    return next();
  });
});


router.get('/polls/:poll', function (req, res) { //get poll by ID
  req.poll.populate('options', function (err, poll) {
    if (err) { return next(err); }

    res.json(poll);
  });
});






router.post('/polls/:poll/options', auth, function (req, res, next) {  //add poll option
  var option = new Option(req.body);
  option.poll = req.poll;
  option.author = req.payload.username;

  option.save(function (err, option) {
    if (err) { return next(err); }

    req.poll.options.push(option);
    req.poll.save(function (err, poll) {
      if (err) { return next(err); }

      res.json(option);
    });
  });
});


router.put('/polls/:poll/options/:option/upvote', auth, function (req, res, next) {
  req.option.upvote(function (err, option) {
    if (err) { return next(err); }

    res.json(option);
  });
});

router.post('/register', function (req, res, next) {
  if (!req.body.username || !req.body.password) {
    return res.status(400).json({ message: 'Please fill out all fields' });
  }

  var user = new User();

  user.username = req.body.username;

  user.setPassword(req.body.password)

  user.save(function (err) {
    if (err) { return next(err); }

    return res.json({ token: user.generateJWT() })
  });
});

router.post('/login', function (req, res, next) {
  if (!req.body.username || !req.body.password) {
    return res.status(400).json({ message: 'Please fill out all fields' });
  }

  passport.authenticate('local', function (err, user, info) {
    if (err) { return next(err); }

    if (user) {
      return res.json({ token: user.generateJWT() });
    } else {
      return res.status(401).json(info);
    }
  })(req, res, next);
});


router.delete('/polls/:id/', function(req, res, next) {
  Polls.findById(req.params.id, function (err, poll) {
    if(err) { return next(err); }
    if(!poll) { return res.send(404); }
    poll.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
});



module.exports = router;
