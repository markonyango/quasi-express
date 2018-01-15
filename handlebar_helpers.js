const Handlebars = require('hbs');
const moment = require('moment');

Handlebars.registerHelper('formatDatum', (data) => {
    return moment(data).format('D. MMM Y - HH:mm')
});