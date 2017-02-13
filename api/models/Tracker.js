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
     * Czas po ktorym wyłącza się blokada clientow
     */
    allow_reload_minutes: 2,
    /*
     * Maksymalna liczba nowych sesji jaka moze byc utworzona w czasie "allow_reload_minutes"
     */
    max_user_count_per_allow_time: 10,
    /*
     * Tworzy nowy obiekt sesji
     * 
     * @param {type} track_data
     * @returns {undefined}\
     */
    createNewSession: function (track_data) {
        var inst = this;
        
        User.findOne({
            secret: track_data.uib_client_secret+'a'
        }).exec(function (err, user) {
            if(typeof user === 'undefined'){
                console.log('User not found.');
                return null;
            }
            console.log('Czasy: ', user.clients_counter,  (new Date().getTime() - user.last_allow_time) / 1000)
            // Licznik przekroczony, ale czas do przełądowania minął. Przełąduj licznik i jazda dalej.
            if(user.clients_counter >= inst.max_user_count_per_allow_time && (new Date().getTime() - user.last_allow_time >= inst.allow_reload_minutes * 1000 * 60) ){
                user.clients_counter = 0;
                user.last_allow_time = new Date().getTime();
            }
            // licznik przekroczony czas do przeladowania nie minął, nara.
            else if(user.clients_counter >= inst.max_user_count_per_allow_time){
                return null;
            }
            
            // Stworz nowy obiekt sesji trackingu
            Tracker.create({
                session_id: track_data.session_id,
                uib_client_secret: track_data.uib_client_secret,
                uib_site_secret: track_data.uib_site_secret,
                origin: track_data.origin,
                session_started_at: track_data.session_started_at,
                last_data_received_at: track_data.send_at,
                user_agent: track_data.user_agent,
                client_info: track_data.client_info,

                move_data: {},
                scroll_data: {},
                click_data: {},
                background_data: {10: {
                        background: track_data.background,
                        viewport_width: track_data.viewport_width,
                        viewport_height: track_data.viewport_height,
                        document_width: track_data.document_width,
                        document_height: track_data.document_height,
                        scroll_top: track_data.scroll_top
                    }}

            }).exec(function createCB(err, created) {
                // Po stworzeniu sesji podbij licznik clientow
                user.clients_counter++;
                user.save();
                console.log('Stworzona sesja: ' + track_data.session_id);
            });
            
        });
    },
    /*
     * Zapis danych jeśli obiekt istnieje już w bazie
     * 
     * @param {Tracker} obj
     * @param {Array} track_data
     * @returns {undefined}
     */
    attachData: function (obj, track_data) {
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
    },
    /*
     * Tu przylatują dane przez socket. Dodajemy do istniejącej sesji, albo tworzy nową jeśli takiej nie ma.1486916273121e
     */
    insertTrackData: function (track_data) {
        var inst = this;
        var session_delay_time = 6; // [sekundy]
        Tracker.findOne({
            session_id: track_data.session_id,
            uib_client_secret: track_data.uib_client_secret,
            uib_site_secret: track_data.uib_site_secret,
            last_data_received_at: {$gt: track_data.send_at - session_delay_time * 1000}
        }).exec(function (err, obj) {
            if (typeof obj === 'undefined') {
                inst.createNewSession(track_data);
            } else {
                inst.attachData(obj, track_data);
            }

        });
    }
};

