const fs = require('fs');
const axios = require('axios');

module.exports.generate = async function generate() {
    try {
        const { data } = await axios.get('https://raw.githubusercontent.com/WatWowMap/Masterfile-Generator/master/master-latest.json');

        fs.mkdir('static/data', (error) => error ? console.log('Data folder already exists, skipping.') : console.log('Data folder created.'));

        fs.writeFile(
            'static/data/masterfile.json',
            JSON.stringify(data, null, 2),
            'utf8',
            () => { },
        );
        console.log('New masterfile generated');
    } catch (e) {
        console.warn('Unable to generate new masterfile, using existing.');
    }
};
