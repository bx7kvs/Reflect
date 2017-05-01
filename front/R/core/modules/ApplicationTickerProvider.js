/**
 * Created by Viktor Khodosevich on 4/28/2017.
 */
$R.$(function ApplicationTickerProvider() {

    var tickers = {};

    function Ticker(canvas, target) {
        var ticktime = (1000 / 58.8).toFixed(2),
            callbacks = {},
            context = canvas.getContext('2d'),
            frame = 0,
            args = [null, canvas, context, 0],
            tickfunction = function () {
                args[0] = new Date();
                args[3] = frame;
                try {
                    for (var ordering in callbacks) {
                        for (var i = 0; i < callbacks[ordering].length; i++) {
                            callbacks[ordering][i].apply(target, args);
                        }
                    }
                    frame++;
                }
                catch (e) {
                    clearInterval(interval);
                    resolve('error', e);
                    console.error('Unable to run ticker anymore. Error emerged during app ticker progress.');
                    throw e;
                }

            },
            interval = null,
            eventCb = {
                stop: [],
                start: [],
                error: []
            },
            self = this;

        function resolve(event, args) {
            var _call_args = [];
            if (typeof args == "object" && args.constructor == Array) {
                _call_args = args;
            }
            else if (args !== undefined) {
                _call_args.push(args);
            }

            if (typeof event == "string" && event.length) {
                if (eventCb[event]) {
                    for (var i = 0; i < eventCb[event].length; i++) {
                        eventCb[event][i].apply(self, _call_args);
                    }
                }
                else {
                    throw new Error('Unable to resolve event [' + event + ']. No such event.')
                }
            }
            else {
                throw new Error('Unable to resolve event. Event parameter is not a string or empty')
            }
        }

        this.on = function (event, func) {
            if(typeof event == "string" && event.length) {
                if(eventCb[event]) {
                    if(typeof func == "function") {
                        console.log(event + ' added ');
                        console.log(func);
                        eventCb[event].push(func)
                    }
                    else {
                        throw new Error('Unable to set event ['+event+']. Callback is not a function.');
                    }
                }
                else {
                    throw new Error('Unable to set event ['+event+'] handler. No such event.')
                }
            }
            else {
                throw new Error('Unable to set event. Event argument is not a string or empty.')
            }
        };

        this.stop = function () {
            if (interval) {
                frame = 0;
                clearInterval(interval);
                interval = null;
                resolve('stop', this);
            }
        };

        this.start = function () {
            if (!interval) {
                interval = setInterval(tickfunction, ticktime);
                resolve('start', this);
            }
        };

        this.fps = function (number) {
            if (typeof number == "number") {
                if (number > 60) number = 60;
                if (number <= 0) number = 1;
                ticktime = (1000 / number).toFixed(2);
                this.stop();
                this.start();
            }
            else {
                return (1000 / ticktime).toFixed(2);
            }
        };

        this.callback = function (a, b) {
            if (typeof a === "function") {
                if (!callbacks[0]) callbacks[0] = [];
                callbacks[0].push(a);
            }
            else if (typeof a == "number") {
                if (typeof b == "function") {
                    if (!callbacks[a]) callbacks[a] = [];
                    callbacks[a].push(b);
                }
                else {
                    throw new Error('Unable to queue. callback is not a function')
                }
            }
            else {
                throw new Error('Unable to create callback. Wrong arguments passed');
            }
        }
    }

    this.createTicker = function (app, canvas, target) {
        if (tickers[app]) tickers[app].stop();

        tickers[app] = new Ticker(canvas, target);

        return tickers[app];
    }

});