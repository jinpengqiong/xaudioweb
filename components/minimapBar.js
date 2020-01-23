import style from '../utils/style';
import getId from '../utils/getid';
import { roundedRect } from '../utils/canvasTool'

export default class MinimapBarCanvas {
  constructor() {
    this.svg = null
    this.zoom = null
    this.g = null
    this.rect = null
  }

  initWave() {
    this.svg = d3.select("#bar-chart")
  }

  clearWave() {
    this.svg = null
  }

  drawLines(x, y, width, height) {
    var self = this
    // function dragstarted() {
    //   console.log('dragstarted')
    //   d3.event.sourceEvent.stopPropagation();
    //   d3.select(self).raise();
    //   d3.select(self).classed("dragging", true);
    // }

    // function dragged(d) {
    //   console.log('dragged',d3.event.transform)
    //   d3.select(self).attr("cx", d.x = d3.event.transform.x).attr("cy", d.y = d3.event.transform.y);
    // }

    // function dragended() {
    //   console.log('dragended')
    //   d3.select(self).classed("dragging", false);
    // }
    function started() {
      var circle = d3.select(this).classed("dragging", true);

      d3.event.on("drag", dragged).on("end", ended);

      function dragged(d) {
        circle.raise().attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
      }

      function ended() {
        circle.classed("dragging", false);
      }
    }

    function zoomed() {
      var t = d3.event.transform;
      // console.log('zoom', t)
      if(t.k <= 1 && t.x > 0){
        self.svg.attr("transform", `scale(${t.k}, 1)`);
      }else if(t.k < 0.001){
        return
      }else{
        self.svg.attr("transform", `translate(0,0) scale(1, 1)`);
      }
    }

    this.zoom = d3.select("#wave-waveform").call(
          d3.zoom()
            .translateExtent([[0, 0], [width, height]])
            .scaleExtent([0.005,1])
            .on("zoom", zoomed))
    this.g = this.svg.append("g")
                      .call(
                        d3.drag()
                          .subject(function (d) { return d; })
                          .on("start", started)
                        );
    this.rect = this.g.append("rect")
                        .attr("x", x)//每个矩形的起始x坐标
                        .attr("y", y)
                        .attr("width", width)
                        .attr("height", height)//每个矩形的高度
                        .attr("stroke-width","8px")//填充颜色
                        .attr("stroke-linejoin","round")
                        .attr("stroke","gray")//填充颜色
  }
}
