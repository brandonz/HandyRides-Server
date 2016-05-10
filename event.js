// app/models/event.js

var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var EventSchema   = new Schema({
    id: {type: String, required: true},
    users: [
    	{
    		fname: {type: String},
    		lname: {type: String},
    		email: {type: String},
            status: {type: String},
            info: {type: Object}
    	}
    ]
});

module.exports = mongoose.model('Event', EventSchema);