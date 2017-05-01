/**
 * Created by bx7kv_000 on 1/13/2017.
 */
$R.part('Objects', ['$DrawerHelper', '$ModelHelper', 'Resource',
    function SpriteObjectDrawer(DrawerHelper, ModelHelper, Resource) {

        var style = this.extension('Style'),
            box = this.extension('Box'),
            drawer = this.extension('Drawer'),
            matrix = this.extension('Matrix'),
            width = null, height = null, image = null;

        box.f(function (boxContainer) {
            var position = style.get('position'),
                anchor = style.get('anchor');

            var x = position[0],
                y = position[1];

            if (anchor[0] == 'center') {
                x -= width ? width / 2 : 0;
            }
            if (anchor[0] == 'right') {
                x -= width ? width : 0;
            }
            if (anchor[1] == 'middle') {
                y -= height ? height / 2 : 0;
            }
            if (anchor[1] == 'bottom') {
                y -= height ? height : 0
            }
            boxContainer.set(
                x,
                y,
                width ? width : 0,
                height ? height : 0,
                0,
                0,
                0,
                0
            );
        });

        drawer.f(function (context) {
            if (image && image.loaded() && !image.error()
                && image.ready()
                && width !== null && height !== null
                && width > 0 && height > 0) {
                DrawerHelper.transform(this, context);
                context.drawImage(image.export(), 0, 0, width, height);
            }
        });

        this.watch('src', function (o, n) {
            if (n !== o) {
                var data = ModelHelper.readSpriteString(n);
                image = Resource.sprite(data.url);
                image.config(data.frames);
                image.on('load', function () {
                    if (width == null) {
                        width = image.width();
                    }
                    if (height == null) {
                        height = image.height();
                    }
                    matrix.purge();
                    box.purge();
                });
            }
        });

        this.watch('size', function (o, n) {
            if (o[0] !== n[0] || o[1] !== n[1]) {
                width = n[0];
                height = n[1];
                box.purge();
            }
        });
        this.watch('position', function (o, n) {
            if (o[0] !== n[0] || o[1] !== n[1]) {
                box.purge();
            }
        });
    }
]);