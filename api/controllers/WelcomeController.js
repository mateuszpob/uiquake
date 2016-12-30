/**
 * WelcomeController
 *
 * @description :: Server-side logic for managing Welcomes
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	index: function (req, res) {
            if(req.user)
                return res.redirect('/dashboard');
            else
                return res.redirect('/login');
            
            return res.view('homepage');
        }
};