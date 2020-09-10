const createEstimator = require('mp3-duration-estimate').default;
const FetchDataReader = require('mp3-duration-estimate').FetchDataReader;
const fetch = require('node-fetch');

const estimator = createEstimator(new FetchDataReader(fetch));

// if error return 0 by tricky
estimator(process.argv.slice(2)[0])
.then(duration => console.log(duration))
.catch(error => console.log(0))