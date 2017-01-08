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
     * Tu przylatują dane przez sockety. Dodajemy do istniejącej sesji, albo tworzy nową jeśli takiej nie ma.
     */
    insertTrackData: function (track_data) {
        Tracker.findOne({
            session_id: track_data.session_id,
            app_key: track_data.app_key,
            // session_started_at: track_data.session_started_at
        }).exec(function (err, obj) {
            if (obj) {
                
                var time_offset = Math.round((track_data.session_started_at - obj.session_started_at) / 10) * 10;
                console.log(time_offset)

                for (var attrname in track_data[track_data.type]) {
                    if(track_data[track_data.type][attrname])
                        obj[track_data.type]['' + parseInt(parseInt(time_offset) + parseInt(attrname))] = track_data[track_data.type][attrname];
                }
                // Tu backgroundy lecą
                if (track_data.type === 'init') {
                    var background = track_data.background;

                    console.log('================== Jaaaaazdaaa z obiektem!: ' + track_data.type);
                    obj.background_data['' + parseInt(time_offset)] = {
                        background: background,
                        viewport_width: track_data.viewport_width,
                        viewport_height: track_data.viewport_height,
                        document_width: track_data.document_width,
                        document_height: track_data.document_height,
                    }
                }
                obj.save();
                
            } else {
                //@todo sprawdzanie czy jest taki user zarejestrowany
                var background = track_data.background;

                Tracker.create({
                    session_id: track_data.session_id,
                    app_key: track_data.app_key,
                    origin: track_data.origin,
                    session_started_at: track_data.session_started_at,

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

