/**
 * higher order function for async/await error handling
 * @param {function} an async function
 * @returns {function}
 */
export const catchErrors = fn => {
    return function( ... args) {
        return fn( ...args).catch((err) => {
            console.error(err);
        })
    }
}

/**
 * format ms to human readable time duration
 * @param {*} ms number of milliseconds
 * @returns {string} formatted duration string
 */
export const formatDuration = ms => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor(((ms % 60000) / 1000));
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
}