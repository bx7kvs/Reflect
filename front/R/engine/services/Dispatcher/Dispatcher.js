/**
 * Created by Viktor Khodosevich on 2/2/2017.
 */
$R.service(
    ['@Canvas', 'Canvas', '@Ticker', '$Finder',
        function Dispatcher(CanvasRoot, Canvas, Ticker, Finder) {
            var target = {
                    current: null,
                    previous: null
                },
                mousedown = {
                    current: false,
                    previous: false
                },
                cursor = {
                    old: [0, 0],
                    current: [0, 0]
                },
                drag = {
                    start: [0, 0],
                    current: [0, 0],
                    delta: [0, 0]
                },
                checked = true,
                active = false,
                focused = false,
                dragged = false;

            Canvas.on('mousedown', function () {
                if (!active || !focused) return;
                mousedown.previous = mousedown.current;
                mousedown.current = true;
                checked = false;
            });
            Canvas.on('mouseup', function () {
                if (!active || !focused) return;
                mousedown.previous = mousedown.current;
                mousedown.current = false;
                checked = false;
            });
            Canvas.on('mousemove', function (e) {
                if (!active || !focused) return;
                cursor.current[0] = e.mouse.position[0];
                cursor.current[1] = e.mouse.position[1];
                checked = false;
            });

            Canvas.on('mouseleave', function () {
                focused = false;
            });

            Canvas.on('mouseenter', function () {
                focused = true;
            });

            function DefaultREvent(type, target) {
                var _type = type, propagate = true, _target = target, _originalTarget = target;

                this.type = function () {
                    return _type;
                };

                this.date = new Date();

                this.stopPropagation = function () {
                    propagate = false;
                };
                this.propagate = function () {
                    return propagate;
                };
                this.target = function () {
                    return _target;
                };
                this.propagated = function () {
                    _target.$$PROPAGATIONSEARCH = true;
                    var result = _originalTarget.$$PROPAGATIONSEARCH;
                    delete _target.$$PROPAGATIONSEARCH;
                    return result ? result : false;
                };
                this.originalTarget = function () {
                    if (this.$$MOUSEPROPAGATIONSETTER) {
                        var event = getEventByType(_type, _target);
                        event.originalTarget.call({$$RESETTARGET: this.$$MOUSEPROPAGATIONSETTER});
                        return event;
                    }
                    if (this.$$RESETTARGET) {
                        _target = this.$$RESETTARGET;
                    }
                    return _originalTarget;
                };
            }

            function MouseEvent(type, target) {
                DefaultREvent.apply(this, [type, target]);
                this.cursor = [cursor.current[0], cursor.current[1]];
                Object.freeze(this);
            }

            function DragEvent(type, target) {
                DefaultREvent.apply(this, [type, target]);
                this.drag = {
                    start: [drag.start[0], drag.start[1]],
                    current: [drag.current[0], drag.current[1]],
                    delta: [drag.delta[0], drag.delta[1]]
                };
                Object.freeze(this);
            }

            function getEventByType(type, target) {
                if (type === 'mousemove' || type === 'mouseleave'
                    || type === 'mouseenter' || type === 'mousedown'
                    || type === 'mouseup') {
                    return new MouseEvent(type, target);
                }
                if (type === 'dragstart' || type === 'dragend' || type === 'dragmove') {
                    return new DragEvent(type, target);
                }
            }

            function Dispatch(event, target) {
                var targetMouse = target.extension('Mouse');
                if (!targetMouse) return;

                if (targetMouse.hasEvent(event)) {
                    targetMouse.resolve(target, event, getEventByType(event, target));
                }
            }

            function resolveEventByType(type) {
                if ((type === 'mouseenter' || type === 'dragstart' || type === 'dragend' || type === 'dragmove' ||
                    type === 'mousemove' || type === 'mouseup' || type === 'mousedown') && target.current) {
                    Dispatch(type, target.current);
                }
                if ((type === 'mouseleave' || type === 'dragend') && target.previous) {
                    Dispatch(type, target.previous);
                }
            }

            function resolveDragStart() {
                dragged = true;
                drag.start[0] = cursor.current[0];
                drag.start[1] = cursor.current[1];
                resolveEventByType('dragstart');
            }

            function resolveDragEnd() {
                drag.current[0] = cursor.current[0];
                drag.current[1] = cursor.current[1];
                drag.delta[0] = drag.start[0] - drag.current[0];
                drag.delta[1] = drag.start[1] - drag.current[1];
                resolveEventByType('dragend');
                dragged = false;
            }

            function DispatchEvents() {
                if (mousedown.current !== mousedown.old && mousedown.current) {
                    resolveEventByType('mousedown');
                }
                if (mousedown.current && mousedown.current !== mousedown.old && !dragged) {
                    resolveDragStart();
                }
                if (cursor.old[0] !== cursor.current[0] || cursor.old[1] !== cursor.current[1]) {

                    if (target.current && !target.previous) {
                        resolveEventByType('mouseenter');
                    }
                    if (!target.current && target.previous) {
                        resolveEventByType('mouseleave');
                        resolveDragEnd();
                    }
                    if (target.current && target.previous) {
                        target.current.$$MOUSESEARCH = true;
                        var result = false;

                        if (!target.previous.$$MOUSESEARCH) result = true;
                        delete target.current.$$MOUSESEARCH;

                        if (result) {
                            resolveDragEnd();
                            resolveEventByType('mouseleave');
                            resolveEventByType('mouseenter');
                            resolveDragStart();
                        }
                    }
                    if (mousedown.current && mousedown.current === mousedown.old && dragged) {
                        drag.current[0] = cursor.current[0];
                        drag.current[1] = cursor.current[1];
                        drag.delta[0] = drag.start[0] - drag.current[0];
                        drag.delta[1] = drag.start[1] - drag.current[1];
                        resolveEventByType('dragmove');
                    }
                    if (mousedown.current === mousedown.old) {
                        resolveEventByType('mousemove');
                    }
                }
                if (!mousedown.current && mousedown.current !== mousedown.old && dragged) {
                    resolveDragEnd();
                }
                if (!mousedown.current && mousedown.current !== mousedown.old) {
                    resolveEventByType('mouseup');
                    dragged = false
                }

                target.previous = target.current;
                mousedown.old = mousedown.current;
                cursor.old[0] = cursor.current[0];
                cursor.old[1] = cursor.current[1];
            }

            function UpdateTargets() {
                target.previous = target.current;
                target.current = Finder.check(cursor.current);
            }

            var tick = false;

            function eventDispatcherTick() {
                tick = !tick;
                if (tick) {
                    if (checked) return;
                    UpdateTargets();
                    DispatchEvents();
                    checked = true;
                }
            }

            CanvasRoot.queue(-1, eventDispatcherTick);

            Ticker.on('start', function () {
                active = true;
            });
            Ticker.on('stop', function () {
                active = false;
            });
            Ticker.on('error', function () {
                active = false;
            });
        }
    ]
);