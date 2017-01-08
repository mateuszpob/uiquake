/**
 * TrackerController
 *
 * @description :: Server-side logic for managing Trackers
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var sha1 = require('sha1');

module.exports = {
    /*
     * GET Wyświetla listę nagranych sesji z ruchem myszy.
     * @param {type} req
     * @param {type} res
     * @returns {unresolved}
     */
    displayTrackingSessionList: function (req, res) {
        if(!req.user)
            return res.redirect('/login');
        
        return res.view('dashboard/recordings/session_list', {user: req.user});
    },
    /*
     * POST 
     * @param {type} req
     * @param {type} res
     * @returns {undefined}
     */
    getSessionsList: function (req, res) {
        if(!req.user)
            return res.json({error: 'unlogged'});
        
        var obj = Tracker.find().sort('session_started_at DESC').exec(function (err, obj) {
            return res.json({data: obj});
        });
    },
    /* 
     * GET Wyświetla tracking kursora wybranej sesji.
     * @param {type} req
     * @param {type} res
     * @returns {undefined}
     */
    displayTracking: function (req, res) {
        if(!req.user)
            return res.redirect('/login');
        
        var obj = Tracker.findOne({'tracker_id': req.param('tracker_id')}).exec(function (err, obj) {
            res.set("Access-Control-Allow-Origin", "*");

            return res.view('dashboard/recordings/tracker_panel', {
                tracker_id: req.param('tracker_id'),
                user: req.user
            });
            console.log(obj);
            if (obj) {
                return res.view('cursor_tracking/tracker_panel', {
                    tracker_id: req.param('tracker_id'),
                    user: req.user
                });
            } else {
                return res.view('cursor_tracking/tracker_panel', {
                    tracker_id: null,
                    user: req.user
                });
            }
        });

    },
    /*
     * POST Zwraca dane trakingu
     * @param {type} req
     * @param {type} res
     * @returns {object}
     */
    getTrackData: function (req, res) {
        if(!req.user)
            return res.json({error: 'unlogged'});
        
        var obj = Tracker.findOne({id: req.param('tracker_id')}).exec(function (err, obj) {
            return res.json({data: obj})
        });
    }
};

