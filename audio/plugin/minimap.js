import * as utils from '../../utils';

export default class MinimapPlugin {
    static create(params) {
        return {
            name: 'minimap',
            deferInit: params && params.deferInit ? params.deferInit : false,
            params: params,
            staticProps: {},
            instance: MinimapPlugin
        };
    }

    constructor(params, wf) {
        this.params = wf.util.extend(
            {},
            wf.params,
            {
                showRegions: false,
                showOverview: false,
                overviewBorderColor: 'green',
                overviewBorderSize: 2,
                // the container should be different
                container: false,
                pixelRatio: window.devicePixelRatio || screen.deviceXDPI / screen.logicalXDPI,
                height: Math.max(Math.round(wf.params.height / 4), 20)
            },
            params,
            {
                scrollParent: false,
                fillParent: true
            }
        );
        // if container is a selector, get the element
        if (typeof params.container === 'string') {
            const el = document.querySelector(params.container);
            if (!el) {
                console.warn(
                    `Wavesurfer minimap container ${params.container} was not found! The minimap will be automatically appended below the waveform.`
                );
            }
            this.params.container = el;
        }
        // if no container is specified add a new element and insert it
        if (!params.container) {
            this.params.container = wf.util.style(
                document.createElement('minimap'),
                {
                    display: 'block'
                }
            );
        }
        this.drawer = new wf.Drawer(this.params.container, this.params);
        this.waveform = wf;
        this.util = wf.util;
        this.renderEvent =
            wf.params.backend === 'MediaElement' ? 'waveform-ready' : 'ready';
        this.overviewRegion = null;

        this.drawer.createWrapper();
        this.createElements();
        let isInitialised = false;

        // wf ready event listener
        this._onShouldRender = () => {
            // only bind the events in the first run
            if (!isInitialised) {
                this.bindWavesurferEvents();
                this.bindMinimapEvents();
                isInitialised = true;
            }
            // if there is no such element, append it to the container (below
            // the waveform)
            if (!document.body.contains(this.params.container)) {
                wf.container.insertBefore(this.params.container, null);
            }

            if (this.waveform.regions && this.params.showRegions) {
                this.regions();
            }

            this.adjustSize();

            this.render();
        };

        this._onAudioprocess = currentTime => {
            this.drawer.progress(this.waveform.backend.getPlayedPercents());
        };

        // wf seek event listener
        this._onSeek = () =>
            this.drawer.progress(wf.backend.getPlayedPercents());

        // event listeners for the overview region
        this._onScroll = e => {
            if (!this.draggingOverview) {
                this.moveOverviewRegion(e.target.scrollLeft / this.ratio);
            }
        };
        this._onMouseover = e => {
            if (this.draggingOverview) {
                this.draggingOverview = false;
            }
        };
        let prevWidth = 0;
        this._onResize = wf.util.debounce(() => {
            if (prevWidth != this.drawer.wrapper.clientWidth) {
                prevWidth = this.drawer.wrapper.clientWidth;
                this.render();
                this.drawer.progress(
                    this.waveform.backend.getPlayedPercents()
                );
            }
        });
        this._onZoom = e => {
            this.render();
        };
        this.waveform.on('zoom', this._onZoom);
    }

    init() {
        if (this.waveform.isReady) {
            this._onShouldRender();
        }
        this.waveform.on(this.renderEvent, this._onShouldRender);
    }

    destroy() {
        window.removeEventListener('resize', this._onResize, true);
        window.removeEventListener('orientationchange', this._onResize, true);
        this.waveform.drawer.wrapper.removeEventListener(
            'mouseover',
            this._onMouseover
        );
        this.waveform.un(this.renderEvent, this._onShouldRender);
        this.waveform.un('seek', this._onSeek);
        this.waveform.un('scroll', this._onScroll);
        this.waveform.un('audioprocess', this._onAudioprocess);
        this.waveform.un('zoom', this._onZoom);
        this.drawer.destroy();
        this.overviewRegion = null;
        this.unAll();
    }

    regions() {
        this.regions = {};

        this.waveform.on('region-created', region => {
            this.regions[region.id] = region;
            this.renderRegions();
        });

        this.waveform.on('region-updated', region => {
            this.regions[region.id] = region;
            this.renderRegions();
        });

        this.waveform.on('region-removed', region => {
            delete this.regions[region.id];
            this.renderRegions();
        });
    }

    renderRegions() {
        const regionElements = this.drawer.wrapper.querySelectorAll('region');
        let i;
        for (i = 0; i < regionElements.length; ++i) {
            this.drawer.wrapper.removeChild(regionElements[i]);
        }

        Object.keys(this.regions).forEach(id => {
            const region = this.regions[id];
            const width =
                this.getWidth() *
                ((region.end - region.start) / this.waveform.getDuration());
            const left =
                this.getWidth() *
                (region.start / this.waveform.getDuration());
            const regionElement = this.util.style(
                document.createElement('region'),
                {
                    height: 'inherit',
                    backgroundColor: region.color,
                    width: width + 'px',
                    left: left + 'px',
                    display: 'block',
                    position: 'absolute'
                }
            );
            regionElement.classList.add(id);
            this.drawer.wrapper.appendChild(regionElement);
        });
    }

    createElements() {
        this.drawer.createElements();
        if (this.params.showOverview) {
            this.overviewRegion = this.util.style(
                document.createElement('overview'),
                {
                    top: 0,
                    bottom: 0,
                    width: '0px',
                    display: 'block',
                    position: 'absolute',
                    cursor: 'move',
                    border:
                        this.params.overviewBorderSize +
                        'px solid ' +
                        this.params.overviewBorderColor,
                    zIndex: 2,
                    opacity: this.params.overviewOpacity
                }
            );
            this.drawer.wrapper.appendChild(this.overviewRegion);
        }
    }

    bindWavesurferEvents() {
        window.addEventListener('resize', this._onResize, true);
        window.addEventListener('orientationchange', this._onResize, true);
        this.waveform.on('audioprocess', this._onAudioprocess);
        this.waveform.on('seek', this._onSeek);
        if (this.params.showOverview) {
            this.waveform.on('scroll', this._onScroll);
            this.waveform.drawer.wrapper.addEventListener(
                'mouseover',
                this._onMouseover
            );
        }
    }

    bindMinimapEvents() {
        const positionMouseDown = {
            clientX: 0,
            clientY: 0
        };
        let relativePositionX = 0;
        let seek = true;

        // the following event listeners will be destroyed by using
        // this.unAll() and nullifying the DOM node references after
        // removing them
        if (this.params.interact) {
            this.drawer.wrapper.addEventListener('click', event => {
                this.fireEvent('click', event, this.drawer.handleEvent(event));
            });

            this.on('click', (event, position) => {
                if (seek) {
                    this.drawer.progress(position);
                    this.waveform.seekAndCenter(position);
                } else {
                    seek = true;
                }
            });
        }

        if (this.params.showOverview) {
            this.overviewRegion.addEventListener('mousedown', event => {
                this.draggingOverview = true;
                relativePositionX = event.layerX;
                positionMouseDown.clientX = event.clientX;
                positionMouseDown.clientY = event.clientY;
            });

            this.drawer.wrapper.addEventListener('mousemove', event => {
                if (this.draggingOverview) {
                    this.moveOverviewRegion(
                        event.clientX -
                            this.drawer.container.getBoundingClientRect().left -
                            relativePositionX
                    );
                }
            });

            this.drawer.wrapper.addEventListener('mouseup', event => {
                if (
                    positionMouseDown.clientX - event.clientX === 0 &&
                    positionMouseDown.clientX - event.clientX === 0
                ) {
                    seek = true;
                    this.draggingOverview = false;
                } else if (this.draggingOverview) {
                    seek = false;
                    this.draggingOverview = false;
                }
            });
        }
    }

    render() {
        const len = this.drawer.getWidth();
        const peaks = this.waveform.backend.getPeaks(len, 0, len);

        this.drawer.setHeight(this.params.height * this.params.pixelRatio);
        this.drawer.drawPeaks(peaks, len, 0, len);
        this.drawer.progress(this.waveform.backend.getPlayedPercents());

        if (this.params.showOverview) {
            //get proportional width of overview region considering the respective
            //width of the drawers
            this.ratio = this.waveform.drawer.width / this.drawer.width;
            this.waveShowedWidth = this.waveform.drawer.width / this.ratio;
            this.waveWidth = this.waveform.drawer.width;
            this.overviewWidth = this.drawer.container.offsetWidth / this.ratio;
            this.overviewPosition = 0;
            this.moveOverviewRegion(
                this.waveform.drawer.wrapper.scrollLeft / this.ratio
            );
            this.overviewRegion.style.width = this.overviewWidth + 'px';
        }
    }

    moveOverviewRegion(pixels) {
        if (pixels < 0) {
            this.overviewPosition = 0;
        } else if (
            pixels + this.overviewWidth <
            this.drawer.container.offsetWidth
        ) {
            this.overviewPosition = pixels;
        } else {
            this.overviewPosition =
                this.drawer.container.offsetWidth - this.overviewWidth;
        }
        this.overviewRegion.style.left = this.overviewPosition + 'px';
        if (this.draggingOverview) {
            this.waveform.drawer.wrapper.scrollLeft =
                this.overviewPosition * this.ratio;
        }
    }

    getWidth() {
        return this.drawer.width / this.params.pixelRatio;
    }

    adjustSize() {
      let wrapperRect = this.params.container.getBoundingClientRect();
      let newHeight = wrapperRect.bottom - wrapperRect.top;
      let chn = this.waveform.getNumOfChannels();

      this.params.height = parseInt(newHeight/chn);

      if (this.params.width) {
        utils.style(this.params.container, { 
          background: this.params.backgroundColor, 
          width: this.params.width+'px', 
        });
      }


    }



}
