var request = require('request');
var options = {
    'method': 'GET',
    'url': 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?id=2280',
    'headers': {
        'X-CMC_PRO_API_KEY': 'cdb408f3-4d42-404c-8112-5892162be6c1'
    }
};
request(options, function(error, response) {
    if (error) throw new Error(error);
    console.log(response.body);
});