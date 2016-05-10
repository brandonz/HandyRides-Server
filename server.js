// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var mongoose   = require('mongoose');
var cors = require('cors');
var mongodb    = require("mongodb");
var path       = require("path");
var ObjectID   = mongodb.ObjectID;

// Schemas
var User = require('./user.js');
var Event = require('./event.js');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

var port = process.env.PORT || 8080;        // set our port

// Connect db
mongoose.connect(process.env.MONGOLAB_URI);

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// middleware to use for all requests
// router.use(function(req, res, next) {
    //  // Website you wish to allow to connect
    // res.setHeader('Access-Control-Allow-Origin', 'http://brandonz.mycpanel2.princeton.edu');

    // // Request methods you wish to allow
    // res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // // Request headers you wish to allow
    // res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // // do logging
    // // console.log('Something is happening.');
    // next(); // make sure we go to the next routes and don't stop here
// });

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.json({ message: 'live' });
});

// more routes for our API will happen here

// on routes that end in /users
// ----------------------------------------------------
router.route('/users')

    // create a user (accessed at POST /api/users)
    .post(function(req, res) {
        
        var user = new User();      // create a new instance of the User model
        user.fname = req.body.fname;
        user.lname = req.body.lname;
        user.email = req.body.email;
        user.passw = req.body.passw;
        user.events = [];

        // // form checking
        // if (!(req.body.fname && req.body.lname && req.body.email && req.body.passw)) {
        //     res.json({message: 'Empty params!'});
        //     return;
        // }

        // check if the email already exists
        User.find({email: req.body.email}, function(err, userRes) {
            if (err)
                res.send(err);

            if (userRes.length > 0) {
                res.json({message: 'User already exists!'});
            } else {
                // save the user and check for errors
                user.save(function(err) {
                    if (err)
                        res.send(err);

                    res.json({ message: 'User created!' });
                });
            }
        });
        
    })

    // [TESTING PURPOSES ONLY] get all the users (accessed at GET /api/users)
    .get(function(req, res) {
        User.find(function(err, users) {
            if (err)
                res.send(err);

            res.json(users);
        });
    });

// on routes that end in /users/:email/:password
// ----------------------------------------------------
router.route('/users/:email/:password')

    // get the user with that id (accessed at GET /api/users/:email)
    .get(function(req, res) {
        User.find({email: req.params.email, passw: req.params.password}, function(err, user) {
            if (err)
                res.send(err);

            res.json(user);
        });
    })

    // update the user with this id (accessed at PUT /api/users/:email)
    .put(function(req, res) {

        // use our user model to find the user we want
        User.find({email: req.params.email}, function(err, user) {

            if (err)
                res.send(err);

            // check for password validity
            if (user.length == 0) {
                res.json({ message: 'Not updated!'});
            }
            else {
                user.fname = req.body.fname;  // update the users info

                // save the user
                user.save(function(err) {
                    if (err)
                        res.send(err);

                    res.json({ message: 'User updated!' });
                });
            }

        });
    })

     // delete the user with this id (accessed at DELETE /api/users/:email)
    .delete(function(req, res) {
        User.remove({
            email: req.params.email,
            passw: req.params.password
        }, function(err, user) {
            if (err)
                res.send(err);

            res.json({ message: 'Successfully deleted' });
        });
    });

// on routes that end in /users/:email/:password
// ----------------------------------------------------
router.route('/auth/:email/:password')

    // check if the email password exists (accessed at GET /api/users/:email)
    .get(function(req, res) {
        User.find({email: req.params.email, passw: req.params.password}, function(err, user) {
            if (err)
                res.send(err);

            // check for password validity
            if (user.length == 0) {
                res.json({ valid: false });
            }
            else {
                res.json({ valid: true });
            }
        });
    })

// on routes that end in /events/:email/
// ----------------------------------------------------
// router.route('/events/:email')

//     // get all events that the user is registered in
//     .get (function(req, res) {
//         User.find({email: req.params.email}, function(err, user) {
//             if (user.length == 0)
//                 res.json([]);
//             else
//                 res.json(user[0].events);
//         });
//     // })

router.route('/events')
    // register an event the user is in
    .post (function(req, res) {

        User.find({email: req.body.email}, function(err, userRes) {
            if (err)
                res.send(err);

            if (userRes.length == 0) {
                res.send({message: 'No users found!'});
                return;
            }

            var info;

            // if driver
            if (req.body.userstatus == "driver") {
                info = {seats: req.body.seats, address: req.body.address, date: req.body.date, time: req.body.time};
                // add event
                User.findByIdAndUpdate(
                    userRes[0]._id,
                    {$push: {"events": {id: req.body.eventid, status: req.body.userstatus, info: info}}},
                    {safe: true, upsert: true, new : true},
                    function(err, model) {
                        // res.send(err);
                    }
                );
            }
            // if rider
            else if (req.body.userstatus == "rider") {
                info = {};

                // add event
                User.findByIdAndUpdate(
                    userRes[0]._id,
                    {$push: {"events": {id: req.body.eventid, status: req.body.userstatus}}},
                    {safe: true, upsert: true, new : true},
                    function(err, model) {
                        // res.send(err);
                    }
                );
            }


            // add to event
            Event.find({id: req.body.eventid}, function(eventErr, eventRes) {

                if (eventErr)
                    res.send(eventErr);
                // first user to register for event
                else if (eventRes.length == 0) {
                    var userObj = {
                        fname: userRes[0].fname,
                        lname: userRes[0].lname,
                        email: req.body.email,
                        status: req.body.userstatus,
                        info : info
                    };

                    var nEvent = new Event();      // create a new instance of the Event model
                    nEvent.id = req.body.eventid;
                    nEvent.users = [];
                    nEvent.users.push(userObj);

                    nEvent.save(function(err) {
                        if (err)
                            res.send(err);
                    });
                }
                else {
                    Event.findByIdAndUpdate(
                        eventRes[0]._id,
                        {$push: {"users": {fname: userRes[0].fname, lname: userRes[0].lname, email: req.body.email, status: req.body.userstatus, info: info}}},
                        {safe: true, upsert:true, new: true},
                        function(err, model) {
                            // res.send(err);
                        }
                    );
                }
            });


            res.json({message: 'User updated!'});
        });
    })

router.route('/events/:eventid')
    .get(function(req, res) {
        Event.find({id: req.params.eventid}, function(err, events) {
            if (err)
                res.send(err);

            res.json(events);
        });
    })



// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);