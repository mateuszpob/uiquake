/**
 * DashboardController
 *
 * @description :: Server-side logic for managing Dashboards
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	
        /*
         * wyswietla dashboard
         */
        displayDashboard: function (req, res) {
            if(req.user)
                return res.view('dashboard/dashboard', {user: req.user});
            return res.redirect('/login');
        },
    
};

