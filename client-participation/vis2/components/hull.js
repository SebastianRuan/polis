import React from "react";
import * as globals from "./globals";
import {VictoryAnimation} from "victory-core";
import * as d3 from "../../js/3rdparty/d3.v4.min.js";

export class Hull extends React.Component {
  render () {
    return (
      <g>
        <path
          data-testid={`hull-${this.props.gid}`}
          onClick={() => {this.props.handleClick(this.props.gid)}}
          d={this.props.pathString}
          ref={this.props.getHullElems(this.props.gid)}
          fill={/*globals.groupColor(hull.group[0].gid)*/ this.props.selectedGroup === this.props.gid ? "rgb(180,180,180)" : "rgb(220,220,220)"}
          fillOpacity={.6}/>
      </g>
    );
  }
};

export class Hulls extends React.Component {
  render () {
    const line = d3.line(); // .curve(d3.curveBasis);
    return (
      <g>
        {
          this.props.hulls ? this.props.hulls.map((hull) => {
            let gid = hull.group[0].gid;
            const pathString = line(hull.hull);
            return (
              <VictoryAnimation
                easing={"quadOut"}
                duration={1500}
                key={gid}
                data={{tweenPath: pathString}}>
                {(tweenedProps, animationInfo) => {
                  // if (animationInfo.animating && animationInfo.progress < 1) {
                  return <Hull
                    key={gid}
                    gid={gid}
                    selectedGroup={this.props.selectedGroup}
                    pathString={tweenedProps.tweenPath}
                    getHullElems={this.props.getHullElems}
                    handleClick={this.props.handleClick}
                    hull={hull}/>
                  // }
                }}
              </VictoryAnimation>
            )
          }) : ""
        }
      </g>
    )
  }
}

export default Hulls;
