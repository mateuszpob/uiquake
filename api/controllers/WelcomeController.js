/**
 * WelcomeController
 *
 * @description :: Server-side logic for managing Welcomes
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	index: function (req, res) {
            return res.view('homepage');
        },
	getScriptsPage: function (req, res) {
            return res.view('after_register');
        },
};