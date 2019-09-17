class Section {
    constructor(params, ws) {
        this.wavesurfer = ws;
        this.wrapper = ws.drawer.wrapper;
        this.util = ws.util;
        this.style = this.util.style;

        this.id = params.id == null ? ws.util.getId() : params.id;
        this.start = Number(params.start) || 0;
        this.end =
            params.end == null
                ? // small marker-like region
                  this.start +
                  (4 / this.wrapper.scrollWidth) * this.wavesurfer.getDuration()
                : Number(params.end);
        this.resize =
            params.resize === undefined ? true : Boolean(params.resize);
        this.drag = params.drag === undefined ? true : Boolean(params.drag);
        //this.color = params.color || 'rgba(0, 0, 0, 0.1)';
        this.color = params.color || 'hsla(190, 40%, 90%, 0.3)';
        this.data = params.data || {};
        this.attributes = params.attributes || {};

        this.maxLength = params.maxLength;
        this.minLength = params.minLength;
        this._onRedraw = () => this.updateRender();

        this.scroll = params.scroll !== false && ws.params.scrollParent;
        this.scrollSpeed = params.scrollSpeed || 1;
        this.scrollThreshold = params.scrollThreshold || 10;

        this.render();
        this.wavesurfer.on('zoom', this._onRedraw);
        this.wavesurfer.on('redraw', this._onRedraw);
        this.wavesurfer.fireEvent('section-created', this);
    }

    /* Update region params. */
    update(params) {
        if (null != params.start) {
            this.start = Number(params.start);
        }
        if (null != params.end) {
            this.end = Number(params.end);
        }
        if (null != params.color) {
            this.color = params.color;
        }
        if (null != params.data) {
            this.data = params.data;
        }
        if (null != params.resize) {
            this.resize = Boolean(params.resize);
        }
        if (null != params.drag) {
            this.drag = Boolean(params.drag);
        }
        if (null != params.maxLength) {
            this.maxLength = Number(params.maxLength);
        }
        if (null != params.minLength) {
            this.minLength = Number(params.minLength);
        }
        if (null != params.attributes) {
            this.attributes = params.attributes;
        }

        this.updateRender();
        this.fireEvent('update');
        this.wavesurfer.fireEvent('section-updated', this);
    }

    /* Remove a single region. */
    remove() {
        if (this.element) {
            this.wrapper.removeChild(this.element);
            this.element = null;
            this.fireEvent('remove');
            this.wavesurfer.un('zoom', this._onRedraw);
            this.wavesurfer.un('redraw', this._onRedraw);
            this.wavesurfer.fireEvent('section-removed', this);
        }
    }

    /* Render a section as a DOM element. */
    render() {
        const sectionEl = document.createElement('section');
        sectionEl.className = 'wavesurfer-section';
        sectionEl.title = this.formatTime(this.start, this.end);
        sectionEl.setAttribute('data-id', this.id);

        for (const attrname in this.attributes) {
            sectionEl.setAttribute(
                'data-section-' + attrname,
                this.attributes[attrname]
            );
        }

        const width = this.wrapper.scrollWidth;
        this.style(sectionEl, {
            position: 'absolute',
            zIndex: 2,
            height: '100%',
            top: '0px'
        });

        /* Resize handles */
        if (this.resize) {
            const handleLeft = sectionEl.appendChild(
                document.createElement('handle')
            );
            const handleRight = sectionEl.appendChild(
                document.createElement('handle')
            );
            handleLeft.className = 'wavesurfer-handle wavesurfer-handle-start';
            handleRight.className = 'wavesurfer-handle wavesurfer-handle-end';
            const css = {
                cursor: 'col-resize',
                position: 'absolute',
                left: '0px',
                top: '0px',
                width: '1%',
                maxWidth: '4px',
                height: '100%'
            };
            this.style(handleLeft, css);
            this.style(handleRight, css);
            this.style(handleRight, {
                left: '100%'
            });
        }

        this.element = this.wrapper.appendChild(sectionEl);
        this.updateRender();
        this.bindEvents(sectionEl);
    }

    formatTime(start, end) {
        return (start == end ? [start] : [start, end])
            .map(time =>
                [
                    Math.floor((time % 3600) / 60), // minutes
                    ('00' + Math.floor(time % 60)).slice(-2) // seconds
                ].join(':')
            )
            .join('-');
    }

    getWidth() {
        return this.wavesurfer.drawer.width / this.wavesurfer.params.pixelRatio;
    }

    /* Update element's position, width, color. */
    updateRender() {
        // duration varies during loading process, so don't overwrite important data
        const dur = this.wavesurfer.getDuration();
        const width = this.getWidth();

        var startLimited = this.start;
        var endLimited = this.end;
        if (startLimited < 0) {
            startLimited = 0;
            endLimited = endLimited - startLimited;
        }
        if (endLimited > dur) {
            endLimited = dur;
            startLimited = dur - (endLimited - startLimited);
        }

        if (this.minLength != null) {
            endLimited = Math.max(startLimited + this.minLength, endLimited);
        }

        if (this.maxLength != null) {
            endLimited = Math.min(startLimited + this.maxLength, endLimited);
        }

        if (this.element != null) {
            // Calculate the left and width values of the region such that
            // no gaps appear between regions.
            const left = Math.round((startLimited / dur) * width);
            const sectionWidth = Math.round((endLimited / dur) * width) - left;

            this.style(this.element, {
                left: left + 'px',
                width: sectionWidth + 'px',
                backgroundColor: this.color,
                cursor: this.drag ? 'move' : 'default'
            });

            for (const attrname in this.attributes) {
                this.element.setAttribute(
                    'data-section-' + attrname,
                    this.attributes[attrname]
                );
            }

            this.element.title = this.formatTime(this.start, this.end);
        }
    }

    /* Bind DOM events. */
    bindEvents() {
        this.element.addEventListener('mouseenter', e => {
            this.fireEvent('mouseenter', e);
            this.wavesurfer.fireEvent('section-mouseenter', this, e);
        });

        this.element.addEventListener('mouseleave', e => {
            this.fireEvent('mouseleave', e);
            this.wavesurfer.fireEvent('section-mouseleave', this, e);
        });

        this.element.addEventListener('click', e => {
            e.preventDefault();
            this.fireEvent('click', e);
            this.wavesurfer.fireEvent('section-click', this, e);
        });

        this.element.addEventListener('dblclick', e => {
            e.stopPropagation();
            e.preventDefault();
            this.fireEvent('dblclick', e);
            this.wavesurfer.fireEvent('section-dblclick', this, e);
        });

        /* Drag or resize on mousemove. */
        (this.drag || this.resize) &&
            (() => {
                const container = this.wavesurfer.drawer.container;
                const scrollSpeed = this.scrollSpeed;
                const scrollThreshold = this.scrollThreshold;
                let startTime;
                let touchId;
                let drag;
                let maxScroll;
                let resize;
                let updated = false;
                let scrollDirection;
                let wrapperRect;

                // Scroll when the user is dragging within the threshold
                const edgeScroll = e => {
                    const duration = this.wavesurfer.getDuration();
                    if (!scrollDirection || (!drag && !resize)) {
                        return;
                    }

                    // Update scroll position
                    let scrollLeft =
                        this.wrapper.scrollLeft + scrollSpeed * scrollDirection;
                    this.wrapper.scrollLeft = scrollLeft = Math.min(
                        maxScroll,
                        Math.max(0, scrollLeft)
                    );

                    // Get the currently selected time according to the mouse position
                    const time = this.wavesurfer.section.util.getRegionSnapToGridValue(
                        this.wavesurfer.drawer.handleEvent(e) * duration
                    );
                    const delta = time - startTime;
                    startTime = time;

                    // Continue dragging or resizing
                    drag ? this.onDrag(delta) : this.onResize(time, delta, resize);

                    // Repeat
                    window.requestAnimationFrame(() => {
                        edgeScroll(e);
                    });
                };

                const onDown = e => {
                    const duration = this.wavesurfer.getDuration();
                    if (e.touches && e.touches.length > 1) {
                        return;
                    }
                    touchId = e.targetTouches
                        ? e.targetTouches[0].identifier
                        : null;

                    // stop the event propagation, if this section is resizable or draggable
                    // and the event is therefore handled here.
                    if (this.drag || this.resize) {
                          //e.stopPropagation();
                    }

                    // Store the selected startTime we begun dragging or resizing
                    startTime = this.wavesurfer.section.util.getRegionSnapToGridValue(
                        this.wavesurfer.drawer.handleEvent(e, true) * duration
                    );

                    this.startLimited = this.start;
                    this.endLimited = this.end;

                    // Store for scroll calculations
                    maxScroll =
                        this.wrapper.scrollWidth - this.wrapper.clientWidth;
                    wrapperRect = this.wrapper.getBoundingClientRect();

                    if (e.target.tagName.toLowerCase() == 'handle') {
                        if (
                            e.target.classList.contains(
                                'wavesurfer-handle-start'
                            )
                        ) {
                            resize = 'start';
                        } else {
                            resize = 'end';
                        }
                    } else {
                        drag = true;
                        resize = false;
                    }
                    this.resizeStatus = resize;
                };
                const onUp = e => {
                    if (e.touches && e.touches.length > 1) {
                        return;
                    }

                    if (drag || resize) {
                        drag = false;
                        scrollDirection = null;
                        resize = false;
                        this.resizeStatus = resize;
                    }

                    this.startLimited = this.start;
                    this.endLimited = this.end;

                    if (updated) {
                        updated = false;
                        this.util.preventClick();
                        this.fireEvent('update-end', e);
                        this.wavesurfer.fireEvent('section-update-end', this, e);
                    }
                };
                const onMove = e => {
                  console.log("###################1111111111111111111111111111111111111");
                    const duration = this.wavesurfer.getDuration();

                    if (e.touches && e.touches.length > 1) {
                        return;
                    }
                    if (
                        e.targetTouches &&
                        e.targetTouches[0].identifier != touchId
                    ) {
                        return;
                    }

                    if (drag || resize) {
                      console.log("iiiii---startTime: ", startTime);
                        const oldTime = startTime;
                        const time = this.wavesurfer.section.util.getRegionSnapToGridValue(
                            this.wavesurfer.drawer.handleEvent(e) * duration
                        );

                        const delta = time - startTime;
                        startTime = time;

                        // Drag
                        if (this.drag && drag) {
                            updated = updated || !!delta;
                            this.onDrag(delta);
                        }

                        // Resize
                        if (this.resize && resize) {
                            updated = updated || !!delta;
                            this.onResize(time, delta, resize);
                        }

                        if (
                            this.scroll &&
                            container.clientWidth < this.wrapper.scrollWidth
                        ) {
                            if (drag) {
                                // The threshold is not between the mouse and the container edge
                                // but is between the region and the container edge
                                const regionRect = this.element.getBoundingClientRect();
                                let x = regionRect.left - wrapperRect.left;

                                // Check direction
                                if (time < oldTime && x >= 0) {
                                    scrollDirection = -1;
                                } else if (
                                    time > oldTime &&
                                    x + regionRect.width <= wrapperRect.right
                                ) {
                                    scrollDirection = 1;
                                }

                                // Check that we are still beyond the threshold
                                if (
                                    (scrollDirection === -1 &&
                                        x > scrollThreshold) ||
                                    (scrollDirection === 1 &&
                                        x + regionRect.width <
                                            wrapperRect.right - scrollThreshold)
                                ) {
                                    scrollDirection = null;
                                }
                            } else {
                                // Mouse based threshold
                                let x = e.clientX - wrapperRect.left;

                                // Check direction
                                if (x <= scrollThreshold) {
                                    scrollDirection = -1;
                                } else if (
                                    x >=
                                    wrapperRect.right - scrollThreshold
                                ) {
                                    scrollDirection = 1;
                                } else {
                                    scrollDirection = null;
                                }
                            }

                            scrollDirection && edgeScroll(e);
                        }
                    }
                };

                this.element.addEventListener('mousedown', onDown);
                this.element.addEventListener('touchstart', onDown);

                this.wrapper.addEventListener('mousemove', onMove);
                this.wrapper.addEventListener('touchmove', onMove);

                document.body.addEventListener('mouseup', onUp);
                document.body.addEventListener('touchend', onUp);

                this.on('remove', () => {
                    document.body.removeEventListener('mouseup', onUp);
                    document.body.removeEventListener('touchend', onUp);
                    this.wrapper.removeEventListener('mousemove', onMove);
                    this.wrapper.removeEventListener('touchmove', onMove);
                });

                this.wavesurfer.on('destroy', () => {
                    document.body.removeEventListener('mouseup', onUp);
                    document.body.removeEventListener('touchend', onUp);
                });
            })();
    }

    onDrag(delta) {
        const maxEnd = this.wavesurfer.getDuration();
        if (this.end + delta > maxEnd || this.start + delta < 0) {
            return;
        }

        this.update({
            start: this.start + delta,
            end: this.end + delta
        });
    }

    onResize(time, delta, direction) {
      console.log("delta: ", delta, ", direction: ", direction);
      console.log("start: ", this.start, ", end: ", this.end);
      console.log("startLimited: ", this.startLimited, ", endLimited: ", this.endLimited);
        if (direction == 'start') {
            this.update({
                //start: Math.min(Math.min(this.start + delta, this.end), this.endLimited),
                //end: Math.max(Math.max(this.start + delta, this.end), time)
                start: Math.min(time, this.endLimited),
                end: Math.max(time, this.endLimited)
            });
        } else {
            this.update({
                //start: Math.min(time, Math.min(this.end + delta, this.start)),
                //end: Math.max(Math.max(this.end + delta, this.start), this.startLimited)
                start: Math.min(time, this.startLimited),
                end: Math.max(time, this.startLimited)
            });
        }
    }
}

/**
 * @typedef {Object} SectionPluginParams
 * @property {?boolean} dragSelection Enable creating regions by dragging with
 * the mouse
 * @property {?RegionParams[]} regions Regions that should be added upon
 * initialisation
 * @property {number} slop=2 The sensitivity of the mouse dragging
 * @property {?number} snapToGridInterval Snap the regions to a grid of the specified multiples in seconds
 * @property {?number} snapToGridOffset Shift the snap-to-grid by the specified seconds. May also be negative.
 * @property {?boolean} deferInit Set to true to manually call
 * `initPlugin('regions')`
 */

/**
 * @typedef {Object} RegionParams
 * @desc The parameters used to describe a region.
 * @example wavesurfer.addRegion(regionParams);
 * @property {string} id=→random The id of the region
 * @property {number} start=0 The start position of the region (in seconds).
 * @property {number} end=0 The end position of the region (in seconds).
 * @property {?boolean} loop Whether to loop the region when played back.
 * @property {boolean} drag=true Allow/disallow dragging the region.
 * @property {boolean} resize=true Allow/disallow resizing the region.
 * @property {string} [color='rgba(0, 0, 0, 0.1)'] HTML color code.
 */

/**
 * Regions are visual overlays on waveform that can be used to play and loop
 * portions of audio. Regions can be dragged and resized.
 *
 * Visual customization is possible via CSS (using the selectors
 * `.wavesurfer-region` and `.wavesurfer-handle`).
 *
 * @implements {PluginClass}
 * @extends {Observer}
 *
 * @example
 * // es6
 * import RegionsPlugin from 'wavesurfer.regions.js';
 *
 * // commonjs
 * var RegionsPlugin = require('wavesurfer.regions.js');
 *
 * // if you are using <script> tags
 * var RegionsPlugin = window.WaveSurfer.regions;
 *
 * // ... initialising wavesurfer with the plugin
 * var wavesurfer = WaveSurfer.create({
 *   // wavesurfer options ...
 *   plugins: [
 *     RegionsPlugin.create({
 *       // plugin options ...
 *     })
 *   ]
 * });
 */
export default class SectionPlugin {
    /**
     * Regions plugin definition factory
     *
     * This function must be used to create a plugin definition which can be
     * used by wavesurfer to correctly instantiate the plugin.
     *
     * @param {RegionsPluginParams} params parameters use to initialise the plugin
     * @return {PluginDefinition} an object representing the plugin
     */
    static create(params) {
        return {
            name: 'section',
            deferInit: params && params.deferInit ? params.deferInit : false,
            params: params,
            staticProps: {
                addSection(options) {
                    if (!this.initialisedPluginList.section) {
                        this.initPlugin('section');
                    }
                    return this.section.add(options);
                },

                clearSection() {
                    this.section && this.section.clear();
                },

                enableDragSelection(options) {
                    if (!this.initialisedPluginList.section) {
                        this.initPlugin('section');
                    }
                    this.section.enableDragSelection(options);
                },

                disableDragSelection() {
                    this.section.disableDragSelection();
                }
            },
            instance: SectionPlugin
        };
    }

    constructor(params, ws) {
        this.params = params;
        this.wavesurfer = ws;
        this.util = ws.util;
        this.util.getRegionSnapToGridValue = value => {
            return this.getRegionSnapToGridValue(value, params);
        };

        // turn the plugin instance into an observer
        const observerPrototypeKeys = Object.getOwnPropertyNames(
            this.util.Observer.prototype
        );
        observerPrototypeKeys.forEach(key => {
            Section.prototype[key] = this.util.Observer.prototype[key];
        });
        this.wavesurfer.Section = Section;

        this._onBackendCreated = () => {
            this.wrapper = this.wavesurfer.drawer.wrapper;
            if (this.params.section) {
                this.add(this.params.section);
            }
        };

        // Id-based hash of regions
        //this.list = {};
        this._onReady = () => {
            if (this.params.dragSelection) {
                this.enableDragSelection(this.params);
            }
            //Object.keys(this.list).forEach(id => {
                //this.list[id].updateRender();
            //});
            if (this.section) {
              this.section.updateRender();
            }
        };
    }

    init() {
        // Check if ws is ready
        if (this.wavesurfer.isReady) {
            this._onBackendCreated();
            this._onReady();
        } else {
            this.wavesurfer.once('ready', this._onReady);
            this.wavesurfer.once('backend-created', this._onBackendCreated);
        }
    }

    destroy() {
        this.wavesurfer.un('ready', this._onReady);
        this.wavesurfer.un('backend-created', this._onBackendCreated);
        this.disableDragSelection();
        this.clear();
    }

    /**
     * Add section 
     *
     * @param {object} params Section parameters
     * @return {Section} The created region
     */
    add(params) {
        const section = new this.wavesurfer.Section(params, this.wavesurfer);

        //this.list[region.id] = region;
        this.section = section;

        section.on('remove', () => {
            //delete this.list[region.id];
            this.section = null;
        });

        return section;
    }

    /**
     * Remove all regions
     */
    clear() {
        //Object.keys(this.list).forEach(id => {
            //this.list[id].remove();
        //});
        if (this.section) {
          this.section.remove();
        }
    }

    enableDragSelection(params) {
        const slop = params.slop || 2;
        const container = this.wavesurfer.drawer.container;
        const scroll =
            params.scroll !== false && this.wavesurfer.params.scrollParent;
        const scrollSpeed = params.scrollSpeed || 1;
        const scrollThreshold = params.scrollThreshold || 10;
        let drag;
        let duration = this.wavesurfer.getDuration();
        let maxScroll;
        let start;
        let section;
        let touchId;
        let pxMove = 0;
        let scrollDirection;
        let wrapperRect;

        // Scroll when the user is dragging within the threshold
        const edgeScroll = e => {
            if (!section || !scrollDirection) {
                return;
            }

            // Update scroll position
            let scrollLeft =
                this.wrapper.scrollLeft + scrollSpeed * scrollDirection;
            this.wrapper.scrollLeft = scrollLeft = Math.min(
                maxScroll,
                Math.max(0, scrollLeft)
            );

            // Update range
            const end = this.wavesurfer.drawer.handleEvent(e);
            section.update({
                start: Math.min(end * duration, start * duration),
                end: Math.max(end * duration, start * duration)
            });

            // Check that there is more to scroll and repeat
            if (scrollLeft < maxScroll && scrollLeft > 0) {
                window.requestAnimationFrame(() => {
                    edgeScroll(e);
                });
            }
        };

        const eventDown = e => {
            if (e.touches && e.touches.length > 1) {
                return;
            }

            if (this.section) {
              if (this.section.resizeStatus == 'start' || this.section.resizeStatus == 'end')
                return;
            }

            duration = this.wavesurfer.getDuration();
            touchId = e.targetTouches ? e.targetTouches[0].identifier : null;

            // Store for scroll calculations
            maxScroll = this.wrapper.scrollWidth - this.wrapper.clientWidth;
            wrapperRect = this.wrapper.getBoundingClientRect();

            drag = true;
            start = this.wavesurfer.drawer.handleEvent(e, true);

            if (this.section) {
              this.section.remove();
              section = null;
            }
            scrollDirection = null;
        };
        this.wrapper.addEventListener('mousedown', eventDown);
        this.wrapper.addEventListener('touchstart', eventDown);
        this.on('disable-drag-selection', () => {
            this.wrapper.removeEventListener('touchstart', eventDown);
            this.wrapper.removeEventListener('mousedown', eventDown);
        });

        const eventUp = e => {
            if (e.touches && e.touches.length > 1) {
                return;
            }

            drag = false;
            pxMove = 0;
            scrollDirection = null;

            if (section) {
                this.util.preventClick();
                section.fireEvent('update-end', e);
                this.wavesurfer.fireEvent('section-update-end', section, e);
            }

            section = null;
        };
        this.wrapper.addEventListener('mouseup', eventUp);
        this.wrapper.addEventListener('touchend', eventUp);

        document.body.addEventListener('mouseup', eventUp);
        document.body.addEventListener('touchend', eventUp);
        this.on('disable-drag-selection', () => {
            document.body.removeEventListener('mouseup', eventUp);
            document.body.removeEventListener('touchend', eventUp);
            this.wrapper.removeEventListener('touchend', eventUp);
            this.wrapper.removeEventListener('mouseup', eventUp);
        });

        const eventMove = e => {
                  console.log("###################2222222222222222222222222");
            if (!drag) {
                return;
            }
            if (++pxMove <= slop) {
                return;
            }
            if (e.touches && e.touches.length > 1) {
                return;
            }
            if (e.targetTouches && e.targetTouches[0].identifier != touchId) {
                return;
            }

            if (!section) {
                this.clear();
                section = this.add(params || {});
            }

            const end = this.wavesurfer.drawer.handleEvent(e);
            const startUpdate = this.wavesurfer.section.util.getRegionSnapToGridValue(
                start * duration
            );
            const endUpdate = this.wavesurfer.section.util.getRegionSnapToGridValue(
                end * duration
            );

            console.log("---start: ", start, "----end: ", end);
            console.log("---startUpdate: ", startUpdate, "----endUpdate: ", endUpdate);
            section.update({
                start: Math.min(endUpdate, startUpdate),
                end: Math.max(endUpdate, startUpdate)
            });

            // If scrolling is enabled
            if (scroll && container.clientWidth < this.wrapper.scrollWidth) {
                // Check threshold based on mouse
                const x = e.clientX - wrapperRect.left;
                if (x <= scrollThreshold) {
                    scrollDirection = -1;
                } else if (x >= wrapperRect.right - scrollThreshold) {
                    scrollDirection = 1;
                } else {
                    scrollDirection = null;
                }
                scrollDirection && edgeScroll(e);
            }
        };
        this.wrapper.addEventListener('mousemove', eventMove);
        this.wrapper.addEventListener('touchmove', eventMove);
        this.on('disable-drag-selection', () => {
            this.wrapper.removeEventListener('touchmove', eventMove);
            this.wrapper.removeEventListener('mousemove', eventMove);
        });
    }

    disableDragSelection() {
        this.fireEvent('disable-drag-selection');
    }

    /**
     * Get current region
     *
     * The smallest region that contains the current time. If several such
     * regions exist, take the first. Return `null` if none exist.
     *
     * @returns {Region} The current region
     */
    //getCurrentRegion() {
        //const time = this.wavesurfer.getCurrentTime();
        //let min = null;
        //Object.keys(this.list).forEach(id => {
            //const cur = this.list[id];
            //if (cur.start <= time && cur.end >= time) {
                //if (!min || cur.end - cur.start < min.end - min.start) {
                    //min = cur;
                //}
            //}
        //});

        //return min;
    //}

    /**
     * Match the value to the grid, if required
     *
     * If the regions plugin params have a snapToGridInterval set, return the
     * value matching the nearest grid interval. If no snapToGridInterval is set,
     * the passed value will be returned without modification.
     *
     * @param {number} value the value to snap to the grid, if needed
     * @param {Object} params the regions plugin params
     * @returns {number} value
     */
    getRegionSnapToGridValue(value, params) {
        if (params.snapToGridInterval) {
            // the regions should snap to a grid
            const offset = params.snapToGridOffset || 0;
            return (
                Math.round((value - offset) / params.snapToGridInterval) *
                    params.snapToGridInterval +
                offset
            );
        }

        // no snap-to-grid
        return value;
    }
}