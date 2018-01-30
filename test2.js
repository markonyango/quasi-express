const fetch = require('node-fetch');
const to = require('./catchError');
const FormData = require('form-data');
const fs = require('fs');


(function () {
  const form = new FormData();
  form.append('email', 'test@user.com');
  form.append('password', 'testuser');

  var body = { 'email': 'mark', 'password': 'mark' }

  fetch('http://localhost:3000/users/login', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  })
    // .then(res => res.json())
    .then(res => console.log(res))
    // .then(res => /Hello\, welcome to QUASI\-Express/.test(res) ? console.log('yes'): null)
    .catch(error => console.log(error))
})();
