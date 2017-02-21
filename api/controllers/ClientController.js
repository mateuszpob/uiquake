/**
 * ClientController
 *
 * @description :: Zwraca skrypty dla klientow
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var fs = require('fs');
var sha1 = require('sha1');
var local = require('../../config/local');

module.exports = {
    /*
     * Czas po ktorym wyłącza się blokada clientow
     */
    allow_reload_minutes: 2,
    /*
     * Maksymalna liczba nowych sesji jaka moze byc utworzona w czasie "allow_reload_minutes"
     */
    max_user_count_per_allow_time: 10,
    /*
     * Zwraca skrypty dla clienta
     * @param {type} req
     * @param {type} response
     */
    getClientTrackingScript: function (req, response) {
        var inst = this;
        var user_secret = req.param('user_secret');
        var site_secret = req.param('site_secret');
        
        User.findOne({secret: user_secret}).exec(function (err, user) {
            if (user) {
                var client_locked = false;
                // sprawdz czy nie trzeba pierdolnąć
                console.log(user.clients_counter, new Date().getTime() - user.last_allow_time , inst.allow_reload_minutes * 1000 * 60);
                if(user.clients_counter >= inst.max_user_count_per_allow_time && (new Date().getTime() - user.last_allow_time < inst.allow_reload_minutes * 1000 * 60) ){
                    client_locked = true;
                }
                try{ 
                    var referrer = req.headers.referer.replace('https://', '').replace('http://', '').replace(/\/$/g, '').split('/')[0];
                    user.sites.forEach(function (site) {
                        if (site_secret === site.secret && site.url === referrer) { 
                            fs.readFile('./client_scripts/mouse_tracker.js', function (error, tracker_script) {
                                if (!error) { 
                                    fs.readFile('./client_scripts/socket.io.min.js', function (error, socket_script) {
                                        if (error) {
                                            return inst.returnEmptyScript(response, 'Read script file error.');
                                        } else {
                                            var result_script = socket_script;
                                            result_script += ' var uib_site_secret = "' + site.secret + '"; ';
                                            result_script += ' var uib_user_secret = "' + user_secret + '"; ';
                                            result_script += ' var socket_url = "' + req.host + '"; ';
                                            result_script += ' var server_url = "' + local.server_url + '"; ';
                                            if(client_locked){
                                                result_script += ' var client_locked = true; ';
                                            }
                                            result_script += tracker_script;

                                            response.writeHead(200, {'Content-Type': 'text/html'});
                                            return response.end(result_script, 'utf-8');
                                        }
                                    });
                                }
                            });
                        }else{
                            return inst.returnEmptyScript(response, 'Invalid credentials. Site secret: ' + site_secret +  ', referrer: ' + referrer);
                        }
                    })
                } catch (e) {
                    return inst.returnEmptyScript(response, ['['+ new Date() +'] Client script error.', e]);
                }

            } else {
                return inst.returnEmptyScript(response, 'User not found. Secret: ' + user_secret);
            }
        });
    },
    /*
     * Zwraca pusty skrypw w razie bledow i loguje bledy.
     */
    returnEmptyScript(response, params) {
        console.log(params);
        response.writeHead(200, {'Content-Type': 'text/html'});
        return response.end('', 'utf-8');
    }
};