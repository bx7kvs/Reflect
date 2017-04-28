/**
 * Created by Viktor Khodosevich on 4/26/2017.
 */
$R.$([function InjectionContainerProvider() {

    function Injection(con, dep) {

        var constructor = con, instance = null,
            dependencies = [];

        for (var i = 0; i < dep.length; i++) {
            dependencies.push(dep[i]);
        }

        this.name = function () {
            return con.name;
        };

        this.dependencies = function () {
            var result = [];
            for (var i = 0; i < dependencies.length; i++) {
                result.push(dependencies[i]);
            }
            return result;
        };

        this.extend = function (container) {
            return function (target, injectionName) {
                if (typeof target == "object") {
                    if (typeof injectionName === "string") {
                        var injection = container.find(injectionName);
                        if (injection) {
                            var params = container.resolve(injection);
                            params.$constructor.apply(target, params.dependencies);
                        }
                        else {
                            throw new Error('Unable to find injection [' + injectionName + ']');
                        }
                    }
                    else {
                        throw new Error('Extend class name should be a string!');
                    }
                }
                else {
                    throw new Error('Extend target should be an object!');
                }
            }
        };

        this.inject = function (container) {
            return function (injectionName) {
                return container.resolve(injectionName, true);
            }
        };

        this.create = function (args, direct) {
            if (direct) {
                args.unshift(null);
                return new (Function.prototype.bind.apply(constructor, args));
            }
            else {
                if (!instance) {
                    args.unshift(null);
                    instance = new (Function.prototype.bind.apply(constructor, args));
                }
                return instance;
            }
        };

        this.$constructor = function () {
            return constructor;
        };

        this.args = function () {
            return [con, dep];
        }
    }

    function SourceContainer(prefix, container, loop) {
        var pfx = prefix ? prefix : false,
            containers = [];

        if (typeof container == "object") {
            if (container.constructor === InjectionContainer) {
                containers = [container]
            }
            else if (container.constructor == Array) {
                var valid = true;
                for (var i = 0; i < container.length; i++) {
                    if (container[i].constructor === InjectionContainer) {
                        containers.push(container[i]);
                    }
                    else {
                        valid = false;
                        break;
                    }
                }
                if (container.length == 0) valid = false;

                if (!valid) throw new Error('Container array is empty!');
            }
            else {
                throw new Error('Invalid type if container!');
            }
        }


        function stripPrefix(name) {
            var string = '';

            for (var i = 0; i < name.length; i++) {
                if (i > pfx.length) {
                    string += name[i];
                }
            }
            return string;
        }

        this.check = function (name) {
            var result = true;
            if(prefix) {
                for (var i = 0; i < prefix.length; i++) {
                    if (!name[i] || name[i] !== prefix[i]) {
                        result = false;
                    }
                }
            }
            return result;
        };

        this.has = function (name) {
            var result = false;
            if (this.check(name)) {
                for (var i = 0; i < containers.length; i++) {
                    var stripName = stripPrefix(name);
                    if (container.has(stripName)) {
                        result = true;
                        break;
                    }
                }
            }
            return result;
        };

        this.loop = function () {
            return loop;
        };

        this.containers = function () {
            return containers;
        };

        this.prefix = function () {
            return pfx;
        };

        this.resolve = function (name, direct) {
            var result = null;
            if (this.has(name)) {
                var source = null;
                var stripName = stripPrefix(name);
                for (var i = 0; i < containers.length; i++) {
                    if (containers[i].has(stripName)) {
                        source = containers[i];
                    }
                }
                if (source) result = source.resolve(stripName, direct);
            }
            return result;
        };

    }

    function InjectionContainer(lib) {
        var library = typeof lib == "object" ? lib : {},
            sources = {};

        this.injection = function (config) {
            var constructor = null,
                dependencies = [];

            if (typeof config == "function") {
                if (config.name && config.name.length) {
                    constructor = config;
                }
                else {
                    throw new Error('Anonymous function can not be injection constructor.');
                }
            }
            else if (typeof config == "object" && config.constructor === Array) {
                for (var i = 0; i < config.length; i++) {
                    if (typeof config[i] == "string" && config[i].length) {
                        dependencies.push(config[i])
                    }
                    else if (typeof config[i] == "function" && config[i].name) {
                        constructor = config[i];
                        break;
                    }
                    else {
                        throw new Error('Unknown type of injection name or constructor.');
                    }
                }
            }
            else {
                throw new Error('Unknown type of injection config.');
            }

            library[constructor.name] = new Injection(constructor, dependencies);
        };

        this.source = function (container, prefixkey) {
            if (container && typeof container == "object") {
                if (container.constructor === InjectionContainer) {
                    if (!prefixkey) prefixkey = false;
                    if ((typeof prefixkey == "string" && prefixkey.length) || prefixkey === false) {
                        container.$$LOOP = true;
                        var loop = false;
                        if (this.$LOOP) loop = true;
                        delete container.$$LOOOP;
                        sources[prefixkey ? prefixkey : '$$noprefix'] =
                            new SourceContainer(prefixkey, [container], [loop]);
                    }
                }
                else if (container.constructor === Array) {
                    var valid = true,
                        loop = [];

                    for (var i = 0; i < container.length; i++) {
                        if (typeof container[i] == "object" && container[i].constructor == InjectionContainer) {
                            container[i].$$LOOOP = true;
                            if (this.$$LOOOP) {
                                loop.push(true);
                            }
                            else {
                                loop.push(false);
                            }
                            delete  container[i].$$LOOOP;
                        }
                        else {
                            valid = false
                        }
                    }

                    if (valid) {
                        if (!prefixkey) prefixkey = false;

                        if ((typeof prefixkey == "string" && prefixkey.length) || prefixkey === false) {
                            var source = new SourceContainer(prefixkey, container, loop);
                            sources[prefixkey ? prefixkey : '$$noprefix'] = source;
                        }
                    }
                    else {
                        throw new Error('Source container config is not valid. One of the containers provided is not an InjectionContainer instance');
                    }
                }
            }
        };

        this.clone = function () {
            var newLibrary = {};
            for (var injection in library) {
                newLibrary[injection] = library[injection].clone()
            }
            var newContainer = new InjectionContainer(newLibrary);

            for (var i = 0; i < sources.length; i++) {
                var containers = sources[i].containers(),
                    sourceloop = sources[i].loop(),
                    sourceprefix = sources[i].prefix(),
                    newcontainers = [];

                for(var i = 0 ; i < containers.length; i++) {
                    if(sourceloop[i]) {
                        newcontainers.push(newContainer);
                    }
                    else {
                        newcontainers.push(containers[i].clone());
                    }
                }

                newContainer.source(newcontainers,sourceprefix);
            }
            return newContainer;
        };

        this.findSourceByInjectionName = function (injectionName) {
            var source = null;

            for(var prefix in sources) {
                if(sources.hasOwnProperty(prefix)) {
                    if(sources[prefix].prefix()) {
                        if(sources[prefix].has(injectionName)) {
                            source = sources[prefix];
                        }
                    }
                }
            }

            if(!source && sources.$$noprefix && sources.$$noprefix.has(injectionName)) source = sources.$$noprefix;

            return source;
        };

        this.resolve = function (name, direct) {
            if (name && name.constructor === Injection) {
                var injection = name,
                    deps = injection.dependencies(),
                    result = {
                        dependencies: [],
                        $constructor: injection.$constructor()
                    };

                for (var i = 0; i < deps.length; i++) {
                    var src = this.findSourceByInjectionName(deps[i]);
                    if (src) {
                        result.dependencies.push(src.resolve(deps[i]));
                    }
                    else {
                        return new Error('Unable to inject [' + deps[i] + '] while direct injection process.');
                    }
                }

                return result;
            }
            else {
                if (this.has(name)) {

                    var dependencies = library[name].dependencies(),
                        args = [];

                    for (var i = 0; i < dependencies.length; i++) {

                        if (dependencies[i] == '@extend') {
                            args.push(library[name].inject(this));
                        }
                        else if (dependencies[i] == '@inject') {
                            args.push(library[name].extend(this));
                        }
                        else {
                            var source = this.findSourceByInjectionName(dependencies[i]);
                            if (source) {
                                args.push(source.resolve(dependencies[i]));
                            }
                            else {
                                throw new Error('Injection [' + dependencies[i] + '] source was not found.');
                            }
                        }
                    }

                    return library[name].create(args, direct);

                }
                else {
                    throw new Error('Injection [' + name + '] was not found in library!');
                }
            }
        };

        this.has = function (name) {
            return !!library[name];
        };

        this.get = function (name) {
            if (library[name]) return library[name];
            return null;
        };
    }

    this.container = function () {
        return new InjectionContainer();
    };

}]);