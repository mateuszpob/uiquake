/**
 * AuthController
 *
 * @description :: Server-side logic for managing Authcontrollers
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var passport = require('passport');
var sha1 = require('sha1');

module.exports = {

    login: function (req, res) {
        res.view();
    },
    process: function (req, res) {
        console.log('Passport 554')
        passport.authenticate('local', function (err, user, info) {
            if ((err) || (!user)) {
                return res.redirect('/login');
                res.send(err);
            }
            req.logIn(user, function (err) {
                if (err)
                    res.send(err);
                return res.redirect('/dashboard');
            });
        })(req, res);
    },
    logout: function (req, res) {
        req.logout();
        return res.redirect('/');
    },
    createAccount: function (req, res) {
        return res.view('auth/register');
    },
    /*
     * Tworzy nowego usera. Potem przekierowuje go na strone
     * ze skryptami ktore musi wkleic na swojej stronie.
     * 
     * @param {type} req
     * @param {type} res
     * @returns {redirect}
     */
    createAccountProcess: function (req, res) {
        var params = {};
        //console.log(req.headers)
        var url = req.param('url').replace('https://', '').replace('http://', '').replace(/\/$/g, '').split('/')[0];
        params.email = req.param('email');
        params.username = req.param('username');
        params.password = req.param('password');
        params.secret = sha1(new Date().getTime()+'4wina');
        params.sites = [{url: url, active: true, secret: sha1(url + 'dupa7')}];

        User.create(params).exec(function (err, user) {
            req.login(user, function (err) {
                if (!err) {
                    res.redirect('/dashboard');
                } else {
                    console.log('Cos sie spier####lo pczy rejestracji usera!');
                }
            })
        });



    }
};

/**
 * Sails controllers expose some logic automatically via blueprints.
 *
 * Blueprints are enabled for all controllers by default, and they can be turned on or off
 * app-wide in `config/controllers.js`. The settings below are overrides provided specifically
 * for AuthController.
 *
 * NOTE:
 * REST and CRUD shortcut blueprints are only enabled if a matching model file
 * (`models/Auth.js`) exists.
 *
 * NOTE:
 * You may also override the logic and leave the routes intact by creating your own
 * custom middleware for AuthController's `find`, `create`, `update`, and/or
 * `destroy` actions.
 */

//module.exports.blueprints = {
//
//    // Expose a route for every method,
//    // e.g.
//    // `/auth/foo` =&gt; `foo: function (req, res) {}`
//    actions: true,
//
//    // Expose a RESTful API, e.g.
//    // `post /auth` =&gt; `create: function (req, res) {}`
//    rest: true,
//
//    // Expose simple CRUD shortcuts, e.g.
//    // `/auth/create` =&gt; `create: function (req, res) {}`
//    // (useful for prototyping)
//    shortcuts: true
//
//};