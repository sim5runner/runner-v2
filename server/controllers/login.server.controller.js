/**
 * Created by AbhishekK on 8/26/2016.
 */

var Users = require('./../models/app.server.models.user');
const passport = require('passport');
var https = require('https');

var getUserPassword = function(email, callback){
    logger.info('getting google user details from db');
    Users.findOne({'profile.email': email}, function(err, user) {
        if(user){
            callback(user.username,user.password);
        } else {
            // todo: create user validating compro email domain if does not exist
            callback(null);
        }
    });
};

var googleLogin = function (req,done,er) {

//    validate google login
    var _v1 = ('/oauth2/v3/tokeninfo?id_token=' + req.body.id_token);

    var options = {
        host: 'www.googleapis.com',
        path: _v1,
        method: 'get'
    };

    var callback = function(response) {
        var str = '';
        response.on('data', function (chunk) {
            str += chunk;
            var email = JSON.parse(str).email;
            getUserPassword(email, function(username,password){
                logger.info(username);
                done({username:username, password: password, error: (username === null)});
            });
        });

        response.on('error', function(err) {
            logger.error('error');
            er({error: true});
        });

        response.on('end', function () {
            logger.info('end');
        });
    };

    https.request(options, callback).end();

};

exports.userLoginHandler = function(req, res) {

    if(req.isAuthenticated()){
        logger.info('request authenticated');
        res.redirect('/');
    }
    else if (req.body.id_token !== null && req.body.id_token !== undefined){
        logger.info('request authenticated google');
        req.body.username = 'test';
        req.body.password = 'test';

        googleLogin(req,
            function(_res){
                logger.info('authenticating google user from db');
                if (_res.error === true) {
                    logger.error('sending error 403');
                    return res.send({
                        status: 403,
                        message: 'Invalid User!'
                    });
                } else {
                    req.body.username = _res.username;
                    req.body.password = _res.password;
                    passport.authenticate('local')(req, res, function (err) {
                        return res.send({
                            status: err ? 403 : 200,
                            message: (err !== undefined && err !== null) ? err.message : 'Login successful'
                        });
                    });
                }
            },
            function(_error){
                logger.error(_error);
                return res.send({
                    status: 403,
                    message: 'Error in google authentication!'
                });
            }
        )
    }
    else {
        logger.info('authenticating username and password from db');
        passport.authenticate('local')(req, res, function (err) {
            return res.send({
                status: (err !== undefined && err !== null) ? 403 : 200,
                message: (err !== undefined && err !== null) ? err.message : 'Login successful'
            });
        });
    }
};