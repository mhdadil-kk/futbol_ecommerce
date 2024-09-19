const Cart = require("../models/cart")
const Order = require('../models/order'); 




const loadOrderList = async (req, res) => {
    try {
        const userId = req.session.user ? req.session.user_id : null;// Use optional chaining to avoid errors if user is undefined
        
        if (!userId) {
            console.error('User ID is not defined');
            return res.status(400).send('User not authenticated');
        }

        const orders = await Order.find({ user: userId }).sort({ orderDate: -1 }).exec();

        if (!orders || orders.length === 0) {
            console.log('No orders found for user:', userId);
            return res.render('user/order', { orders: [] }); // Render with an empty list
        }

        res.render('user/order', { orders });
    } catch (error) {
        console.error('Error loading orders:', error);
        res.status(500).send('Internal server error');
    }
};


const loadOrderDetails = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        console.log(orderId);

        const order = await Order.findById(orderId)
            .populate('products.product')
            .populate('deliveryAddress'); // Populate deliveryAddress to access its fields

        if (!order) {
            return res.status(404).render('error', { message: 'Order not found' });
        }

        // Calculate estimated delivery date
        const orderDate = new Date(order.orderDate);
        const estimatedDeliveryDate = new Date(orderDate);
        estimatedDeliveryDate.setDate(orderDate.getDate() + 4); // Add 4 days

        res.render('user/order-Details', {
            order,
            estimatedDeliveryDate: estimatedDeliveryDate.toDateString() // Format as needed
        });

    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).render('error', { message: 'Error fetching order details' });
    }
};

const cancelOrder = async (req, res) => {
    const { orderId } = req.params;

    try {
        // Find the order by ID
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.status === 'Cancelled') {
            return res.status(400).json({ message: 'Order is already cancelled' });
        }

        // Update the order status to 'Cancelled'
        order.status = 'Cancelled';
        await order.save();

        res.status(200).json({ message: 'Order cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling order:', error); // Log the error
        res.status(500).json({ message: 'An error occurred while cancelling the order', error: error.message });
    }
};







const placeOrder = async (req, res) => {
    try {
        const { address, paymentMethod } = req.body;
        const userId = req.session.user ? req.session.user_id : null;

        if (!address || !paymentMethod) {
            return res.status(400).json({
                success: false,
                message: 'Address and payment method are required'
            });
        }

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        // Fetch cart items from the database
        const cart = await Cart.findOne({ user: userId }).populate('products.product');

        if (!cart || cart.products.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart is empty'
            });
        }

        // Calculate total price manually based on cart products
        let totalPrice = 0;
        const productsWithPrices = cart.products.map(cartItem => {
            if (!cartItem.product.price) {
                throw new Error(`Price not found for product ${cartItem.product.name}`);
            }
            totalPrice += cartItem.quantity * cartItem.product.price;
            return {
                product: cartItem.product._id,
                quantity: cartItem.quantity,
                price: cartItem.product.price // Ensure price is being included
            };
        });

        // Create a new order
        const newOrder = new Order({
            user: userId,
            products: productsWithPrices, // Store the cart items with prices
            totalPrice, // Calculated total price
            deliveryAddress: address, // Ensure address is correctly mapped
            paymentMethod,
            status: 'Pending'
        });

        // Save the order to the database
        const savedOrder = await newOrder.save();

        // Clear the cart after placing the order
        await Cart.deleteOne({ user: userId });

        // Respond with success
        res.json({
            success: true,
            orderId: savedOrder._id
        });
    } catch (error) {
        console.error('Error placing order:', error.message);
        res.status(500).json({
            success: false,
            message: error.message || 'An error occurred while placing your order. Please try again.'
        });
    }
};




//admin Side  


const adOrderLoad = async (req, res) => {
    try {

        const orders = await Order.find()
            .populate('user', 'name email') 
            .populate('products.product', 'name') 
            .populate('deliveryAddress');
        res.render('admin/orderList', { orders });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};


const adOrderDetails = async (req, res) => {
    try {
        // Fetch order details by ID with populated fields
        const order = await Order.findById(req.params.id)
            .populate('user') // Populate user details
            .populate({
                path: 'products.product', // Populate product details
                select: 'name images price' // Adjust fields based on your Product schema
            })
            .populate('deliveryAddress') // Populate address details if needed
            .exec();

        if (!order) {
            return res.status(404).send('Order not found');
        }

        // Render the EJS template with order data
        res.render('admin/orders-detail', {
            order
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).send('Server Error');
    }
};


const updateOrder = async(req,res) =>{
    try{

     const orderId = req.params.orderId
     const {status} = req.body
    
     const Updated = await Order.findByIdAndUpdate(orderId,{status},{new:true})

     if(Updated){
        res.redirect(`/admin/orders/${orderId}`);
     }else{
        return res.status(404).send('Order not found');

     }




    }catch(error){
    console.log(error)
    }
}


module.exports ={
    loadOrderList,
    loadOrderDetails,
    placeOrder,
    cancelOrder,
    adOrderLoad,
    adOrderDetails,
    updateOrder
}

