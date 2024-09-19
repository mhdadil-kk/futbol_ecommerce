const address = require("../models/address");
const Cart = require("../models/cart");
const Product = require("../models/product");

const loadCart = async (req, res) => {
    try {
        const userId = req.session.user_id;
        if (!userId) {
            return res.redirect('/login'); // Redirect to login if not authenticated
        }

        const cart = await Cart.findOne({ user: userId }).populate('products.product');

        if (!cart) {
            return res.render('user/cart', {
                cart: { products: [], total_price: 0 }
            });
        }

        // Calculate total price
        const total_price = cart.products.reduce((total, item) => {
            return total + (item.quantity * item.product.price);
        }, 0);

        res.render('user/cart', {
            cart: {
                products: cart.products,
                total_price: total_price
            }
        });
    } catch (error) {
        console.log(error);
        res.render('user/cart', {
            cart: { products: [], total_price: 0 }
        });
    }
};

const addToCart = async (req, res) => {
    try {


        // Ensure user ID is present
        const userId = req.session.user_id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not logged in' });
        }
        
        const { productId, quantity } = req.body;

        // Find the product
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Set the maximum quantity per user
        const MAX_QTY_PER_USER = 5;

        let existingCart = await Cart.findOne({ user: userId });

        if (existingCart) {
            const productIndex = existingCart.products.findIndex(p => p.product.toString() === productId);

            if (productIndex > -1) {
                // Existing product in the cart
                let newQuantity = existingCart.products[productIndex].quantity + Number(quantity);

                // Check stock and maximum quantity limit
                if (newQuantity > product.stock) {
                    newQuantity = product.stock;
                }
                if (newQuantity > MAX_QTY_PER_USER) {
                    newQuantity = MAX_QTY_PER_USER;
                }

                existingCart.products[productIndex].quantity = newQuantity;
                existingCart.products[productIndex].product_total = newQuantity * product.price;
            } else {
                // New product to add to cart
                let newQuantity = Math.min(quantity, product.stock, MAX_QTY_PER_USER);
                existingCart.products.push({ product: productId, quantity: newQuantity, product_total: newQuantity * product.price });
            }

            // Recalculate total price
            existingCart.total_price = existingCart.products.reduce((acc, curr) => acc + curr.product_total, 0);
            await existingCart.save();
        } else {
            // New cart for the user
            let newQuantity = Math.min(quantity, product.stock, MAX_QTY_PER_USER);
            const newCart = new Cart({
                user: userId,
                products: [{ product: productId, quantity: newQuantity, product_total: newQuantity * product.price }],
                total_price: newQuantity * product.price
            });
            await newCart.save();
        }

        return res.json({ success: true });
    } catch (error) {
        console.log('Error adding to cart:', error);
        return res.json({ success: false, message: 'Error adding product to cart' });
    }
};

const removeProduct = async (req, res) => {
    try {
        const userId = req.session.user_id;
        if (!userId) {
            return res.redirect('/login'); // Redirect to login if not authenticated
        }

        const productId = req.params.productId; // Get the product ID from the URL

        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.redirect('/cart'); // Redirect if the cart does not exist
        }

        // Find the index of the product to be removed
        const productIndex = cart.products.findIndex(p => p.product.toString() === productId);
        if (productIndex > -1) {
            // Remove the product from the cart
            cart.products.splice(productIndex, 1);

            // Recalculate the total price
            cart.total_price = cart.products.reduce((acc, curr) => acc + curr.product_total, 0);

            // Save the updated cart to the database
            await cart.save();
        }

        // Redirect back to the cart page after updating
        res.redirect('/cart');
    } catch (error) {
        console.log('Error removing product from cart:', error);
        res.redirect('/cart');
    }
};

const updateCart = async (req, res) => {
    try {
        const userId = req.session.user_id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not logged in' });
        }

        const productId = req.params.productId; // Get productId from URL parameter
        const { quantity } = req.body; // Get quantity from request body

        // Find the product
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        let cart = await Cart.findOne({ user: userId });

        if (cart) {
            const productIndex = cart.products.findIndex(p => p.product.toString() === productId);

            if (productIndex > -1) {
                let newQuantity = Number(quantity);

                // Check stock and maximum quantity limit
                if (newQuantity > product.stock) {
                    newQuantity = product.stock;
                }
                const MAX_QTY_PER_USER = 5;
                if (newQuantity > MAX_QTY_PER_USER) {
                    return res.json({ success: false, message: `Maximum quantity per product is ${MAX_QTY_PER_USER}` });
                }
                if (newQuantity < 1) {
                    newQuantity = 1;
                }

                cart.products[productIndex].quantity = newQuantity;
                cart.products[productIndex].product_total = newQuantity * product.price;

                // Recalculate total price
                cart.total_price = cart.products.reduce((acc, curr) => acc + curr.product_total, 0);

                await cart.save();

                return res.json({ success: true, price: product.price, total_price: cart.total_price });
            } else {
                return res.status(404).json({ success: false, message: 'Product not found in cart' });
            }
        } else {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }
    } catch (error) {
        console.log('Error updating cart:', error);
        return res.json({ success: false, message: 'Error updating cart' });
    }
};



const loadcheckout = async (req, res) => {
    try {

        const userId = req.session.user_id



        const addresses = await address.find({ user: userId });



        const cart = await Cart.findOne({ user: userId }).populate('products.product');
        console.log(cart)
        const cartItems = cart.products.map(item => ({
            name: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
            totalPrice: item.quantity * item.product.price
        }));

        const totalPrice = cartItems.reduce((total, item) => total + item.totalPrice, 0);


        res.render('user/checkout', {
            addresses,
            cartItems,
            totalPrice
        })

    } catch (error) {
        console.log(error)
    }
}




module.exports = {
    loadCart,
    addToCart,
    loadcheckout,
    removeProduct,
    updateCart

};
