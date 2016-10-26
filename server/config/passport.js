'use strict';

// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;
var crypto = require('crypto');
var Users     = require('./../models/app.server.models.user');

var hashPassword = function(password, saltValue) {
     return crypto.pbkdf2Sync(password, saltValue, 1000, 64).toString('hex');
};

module.exports = function(passport) {

    // passport session setup
    // required for persistent login sessions
    // passport needs ability to serialize and deserialize users out of session

    passport.serializeUser(function(user, done) {
        done(null, user.username);
    });

    passport.deserializeUser(function(username, done) {
        Users.findOne({username: username}, function(err, user) {
            done(err, user);
        });
    });

    passport.use('local',
        new LocalStrategy({
                passReqToCallback : true
            },
            function(req, username, password, done) {

                Users.findOne({username: username}, function(err, user) {

                    if (!user && req.body.email !== undefined) {
                        if (req.body.email.indexOf("comprotechnologies.com") !== -1) {
                            console.log("Registering new user");
                            var cipher = crypto.createCipher('aes256', 'password');
                            var salt = crypto.randomBytes(16).toString('hex');
                            var newPass = hashPassword(password, salt);

                            var newUser = new Users();
                            newUser.username = username;
                            newUser.password = newPass;
                            newUser.salt = salt;
                            newUser.profile.name = req.body.name;
                            newUser.profile.email = req.body.email;

                            newUser.profile.svn_credentials = {};
                            newUser.profile.svn_credentials.username = req.body.svnusername;

                            newUser.profile.svn_credentials.password = cipher.update(req.body.svnpassword, 'utf8', 'hex') + cipher.final('hex');

                            newUser.save().then(function () {
                                // Remove sensitive data before replying
                                newUser.password = undefined;
                                newUser.salt = undefined;
                                newUser.profile.svn_credentials.password = undefined;
                                return done(null, newUser);
                            })
                        } else {
                            return done({message:'Only Compro users can register to this tool'}, false);
                        }
                    } else {
                        if (err || user === null) {return done({message:'User not found'}, false)}

                        if (username === null) {
                            console.log('Credentials not provided');
                            return done({message:'Credentials not provided'}, false);
                        }

                        if(user.username !== username){
                            console.log('User Not Found with username '+username);
                            return done({message:'User Not Found with username' + username}, false);
                        }

                        if (user.password != hashPassword(password, user.salt))
                            return done({message:'Incorrect password'}, false);

                        return done(null, user);
                    }
                });

            }
    ));
};