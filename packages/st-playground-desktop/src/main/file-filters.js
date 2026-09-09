const saveFilters = {
    JPEG: {name: 'JPEG Image', extensions: ['jpg', 'jpeg']},
    MP3: {name: 'MP3 Sound', extensions: ['mp3']},
    PNG: {name: 'PNG Image', extensions: ['png']},
    SB: {name: 'Scratch 1 Project', extensions: ['sb']},
    SB2: {name: 'Scratch 2 Project', extensions: ['sb2']},
    SB3: {name: 'ST-Playground Project', extensions: ['sb3']},
    Sprite2: {name: 'Scratch 2 Sprite', extensions: ['sprite2']},
    Sprite3: {name: 'Scratch 3 Sprite', extensions: ['sprite3']},
    SVG: {name: 'SVG Image', extensions: ['svg']},
    WAV: {name: 'WAV Sound', extensions: ['wav']}
};

const filtersByExtension = Object.values(saveFilters).reduce((result, filter) => {
    for (const extension of filter.extensions) {
        result[extension] = filter;
    }
    return result;
}, {});

const getFilterForExtension = extNameNoDot =>
    filtersByExtension[extNameNoDot] || {
        name: `${extNameNoDot.toUpperCase()} Files`,
        extensions: [extNameNoDot]
    };

module.exports = {
    getFilterForExtension,
    saveFilters
};
