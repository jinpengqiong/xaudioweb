import * as utils from '../utils';

export default class RectWrapper extends utils.Observer {
  constructor(container, params) {
    super();
    this.container = container;
    this.params = params;
    this.width = 0;
    this.height = (params.height) * this.params.pixelRatio;
    this.lastPos = 0;
    this.wrapper = null;
  }

  style(el, styles) {
    return utils.style(el, styles);
  }

  createWrapper() {
    this.wrapper = this.container.appendChild(document.createElement('rectwrapper'));

    this.style(this.wrapper, {
      display: 'block',
      position: 'relative',
      userSelect: 'none',
      webkitUserSelect: 'none',
      height: this.params.height + 'px'
    });

    if (this.params.fillParent || this.params.scrollParent) {
      this.style(this.wrapper, {
        width: '100%',
        overflowX: this.params.hideScrollbar ? 'hidden' : 'auto',
        overflowY: 'hidden'
      });
    }

    this.setupWrapperEvents();
  }

  handleEvent(e, noPrevent) {
    !noPrevent && e.preventDefault();

    const clientX = e.targetTouches
      ? e.targetTouches[0].clientX
      : e.clientX;
      const bbox = this.wrapper.getBoundingClientRect();

      const nominalWidth = this.width;
      const parentWidth = this.getWidth();

      let progress;
      if (!this.params.fillParent && nominalWidth < parentWidth) {
        progress =
          (this.params.rtl ? bbox.right - clientX : clientX - bbox.left) *
          (this.params.pixelRatio / nominalWidth) || 0;

        if (progress > 1) {
          progress = 1;
        }
      } else {
        progress =
          ((this.params.rtl
            ? bbox.right - clientX
            : clientX - bbox.left) +
              this.wrapper.scrollLeft) /
              this.wrapper.scrollWidth || 0;
      }

      return progress;
  }

  setupWrapperEvents() {
    this.wrapper.addEventListener('click', e => {
      const scrollbarHeight =
        this.wrapper.offsetHeight - this.wrapper.clientHeight;
      if (scrollbarHeight != 0) {
        // scrollbar is visible.  Check if click was on it
        const bbox = this.wrapper.getBoundingClientRect();
        if (e.clientY >= bbox.bottom - scrollbarHeight) {
          // ignore mousedown as it was on the scrollbar
          return;
        }
      }

      if (this.params.interact) {
        this.fireEvent('click', e, this.handleEvent(e));
      }
    });

    this.wrapper.addEventListener('scroll', e => this.fireEvent('scroll', e));
  }

  resetScroll() {
    if (this.wrapper !== null) {
      this.wrapper.scrollLeft = 0;
    }
  }

  recenter(percent) {
    const position = this.wrapper.scrollWidth * percent;
    this.recenterOnPosition(position, true);
  }

  recenterOnPosition(position, immediate) {
    const scrollLeft = this.wrapper.scrollLeft;
    const half = ~~(this.wrapper.clientWidth / 2);
    const maxScroll = this.wrapper.scrollWidth - this.wrapper.clientWidth;
    let target = position - half;
    let offset = target - scrollLeft;

    if (maxScroll == 0) {
      // no need to continue if scrollbar is not there
      return;
    }

    // if the cursor is currently visible...
    if (!immediate && -half <= offset && offset < half) {
      // we'll limit the "re-center" rate.
      const rate = 5;
      offset = Math.max(-rate, Math.min(rate, offset));
      target = scrollLeft + offset;
    }

    // limit target to valid range (0 to maxScroll)
    target = Math.max(0, Math.min(maxScroll, target));
    // no use attempting to scroll if we're not moving
    if (target != scrollLeft) {
      this.wrapper.scrollLeft = target;
    }
  }


  rebeginOnPosition(position, immediate) {
    const scrollLeft = this.wrapper.scrollLeft;
    const maxScroll = this.wrapper.scrollWidth - this.wrapper.clientWidth;
    let target = position;
    let offset = target - scrollLeft;

    if (maxScroll == 0) {
      // no need to continue if scrollbar is not there
      return;
    }

   // limit target to valid range (0 to maxScroll)
    target = Math.max(0, Math.min(maxScroll, target));
    // no use attempting to scroll if we're not moving
    if (target != scrollLeft) {
      this.wrapper.scrollLeft = target;
    }
  }


  getScrollX() {
    let x = 0;
    if (this.wrapper) {
      const pixelRatio = this.params.pixelRatio;
      x = Math.round(this.wrapper.scrollLeft * pixelRatio);

      // In cases of elastic scroll (safari with mouse wheel) you can
      // scroll beyond the limits of the container
      // Calculate and floor the scrollable extent to make sure an out
      // of bounds value is not returned
      // Ticket #1312
      if (this.params.scrollParent) {
        const maxScroll = ~~(
          this.wrapper.scrollWidth * pixelRatio -
          this.getWidth()
        );
        x = Math.min(maxScroll, Math.max(0, x));
      }
    }
    return x;
  }

  getWidth() {
    return Math.round(this.container.clientWidth * this.params.pixelRatio);
  }

  setWidth(width) {
    if (this.width == width) {
      return false;
    }

    this.width = width;

    if (this.params.fillParent || this.params.scrollParent) {
      this.style(this.wrapper, {
        width: ''
      });
    } else {
      this.style(this.wrapper, {
        width: ~~(this.width / this.params.pixelRatio) + 'px'
      });
    }

    this.updateSize();
    return true;
  }

  setHeight(height) {
    if (height == this.height) {
      return false;
    }
    this.height = height;

    this.style(this.wrapper, {
      height: ~~(this.height / this.params.pixelRatio) + 'px'
    });

    this.updateSize();
    return true;
  }

/*
  progress(progress) {
    const minPxDelta = 1 / this.params.pixelRatio;
    const pos = Math.round(progress * this.width) * minPxDelta;

    if (pos < this.lastPos || pos - this.lastPos >= minPxDelta) {
      this.lastPos = pos;

      if (this.params.scrollParent && this.params.autoCenter) {
        const newPos = ~~(this.wrapper.scrollWidth * progress);
        this.recenterOnPosition(newPos);
      }

      this.updateProgress(pos);
    }
  }
*/

  progress(progress) {
    const minPxDelta = 1 / this.params.pixelRatio;
    const pos = Math.round(progress * this.width) * minPxDelta;

    if (pos < this.lastPos || pos - this.lastPos >= minPxDelta) {
      this.lastPos = pos;

      this.updateProgress(pos);
    }
  }


  destroy() {
    this.unAll();
    if (this.wrapper) {
      if (this.wrapper.parentNode == this.container) {
        this.container.removeChild(this.wrapper);
      }
      this.wrapper = null;
    }
  }

  updateCursor() {}

  updateSize() {}

  updateProgress(position) {}
}
