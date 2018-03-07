const Handlebars = require('hbs')
const moment = require('moment')

Handlebars.registerHelper('formatDatum', (data) => {
    return moment(data).format('D. MMM Y - HH:mm')
})

Handlebars.registerHelper('json', function(context) {
    return JSON.stringify(context, null, 2)
})

Handlebars.registerHelper('html', function(context) {
    context = context.replace(/\n/gi, '<br>')
    
    return context
})

Handlebars.registerHelper('status', (status, id) => {
    let safeString = ''
    switch (status) {
        case 'running':
            safeString =    '<i class="fas fa-spinner fa-pulse"></i></i><button pid="' + id + '" name="stop_project">' +
                                '<i class="fas fa-stop" style="color:red"></i></button>' +
                                '<button pid="' + id + '" name="remove_project"><i class="fas fa-trash-alt"></i></button>'
            return new Handlebars.SafeString(safeString)

        case 'queued':
            safeString =    '<button pid="' + id + '"name="start_project"><i class="fas fa-play" style="color:green"></i></button>' +
                                '<button pid="' + id + '" name="remove_project"><i class="fas fa-trash-alt"></i></button>'
            return new Handlebars.SafeString(safeString)

        case 'done':
            return new Handlebars.SafeString('<i class="fas fa-check"></i>')

        case 'failed':
            safeString =    '<i class="fas fa-exclamation"></i>' +
                                '<button pid="' + id + '" name="remove_project"><i class="fas fa-trash-alt"></i></button>'
            return new Handlebars.SafeString(safeString)
            
        case 'stopped':
            safeString =    '<button pid="' + id + '"name="start_project"><i class="fas fa-play" style="color:green"></i></button>' +
                                '<button pid="' + id + '" name="remove_project"><i class="fas fa-trash-alt"></i></button>'
            return new Handlebars.SafeString(safeString)
    }
})