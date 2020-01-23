class Section {
  constructor(params, wf) {
    this.waveform = wf;
    this.wrapper = wf.drawer.wrapper;
    this.util = wf.util;
    this.style = this.util.style;

    this.id = params.id == null ? wf.util.getId() : params.id;
    this.start = Number(params.start) || 0;
    this.end =
      params.end == null
        ? // small marker-like region
          this.start +
          (4 / this.wrapper.scrollWidth) * this.waveform.getDuration()
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

            this.scroll = params.scroll !== false && wf.params.scrollParent;
            this.scrollSpeed = params.scrollSpeed || 1;
            this.scrollThreshold = params.scrollThreshold || 10;

            this.render();
            this.waveform.on('zoom', this._onRedraw);
            this.waveform.on('redraw', this._onRedraw);
            this.waveform.fireEvent('section-created', this);
  }

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
    this.waveform.fireEvent('section-updated', this);
  }

  remove() {
    if (this.element) {
      this.wrapper.removeChild(this.element);
      this.element = null;
      this.fireEvent('remove');
      this.waveform.un('zoom', this._onRedraw);
      this.waveform.un('redraw', this._onRedraw);
      this.waveform.fireEvent('section-removed', this);
    }
  }

  render() {
    const sectionEl = document.createElement('section');
    sectionEl.className = 'waveform-section';
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
      handleLeft.className = 'waveform-handle waveform-handle-start';
      handleRight.className = 'waveform-handle waveform-handle-end';
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
    return this.waveform.drawer.width / this.waveform.params.pixelRatio;
  }

  updateRender() {
    // duration varies during loading process, so don't overwrite important data
    const dur = this.waveform.getDuration();
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
        cursor: this.drag ? 'move' : 'default',

        borderLeftStyle: 'solid',
        borderLeftWidth: '1px',
        borderLeftColor: 'blue' 

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

  bindEvents() {
    this.element.addEventListener('mouseenter', e => {
      this.fireEvent('mouseenter', e);
      this.waveform.fireEvent('section-mouseenter', this, e);
    });

    this.element.addEventListener('mouseleave', e => {
      this.fireEvent('mouseleave', e);
      this.waveform.fireEvent('section-mouseleave', this, e);
    });

    this.element.addEventListener('click', e => {
      e.preventDefault();
      this.fireEvent('click', e);
      this.waveform.fireEvent('section-click', this, e);
    });

    this.element.addEventListener('dblclick', e => {
      e.stopPropagation();
      e.preventDefault();
      this.fireEvent('dblclick', e);
      this.waveform.fireEvent('section-dblclick', this, e);
    });

    /* Drag or resize on mousemove. */
    (this.drag || this.resize) &&
      (() => {
      const container = this.waveform.drawer.container;
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
        const duration = this.waveform.getDuration();
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
        const time = this.waveform.section.util.getRegionSnapToGridValue(
          this.waveform.drawer.handleEvent(e) * duration
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
        const duration = this.waveform.getDuration();
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
          startTime = this.waveform.section.util.getRegionSnapToGridValue(
            this.waveform.drawer.handleEvent(e, true) * duration
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
                'waveform-handle-start'
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
          this.waveform.fireEvent('section-update-end', this, e);
        }
      };
      const onMove = e => {
        const duration = this.waveform.getDuration();

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
          const oldTime = startTime;
          const time = this.waveform.section.util.getRegionSnapToGridValue(
            this.waveform.drawer.handleEvent(e) * duration
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

      this.waveform.on('destroy', () => {
        document.body.removeEventListener('mouseup', onUp);
        document.body.removeEventListener('touchend', onUp);
      });
    })();
  }

  onDrag(delta) {
    const maxEnd = this.waveform.getDuration();
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
    console.log("now real start: ", this.start, ", real end: ", this.end);
  }

}

export default class SectionPlugin {
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

  constructor(params, wf) {
    this.params = params;
    this.waveform = wf;
    this.util = wf.util;
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
    this.waveform.Section = Section;

    this._onBackendCreated = () => {
      this.wrapper = this.waveform.drawer.wrapper;
      if (this.params.section) {
        this.add(this.params.section);
      }
    };

    this._onReady = () => {
      if (this.params.dragSelection) {
        this.enableDragSelection(this.params);
      }
      if (this.section) {
        this.section.updateRender();
      }
    };
  }

  init() {
    // Check if wf is ready
    if (this.waveform.isReady) {
      this._onBackendCreated();
      this._onReady();
    } else {
      this.waveform.once('ready', this._onReady);
      this.waveform.once('backend-created', this._onBackendCreated);
    }
  }

  destroy() {
    this.waveform.un('ready', this._onReady);
    this.waveform.un('backend-created', this._onBackendCreated);
    this.disableDragSelection();
    this.clear();
  }

  add(params) {
    const section = new this.waveform.Section(params, this.waveform);

    this.section = section;

    section.on('remove', () => {
      this.section = null;
    });


    return section;
  }

  clear() {
    if (this.section) {
      this.section.remove();
    }
  }

  enableDragSelection(params) {
    const slop = params.slop || 2;
    const container = this.waveform.drawer.container;
    const scroll =
      params.scroll !== false && this.waveform.params.scrollParent;
    const scrollSpeed = params.scrollSpeed || 1;
    const scrollThreshold = params.scrollThreshold || 10;
    let drag;
    let duration = this.waveform.getDuration();
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
      const end = this.waveform.drawer.handleEvent(e);
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

      duration = this.waveform.getDuration();
      touchId = e.targetTouches ? e.targetTouches[0].identifier : null;

      // Store for scroll calculations
      maxScroll = this.wrapper.scrollWidth - this.wrapper.clientWidth;
      wrapperRect = this.wrapper.getBoundingClientRect();

      drag = true;
      start = this.waveform.drawer.handleEvent(e, true);

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
        this.waveform.fireEvent('section-update-end', section, e);
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

      const end = this.waveform.drawer.handleEvent(e);
      const startUpdate = this.waveform.section.util.getRegionSnapToGridValue(
        start * duration
      );
      const endUpdate = this.waveform.section.util.getRegionSnapToGridValue(
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

  getStartTime() {
    if (this.section) 
      return this.section.start;
    else 
      return 0;
  }

  getEndTime() {
    if (this.section)
      return this.section.end;
    else 
      return 0;
  }

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
