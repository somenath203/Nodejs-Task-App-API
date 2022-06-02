const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./task');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "User must enter full name"],
        trim: true
    },
    email: {
        type: String,
        required: [true, "User must provide email"],
        unique: [true, "Entred email already exist. Please try another email."],
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid');
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be a positive number.');
            }
        }
    },
    password: {
        type: String,
        required: [true, "user must enter password"],
        trim: true,
        validate(value) {
            if (value.length < 6) {
                throw new Error('Length of password must be greater that 6')
            }
            if (value.toLowerCase().indexOf("password") > -1) {
                throw new Error('your password cannot contain the word "password". ')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true 
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
});

// virtual
userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
});


// showing only selected info of the user in public and hiding the sensetive ones
userSchema.methods.toJSON = function () {

    
    const user = this;
    
    const userObject = user.toObject();

    delete userObject.password;

    delete userObject.tokens;

    delete userObject.avatar;

    return userObject;

}

// function to handle login of user
userSchema.statics.findByCredentials = async (email, password) => {

    const user = await User.findOne({ email });

    if (!user) {
        return;
    }


    const isMatchPassword = await bcrypt.compare(password, user.password);

    if (!isMatchPassword) {
        return;
    }


    return user;

};

// hash the plain text password before saving
userSchema.pre('save', async function (next) {

    const user = this;

    if (user.isModified('password')) {

        user.password = await bcrypt.hash(user.password, 8);
    }

    next();

});


// generating jwt token
userSchema.methods.generateAuthToken = async function () {
    
    const user = this;

    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);

    user.tokens = user.tokens.concat({ token: token }); 

    await user.save(); 

    return token;

}

// while deleteing user, also delete all the task associated with that particular user
userSchema.pre('remove', async function (next) {

    const user = this;

    await Task.deleteMany({ owner: user._id });

    next();

});


const User = mongoose.model('User', userSchema);


module.exports = User;



