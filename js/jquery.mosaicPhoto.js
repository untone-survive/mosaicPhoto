/**
 * Class: mosaicPhoto
 * Use: insert preview photos mosaically into div
 * Author: Anton Syuvaev (http://h8every1.ru)
 * Company: Elustro (http://elustro.ru)
 * Date: 10.05.2012
 * Version: 1.0.2
 */

(function ($) {

    var mosaicPhoto = function (root, settings) {

        var self = this, $window = $(window), $document = $(document),

        // container element for all divs with images
            container = $('<div style="height:100%;position:relative"></div>').appendTo(root),

        // object of images
            images = settings.images,
        // number of images to show
            maxImages,
        // selected images category
            imgCat,
        // image dimensions
            imgWidth = 0, imgHeight = 0,
        // timer id for automatic transitions
            timerId,
            listeners,
        // namespace for binding events
            namespace = '.mosaicphoto'+(new Date).getTime();

        function Initialize() {
            checkOptions();
            // insert images
            return _populate();
        }

        function checkOptions() {
            // repair user input
            _repairRatio();
            // calculate image div dimensions
            _checkDimensions();
            // set new columns and rows number
            _newColsRows();
            // set maximum of images
            _setMaxImages();
            // select images category
            _selectCategory(imgCat);
            // bind window resize event
            _windowResize();
            // setup listener objects
            _setupListeners();
            // check timer
            _checkTimer();
        }

        // parse user input
        function _repairRatio() {
            while (settings.ratio > 1) {
                settings.ratio /= 100;
            }
        }

        // select category from images
        function _selectCategory(category) {
            if (!category || !images.hasOwnProperty(category) || typeof images[category] !== 'object' ) {
                category = _selectFirstCategory();
            }
            imgCat = category;
        }

        // returns (probably) first category from images object
        function _selectFirstCategory() {
            for (var cat in images) {
                if (images.hasOwnProperty(cat)) {
                    return cat;
                }
            }
            alert('No image data!');
            return null;
        }

        function _newColsRows() {
            // if not dynamic, there's no need to change number of cols
            if (!settings.dynamic) {
                return true;
            }

            var newCols = Math.floor(container.width() / imgWidth),
                newRows = Math.floor(container.height() / imgHeight);

            if (newRows !== settings.rows || newCols !== settings.cols) {
                settings.rows = newRows;
                settings.cols = newCols;
                return true;
            }
            return false;
        }

        // calculates image dimensions
        function _checkDimensions() {
            // calculating single item dimensions from css
            var proto = $('<div class="' + settings.activeClass + '"/>').appendTo(container);
            imgWidth = proto.outerWidth(true);
            imgHeight = proto.outerHeight(true);
            proto = null;
        }

        // generates and inserts images into container
        function _populate() {

            var maxImagesReal = Math.min(maxImages, images[imgCat].length);

            if (!maxImagesReal) {
                return false;
            }
            // get random images from current set
            var imgs = _randomFromArray(images[imgCat], maxImagesReal),

            // get random image positions
                divs = [],
                totalDivs = settings.rows * settings.cols;

            for (var i = 0; i < totalDivs; i++) {
                divs[i] = i;
            }
            // get random image div-s
            divs = _randomFromArray(divs, maxImagesReal).sort(function (a, b) {
                return a - b;
            });

            // generating string of divs to insert into container
            var position = 0,
                div = divs.shift(),
                img = imgs.shift(),
                imgString = '';

            // walk through every cell of container
            for (i = 0; i < settings.rows; i++) {
                for (var j = 0; j < settings.cols; j++) {
                    // if there are still images to insert
                    if (divs.length) {
                        // and position is filled, insert image
                        if (position === div) {
                            var isObject = typeof img === 'object',
                                src = isObject ? img[0] : img,
                            // if link is provided, generate it
                                link = isObject && img[1] ? '<a href="' + img[1] + '"></a>' : '';

                            // generate image
                            imgString += '<div class="' + settings.activeClass + '" '
                                + 'style="top:' + ( i * imgHeight) + 'px;'
                                + 'left:' + ( j * imgWidth) + 'px;'
                                + 'background-image:url(' + src + ')">'
                                + link + '</div>';

                            // select next image and div for iserting
                            div = divs.shift();
                            img = imgs.shift();
                        }
                        position++;
                    }
                    else { // if there are no more images to insert
                        break;
                    }
                }
            }

            // clear container
            _clearContainer();
            $(imgString).appendTo(container)
                // fade in all added photos
                .fadeIn(settings.fadeTime);
            settings.showAllCallback();
            return true;

        }

        function _windowResize() {
            $window.unbind('resize'+namespace);
            if (settings.dynamic) {
                $window.bind('resize'+namespace, function () {
                    if (_newColsRows()) {
                        return _populate();
                    }
                });
            }
        }

        function _setupListeners() {
            $document.undelegate(settings.listenersEvents + namespace);

            listeners = $(settings.listeners);
            if (listeners.length) {
                $document
                    .delegate(settings.listeners, settings.listenersEvents + namespace, function (e) {
                        _selectCategory($(this).attr('rel'));
                        _populate();
                        settings.listenerCallback();
                        return e.preventDefault();
                    })
                    .delegate(settings.listeners, 'click'+namespace, function (e) {
                        return e.preventDefault();
                    });
            }

        }

        // get maximum of possible images
        function _setMaxImages() {
            maxImages = Math.min(
                Math.floor(settings.rows * settings.cols * settings.ratio),
                settings.maxImages
            );
        }

        // clear the container element
        function _clearContainer() {
            container.html('');
        }

        // timer
        function _checkTimer() {
            // if settings were changed, stop timer
            if (timerId) {
                clearInterval(timerId);
            }
            if (settings.auto) {
                timerId = setInterval(function () {
                    return _populate();
                }, settings.timer + settings.fadeTime);
            }
        }

        // shuffles the array and returns part of it
        function _randomFromArray(array, count) {
            var result = [],

            //clone given array in temporary var
                tmp = array.slice();
            while (tmp.length) {
                result.push(tmp.splice(Math.random() * tmp.length, 1)[0]);
            }

            // return part of shuffled array
            return result.slice(0, count);
        }

        this.getOptions = function (option) {
            return (typeof option === 'undefined') ? settings : settings[option];
        };

        this.setOptions = function (options) {
            $window.undelegate(settings.listenersEvents + namespace);
            $.extend(settings, options);
            checkOptions();
            return self;
        };

        this.selectCategory = function (category) {
            _selectCategory(category);
            return self;
        };

        this.refresh = function() {
            _populate();
            return self;
        };

        this.destroy = function() {
            $window.undelegate(namespace);
            if (timerId) {
                clearInterval(timerId);
            }
            container.remove();
            root.removeData('mosaicphoto');
            return root;
        };

        Initialize();

    };
    mosaicPhoto.defaults = {
        rows:3, /* number of rows */
        cols:8, /* number of columns */
        ratio:0.8, /* amount of filled spots. 0 - none, 1 - all spots are filled with images. With maximum of maxImages */
        maxImages:24, /* maximum this number of images will be shown. overrides ratio setting */
        dynamic:true, /* if set to true, columns and rows are set dynamically. overrides 'rows' and 'cols' settings */

        activeClass:'mosaicItem', /* class for mosaic div elements*/
        fadeTime:750, /* fading time */
        auto:false, /* shoud the mosaic refill automatically& */
        timer:3000, /* */

        images:{}, /* object with arrays of images. must contain at least 1 category. */

        listeners:'', /* string representing listener objects container. i.e. "#menu a". tags inside 'listeners'. 'listenersEvents' ore delegated on those. Tags must contain 'rel' attribute with a value of correspoding images category. (<a href="#" rel="cat1>category 1</a> <a href="#" rel="cat-2>category 2</a>) */
        listenersEvents:'click', // event for listener objects

        showAllCallback:function () {
        }, // executed after mosaic has been filled with images
        listenerCallback:function () {
        } // exected after listener has finishd its event
    };


    // jQuery plugin implementation
    $.fn.mosaicPhoto = function (mp_settings) {

        // return existing instance
        var data = this.data("mosaicphoto");
        if (data) {
            if(typeof mp_settings === 'object') {
                data.setOptions(mp_settings);
            }
            return data;
        } else {
            // setup settings
            mp_settings = $.extend({}, mosaicPhoto.defaults, mp_settings);

            this.each(function () {
                var $this = $(this);
                data = new mosaicPhoto($this, mp_settings);
                $this.data("mosaicphoto", data);
            });
            return this;
        }


    };

})(jQuery);

