const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { UserInputError } = require('apollo-server')

const { validateRegisterInput, validateLoginInput } = require('../../utils/validators')
const { SECRET_KEY } = require('../../config')
const User = require('../../model/UserModel')




function generateToken(user) {
    return jwt.sign({
        id: user.id,
        username: user.username,
        email: user.email
    },
        SECRET_KEY,
        { expiresIn: '2h' })
}

module.exports = {
    Mutation: {

        async login(_, { username, password }) {
            const { errors, valid } = validateLoginInput(username, password)
            if (!valid) {
                throw new UserInputError('Errors', { errors })
            }

            const user = await User.findOne({ username })
            if (!user) {
                errors.genaral = 'User not found'
                throw new UserInputError('User not found', { errors })
            }

            const match = await bcrypt.compare(password, user.password)
            if (!match) {
                errors.genaral = 'Wrong credentials'
                throw new UserInputError('Wrong credentials', { errors })
            }


            const token = generateToken(user)

            return {
                ...user._doc,
                id: user._id,
                token
            }
        },





        async register(
            _,
            {
                registerInput: { username, email, password, confirmPassword }
            },
        ) {
            // TODO: Validated user data 
            const { errors, valid } = validateRegisterInput(username, email, password, confirmPassword)
            if (!valid) {
                throw new UserInputError('Error', { errors })
            }
            // TODO: Make sure user dosent already exist
            const user = await User.findOne({ username })
            if (user) {
                throw new UserInputError('Username is taken', {
                    errors: {
                        username: 'This username is taken'
                    }
                })
            }

            // TODO: hash password and create an auth token
            password = await bcrypt.hash(password, 12)

            const newUser = new User({
                username,
                email,
                password,
                createdAt: new Date().toISOString()
            })

            const res = await newUser.save()

            const token = generateToken(res)

            return {
                ...res._doc,
                id: res._id,
                token
            }
        }


    }
}
