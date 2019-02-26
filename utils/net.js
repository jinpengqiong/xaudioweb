//import fetch from 'whatwg-fetch'
import fetch from 'isomorphic-fetch';

export const validToken = (host, token) => {

  return fetch(
    host + `/check_token`,
    {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
    }
  )
  .then(res => res.json())
  .then(result => {
    if (result.error_code != 0) {
      return false;
    } else {
      return true;
    }
  })

}



