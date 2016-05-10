// app/models/user.js

var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var UserSchema   = new Schema({
    fname: {type: String, required: true},
    lname: {type: String, required: true},
    email: {type: String, required: true},
    passw: {type: String, required: true},
    events: [
    	{
    		id: {type: String},
    		status: {type: String}
    	}
    ]
});

module.exports = mongoose.model('User', UserSchema);