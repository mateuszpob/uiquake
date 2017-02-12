/**
 * ClientController
 *
 * @description :: Zwraca skrypty dla klientow
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var fs = require('fs');
var sha1 = require('sha1');

module.exports = {
    /*
     * Czas po ktorym wyłącza się blokada clientow
     */
    allow_reload_minutes: 2,
    /*
     * Maksymalna liczba nowych sesji jaka moze byc utworzona w czasie "allow_reload_minutes"
     */
    max_user_count_per_allow_time: 5,
    /*
     * Zwraca skrypty dla clienta
     * @param {type} req
     * @param {type} response
     */
    getClientTrackingScript: function (req, response) {
        var inst = this;
        
        var client_secret = req.param('client_secret');
        var site_secret = req.param('site_secret');
        
        User.findOne({secret: client_secret}).exec(function (err, user) {
            if (user) {
                
                try{
                    var client_locked = false;
                    // sprawdz czy nie trzeba pierdolnąć locka
                    if(user.clients_counter > inst.max_user_count_per_allow_time && (new Date().getTime() - user.last_allow_time < inst.allow_reload_minutes * 1000 * 60) ){
                        client_locked = true;
                    }
                
                    var referrer = req.headers.referer.replace('https://', '').replace('http://', '').replace(/\/$/g, '').split('/')[0]
                    user.sites.forEach(function (site) {
    //                    console.log(req.headers)
                        if (site_secret === site.secret && site.url === referrer) {
                            fs.readFile('./client_scripts/mouse_tracker.js', function (error, tracker_script) {
                                if (!error) {
                                    fs.readFile('./client_scripts/socket.io.min.js', function (error, socket_script) {
                                        if (error) {
                                            response.writeHead(200, {'Content-Type': 'text/html'});
                                            return response.end('', 'utf-8');
                                        } else {
                                            var result_script = socket_script;
                                            result_script += ' var uib_site_secret = "' + site.secret + '"; ';
                                            result_script += ' var uib_client_secret = "' + client_secret + '"; ';
                                            result_script += ' var socket_url = "' + req.host + '"; ';
                                            if(client_locked){
                                                result_script += 'var client_locked = true; ';
                                            }
                                            result_script += tracker_script;

                                            response.writeHead(200, {'Content-Type': 'text/html'});
                                            return response.end(result_script, 'utf-8');
                                        }
                                    });
                                }
                            });
                        }
                    })
                } catch (e) {
                    console.log('['+ new Date() +'] Client script exception!', e);
                    
                    response.writeHead(200, {'Content-Type': 'text/html'});
                    return response.end('console.log("Dupa.")', 'utf-8');
                }

            } else {
                // nie znalazlem usera
                console.log('User not found. Secret: ' + client_secret);
                response.writeHead(200, {'Content-Type': 'text/html'});
                return response.end('', 'utf-8');
            }
        });
    }
};