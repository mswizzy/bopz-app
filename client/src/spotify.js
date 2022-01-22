import axios from 'axios'

//map for localStorage keys
const LOCALSTORAGE_KEYS = {
    accessToken: 'spotify_access_token',
    refreshToken: 'spotify_refresh_token',
    expireTime: 'spotify_token_expire_time',
    timestamp: 'spotify_token_timestamp',
}

//map to retrieve localStorage values
const LOCALSTORAGE_VALUES = {
    accessToken: window.localStorage.getItem(LOCALSTORAGE_KEYS.accessToken),
    refreshToken: window.localStorage.getItem(LOCALSTORAGE_KEYS.refreshToken),
    expireTime: window.localStorage.getItem(LOCALSTORAGE_KEYS.expireTime),
    timestamp: window.localStorage.getItem(LOCALSTORAGE_KEYS.timestamp)
};

export const logout = () => {
    //clear localStorage items
    for (const property in LOCALSTORAGE_KEYS) {
        window.localStorage.removeItem(LOCALSTORAGE_KEYS[property]);
    }
    // go to homepage
    window.location = window.location.origin;
}

/**
 * Checks if the amt of time elapsed between the timestamp in localStorage and now
 * is greater than the expiration time
 * @return {boolean} whether or not the localStorage access token has expired
 */
const hasTokenExpired = () => {
    const { accessToken, timestamp, expireTime } = LOCALSTORAGE_VALUES;
    if (!accessToken || !timestamp) {
        return false;
    }
    const millisecondsElapsed = Date.now() - Number(timestamp);
    return (millisecondsElapsed/1000) > Number(expireTime);
}

/**
 * use refresh token in localStorage to use the /refresh_token endpoint in node app
 * updates values in localStorage with response data
 * @returns {void}
 */
const refreshToken = async () => {
    try {
        //logout if there is no refresh token stored or are in a reload infinite loop
        if (!LOCALSTORAGE_VALUES.refreshToken || LOCALSTORAGE_VALUES.refreshToken == 'undefined' || 
        (Date.now() - Number(LOCALSTORAGE_VALUES.timestamp) / 1000) < 1000
        ){
            console.error('No refresh token available');
            logout();
        }

        //use '/refresh_token' endpoint from node app
        const { data } = await axios.get(`/refresh_token?refresh_token=${LOCALSTORAGE_VALUES.refreshToken}`);

        //update localStorage values
        window.localStorage.setItem(LOCALSTORAGE_KEYS.accessToken, data.access_token);
        window.localStorage.setItem(LOCALSTORAGE_KEYS.timestamp, Date.now());

        //relead page to reflect localStorage updates
        window.location.reload();
    } catch (e) {
        console.error(e);
    }
};

/**
 * Handles logic for retrieving the Spotify access token from localStorage
 * or URL query params
 * @returns {string} A Spotify access token
 */
const getAccessToken = () => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const queryParams = {
      [LOCALSTORAGE_KEYS.accessToken]: urlParams.get('access_token'),
      [LOCALSTORAGE_KEYS.refreshToken]: urlParams.get('refresh_token'),
      [LOCALSTORAGE_KEYS.expireTime]: urlParams.get('expires_in'),
    };
    const hasError = urlParams.get('error');
  
    // If there's an error OR the token in localStorage has expired, refresh the token
    if (hasError || hasTokenExpired() || LOCALSTORAGE_VALUES.accessToken === 'undefined') {
      refreshToken();
    }
  
    // If there is a valid access token in localStorage, use that
    if (LOCALSTORAGE_VALUES.accessToken && LOCALSTORAGE_VALUES.accessToken !== 'undefined') {
      return LOCALSTORAGE_VALUES.accessToken;
    }
  
    // If there is a token in the URL query params but not in localStorage, user is logging in for the first time
    if (queryParams[LOCALSTORAGE_KEYS.accessToken]) {
      // Store the query params in localStorage
      for (const property in queryParams) {
        window.localStorage.setItem(property, queryParams[property]);
      }
      // Set timestamp
      window.localStorage.setItem(LOCALSTORAGE_KEYS.timestamp, Date.now());
      // Return access token from query params
      return queryParams[LOCALSTORAGE_KEYS.accessToken];
    }

    return false;
}

export const accessToken = getAccessToken();

/**
 * axios global headers
 * sets base url and request headers for every HTTP request 
 */
axios.defaults.baseURL = "https://api.spotify.com/v1";
axios.defaults.headers['Authorization'] = `Bearer ${accessToken}`;
axios.defaults.headers['Content-Type'] = 'application/json';

/**
 * get current user profile
 * https://developer.spotify.com/documentation/web-api/reference/#endpoint-get-current-users-profile
 * @returns {Promise}
 */
export const getCurrentUserProfile = () => axios.get('/me');

/**
 * get list of current user's playlists
 * https://developer.spotify.com/documentation/web-api/reference/#endpoint-get-current-users-playlists
 * @param {*} limit max num playlists to get
 * @returns 
 */
export const getCurrentUserPlaylists = (limit = 20) => {
    return axios.get(`/me/playlists?limit=${limit}`);
};

/**
 * get user's top artists and tracks
 * https://developer.spotify.com/documentation/web-api/reference/#endpoint-get-users-top-artists-and-tracks
 * @param {string} time_range - 'short_term' (last 4 weeks),
 * 'medium_term' (last 6 months), or 'long_term' (several years and new data).
 * Defaults to 'short_term'
 * @returns {Promise}
 */
export const getTopArtists = (time_range = 'short_term') => {
    return axios.get(`/me/top/artists?time_range=${time_range}`)
}

/**
 * get user's top tracks
 * https://developer.spotify.com/documentation/web-api/reference/#endpoint-get-users-top-artists-and-tracks
 * @param {string} time_range - 'short_term' (last 4 weeks),
 * 'medium_term' (last 6 months), or 'long_term' (several years and new data).
 * Defaults to 'short_term'
 * @returns {Promise}
 */
export const getTopTracks = (time_range = 'short_term') => {
    return axios.get(`/me/top/tracks?time_range=${time_range}`);
}

/**
 * get specified playlist by id
 * @param {string} playlist id
 * @returns {Promise}
 */
export const getPlaylistById = playlist_id => {
    return axios.get(`/playlists/${playlist_id}`);
}

/**
 * Get audio features for several tracks
 * @param {string} ids - comma separated list of spotify track ids
 * @returns {Promise}
 */
export const getAudioFeaturesForTracks = ids => {
    return axios.get(`/audio-features?ids=${ids}`);
}