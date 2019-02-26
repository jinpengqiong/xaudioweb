import R from 'ramda';
import Router from 'next/router'
import {validToken} from './net';
import {message} from 'antd';
import langmap from '../config/langmap';


//export const DEFAULT_LIMIT = 20;
export const DEFAULT_LIMIT = 2;

function number (n) {
	if (!n) return 10;
	return (typeof n === 'number') ? n : parseInt(n, 10);
}

function randomKey (len, chars) {
	var str = '';
	if (typeof len === 'object') { // cheap array check
		var min = number(len[0]);
		var max = number(len[1]);
		len = Math.round(Math.random() * (max - min)) + min;
	} else {
		len = number(len);
	}
	chars = chars || '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz';
	for (var i = 0; i < len; i++) {
		str += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return str;
}

export const randomString = (len, chars) => {
  return randomKey(len, chars);
};

export const storeSelector = R.curry((wantedStore, props) => ({
  [wantedStore]: R.path(['store', wantedStore], props),
}))

export const genAntChildNumTab = (len, prefix, width) => {
  let children = [];

  for(let i = 0; i < len; i++) {
    children.push({
      title: (i+1).toString(),
      dataIndex: `${prefix}${i+1}`,
      key: `${prefix}${i+1}`,
      width: width
    })
  }

  return children;
}

export const sortAsc = src => {
  return src.sort(function(a, b) {
    return a - b;
  });
};

export const sortDesc = src => {
  return src.sort(function(a, b) {
    return b - a;
  });
};


export const mobxState2Plain = store => {
  let keys = R.keys(store);
  let obj = {};

  keys.map(key => {
    if (store[key].toJSON)
      obj[key] = store[key].toJSON();
    else
      obj[key] = store[key];
  })

  return obj;
};

export const checkCurToken = (host) => {

  let token = localStorage.getItem("token");

  if (token != undefined && token != null && token.length > 10) {
    return validToken(host, token)
    .then(result => {
      if (!result)
        localStorage.clear();
      return result;
    })
  } else {
    localStorage.clear();
    return new Promise(resolve => resolve(false));
  }

};


export const checkLoginExpired = (logic) => {
  let curLang = localStorage.getItem("lang");

  checkCurToken(logic.getHost())
  .then((result) => {
    if (result) {
      logic.loadData()
    } else {
      message.info(langmap.tokenInvalid[curLang]);
      Router.push("/login")
    }
  })

}

export function logout() {
  localStorage.clear()
  Router.push("/login")
}



