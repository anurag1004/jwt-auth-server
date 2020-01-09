const mongoose = require('mongoose'),
jwt = require('jsonwebtoken'),
ttl = require('mongoose-ttl');

const tokenSchema = new mongoose.Schema({
    bearer : String,
    user_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    createdAt: {
        type: Date, 
        default:Date.now()
    }
});

// schema.plugin(ttl, { 
//     ttl: 'the time each doc should live in the db (default 60 seconds)',
//     interval: 'how often the expired doc reaper runs (default 5 mins)',
//     onReap: 'callback passed to reaper execution' 
// });

//for testing purpose I set it to 1min//
//idealy it may be 5 or 6min more than session expiry time//
//all issued tokens will be deleted after 1min//
//though it may not be exact 1min because mongo ttl check in every 60secs//
tokenSchema.plugin(ttl, { ttl: '1m' });
module.exports = mongoose.model("Token",tokenSchema);