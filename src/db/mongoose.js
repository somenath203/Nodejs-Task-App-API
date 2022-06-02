const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URL, () => {
    console.log('mongoDB connected successfully');
});





