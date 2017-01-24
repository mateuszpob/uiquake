/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.bootstrap.html
 */

module.exports.bootstrap = function (cb) {

//    if (process.argv[2]) {
//        var port = parseInt(process.argv[2]);
//        sails.config.port = port;
//    }

    sails.config.port = 8080;

    // Tracking data handler
    sails.io.on('connect', function (socket) {
        var address = socket.handshake.headers.origin
//        var client_ip = socket.request.connection.remoteAddress;
//        console.log('Wait for data from ' + client_ip);
        socket.on('points_data', function (data) {
            Tracker.insertTrackData(data, '123');
        });
        

    });

    // It's very important to trigger this callback method when you are finished
    // with the bootstrap!  (otherwise your server will never lift, since it's waiting on the bootstrap)
    cb();
};
