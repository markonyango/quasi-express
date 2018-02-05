const fetch = require('node-fetch');

var createUser = async function () {
    var body = { 'email': 'mark', 'password': 'mark' }

    var res = await fetch('http://localhost:3000/users/login', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json'
        }
    })

    res = await res.headers._headers['set-cookie'][0];
    return await res.split(';', 1)[0]
}

module.exports = createUser