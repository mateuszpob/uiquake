/**
 * WelcomeController
 *
 * @description :: Server-side logic for managing Welcomes
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	index: function (req, res) {
            console.log(req.user)
            
            return res.json({'ses': req.user});
        },
};

