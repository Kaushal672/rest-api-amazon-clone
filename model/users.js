/* eslint-disable no-underscore-dangle */
const mongoose = require('mongoose');

const { Schema } = mongoose;

const addressSchema = new Schema({
    country: { type: String, required: true },
    fullName: { type: String, required: true },
    phone: {
        type: String,
        match: [/\d{10}/, 'Phone number should only 10 have digits'],
    },
    pincode: {
        type: String,
        match: [/^\d{6}/, 'Phone number should only 6 have digits'],
    },
    addressline: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    default: { type: Boolean, default: false },
});

const userSchema = new Schema({
    username: { type: String, required: true },
    avatar: {
        type: {
            filename: String,
            url: String,
        },
        default: {
            filename: 'India Tour/default_avatar_fbyzfp.jpg',
            url: 'https://res.cloudinary.com/dlds2z087/image/upload/v1669354509/India%20Tour/default_avatar_fbyzfp.jpg',
        },
    },
    phone: {
        type: String,
        match: [/\d{10}/, 'Phone number should only 10 have digits'],
    },
    email: {
        type: String,
        match: [/\S+@\S+\.\S+/, 'Email must be valid'],
        required: [true, 'Email must be valid'],
        unique: true,
    },
    password: {
        type: String,
        required: [true, 'Password is not valid'],
    },
    cart: { type: Schema.Types.ObjectId, ref: 'Cart' },
    admin: { type: Boolean, default: false },
    company: { type: String },
    addresses: [addressSchema],
});

userSchema.methods.addAddress = async function (address) {
    let updatedAddresses = this.addresses.slice();
    if (address.default)
        updatedAddresses = updatedAddresses.map((addr) => {
            return { ...addr, default: false };
        });
    updatedAddresses.push(address);
    this.addresses = updatedAddresses;
    return this.save();
};

userSchema.methods.updateAddress = async function (address, id) {
    const idx = this.addresses.findIndex((addr) => addr._id.toString() === id);
    const updatedAddresses = this.addresses.slice();

    updatedAddresses[idx] = { ...updatedAddresses[idx], ...address };

    this.addresses = updatedAddresses;
    return this.save();
};

userSchema.methods.removeAddress = async function (id) {
    const updatedAddresses = this.addresses.filter(
        (addr) => addr._id.toString() !== id
    );

    this.addresses = updatedAddresses;
    return this.save();
};

module.exports = mongoose.model('User', userSchema);
