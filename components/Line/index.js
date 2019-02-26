/*
 *
 * Line.js
 *
 */

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {WrapperAbsolute} from '../BaseStyle'; 

const StyledLine = styled.line.attrs({
  x1: props => props.x1,
  y1: props => props.y1,
  x2: props => props.x2,
  y2: props => props.y2,
})`
  stroke: ${props => props.color ? props.color : blue};
  stroke-width: 2;
`;

function Line(props) {
  return (
    <WrapperAbsolute>
      <svg width="100%" height="100%">
        <StyledLine x1={props.x1} y1={props.y1} x2={props.x2} y2={props.y2} color={props.color}/>
      </svg>
    </WrapperAbsolute>
  );
}

Line.propTypes = {
  x1: PropTypes.number.isRequired,
  y1: PropTypes.number.isRequired,
  x2: PropTypes.number.isRequired,
  y2: PropTypes.number.isRequired,
};

export default Line;
