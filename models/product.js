const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    status: {
        type: Boolean,
        default: false
    },
    category: {
        type: String,
       
    },
    stock: {
        type: Number,
        required: true,
    },
    images: [String],
    status: {
        type: Boolean,
        default: false
    },
},{
    timestamps :true
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
