
var TrackerClient = function () {
    this.move = 1;
    this.rast = 2;
    this.send_moment = 10;
    this.point_stack = {};
    this.last_mouse_event = {X: 0, y: 0};

    this.scroll_stack = [];
    this.scroll_stack_interval = null;

    this.cookie_name = 'tracker_sid';
    this.session_exp_days = 365;
    this.socket = null;

    this.time_start;
    this.session_id;
};



TrackerClient.prototype.onMouseMoveMe = function (e) {
    this.move++;
    if (this.move % this.rast === 0) {
        var time_from_start = Date.now() - this.time_start;
        time_from_start = Math.round(time_from_start / 10) * 10;

        var prop = "" + time_from_start;
        var p_x = null;
        var p_y = null;
        switch (true) {
            case e.pageX !== undefined && e.pageY !== undefined:
                p_x = e.pageX;
                p_y = e.pageY;
                c_x = e.clientX;
                c_y = e.clientY;
                this.last_mouse_event = {
                    xp: e.pageX,
                    yp: e.pageY,
                    xc: e.clientX,
                    yc: e.clientY
                }
                break;
            case window.scrollY !== undefined:
                p_x = this.last_mouse_event.xc;
                p_y = this.last_mouse_event.yc + window.scrollY;
                c_x = this.last_mouse_event.xc;
                c_y = this.last_mouse_event.yc;
                //console.log('SCROLL: ', p_y, ' ============= ', this.last_mouse_event.yc , window.scrollY)
                break;
        }

        if (p_x && p_y && c_x && c_y) {
            this.point_stack[prop] = {
                p_x: p_x,
                p_y: p_y,
                c_x: c_x,
                c_y: c_y
            };

        }

    }
    if (this.move % this.send_moment === 0) {
        this.sendData('move_data', this.point_stack);
        this.move = 1;
    }
};

TrackerClient.prototype.onScrollMe = function () {
    var inst = this;
    var time_from_start = Date.now() - this.time_start;
    time_from_start = Math.round(time_from_start / 10) * 10;
    this.scroll_stack.push({scroll: document.body.scrollTop, time: time_from_start});
    clearTimeout(this.scroll_stack_interval);
    this.tmp_stack = {};
    this.scroll_stack_interval = setTimeout(function () {

        inst.tmp_stack['' + inst.scroll_stack[0].time] = {
            start_scroll: inst.scroll_stack[0].scroll,
            start_time: inst.scroll_stack[0].time,
            end_scroll: inst.scroll_stack[inst.scroll_stack.length - 1].scroll,
            end_time: inst.scroll_stack[inst.scroll_stack.length - 1].time
        };
        inst.scroll_stack = [];
        inst.sendData('scroll_data', inst.tmp_stack);
    }, 100);

};

TrackerClient.prototype.onClickMe = function (e) {
    var time_from_start = Date.now() - this.time_start;
    time_from_start = Math.round(time_from_start / 10) * 10;
    var prop = "" + time_from_start;
    var click = [];
    click['' + prop] = {
        p_x: e.pageX,
        p_y: e.pageY,
        c_x: e.clientX,
        c_y: e.clientY,
        target_tag: e.target.tagName,
        target_id: e.target.id,
        target_class: e.target.className,
    };
    console.log(click)
    this.sendData('click_data', click)
};

TrackerClient.prototype.sendData = function (type, to_send) {
    if (to_send) {
        var points_data = [];
        points_data['session_id'] = this.session_id;
        points_data['app_key'] = this.uib_ukey;
        points_data['session_started_at'] = this.time_start;
        points_data['type'] = type;
        points_data['origin'] = window.location.origin;
        points_data[type] = to_send;
//console.log(points_data)
        this.socket.emit('points_data', Object.assign({}, points_data));
        this.point_stack = {};
    } else {

    }
};
/*
 * Wysyla dane inicjujące pierwszy obiekt sesji na serwerze
 */
TrackerClient.prototype.sendInitData = function (html) {
    var points_data = {
        session_id: this.session_id,
        app_key: this.uib_ukey,
        session_started_at: this.time_start,
        type: 'init',
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        document_width: document.body.scrollWidth,
        document_height: document.body.scrollHeight,
        origin: window.location.origin,
        background: html,
        scroll_top: document.body.scrollTop,
        move_data: {},
        scroll_data: {}
    }
    this.socket.emit('points_data', points_data);
};


TrackerClient.prototype.getBackground = function () {

    var last_html = new XMLSerializer().serializeToString(document.documentElement);
      
    last_html = last_html.replace(/(&lt;)/g,"<").replace(/(&gt;)/g,">").replace(/(&amp;)/g,"&").replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, "");
    
    return last_html;
};













TrackerClient.prototype.getSessionId = function (cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    
    // Jeśli nie ma ciastka to ustaw nowe ciastko
    var cname = "tracker_sid";
    var new_session_id = Array(40 + 1).join((Math.random().toString(36) + '00000000000000000').slice(2, 18)).slice(0, 40);
    var d = new Date();
    d.setTime(d.getTime() + (this.session_exp_days*24*60*60*1000)); // dni
    //    d.setTime(d.getTime() + (exdays * 60 * 1000)); // minuty
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + new_session_id + "; " + expires;
    
    return new_session_id;
};

var init = function () {
    if(!uib_ukey)
        return;
    
    
    console.log('Tracker Init: '+this.uib_ukey)

    var inst = new TrackerClient();
    
    inst.uib_ukey = uib_ukey;
    var body = document.body;
    inst.time_start = Date.now();
    inst.socket = io.connect('http://85.255.15.162');

//    inst.socket.on('connect_error', function () {
//        console.log('Connection Error 44');
//    });
//    inst.socket.on('connect_failed', function () {
//        console.log('Connection Failed 44');
//    });
//    inst.socket.on('connect', function () {
//        console.log('Connected 44');
//    });
//    inst.socket.on('disconnect', function () {
//        console.log('Disconnected 44');
//    });
    // http://stackoverflow.com/questions/40820274/save-web-page-source-javascript
    inst.session_id = inst.getSessionId();


    var last_html = inst.getBackground();

    inst.sendInitData(last_html);

    document.addEventListener("mousemove", function (e) {
        last_html = document.body.outerHTML;
        inst.onMouseMoveMe(e);
    });

    document.addEventListener('scroll', function (e) {
        inst.onScrollMe(e);
    });
    
    document.addEventListener('click', function (e) {
        inst.onClickMe(e);
    });


};

//if(window.location.origin !== 'http://127.0.0.1:1337')
//    document.addEventListener('DOMContentLoaded', init, false);

init();

//var i=0;
//setInterval(function(){
//    //console.log(++i);
//}, 1)
