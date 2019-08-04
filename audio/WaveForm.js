import * as utils from '../util';
import WebAudio from './WebAudio';

export default class WaveForm extends utils.Observer {
    defaultParams = {
        audioContext: null,
        audioScriptProcessor: null,
        audioRate: 1,
        autoCenter: true,
        backgroundColor: null,
        barHeight: 1,
        barGap: null,
        container: null,
        cursorColor: '#333',
        cursorWidth: 1,
        dragSelection: true,
        duration: null,
        fillParent: true,
        forceDecode: false,
        height: 128,
        hideScrollbar: false,
        interact: true,
        loopSelection: true,
        maxCanvasWidth: 4000,
        mediaContainer: null,
        minPxPerSec: 20,
        normalize: false,
        partialRender: false,
        pixelRatio: window.devicePixelRatio || screen.deviceXDPI / screen.logicalXDPI,
        progressColor: '#555',
        renderer: MultiCanvas,
        responsive: false,
        rtl: false,
        scrollParent: false,
        skipLength: 2,
        splitChannels: false,
        waveColor: '#999',
        xhr: {}
    };

    backends = {
        MediaElement,
        WebAudio
    };

    static create(params) {
        const wavesurfer = new WaveSurfer(params);
        return wavesurfer.init();
    }

    constructor(params) {
        super();

        this.params = util.extend({}, this.defaultParams, params);

        /** @private */
        this.container =
            'string' == typeof params.container
                ? document.querySelector(this.params.container)
                : this.params.container;

        if (!this.container) {
            throw new Error('Container element not found');
        }

        if (this.params.mediaContainer == null) {
            /** @private */
            this.mediaContainer = this.container;
        } else if (typeof this.params.mediaContainer == 'string') {
            /** @private */
            this.mediaContainer = document.querySelector(
                this.params.mediaContainer
            );
        } else {
            /** @private */
            this.mediaContainer = this.params.mediaContainer;
        }

        if (!this.mediaContainer) {
            throw new Error('Media Container element not found');
        }

        if (this.params.maxCanvasWidth <= 1) {
            throw new Error('maxCanvasWidth must be greater than 1');
        } else if (this.params.maxCanvasWidth % 2 == 1) {
            throw new Error('maxCanvasWidth must be an even number');
        }

        if (this.params.rtl === true) {
            util.style(this.container, { transform: 'rotateY(180deg)' });
        }

        if (this.params.backgroundColor) {
            this.setBackgroundColor(this.params.backgroundColor);
        }

        /**
         * @private Used to save the current volume when muting so we can
         * restore once unmuted
         * @type {number}
         */
        this.savedVolume = 0;

        /**
         * @private The current muted state
         * @type {boolean}
         */
        this.isMuted = false;

        /**
         * @private Will hold a list of event descriptors that need to be
         * canceled on subsequent loads of audio
         * @type {Object[]}
         */
        this.tmpEvents = [];

        /**
         * @private Holds any running audio downloads
         * @type {Observer}
         */
        this.currentRequest = null;
        /** @private */
        this.arraybuffer = null;
        /** @private */
        this.drawer = null;
        /** @private */
        this.backend = null;
        /** @private */
        this.peakCache = null;

        // cache constructor objects
        if (typeof this.params.renderer !== 'function') {
            throw new Error('Renderer parameter is invalid');
        }
        /**
         * @private The uninitialised Drawer class
         */
        this.Drawer = this.params.renderer;
        /**
         * @private The uninitialised Backend class
         */
        this.Backend = this.backends[this.params.backend];

        /**
         * @private map of plugin names that are currently initialised
         */
        this.initialisedPluginList = {};
        /** @private */
        this.isDestroyed = false;

        /**
         * Get the current ready status.
         *
         * @example const isReady = wavesurfer.isReady;
         * @return {boolean}
         */
        this.isReady = false;

        // responsive debounced event listener. If this.params.responsive is not
        // set, this is never called. Use 100ms or this.params.responsive as
        // timeout for the debounce function.
        let prevWidth = 0;
        this._onResize = util.debounce(
            () => {
                if (
                    prevWidth != this.drawer.wrapper.clientWidth &&
                    !this.params.scrollParent
                ) {
                    prevWidth = this.drawer.wrapper.clientWidth;
                    this.drawer.fireEvent('redraw');
                }
            },
            typeof this.params.responsive === 'number'
                ? this.params.responsive
                : 100
        );

        return this;
    }

    /**
     * Initialise the wave
     *
     * @example
     * var wavesurfer = new WaveSurfer(params);
     * wavesurfer.init();
     * @return {this} The wavesurfer instance
     */
    init() {
        this.registerPlugins(this.params.plugins);
        this.createDrawer();
        this.createBackend();
        this.createPeakCache();
        return this;
    }

    /**
     * Add and initialise array of plugins (if `plugin.deferInit` is falsey),
     * this function is called in the init function of wavesurfer
     *
     * @param {PluginDefinition[]} plugins An array of plugin definitions
     * @emits {WaveSurfer#plugins-registered} Called with the array of plugin definitions
     * @return {this} The wavesurfer instance
     */
    registerPlugins(plugins) {
        // first instantiate all the plugins
        plugins.forEach(plugin => this.addPlugin(plugin));

        // now run the init functions
        plugins.forEach(plugin => {
            // call init function of the plugin if deferInit is falsey
            // in that case you would manually use initPlugins()
            if (!plugin.deferInit) {
                this.initPlugin(plugin.name);
            }
        });
        this.fireEvent('plugins-registered', plugins);
        return this;
    }

    /**
     * Get a map of plugin names that are currently initialised
     *
     * @example wavesurfer.getPlugins();
     * @return {Object} Object with plugin names
     */
    getActivePlugins() {
        return this.initialisedPluginList;
    }

    /**
     * Add a plugin object to wavesurfer
     *
     * @param {PluginDefinition} plugin A plugin definition
     * @emits {WaveSurfer#plugin-added} Called with the name of the plugin that was added
     * @example wavesurfer.addPlugin(WaveSurfer.minimap());
     * @return {this} The wavesurfer instance
     */
    addPlugin(plugin) {
        if (!plugin.name) {
            throw new Error('Plugin does not have a name!');
        }
        if (!plugin.instance) {
            throw new Error(
                `Plugin ${plugin.name} does not have an instance property!`
            );
        }

        // staticProps properties are applied to wavesurfer instance
        if (plugin.staticProps) {
            Object.keys(plugin.staticProps).forEach(pluginStaticProp => {
                /**
                 * Properties defined in a plugin definition's `staticProps` property are added as
                 * staticProps properties of the WaveSurfer instance
                 */
                this[pluginStaticProp] = plugin.staticProps[pluginStaticProp];
            });
        }

        const Instance = plugin.instance;

        // turn the plugin instance into an observer
        const observerPrototypeKeys = Object.getOwnPropertyNames(
            util.Observer.prototype
        );
        observerPrototypeKeys.forEach(key => {
            Instance.prototype[key] = util.Observer.prototype[key];
        });

        /**
         * Instantiated plugin classes are added as a property of the wavesurfer
         * instance
         * @type {Object}
         */
        this[plugin.name] = new Instance(plugin.params || {}, this);
        this.fireEvent('plugin-added', plugin.name);
        return this;
    }

    /**
     * Initialise a plugin
     *
     * @param {string} name A plugin name
     * @emits WaveSurfer#plugin-initialised
     * @example wavesurfer.initPlugin('minimap');
     * @return {this} The wavesurfer instance
     */
    initPlugin(name) {
        if (!this[name]) {
            throw new Error(`Plugin ${name} has not been added yet!`);
        }
        if (this.initialisedPluginList[name]) {
            // destroy any already initialised plugins
            this.destroyPlugin(name);
        }
        this[name].init();
        this.initialisedPluginList[name] = true;
        this.fireEvent('plugin-initialised', name);
        return this;
    }

    /**
     * Destroy a plugin
     *
     * @param {string} name A plugin name
     * @emits WaveSurfer#plugin-destroyed
     * @example wavesurfer.destroyPlugin('minimap');
     * @returns {this} The wavesurfer instance
     */
    destroyPlugin(name) {
        if (!this[name]) {
            throw new Error(
                `Plugin ${name} has not been added yet and cannot be destroyed!`
            );
        }
        if (!this.initialisedPluginList[name]) {
            throw new Error(
                `Plugin ${name} is not active and cannot be destroyed!`
            );
        }
        if (typeof this[name].destroy !== 'function') {
            throw new Error(`Plugin ${name} does not have a destroy function!`);
        }

        this[name].destroy();
        delete this.initialisedPluginList[name];
        this.fireEvent('plugin-destroyed', name);
        return this;
    }

    /**
     * Destroy all initialised plugins. Convenience function to use when
     * wavesurfer is removed
     *
     * @private
     */
    destroyAllPlugins() {
        Object.keys(this.initialisedPluginList).forEach(name =>
            this.destroyPlugin(name)
        );
    }

    /**
     * Create the drawer and draw the waveform
     *
     * @private
     * @emits WaveSurfer#drawer-created
     */
    createDrawer() {
        this.drawer = new this.Drawer(this.container, this.params);
        this.drawer.init();
        this.fireEvent('drawer-created', this.drawer);

        if (this.params.responsive !== false) {
            window.addEventListener('resize', this._onResize, true);
            window.addEventListener('orientationchange', this._onResize, true);
        }

        this.drawer.on('redraw', () => {
            this.drawBuffer();
            this.drawer.progress(this.backend.getPlayedPercents());
        });

        // Click-to-seek
        this.drawer.on('click', (e, progress) => {
            setTimeout(() => this.seekTo(progress), 0);
        });

        // Relay the scroll event from the drawer
        this.drawer.on('scroll', e => {
            if (this.params.partialRender) {
                this.drawBuffer();
            }
            this.fireEvent('scroll', e);
        });
    }

    /**
     * Create the backend
     *
     * @private
     * @emits WaveSurfer#backend-created
     */
    createBackend() {
        if (this.backend) {
            this.backend.destroy();
        }

        // Back compat
        if (this.params.backend == 'AudioElement') {
            this.params.backend = 'MediaElement';
        }

        if (
            this.params.backend == 'WebAudio' &&
            !this.Backend.prototype.supportsWebAudio.call(null)
        ) {
            this.params.backend = 'MediaElement';
        }

        this.backend = new this.Backend(this.params);
        this.backend.init();
        this.fireEvent('backend-created', this.backend);

        this.backend.on('finish', () => {
            this.drawer.progress(this.backend.getPlayedPercents());
            this.fireEvent('finish');
        });
        this.backend.on('play', () => this.fireEvent('play'));
        this.backend.on('pause', () => this.fireEvent('pause'));

        this.backend.on('audioprocess', time => {
            this.drawer.progress(this.backend.getPlayedPercents());
            this.fireEvent('audioprocess', time);
        });

        // only needed for MediaElement backend
        if (this.params.backend === 'MediaElement') {
            this.backend.on('seek', () => {
                this.drawer.progress(this.backend.getPlayedPercents());
            });

            this.backend.on('volume', () => {
                let newVolume = this.getVolume();
                this.fireEvent('volume', newVolume);

                if (this.backend.isMuted !== this.isMuted) {
                    this.isMuted = this.backend.isMuted;
                    this.fireEvent('mute', this.isMuted);
                }
            });
        }
    }

    /**
     * Create the peak cache
     *
     * @private
     */
    createPeakCache() {
        if (this.params.partialRender) {
            this.peakCache = new PeakCache();
        }
    }

    /**
     * Get the duration of the audio clip
     *
     * @example const duration = wavesurfer.getDuration();
     * @return {number} Duration in seconds
     */
    getDuration() {
        return this.backend.getDuration();
    }

    /**
     * Get the current playback position
     *
     * @example const currentTime = wavesurfer.getCurrentTime();
     * @return {number} Playback position in seconds
     */
    getCurrentTime() {
        return this.backend.getCurrentTime();
    }

    /**
     * Set the current play time in seconds.
     *
     * @param {number} seconds A positive number in seconds. E.g. 10 means 10
     * seconds, 60 means 1 minute
     */
    setCurrentTime(seconds) {
        if (seconds >= this.getDuration()) {
            this.seekTo(1);
        } else {
            this.seekTo(seconds / this.getDuration());
        }
    }

    /**
     * Starts playback from the current position. Optional start and end
     * measured in seconds can be used to set the range of audio to play.
     *
     * @param {?number} start Position to start at
     * @param {?number} end Position to end at
     * @emits WaveSurfer#interaction
     * @return {Promise} Result of the backend play method
     * @example
     * // play from second 1 to 5
     * wavesurfer.play(1, 5);
     */
    play(start, end) {
        this.fireEvent('interaction', () => this.play(start, end));
        return this.backend.play(start, end);
    }

    /**
     * Stops and pauses playback
     *
     * @example wavesurfer.pause();
     * @return {Promise} Result of the backend pause method
     */
    pause() {
        if (!this.backend.isPaused()) {
            return this.backend.pause();
        }
    }

    /**
     * Toggle playback
     *
     * @example wavesurfer.playPause();
     * @return {Promise} Result of the backend play or pause method
     */
    playPause() {
        return this.backend.isPaused() ? this.play() : this.pause();
    }

    /**
     * Get the current playback state
     *
     * @example const isPlaying = wavesurfer.isPlaying();
     * @return {boolean} False if paused, true if playing
     */
    isPlaying() {
        return !this.backend.isPaused();
    }

    /**
     * Skip backward
     *
     * @param {?number} seconds Amount to skip back, if not specified `skipLength`
     * is used
     * @example wavesurfer.skipBackward();
     */
    skipBackward(seconds) {
        this.skip(-seconds || -this.params.skipLength);
    }

    /**
     * Skip forward
     *
     * @param {?number} seconds Amount to skip back, if not specified `skipLength`
     * is used
     * @example wavesurfer.skipForward();
     */
    skipForward(seconds) {
        this.skip(seconds || this.params.skipLength);
    }

    /**
     * Skip a number of seconds from the current position (use a negative value
     * to go backwards).
     *
     * @param {number} offset Amount to skip back or forwards
     * @example
     * // go back 2 seconds
     * wavesurfer.skip(-2);
     */
    skip(offset) {
        const duration = this.getDuration() || 1;
        let position = this.getCurrentTime() || 0;
        position = Math.max(0, Math.min(duration, position + (offset || 0)));
        this.seekAndCenter(position / duration);
    }

    /**
     * Seeks to a position and centers the view
     *
     * @param {number} progress Between 0 (=beginning) and 1 (=end)
     * @example
     * // seek and go to the middle of the audio
     * wavesurfer.seekTo(0.5);
     */
    seekAndCenter(progress) {
        this.seekTo(progress);
        this.drawer.recenter(progress);
    }

    /**
     * Seeks to a position
     *
     * @param {number} progress Between 0 (=beginning) and 1 (=end)
     * @emits WaveSurfer#interaction
     * @emits WaveSurfer#seek
     * @example
     * // seek to the middle of the audio
     * wavesurfer.seekTo(0.5);
     */
    seekTo(progress) {
        // return an error if progress is not a number between 0 and 1
        if (
            typeof progress !== 'number' ||
            !isFinite(progress) ||
            progress < 0 ||
            progress > 1
        ) {
            throw new Error(
                'Error calling wavesurfer.seekTo, parameter must be a number between 0 and 1!'
            );
        }
        this.fireEvent('interaction', () => this.seekTo(progress));

        const paused = this.backend.isPaused();
        // avoid draw wrong position while playing backward seeking
        if (!paused) {
            this.backend.pause();
        }
        // avoid small scrolls while paused seeking
        const oldScrollParent = this.params.scrollParent;
        this.params.scrollParent = false;
        this.backend.seekTo(progress * this.getDuration());
        this.drawer.progress(progress);

        if (!paused) {
            this.backend.play();
        }
        this.params.scrollParent = oldScrollParent;
        this.fireEvent('seek', progress);
    }

    /**
     * Stops and goes to the beginning.
     *
     * @example wavesurfer.stop();
     */
    stop() {
        this.pause();
        this.seekTo(0);
        this.drawer.progress(0);
    }

    /**
     * Sets the ID of the audio device to use for output and returns a Promise.
     *
     * @param {string} deviceId String value representing underlying output
     * device
     * @returns {Promise} `Promise` that resolves to `undefined` when there are
     * no errors detected.
     */
    setSinkId(deviceId) {
        return this.backend.setSinkId(deviceId);
    }

    /**
     * Set the playback volume.
     *
     * @param {number} newVolume A value between 0 and 1, 0 being no
     * volume and 1 being full volume.
     * @emits WaveSurfer#volume
     */
    setVolume(newVolume) {
        this.backend.setVolume(newVolume);
        this.fireEvent('volume', newVolume);
    }

    /**
     * Get the playback volume.
     *
     * @return {number} A value between 0 and 1, 0 being no
     * volume and 1 being full volume.
     */
    getVolume() {
        return this.backend.getVolume();
    }

    /**
     * Set the playback rate.
     *
     * @param {number} rate A positive number. E.g. 0.5 means half the normal
     * speed, 2 means double speed and so on.
     * @example wavesurfer.setPlaybackRate(2);
     */
    setPlaybackRate(rate) {
        this.backend.setPlaybackRate(rate);
    }

    /**
     * Get the playback rate.
     *
     * @return {number} The current playback rate.
     */
    getPlaybackRate() {
        return this.backend.getPlaybackRate();
    }

    /**
     * Toggle the volume on and off. If not currently muted it will save the
     * current volume value and turn the volume off. If currently muted then it
     * will restore the volume to the saved value, and then rest the saved
     * value.
     *
     * @example wavesurfer.toggleMute();
     */
    toggleMute() {
        this.setMute(!this.isMuted);
    }

    /**
     * Enable or disable muted audio
     *
     * @param {boolean} mute Specify `true` to mute audio.
     * @emits WaveSurfer#volume
     * @emits WaveSurfer#mute
     * @example
     * // unmute
     * wavesurfer.setMute(false);
     * console.log(wavesurfer.getMute()) // logs false
     */
    setMute(mute) {
        // ignore all muting requests if the audio is already in that state
        if (mute === this.isMuted) {
            this.fireEvent('mute', this.isMuted);
            return;
        }

        if (mute) {
            // If currently not muted then save current volume,
            // turn off the volume and update the mute properties
            this.savedVolume = this.backend.getVolume();
            this.backend.setVolume(0);
            this.isMuted = true;
            this.fireEvent('volume', 0);
        } else {
            // If currently muted then restore to the saved volume
            // and update the mute properties
            this.backend.setVolume(this.savedVolume);
            this.isMuted = false;
            this.fireEvent('volume', this.savedVolume);
        }
        this.fireEvent('mute', this.isMuted);
    }

    /**
     * Get the current mute status.
     *
     * @example const isMuted = wavesurfer.getMute();
     * @return {boolean} Current mute status
     */
    getMute() {
        return this.isMuted;
    }

    /**
     * Get the list of current set filters as an array.
     *
     * Filters must be set with setFilters method first
     *
     * @return {array} List of enabled filters
     */
    getFilters() {
        return this.backend.filters || [];
    }

    /**
     * Toggles `scrollParent` and redraws
     *
     * @example wavesurfer.toggleScroll();
     */
    toggleScroll() {
        this.params.scrollParent = !this.params.scrollParent;
        this.drawBuffer();
    }

    /**
     * Toggle mouse interaction
     *
     * @example wavesurfer.toggleInteraction();
     */
    toggleInteraction() {
        this.params.interact = !this.params.interact;
    }

    /**
     * Get the fill color of the waveform after the cursor.
     *
     * @return {string} A CSS color string.
     */
    getWaveColor() {
        return this.params.waveColor;
    }

    /**
     * Set the fill color of the waveform after the cursor.
     *
     * @param {string} color A CSS color string.
     * @example wavesurfer.setWaveColor('#ddd');
     */
    setWaveColor(color) {
        this.params.waveColor = color;
        this.drawBuffer();
    }

    /**
     * Get the fill color of the waveform behind the cursor.
     *
     * @return {string} A CSS color string.
     */
    getProgressColor() {
        return this.params.progressColor;
    }

    /**
     * Set the fill color of the waveform behind the cursor.
     *
     * @param {string} color A CSS color string.
     * @example wavesurfer.setProgressColor('#400');
     */
    setProgressColor(color) {
        this.params.progressColor = color;
        this.drawBuffer();
    }

    /**
     * Get the background color of the waveform container.
     *
     * @return {string} A CSS color string.
     */
    getBackgroundColor() {
        return this.params.backgroundColor;
    }

    /**
     * Set the background color of the waveform container.
     *
     * @param {string} color A CSS color string.
     * @example wavesurfer.setBackgroundColor('#FF00FF');
     */
    setBackgroundColor(color) {
        this.params.backgroundColor = color;
        util.style(this.container, { background: this.params.backgroundColor });
    }

    /**
     * Get the fill color of the cursor indicating the playhead
     * position.
     *
     * @return {string} A CSS color string.
     */
    getCursorColor() {
        return this.params.cursorColor;
    }

    /**
     * Set the fill color of the cursor indicating the playhead
     * position.
     *
     * @param {string} color A CSS color string.
     * @example wavesurfer.setCursorColor('#222');
     */
    setCursorColor(color) {
        this.params.cursorColor = color;
        this.drawer.updateCursor();
    }

    /**
     * Get the height of the waveform.
     *
     * @return {number} Height measured in pixels.
     */
    getHeight() {
        return this.params.height;
    }

    /**
     * Set the height of the waveform.
     *
     * @param {number} height Height measured in pixels.
     * @example wavesurfer.setHeight(200);
     */
    setHeight(height) {
        this.params.height = height;
        this.drawer.setHeight(height * this.params.pixelRatio);
        this.drawBuffer();
    }

    /**
     * Get the correct peaks for current wave view-port and render wave
     *
     * @private
     * @emits WaveSurfer#redraw
     */
    drawBuffer() {
        const nominalWidth = Math.round(
            this.getDuration() *
                this.params.minPxPerSec *
                this.params.pixelRatio
        );
        const parentWidth = this.drawer.getWidth();
        let width = nominalWidth;
        // always start at 0 after zooming for scrolling : issue redraw left part
        let start = 0;
        let end = Math.max(start + parentWidth, width);
        // Fill container
        if (
            this.params.fillParent &&
            (!this.params.scrollParent || nominalWidth < parentWidth)
        ) {
            width = parentWidth;
            start = 0;
            end = width;
        }

        let peaks;
        if (this.params.partialRender) {
            const newRanges = this.peakCache.addRangeToPeakCache(
                width,
                start,
                end
            );
            let i;
            for (i = 0; i < newRanges.length; i++) {
                peaks = this.backend.getPeaks(
                    width,
                    newRanges[i][0],
                    newRanges[i][1]
                );
                this.drawer.drawPeaks(
                    peaks,
                    width,
                    newRanges[i][0],
                    newRanges[i][1]
                );
            }
        } else {
            peaks = this.backend.getPeaks(width, start, end);
            this.drawer.drawPeaks(peaks, width, start, end);
        }
        this.fireEvent('redraw', peaks, width);
    }

    /**
     * Horizontally zooms the waveform in and out. It also changes the parameter
     * `minPxPerSec` and enables the `scrollParent` option. Calling the function
     * with a falsey parameter will reset the zoom state.
     *
     * @param {?number} pxPerSec Number of horizontal pixels per second of
     * audio, if none is set the waveform returns to unzoomed state
     * @emits WaveSurfer#zoom
     * @example wavesurfer.zoom(20);
     */
    zoom(pxPerSec) {
        if (!pxPerSec) {
            this.params.minPxPerSec = this.defaultParams.minPxPerSec;
            this.params.scrollParent = false;
        } else {
            this.params.minPxPerSec = pxPerSec;
            this.params.scrollParent = true;
        }

        this.drawBuffer();
        this.drawer.progress(this.backend.getPlayedPercents());

        this.drawer.recenter(this.getCurrentTime() / this.getDuration());
        this.fireEvent('zoom', pxPerSec);
    }

    /**
     * Decode buffer and load
     *
     * @private
     * @param {ArrayBuffer} arraybuffer Buffer to process
     */
    loadArrayBuffer(arraybuffer) {
        this.decodeArrayBuffer(arraybuffer, data => {
            if (!this.isDestroyed) {
                this.loadDecodedBuffer(data);
            }
        });
    }

    /**
     * Directly load an externally decoded AudioBuffer
     *
     * @private
     * @param {AudioBuffer} buffer Buffer to process
     * @emits WaveSurfer#ready
     */
    loadDecodedBuffer(buffer) {
        this.backend.load(buffer);
        this.drawBuffer();
        this.fireEvent('ready');
        this.isReady = true;
    }

    /**
     * Loads audio data from a Blob or File object
     *
     * @param {Blob|File} blob Audio data
     * @example
     */
    loadBlob(blob) {
        // Create file reader
        const reader = new FileReader();
        reader.addEventListener('progress', e => this.onProgress(e));
        reader.addEventListener('load', e =>
            this.loadArrayBuffer(e.target.result)
        );
        reader.addEventListener('error', () =>
            this.fireEvent('error', 'Error reading file')
        );
        reader.readAsArrayBuffer(blob);
        this.empty();
    }

    /**
     * Loads audio and re-renders the waveform.
     *
     * @param {string|HTMLMediaElement} url The url of the audio file or the
     * audio element with the audio
     * @param {number[]|Number.<Array[]>} peaks Wavesurfer does not have to decode
     * the audio to render the waveform if this is specified
     * @param {?string} preload (Use with backend `MediaElement`)
     * `'none'|'metadata'|'auto'` Preload attribute for the media element
     * @param {?number} duration The duration of the audio. This is used to
     * render the peaks data in the correct size for the audio duration (as
     * befits the current `minPxPerSec` and zoom value) without having to decode
     * the audio.
     * @returns {void}
     * @example
     * // uses fetch or media element to load file (depending on backend)
     * wavesurfer.load('http://example.com/demo.wav');
     *
     * // setting preload attribute with media element backend and supplying
     * // peaks
     * wavesurfer.load(
     *   'http://example.com/demo.wav',
     *   [0.0218, 0.0183, 0.0165, 0.0198, 0.2137, 0.2888],
     *   true
     * );
     */
    load(url, peaks, preload, duration) {
        this.empty();

        if (preload) {
            // check whether the preload attribute will be usable and if not log
            // a warning listing the reasons why not and nullify the variable
            const preloadIgnoreReasons = {
                "Preload is not 'auto', 'none' or 'metadata'":
                    ['auto', 'metadata', 'none'].indexOf(preload) === -1,
                'Peaks are not provided': !peaks,
                'Backend is not of type MediaElement':
                    this.params.backend !== 'MediaElement',
                'Url is not of type string': typeof url !== 'string'
            };
            const activeReasons = Object.keys(preloadIgnoreReasons).filter(
                reason => preloadIgnoreReasons[reason]
            );
            if (activeReasons.length) {
                // eslint-disable-next-line no-console
                console.warn(
                    'Preload parameter of wavesurfer.load will be ignored because:\n\t- ' +
                        activeReasons.join('\n\t- ')
                );
                // stop invalid values from being used
                preload = null;
            }
        }

        switch (this.params.backend) {
            case 'WebAudio':
                return this.loadBuffer(url, peaks, duration);
            case 'MediaElement':
                return this.loadMediaElement(url, peaks, preload, duration);
        }
    }

    /**
     * Loads audio using Web Audio buffer backend.
     *
     * @private
     * @param {string} url URL of audio file
     * @param {number[]|Number.<Array[]>} peaks Peaks data
     * @param {?number} duration Optional duration of audio file
     * @returns {void}
     */
    loadBuffer(url, peaks, duration) {
        const load = action => {
            if (action) {
                this.tmpEvents.push(this.once('ready', action));
            }
            return this.getArrayBuffer(url, data => this.loadArrayBuffer(data));
        };

        if (peaks) {
            this.backend.setPeaks(peaks, duration);
            this.drawBuffer();
            this.tmpEvents.push(this.once('interaction', load));
        } else {
            return load();
        }
    }

    /**
     * Either create a media element, or load an existing media element.
     *
     * @private
     * @param {string|HTMLMediaElement} urlOrElt Either a path to a media file, or an
     * existing HTML5 Audio/Video Element
     * @param {number[]|Number.<Array[]>} peaks Array of peaks. Required to bypass web audio
     * dependency
     * @param {?boolean} preload Set to true if the preload attribute of the
     * audio element should be enabled
     * @param {?number} duration Optional duration of audio file
     */
    loadMediaElement(urlOrElt, peaks, preload, duration) {
        let url = urlOrElt;

        if (typeof urlOrElt === 'string') {
            this.backend.load(url, this.mediaContainer, peaks, preload);
        } else {
            const elt = urlOrElt;
            this.backend.loadElt(elt, peaks);

            // If peaks are not provided,
            // url = element.src so we can get peaks with web audio
            url = elt.src;
        }

        this.tmpEvents.push(
            this.backend.once('canplay', () => {
                this.drawBuffer();
                this.fireEvent('ready');
                this.isReady = true;
            }),
            this.backend.once('error', err => this.fireEvent('error', err))
        );

        // If no pre-decoded peaks provided or pre-decoded peaks are
        // provided with forceDecode flag, attempt to download the
        // audio file and decode it with Web Audio.
        if (peaks) {
            this.backend.setPeaks(peaks, duration);
        }

        if (
            (!peaks || this.params.forceDecode) &&
            this.backend.supportsWebAudio()
        ) {
            this.getArrayBuffer(url, arraybuffer => {
                this.decodeArrayBuffer(arraybuffer, buffer => {
                    this.backend.buffer = buffer;
                    this.backend.setPeaks(null);
                    this.drawBuffer();
                    this.fireEvent('waveform-ready');
                });
            });
        }
    }

    /**
     * Decode an array buffer and pass data to a callback
     *
     * @private
     * @param {Object} arraybuffer The array buffer to decode
     * @param {function} callback The function to call on complete
     */
    decodeArrayBuffer(arraybuffer, callback) {
        this.arraybuffer = arraybuffer;
        this.backend.decodeArrayBuffer(
            arraybuffer,
            data => {
                // Only use the decoded data if we haven't been destroyed or
                // another decode started in the meantime
                if (!this.isDestroyed && this.arraybuffer == arraybuffer) {
                    callback(data);
                    this.arraybuffer = null;
                }
            },
            () => this.fireEvent('error', 'Error decoding audiobuffer')
        );
    }

    /**
     * Load an array buffer using fetch and pass the result to a callback
     *
     * @param {string} url The URL of the file object
     * @param {function} callback The function to call on complete
     * @returns {util.fetchFile} fetch call
     * @private
     */
    getArrayBuffer(url, callback) {
        let options = util.extend(
            {
                url: url,
                responseType: 'arraybuffer'
            },
            this.params.xhr
        );
        const request = util.fetchFile(options);

        this.currentRequest = request;

        this.tmpEvents.push(
            request.on('progress', e => {
                this.onProgress(e);
            }),
            request.on('success', data => {
                callback(data);
                this.currentRequest = null;
            }),
            request.on('error', e => {
                this.fireEvent('error', 'fetch error: ' + e.message);
                this.currentRequest = null;
            })
        );

        return request;
    }

    /**
     * Called while the audio file is loading
     *
     * @private
     * @param {Event} e Progress event
     * @emits WaveSurfer#loading
     */
    onProgress(e) {
        let percentComplete;
        if (e.lengthComputable) {
            percentComplete = e.loaded / e.total;
        } else {
            // Approximate progress with an asymptotic
            // function, and assume downloads in the 1-3 MB range.
            percentComplete = e.loaded / (e.loaded + 1000000);
        }
        this.fireEvent('loading', Math.round(percentComplete * 100), e.target);
    }

    /**
     * Exports PCM data into a JSON array and opens in a new window.
     *
     * @param {number} length=1024 The scale in which to export the peaks. (Integer)
     * @param {number} accuracy=10000 (Integer)
     * @param {?boolean} noWindow Set to true to disable opening a new
     * window with the JSON
     * @param {number} start Start index
     * @todo Update exportPCM to work with new getPeaks signature
     * @return {string} JSON of peaks
     */
    exportPCM(length, accuracy, noWindow, start) {
        length = length || 1024;
        start = start || 0;
        accuracy = accuracy || 10000;
        noWindow = noWindow || false;
        const peaks = this.backend.getPeaks(length, start);
        const arr = [].map.call(
            peaks,
            val => Math.round(val * accuracy) / accuracy
        );
        const json = JSON.stringify(arr);
        if (!noWindow) {
            window.open(
                'data:application/json;charset=utf-8,' +
                    encodeURIComponent(json)
            );
        }
        return json;
    }

    /**
     * Save waveform image as data URI.
     *
     * The default format is `'image/png'`. Other supported types are
     * `'image/jpeg'` and `'image/webp'`.
     *
     * @param {string} format='image/png' A string indicating the image format.
     * The default format type is `'image/png'`.
     * @param {number} quality=1 A number between 0 and 1 indicating the image
     * quality to use for image formats that use lossy compression such as
     * `'image/jpeg'`` and `'image/webp'`.
     * @param {string} type Image data type to return. Either 'dataURL' (default)
     * or 'blob'.
     * @return {string|string[]|Promise} When using `'dataURL'` type this returns
     * a single data URL or an array of data URLs, one for each canvas. When using
     * `'blob'` type this returns a `Promise` resolving with an array of `Blob`
     * instances, one for each canvas.
     */
    exportImage(format, quality, type) {
        if (!format) {
            format = 'image/png';
        }
        if (!quality) {
            quality = 1;
        }
        if (!type) {
            type = 'dataURL';
        }

        return this.drawer.getImage(format, quality, type);
    }

    /**
     * Cancel any fetch request currently in progress
     */
    cancelAjax() {
        if (this.currentRequest && this.currentRequest.controller) {
            this.currentRequest.controller.abort();
            this.currentRequest = null;
        }
    }

    /**
     * @private
     */
    clearTmpEvents() {
        this.tmpEvents.forEach(e => e.un());
    }

    /**
     * Display empty waveform.
     */
    empty() {
        if (!this.backend.isPaused()) {
            this.stop();
            this.backend.disconnectSource();
        }
        this.isReady = false;
        this.cancelAjax();
        this.clearTmpEvents();
        this.drawer.progress(0);
        this.drawer.setWidth(0);
        this.drawer.drawPeaks({ length: this.drawer.getWidth() }, 0);
    }

    /**
     * Remove events, elements and disconnect WebAudio nodes.
     *
     * @emits WaveSurfer#destroy
     */
    destroy() {
        this.destroyAllPlugins();
        this.fireEvent('destroy');
        this.cancelAjax();
        this.clearTmpEvents();
        this.unAll();
        if (this.params.responsive !== false) {
            window.removeEventListener('resize', this._onResize, true);
            window.removeEventListener(
                'orientationchange',
                this._onResize,
                true
            );
        }
        this.backend.destroy();
        this.drawer.destroy();
        this.isDestroyed = true;
        this.isReady = false;
        this.arraybuffer = null;
    }
}
