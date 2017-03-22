var Tracker = function () { // hard4Monday
    this.run = true; 
    
    this.tracker_id = null; // id do poprawnia postem nagranej sesjitracker_id
    this.trackData = null;
    this.flag = false;
    this.prevX = null;
    this.prevY = null;
    this.number_of_data_portion = 0;
    this.tracking_scale = 0.816; // skala canvasa i backgroundu, dalej jest i tak wyliczana
    this.last_time = null;
    this.startDelay = 1000; // rysowanie zaczyna sie po tym czasie (ms)
    this.animation_locked = false;
    this.move_data_legth = null; // liczba wszystkich kroków (pozycji x + y + time ...)
    this.tracking_patch = []; // przebyta podczas jednej sesji ścieżka (urle podstron)
    this.counter = 1; // licznik krokow w rysowaniu ścieżki
    this.tracking_drav_interval = null; // interval do rysowania sciezki
    this.timeline_interval = null; // interval do lini czasu
    this.frstTimelineStart = true;
    this.go_step_locker = false; // blokada przycisków go_step, jak jeden step sie laduje to zeby nie klikac, bo i na huj
    this.redirect_steps = [];
    this.time_start_script = null;
    this.time_temp = 0;
    
    this.current_move_step = null; // ostatni krok
    
    this.current_scroll_top = 0;
    this.content_avilable_width = 0; // szerokosc dostepnej przestrzeni na wyswietlanie trackingu. Tyle bedzie miala dlugosci linia timera

    this.events_timer_interval = null; // wersja z timerem: główny timer eventów (interval)
    this.run_time = null; // czas w ktorym rozpocznie się odtwarzanie eventow
    this.first_event_time = null;
    this.last_event_time = null;
    this.session_playing_end = false; // czy czas odtwarzania sesji juz się ukończył.

    this.canvas = null; //document.getElementById('tracker-canvas');
    this.background = null; //document.getElementById('tracker-background');
    this.background_content = null; //this.background.contentWindow || ( this.background.contentDocument.document || this.background.contentDocument);
    //this.ctx = this.canvas.getContext("2d");

    this.mouse_timeline = document.getElementById('mouse-timeline');
    this.mouse_timeline_ptr = document.getElementById('mouse-timeline-pointer');

    this.events_counter = 1;
    this.events_interval = null;
    this.scroll_data_legth = 0;
    this.dupa = true;
    
    this.no_action_delay_seconds = 20;
    this.no_actions_dividion = []; // przedzialy czasowe w ktorych nie bylo zadnej akcji przez czas rowny conajmniej "this.no_action_delay_seconds"

    this.tracking_path = document.getElementById('tracking-path-wrapper');
};

/**
 * Pobierz dane trakingu przez ajax, odpal nastepne funkcje
 */
Tracker.prototype.init = function (tracker_id) {
    this.tracker_id = tracker_id;
    var xhttp = new XMLHttpRequest();
    var tracker_inst = this;
    xhttp.open("POST", "/dashboard/display-tracking/" + this.tracker_id, true);
    xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhttp.send(JSON.stringify({elo: 'mordo'}));
    xhttp.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            
            

            tracker_inst.trackData = JSON.parse(xhttp.responseText).data;

            tracker_inst.findFirsAndLastEventTime();
            // wyswietl liste wszystkich akcji nagranych w sesji
            tracker_inst.showActions();
            // przeskaluj iframe i overlay
            tracker_inst.scaleBackground(tracker_inst.trackData.background_data['10']);
            // ustaw dane do rysowania, eventy, background ... 
            tracker_inst.initCanvasAndBackground(tracker_inst.trackData.background_data['10']);

            tracker_inst.addEventListeners();
        }
    };
};
/* 
 * Skaluje iframe i overlay na nim przed osadzeniem html'a
 * @returns {undefined}
 */
Tracker.prototype.scaleBackground = function (one_step) {

    //var style = window.getComputedStyle(document.getElementById("scale-meter"), null);//.getPropertyValue("width");

//    .log(style)

    
    this.content_avilable_width = document.getElementById('trck-player').offsetWidth;

    var player_width = this.content_avilable_width-30;
    var player_height = document.body.offsetHeight - 155;
    
    if(one_step.viewport_width > one_step.viewport_height){
        this.tracking_scale = (player_width ) / one_step.viewport_width;
    }else{
        this.tracking_scale = (player_height ) / one_step.viewport_height;
    }
    
    this.background = document.getElementById('tracker-background');
    this.background.width = one_step.viewport_width;
    this.background.height = one_step.viewport_height;

    document.getElementById('overlay').style.width = one_step.viewport_width + "px";
    document.getElementById('overlay').style.height = one_step.viewport_height + "px";
    document.getElementById('overlay').style['z-index'] = 2147483647;

    document.getElementById('tracking-player').style.width = one_step.viewport_width + "px";
    document.getElementById('tracking-player').style.height = one_step.viewport_height + 50 + "px";
    document.getElementById('tracking-player').style.transform = 'scale(' + this.tracking_scale + ')';// translateX(-50%)';
    document.getElementById('tracking-player').style.transformOrigin = '0 0';
//    document.getElementById('tracking-player').style.left = '50%';

    document.getElementById('trck-player').style.height = (one_step.viewport_height)*this.tracking_scale + "px";

};
/*
 * Ustawia czas pierwszego eventu i ostatniego eventu + liczba eventów move & scroll
 * @returns {undefined}
 */
Tracker.prototype.findFirsAndLastEventTime = function () { 
    var temp_first_time = 99999999;
    var temp_last_time = 0;

    for (var o in this.trackData.move_data) {
        if (temp_first_time >= parseInt(o))
            temp_first_time = parseInt(o);

        if (temp_last_time <= parseInt(o))
            temp_last_time = parseInt(o);
    }
    for (var o in this.trackData.scroll_data) {
        if (temp_first_time >= parseInt(o))
            temp_first_time = parseInt(o);

        if (temp_last_time <= parseInt(o))
            temp_last_time = parseInt(o);
    }
    this.first_event_time = temp_first_time;
    this.last_event_time = temp_last_time;

    this.last_event = this.trackData.move_data[this.last_event_time];// | this.trackData.scroll_data[this.last_event_time];

    // ustaw dlugosci danych trackingu kursora i eventow
    this.move_data_legth = this.trackData.move_data.length;
    this.scroll_data_legth = this.trackData.scroll_data.length;
    
    // Poszukaj przedziałóœ bez zadnej akcji.
    var step_a = 0;
    var step_b = 0;
    var unlock = true;
    
    var no_actions_dividion = [];
    console.log('Event times: ', this.first_event_time, this.last_event_time)
    for(var i=10 ; i<this.last_event_time ; i+=10){
        if(this.trackData.move_data[i] ){
            if(unlock){
                step_a = i;
                unlock = false;
            }else{
                step_b = step_a;
                step_a = i;
                
                if(step_a - step_b > this.no_action_delay_seconds * 1000){
                    this.no_actions_dividion.push({time_a: step_a, time_b: step_b, difference_time: step_a - step_b});
                }
                
            }
        }
    }
};

/*
 * Osadza html'a w iframe i
 * dokleja canvas do srodka iframe
 */
Tracker.prototype.initCanvasAndBackground = function (one_step, noFirst) {
    var inst = this;
    inst.time_start_script = new Date();
    inst.session_playing_end = false; // ustaw na nowo (lub pierwszy raz). ze czas sesji jeszcze sie nie skonczył
    
    var parser = new DOMParser();
    // przetwarza kod html na obiekt 'document'
    var doc = parser.parseFromString(one_step.background, 'text/html'); //var bckgr = $.parseHTML(one_step.background);
    // dokleja tag 'base' do dokumentu
    var base = doc.createElement('base');
    base.href = this.trackData.origin;
    doc.getElementsByTagName('head')[0].insertBefore(base, doc.getElementsByTagName('head')[0].firstChild)
    // obj 'document' znowu konwerotany do stringa
    var bckgr = new XMLSerializer().serializeToString(doc);

    bckgr = bckgr.replace(/(&lt;)/g, "<")
            .replace(/(&gt;)/g, ">")
            .replace(/(&amp;)/g, "&")
            .replace(/(&quot;)/g, '"')
            .replace(/(&#39;)/g, "'")
            .replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, ""); // komentarze jednoliniowe i blokowe

    this.background = window.frames['tracker-background'];
    this.background.document.open();
    this.background.document.write(bckgr);
    this.background.document.close();
//    this.background.document.appendChild(doc.documentElement)
    this.background_content = this.background.document;

    this.background.onload = function () {
        // init canvas
        inst.canvas = inst.background.document.createElement('canvas');
        inst.canvas.id = 'tracker-canvas';
        inst.canvas.style.position = 'absolute';
        inst.canvas.style.top = 0;
        inst.canvas.style['z-index'] = 2147483646;
        inst.canvas.width = one_step.document_width;
        inst.canvas.height = inst.background_content.body.scrollHeight;

        // init mouse cursor
        inst.tracker_cursor = inst.background.document.createElement('div');
        inst.tracker_cursor.id = 'tracker-cursor';
        inst.tracker_cursor.style.position = 'absolute';
        inst.tracker_cursor.style.width = 90;
        inst.tracker_cursor.style.height = 90;
        inst.tracker_cursor.style.background = 'url(/images/mouse-crs.png)'; 
        inst.tracker_cursor.style['background-size'] = 'contain';
        inst.tracker_cursor.style['z-index'] = 2147483647;

        // append canvas and cursor to embed document
        inst.background.document.body.appendChild(inst.canvas);
        inst.setCursorPosition();
        if (inst.dupa) {
            document.getElementById('tracking-player').appendChild(inst.tracker_cursor);
            inst.dupa = false;
        }
        if(!noFirst)
            inst.time_start = Date.now() - inst.time_temp;

        inst.runTimer();

    };
//inst.background_content = inst.background.contentDocument || inst.background.contentWindow.document;
};

/*
 * Ustawia kursor myszy i poczatek rysowania na canvasie.
 * Odpalane po zaladowaniu nowego backgrounda
 */
Tracker.prototype.setCursorPosition = function () {
    this.ctx = this.canvas.getContext("2d");
    if(!this.move_data_legth > 0){
        this.tracker_cursor.style.top = 9999;
        this.tracker_cursor.style.left = 9999;
        return;
    }
    var t = this.time_temp;
    var i = 0;
    while (this.trackData.move_data[t] === undefined || i < this.move_data_legth) {
        i++;
        t += 10;
    }
    if (this.trackData.move_data[t]) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = "black";
        this.ctx.moveTo(this.trackData.move_data[t].p_x, this.trackData.move_data[t].p_y);
        // ustaw kursor (obrazek myszk)
        this.tracker_cursor.style.top = this.trackData.move_data[t].c_y - 30;
        this.tracker_cursor.style.left = this.trackData.move_data[t].c_x - 40;
    }
    return;
};
/*
 * Przesuwa pasek progresu zgodnie z aktualnym wskazaniem timera
 */
Tracker.prototype.timelineUpdate = function () {
    var progress_bar = document.getElementById('trck-progress');
    var huj = this.content_avilable_width * this.time_temp / this.last_event_time;
    progress_bar.style = "width:" + parseInt(huj) + "px;";
};
/*12
 * Pokazuje akcje z sesji (kilki, przekierowania ...)
 */
Tracker.prototype.showActions = function () {
    var html = '';
    var time;
    for(var c in this.trackData.click_data){
        html += '<div class="user-action click-action" data-time="'+c+'">' +
                    '<div class="mark"></div>' +
                    '<p>Click <span class="time">'+this.msToHuj(c)+'</span>'+
                    '&nbsp;<span class="actag">'+this.trackData.click_data[c].target_tag+'</span></p>' +
                '</div>';
        
    }
    document.getElementById('actions-container').insertAdjacentHTML('beforeend', html);
};
/*
 * Konwertuje milisekundy na zdatna do przeczytania formę
 * @returns {string} czas
 */
Tracker.prototype.msToHuj = function(ms) {
    ms = parseInt(ms);
    var seconds = parseInt((ms/1000)%60);
    var minutes = parseInt((ms/(1000*60))%60);
    var hours = parseInt((ms/(1000*60*60))%24);
    seconds = seconds + "";
    minutes = minutes + "";
    var pad = "00"
    var r = '';
    if(hours > 0){
        r+= pad.substring(0, pad.length - hours.length) + hours + ':'
    }
    r += pad.substring(0, pad.length - minutes.length) + minutes
    r += ':' + pad.substring(0, pad.length - seconds.length) + seconds;
    return r;
};
Tracker.prototype.switchActionOnList = function (action, time) {
    Array.prototype.slice.call(document.getElementsByClassName('user-action')).forEach(function(el){
        el.className = 'user-action click-action'})
    document.querySelector('.user-action.'+action+'-action[data-time="'+time+'"]').className = 'user-action click-action active';
};
/*
 * Główny timer odpalający wszystkie eventy.
 */
Tracker.prototype.runTimer = function () {
    var inst = this;
    
    this.events_timer = setInterval(function () {
//        inst.time_temp = Math.round((Date.now() - inst.time_start) / 10) * 10;

    inst.time_temp += 10;
        //no_actions_dividion
        
        
//        if(inst.time_temp == inst.no_actions_dividion[0].time_b){
//            console.log('inst.time_temp', inst.time_temp)
//            inst.time_temp = inst.no_actions_dividion[0].time_a - 2000;
//            console.log('inst.time_temp', inst.time_temp)
//        }

        document.getElementById('tracking-timer').innerHTML = inst.msToHuj(inst.time_temp)+' / '+inst.msToHuj(inst.last_event_time);

        inst.timelineUpdate();

        inst.mouseMoveEvent(inst.trackData.move_data["" + inst.time_temp]);
        inst.clickEvent(inst.trackData.click_data["" + inst.time_temp], inst.time_temp);
        inst.scrollEvent(inst.trackData.scroll_data["" + inst.time_temp]);
        inst.backgroundEvent(inst.trackData.background_data["" + inst.time_temp], inst.time_temp);

        if (inst.time_temp >= inst.last_event_time){
            inst.session_playing_end = true;
            document.getElementById('trck-play-session').className = 'reload'; // przycisk play/pause session
            clearInterval(inst.events_timer);
        }
    }, 10);

};

/*______________________________________________________________________________
 * EVENT LISTENERY
 */
Tracker.prototype.addEventListeners = function () {
    var inst = this;
    document.getElementById('trck-play-session').addEventListener("click", function(e){inst.playSession(e)});
    document.getElementById('trck-timeline').addEventListener("click", function(e){inst.scrollSession(e)});
    Array.prototype.slice.call(document.getElementsByClassName('user-action')).forEach(function(o){o.addEventListener("click", function(e){inst.goToAction(o)})});
};
/* addEventListener("click", function(e){inst.scrollSession(e)});
 * Przycisk Play/Pause/Reload obok lini czasu
 * @param {type} e
 * @returns {undefined}ame
 */
Tracker.prototype.playSession = function (e) { 
    var inst = this;
    // RELOAD SESSION
    if(this.session_playing_end){
        this.time_temp = 0;
        this.tracker_cursor.style.top = '-999999px';
        this.initCanvasAndBackground(this.trackData.background_data['10']);
        document.getElementById('trck-progress').style.width = '0';
        e.target.className = 'pause';
    }
    // PAUSE SESSION
    else if(this.run){
        this.time_start -= Date.now();
        this.run = false;
        clearInterval(inst.events_timer)
        setTimeout(function(){clearInterval(inst.events_timer)}, 50);
        setTimeout(function(){clearInterval(inst.events_timer)}, 100);
        setTimeout(function(){clearInterval(inst.events_timer)}, 150);
        setTimeout(function(){clearInterval(inst.events_timer)}, 200);
        e.target.className = 'play';
    }
    // PLAY SESSION
    else{ 
        this.time_start += Date.now();
        this.run = true;
        this.runTimer();
        e.target.className = 'pause';

    }
};
/*
 * Przewijanie przy uzyciu osi czasu
 * @param {Event} e
 * @returns void
 */
Tracker.prototype.scrollSession = function (e) {
    this.time_temp = Math.round(this.last_event_time * e.offsetX / this.content_avilable_width / 10) * 10;
};

Tracker.prototype.goToAction = function (o) {
    this.time_temp = parseInt(o.getAttribute('date-time'))-2000;
};

/*______________________________________________________________________________
 * EVENTY
 */
Tracker.prototype.backgroundEvent = function (one_step, t) {
    if (one_step) {
        var inst = this;
        inst.current_scroll_top = one_step.scroll_top | 0;
        clearInterval(this.events_timer);
        this.time_start = this.time_temp;
        setTimeout(function () {
            inst.initCanvasAndBackground(one_step);
        }, 500);

    }
};
Tracker.prototype.mouseMoveEvent = function (one_step) { 
    if (one_step) {
        this.ctx.lineTo(one_step.c_x, one_step.c_y + this.current_scroll_top);
        this.ctx.stroke();
        document.getElementById('tracker-cursor').style.top = one_step.c_y - 30;
        document.getElementById('tracker-cursor').style.left = one_step.c_x - 40;
        this.current_move_step = one_step;
        //this.current_move_step.c_y += this.current_scroll_top;
    }
};
Tracker.prototype.clickEvent = function (one_step, time) { 
    if(one_step){ 
        this.switchActionOnList('click', time);
        this.ctx.fillStyle="#00FF00";
        this.ctx.fillRect(one_step.c_x-5, one_step.c_y + this.current_scroll_top-5, 10, 10);
        this.ctx.stroke();
    }
};
Tracker.prototype.scrollEvent = function (one_step) {
    if (one_step) {
        var inst = this;
        var total_time = one_step.end_time - one_step.start_time;
        var total_scroll = one_step.end_scroll - one_step.start_scroll;
        var one_step_t = 10 * total_time / total_scroll;
        
//        var body = document.getElementById('tracker-background').contentWindow.document.getElementsByTagName('body')[0];

        var body = this.background.document.body
        
        var interval = setInterval(function () {
            if (one_step_t >= 0) { 
                
                // skrolowanie
                body.scrollTop += 10;
                inst.current_scroll_top += 10;
                // rysowanie ścieżki myszy
                if(inst.current_move_step != null){
                    inst.ctx.lineTo(inst.current_move_step.c_x, inst.current_move_step.c_y + inst.current_scroll_top);
                    inst.ctx.stroke();
                }
        
                if (body.scrollTop > one_step.end_scroll){
                    clearInterval(interval);
                }
            } else { 
                // skrolowanie
                body.scrollTop -= 10;
                inst.current_scroll_top -= 10;
                // rosowanie ścieżki myszy
                if(inst.current_move_step != null){
                    inst.ctx.lineTo(inst.current_move_step.c_x, inst.current_move_step.c_y + inst.current_scroll_top);
                    inst.ctx.stroke();
                }
                if (body.scrollTop <= one_step.end_scroll){
                    clearInterval(interval);
                }
            }
        }, Math.abs(one_step_t));

    }
};







