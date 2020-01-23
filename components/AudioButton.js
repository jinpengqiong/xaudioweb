import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import {Button, Icon} from 'antd';

const ButtonStyle = styled.button`
  width: ${props => props.width};
  height: ${props => props.height};
  background: ${props => props.backgroundColor};
  border-color: ${props => props.borderColor};
  border-radius: ${props => props.borderRadius};
  outline: none;
  &:hover {
    background: ${props => props.hoverBackgroundColor};
    border-color: ${props => props.hoverBorderColor};
  }
  //&:focus {
    //border-color: green;
  //}
`;

const genIcon = (iconId, props) => {
  if (props.iconSvg) {
    if (props.isWorking) {
      return (<Icon id={iconId} component={props.iconSvg} style={{color: props.iconWorkingColor}}/>)
    } else {
      return (<Icon id={iconId} component={props.iconSvg} style={{color: props.iconColor}}/>)
    }
  } else {
    if (props.isWorking) {
      return (<Icon id={iconId} type={props.icon} style={{color: props.iconWorkingColor}}/>)
    } else {
      return (<Icon id={iconId} type={props.icon} style={{color: props.iconColor}}/>)
    }
  }
}

const AudioButton = (props) => { 
  let iconId = Math.random().toString(32).substring(2);

  const changeIconHover = () => {
    if (!props.isWorking) {
      let el = document.getElementById(iconId);
      el.style['color'] = props.iconHoverColor;
    }
  };

  const changeIconNormal = () => {
    let el = document.getElementById(iconId);

    if (props.isWorking) {
      el.style['color'] = props.iconWorkingColor;
    } else {
      el.style['color'] = props.iconColor;
    }
  };

  return (
    <ButtonStyle onClick={props.onClick} 
                 isWorking={props.isWorking}
                 width={props.width} 
                 height={props.height}
                 backgroundColor={props.backgroundColor}
                 borderColor={props.borderColor}
                 hoverBackgroundColor={props.hoverBackgroundColor}
                 hoverBorderColor={props.hoverBorderColor}
                 borderRadius={props.borderRadius}
                 onMouseEnter={changeIconHover}
                 onMouseLeave={changeIconNormal}
                 >
       {genIcon(iconId, props)}
    </ButtonStyle>
  ) 
};


AudioButton.propTypes = {
  isWorking: PropTypes.boolean,
  icon: PropTypes.string,
  iconSvg: PropTypes.element,
  onClick: PropTypes.func,
  width: PropTypes.string,
  height: PropTypes.string,
  backgroundColor: PropTypes.string,
  borderColor: PropTypes.string,
  hoverBackgroundColor: PropTypes.string,
  hoverBorderColor: PropTypes.string,
  borderRadius: PropTypes.string,
  iconColor: PropTypes.string,
  iconHoverColor: PropTypes.string,
  iconWorkingColor: PropTypes.string,
};

AudioButton.defaultProps = {
  isWorking: false,
  width: '40px',
  height: '40px',
  backgroundColor: 'rgb(35,35,35)',
  borderColor: 'rgb(35,35,35)',
  hoverBackgroundColor: 'rgb(42,42,42)',
  hoverBorderColor: 'rgb(49,49,49)',
  borderRadius: '3px',
  iconSvg: null,
  iconColor: 'rgb(176,176,176)',
  iconHoverColor: 'rgb(231,231,231)',
  iconWorkingColor: 'rgb(32,153,34)',
};

export default AudioButton;

