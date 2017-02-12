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
        var site_secret = req.param('site_secret');
        
        User.findOne({secret: client_secret}).exec(function (err, user) {
            if (user) {
                try{
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