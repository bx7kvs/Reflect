/**
 * Created by Viktor Khodosevich on 4/26/2017.
 */
$R.$(['@define', 'InjectionContainerProvider', function Injector(define, provider) {

    //TODO: onInit event handling for providers requiring core to be built for some functionality

    var extensions = {},
        parts = {};



    this.extensions = function () {
        var container = provider.container(),
            library = {};



        return result;
    };

    function createExtensionContainer(name) {
        if (!extensions[name]) {
            extensions[name] = provider.container();
            return extensions[name];
        }
        else {
            return extensions[name];
        }
    }

    function createPartContainer(extension) {
        if (!parts[extension]) {
            parts[extension] = provider.container();
            createExtensionContainer(extension).source(parts[extension],'$');
            return parts[extension];
        }
        else {
            return parts[extension];
        }
    }

    define('ext', function (config) {
        if (typeof config == "function" && config.name) {
            if (!extensions[config.name]) {
                createExtensionContainer(config.name).injection(config);
            }
            else {
                throw new Error('Extension constuctor is not a named function');
            }
        }
        else if (typeof config == "object" && config.constructor === Array) {
            var name = null;
            for (var i = 0; i < config.length; i++) {
                if (typeof config[i] === "function" && config[i].name) {
                    name = config[i].name;
                    break
                }
            }
            if (name) {
                if (!extensions[name]) {
                    createExtensionContainer(config.name).injection(config);
                }
                else {
                    throw new Error('Extension constructor was not found!');
                }
            }
            else {
                throw new Error('Constructor not found.');
            }
        }
        else {
            throw new Error('Wrong arguments');
        }

    });

    define('part', function (ext, config) {
        if (typeof ext == "string" && ext.length > 0) {
            if (typeof config == "function" && config.name) {
                createPartContainer(ext).injection(config);
            }
            else if (typeof config == "object" && config.constructor == Array) {
                var name = null;
                for (var i = 0; i < config.length; i++) {
                    if (typeof config[i] == "function" && config[i].name) {
                        name = config.name;
                        break;
                    }
                }
                if (name) {
                    createPartContainer(ext).injection(config);
                }
                else {
                    throw new Error('Extension [' + ext + '] part Constructor was not found.');
                }
            }
        }
        else {
            throw new Error('Host extension was not specified!');
        }
    });

}]);