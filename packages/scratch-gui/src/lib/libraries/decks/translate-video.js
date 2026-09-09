/**
 * Tutorial videos were removed from ST-Playground. Keep the helper so cards
 * and tests still import it; unknown ids are returned unchanged.
 * @param {string} videoId key or hosted video id
 * @returns {string} the given id
 */
const translateVideo = videoId => videoId;

export {
    translateVideo
};
