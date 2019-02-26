import styled from 'styled-components';

export const Mark = styled.span`
  background: lightgrey;
`;

export const Margin = styled.div`
  margin-top: ${props => (props.top ? props.top : 0)};
  margin-bottom: ${props => (props.bottom ? props.bottom : 0)};
  margin-left: ${props => (props.left ? props.left : 0)};
  margin-right: ${props => (props.right ? props.right : 0)};
`;

export const WrapperAbsolute = styled.div`
  position: absolute;
  top: ${props => (props.top ? props.top : 0)};
  left: ${props => (props.left ? props.left : 0)};
  width: 100%;
  height: 100%;
`;

export const WrapperRelative = styled.div`
  id: ${props => props.id};
  position: relative;
  top: ${props => (props.top ? props.top : 0)};
  left: ${props => (props.left ? props.left : 0)};
`;

export const HeaderLogo = styled.div`
  width: 120px;
  height: 31px;
  background: ${props => (props.background ? props.background : '#333')};
  background-image: url(${props => props.backgroundImage+".jpg"});
  background-repeat:no-repeat;
  background-position:center;
  background-size:contain;
  border-radius: 1px;
  margin: 16px 24px 16px 0;
  float: left;
`;


export const HeaderLogo2 = styled.div`
  height: 40px;
  background: ${props => (props.background ? props.background : '#333')};
  background-image: url(${props => props.backgroundImage+".jpg"}),
                    url(${props => props.backgroundImage+".png"}),
                    url(${props => props.backgroundImage+".gif"}),
                    url(${props => props.backgroundImage+".jpeg"});
  background-repeat:no-repeat;
  background-position:center;
  background-size:cover;
  margin: 16px;
`;


export const ZeroWrapper = styled.div`
  margin-top: 10px;
  background: white;
  height: 1200px;
  padding: 25px 16px 30px 16px;
`;

export const MainWrapper = styled.div`
  margin-top: 24px;
  margin-right: 48px;
  margin-bottom: 24px;
  margin-left: 48px;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
  border-bottom-left-radius: 4px;
  padding-top: 24px;
  padding-bottom: 24px;
  padding-left: 0px;
  padding-right: 0px;
  background: white;
`;

const TdColLineStyle = styled.td.attrs({rowSpan: 600})`
  width: 2px;
  color: red;
  background: lightgrey;
`;

export function TdColLine(props) {
  return <TdColLineStyle />;
}

const TdRowLineStyle = styled.td.attrs({colSpan: 300})`
  height: 2px;
  color: red;
  background: lightgrey;
`;

export function TdRowLine(props) {
  return <TdRowLineStyle />;
}
