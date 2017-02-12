/**
 * Tracker.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
    attributes: {
        session_id: {type: 'string'}, // id sesji
        app_key: {type: 'string'}, // id aplikacji (strony internetowej)
        tracked_on_page: {type: 'string'}, // podstrona na ktorej zarejestrowano akcj
        session_started_at: {type: 'integer'}, // timestam startu sesji
        tracking_data: {type: 'json'}           // dane trackingowe
    },
    /*
     * Tu przylatują dane przez socket. Dodajemy do istniejącej sesji, albo tworzy nową jeśli takiej nie ma.1486916273121e
     */
    insertTrackData: function (track_data, client_ip) {
        
        // znajdz usera i dopisz mu do strony ostatni czas danych
        User.findOne({
            secret: track_data.uib_client_secret
        }).exec(function (err, user) {
            user.sites.forEach(function (site) {
                if(site.secret === track_data.uib_site_secret){
                    site.last_data_received_date = new Date().getTime();
                }
            });
            user.save();
        });

        var session_delay_time = 4; // [s]
        Tracker.findOne({
            session_id: track_data.session_id,
            uib_client_secret: track_data.uib_client_secret,
            uib_site_secret: track_data.uib_site_secret,
            last_data_received_at: {$gt: track_data.send_at - session_delay_time * 1000}
        }).exec(function (err, obj) {
            if (obj) {

                var time_offset = Math.round((track_data.session_started_at - obj.session_started_at) / 10) * 10;

                // Wszystkie eventy leca tu
                for (var attrname in track_data[track_data.type]) {
                    if (track_data[track_data.type][attrname])
                        obj[track_data.type]['' + parseInt(parseInt(time_offset) + parseInt(attrname))] = track_data[track_data.type][attrname];
                }
                // Tu backgroundy lecą
                if (track_data.type === 'init') {
                    var background = track_data.background;

                    obj.background_data['' + parseInt(time_offset)] = {
                        background: background,
                        viewport_width: track_data.viewport_width,
                        viewport_height: track_data.viewport_height,
                        document_width: track_data.document_width,
                        document_height: track_data.document_height,
                    }
                }
                if(track_data.type === 'client_info'){
                    obj.client_info = track_data.data_client_info;
                }
                
                obj.last_data_received_at = track_data.send_at;
                obj.save();

            } else {
                console.log('Tworze sesje: ' + track_data.session_id);
                //@todo sprawdzanie czy jest taki user zarejestrowany
                var background = track_data.background;

                Tracker.create({
                    session_id: track_data.session_id,
                    uib_client_secret: track_data.uib_client_secret,
                    uib_site_secret: track_data.uib_site_secret,
                    origin: track_data.origin,
                    session_started_at: track_data.session_started_at,
                    last_data_received_at: track_data.send_at,
                    client_ip: client_ip,
                    user_agent: track_data.user_agent,
                    client_info: track_data.client_info,

                    move_data: {},
                    scroll_data: {},
                    click_data: {},
                    background_data: {10: {
                            background: background,
                            viewport_width: track_data.viewport_width,
                            viewport_height: track_data.viewport_height,
                            document_width: track_data.document_width,
                            document_height: track_data.document_height,
                            scroll_top: track_data.scroll_top
                        }}

                }).exec(function createCB(err, created) {
                    console.log('create new Object.')
                });
            }

        });
    },
};

