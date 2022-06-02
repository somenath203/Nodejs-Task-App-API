const jwt = require('jsonwebtoken');
const User = require('../models/user');

const auth = async (req, res, next) => {

    try {

        const token = req.header('Authorization').replace('Bearer', '').trim();

        const isValidToken = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findOne({ _id: isValidToken._id, 'tokens.token': token });


        if (!user) {
            throw new Error();
        }


        req.user = user;

        req.token = token;

        next();


    } catch (error) {
        console.log(error);
        res.status(401).send({
            error: "please authenticate yourself to access this route"
        });

    }
};

module.exports = auth;
