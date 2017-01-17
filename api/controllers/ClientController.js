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
     * Zwraca skrypty dla clienta
     * @param {type} req
     * @param {type} response
     */
    getClientTrackingScript: function (req, response) {

        var client_secret = req.param('client_secret');

        User.findOne({secret: client_secret}).exec(function (err, user) {
//            console.log('====================== > ' + client_secret)
            console.log(req.headers, user)
            if (user) {
                
                var referrer = req.headers.referer.replace('https://', '').replace('http://', '').replace(/\/$/g, '').split('/')[0]
                user.sites.forEach(function (site) {
//                    console.log(site)
//                    console.log(req.headers)
//                    console.log(sha1(referrer + 'dupa7'), referrer, user)



                    if (sha1(referrer + 'dupa7') === site.secret) {
                        console.log('Znalas ja ====>');
                        fs.readFile('./client_scripts/mouse_tracker.js', function (error, tracker_script) {
                            if (!error) {
                                fs.readFile('./client_scripts/socket.io.min.js', function (error, socket_script) {
                                    if (error) {
                                        response.writeHead(200, {'Content-Type': 'text/html'});
                                        return response.end('', 'utf-8');
                                    } else {
                                        var result_script = socket_script;
                                        result_script += ' var uib_ukey = "' + site.secret + '"; ';
                                        result_script += tracker_script;

                                        response.writeHead(200, {'Content-Type': 'text/html'});
                                        return response.end(result_script, 'utf-8');
                                    }
                                });
                            }
                        });
                    }
                })

            } else {
                // nie znalazlem usera
                console.log('User not found. Secret: ' + client_secret);
                response.writeHead(200, {'Content-Type': 'text/html'});
                return response.end('', 'utf-8');
            }
        });
    },

    /*
     * Zwraca socket.io.min.js 1.4.5
     */
//    getClientSocketScript: function (req, response) {
//        fs.readFile('./client_scripts/socket.io.min.js', function (error, content) {
//            if (error) {
//                response.writeHead(500);
//                response.end();
//            } else {
//                response.writeHead(200, {'Content-Type': 'text/html'});
//                response.end(content, 'utf-8');
//            }
//        });
//    }
};

