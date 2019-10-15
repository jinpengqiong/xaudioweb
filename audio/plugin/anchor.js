export default class AnchorPlugin {
    static create(params) {
        return {
            name: 'anchor',
            deferInit: params && params.deferInit ? params.deferInit : false,
            params: params,
            staticProps: {},
            instance: AnchorPlugin
        };
    }

    defaultParams = {
        hideOnBlur: true,
        width: '1px',
        color: 'red', //'black',
        opacity: '0.25',
        style: 'solid',
        zIndex: 4,
        customStyle: {},
        customShowTimeStyle: {},
        showTime: false,
        followAnchorY: false,
        formatTimeCallback: null
    };

    _drawFixedCusor = (e) => {
        const bbox = this.wavesurfer.container.getBoundingClientRect();
        let y = 0;
        let x = bbox.right - bbox.left;

        let progress = this.wavesurfer.drawer.handleEvent(e, true);
        this.updateAnchorPosition(parseInt(x*progress), y);
        this.showAnchor();
    };


    constructor(params, ws) {
        this.wavesurfer = ws;
        this.style = ws.util.style;
        this.anchor = null;
        this.showTime = null;
        this.displayTime = null;

        this.params = ws.util.extend({}, this.defaultParams, params);
    }

    init() {
        this.wrapper = this.wavesurfer.container;
        this.anchor = this.wrapper.appendChild(
            this.style(
                document.createElement('anchor'),
                this.wavesurfer.util.extend(
                    {
                        position: 'absolute',
                        zIndex: this.params.zIndex,
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: '0',
                        display: 'flex',
                        borderRightStyle: this.params.style,
                        borderRightWidth: this.params.width,
                        borderRightColor: this.params.color,
                        opacity: this.params.opacity,
                        pointerEvents: 'none'
                    },
                    this.params.customStyle
                )
            )
        );
        if (this.params.showTime) {
            this.showTime = this.wrapper.appendChild(
                this.style(
                    document.createElement('showTitle'),
                    this.wavesurfer.util.extend(
                        {
                            position: 'absolute',
                            zIndex: this.params.zIndex,
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: 'auto',
                            display: 'flex',
                            opacity: this.params.opacity,
                            pointerEvents: 'none',
                            height: '100%'
                        },
                        this.params.customStyle
                    )
                )
            );
            this.displayTime = this.showTime.appendChild(
                this.style(
                    document.createElement('div'),
                    this.wavesurfer.util.extend(
                        {
                            display: 'inline',
                            pointerEvents: 'none',
                            margin: 'auto'
                        },
                        this.params.customShowTimeStyle
                    )
                )
            );
        }

        if (this.params.hideOnBlur) {
            this.hideAnchor();
        }

        this.wrapper.addEventListener("mousedown", this._drawFixedCusor);
    }

    destroy() {
        if (this.params.showTime) {
            this.anchor.parentNode.removeChild(this.showTime);
        }
        this.anchor.parentNode.removeChild(this.anchor);
    }

    updateAnchorPosition(xpos, ypos) {
        this.style(this.anchor, {
            left: `${xpos}px`
        });
        if (this.params.showTime) {
            const duration = this.wavesurfer.getDuration();
            const elementWidth =
                this.wavesurfer.drawer.width /
                this.wavesurfer.params.pixelRatio;
            const scrollWidth = this.wavesurfer.drawer.getScrollX();

            const scrollTime =
                (duration / this.wavesurfer.drawer.width) * scrollWidth;

            const timeValue =
                Math.max(0, (xpos / elementWidth) * duration) + scrollTime;
            const formatValue = this.formatTime(timeValue);
            this.style(this.showTime, {
                left: `${xpos}px`,
                top: `${ypos}px`
            });
            this.displayTime.innerHTML = `${formatValue}`;
        }
    }

    showAnchor() {
        this.style(this.anchor, {
            display: 'flex'
        });
        if (this.params.showTime) {
            this.style(this.showTime, {
                display: 'flex'
            });
        }
    }

    hideAnchor() {
        this.style(this.anchor, {
            display: 'none'
        });
        if (this.params.showTime) {
            this.style(this.showTime, {
                display: 'none'
            });
        }
    }

    formatTime(anchorTime) {
        anchorTime = isNaN(anchorTime) ? 0 : anchorTime;
        //console.log("111111111111111111111111:", anchorTime, "##222:", typeof(anchorTime));

        if (this.params.formatTimeCallback) {
            return this.params.formatTimeCallback(anchorTime);
        }
        return [anchorTime].map(time =>
            [
                Math.floor((time % 3600) / 60), // minutes
                ('00' + Math.floor(time % 60)).slice(-2), // seconds
                ('000' + Math.floor((time % 1) * 1000)).slice(-3) // milliseconds
            ].join(':')
        );
    }
}
