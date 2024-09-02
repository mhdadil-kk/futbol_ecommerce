const Category = require("../models/category")
const Product = require("../models/product")

const loadProducts = async (req, res) => {
    try {
        const products = await Product.find()
       
        res.render('admin/page-products-grid', {products})

    } catch (error) {

    }
}


const loadaddProduct = async (req, res) => {
    try {
       
        const categories = await Category.find({is_hide:false})
        
        res.render('admin/page-form-product-2' ,{categories})

    } catch (error) {

    }
}

const addProduct = async (req, res) => {
    try {
        const { name, description, price, category, stock } = req.body;

        console.log(req.files); // Debugging: Check uploaded files

        let imagePaths = [];
        if (req.files && req.files.length > 0) {
            imagePaths = req.files.map(file => file.filename);
        }

        const newProduct = new Product({
            name,
            description,
            price,
            stock,
            images: imagePaths, // Ensure this is 'images' if your schema uses this name
            category,
        });

        const savedProduct = await newProduct.save();

        if (savedProduct) {
            console.log('Product saved:', newProduct);
            res.redirect('/admin/products');
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'An error occurred while adding the product' });
    }
};

const loadeditProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId);
        res.render('admin/edit-products',{product})

    } catch (error) {

    }
}

const editProduct = async (req, res) => {
    try {
        const { name, description, price, category, stock } = req.body;

        

        let imagePaths = [];
        if (req.files && req.files.length > 0) {
            imagePaths = req.files.map(file => file.filename);
        }

        const productId = req.params.id;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        product.name = name;
        product.description = description;
        product.price = price;
        product.stock = stock;
        product.category = category;

        if (imagePaths.length > 0) {
            product.images = imagePaths; 
        }


        const productEdited = await product.save();

        if (productEdited) {
            console.log('Product updated:', productEdited);
            res.redirect('/admin/products');
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'An error occurred while editing the product' });
    }
};

const productBlock = async (req, res) => {

    try {
        const productId = req.query.id;
        const productData = await Product.findOne({ _id: productId });
        productData.status = !productData.status
        const saving = await productData.save();

        if (saving) {
            res.send({ success: 1 })
            console.log(productId + ' listing or unlisting productId')
        } else {
            res.send({ success: 0 })
        }

    } catch (error) {
        console.log(error);
        res.send({ success: 0 })
    }
}




module.exports = {
    loadProducts,
    loadaddProduct,
    addProduct,
    loadeditProduct,
    editProduct,
    productBlock

}

