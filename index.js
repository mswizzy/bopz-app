require('dotenv').config();
const express = require('express');
const querystring = require('querystring');
const path = require('path');

const axios = require('axios');
const app = express();


const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;
const FRONTEND_URI = process.env.FRONTEND_URI;
const PORT = process.env.PORT || 8888;

//priority serve static files from react app
app.use(express.static(path.resolve(__dirname, './client/build')));

app.get('/', (req, res) => {
    res.send('Welcome page');
});

//use to generate random string for state query param and cookie to
// protect against cross-site request forgery
const generateRandomString = length => {
    let text = '';
    const possible = 
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    for (let i = 0; i <length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

const stateKey = 'spotify_auth_state';

//request auth from Spotify
app.get('/login', (req, res) => {
    const state = generateRandomString(16);

    const scope = [
        'user-read-private', 
        'user-read-email', 
        'user-top-read'
    ].join(' ');

    res.cookie(stateKey, state);

    const queryParams = querystring.stringify({
        client_id: SPOTIFY_CLIENT_ID,
        response_type: 'code', 
        redirect_uri: SPOTIFY_REDIRECT_URI,
        state: state,
        scope: scope
    })
    res.redirect(`https://accounts.spotify.com/authorize?${queryParams}`);
});

//use auth code to request access token
app.get('/callback', (req, res) => {
    const code = req.query.code || null; //store value of auth code from query param or default to null

    axios({
        method: 'post',
        url: 'https://accounts.spotify.com/api/token', 
        data: querystring.stringify({ 
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: SPOTIFY_REDIRECT_URI
        }), 
        headers: {
            'content-type': 'application/x-www-form-urlencoded', 
            Authorization: `Basic ${new Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
        },
    })
    .then(response => {
        if (response.status == 200) {
            const {access_token, refresh_token, expires_in } = response.data; //destructure variables to pass into auth header

            //tokens to pass
            const queryParams = querystring.stringify({
                access_token, refresh_token, expires_in
            })
            //redirect to react app
            res.redirect(`${FRONTEND_URI}?${queryParams}`)

        } else {
            res.redirect(`/?${querystring.stringify({error: 'invalid_token'})}`);
        }            

    })
    .catch(error => {
        res.send(error);
    });
});

//request new access token
app.get('/refresh_token', (req, res) => {
    const { refresh_token } = req.query;

    axios({
        method: 'post', 
        url: 'https://accounts.spotify.com/api/token',
        data: querystring.stringify({
            grant_type: 'refresh_token',
            refresh_token: refresh_token
        }),
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${new Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
        },
    })
    .then(response => {
        res.send(response.data);
    })
    .catch(error => {
        res.send(error);
    })
})

//all remaining requests return to React app to handle routing
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, './client/build', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});