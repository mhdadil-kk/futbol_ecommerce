

const Category = require('../models/category')


const loadCategory = async(req,res) =>{
    try{
        
        const categories = await Category.find()
        
       
        res.render('admin/page-categories',{categories:categories})

    }catch(error){
        console.log(error)
    }
}

const addCategory = async(req,res) =>{
    try{

        const {name,description} = req.body

        const newCategory = new Category({
            name,
            description
        })

      const  saveCategory =  await newCategory.save()
      console.log(saveCategory)
      if(saveCategory){
        res.redirect('/admin/categories')
      }
    }catch(error){
        console.log(error)
    }
}

const loadeditCategory = async(req,res) =>{
    try{
        const categoryId = req.params.id
        console.log(categoryId)

        const category = await Category.findById(categoryId)

        res.render('admin/editCategory',{category})

    }catch(error){
        console.log(error)
    }
}

const editCategory = async(req,res) =>{
    try{
      
          const categoryId =  req.params.id;

        const {name , description} = req.body
       
        const category = await Category.findById(categoryId)

        category.name = name
        category.description = description

       const  categoryEdited =  await category.save()

       if(categoryEdited){
        res.redirect('/admin/categories')
       }


    }catch(error){
        console.log(error)
    }
}


const hideCategory = async (req,res) =>{
    try{
     const categoryId = req.query.id
    
     const CategoryData = await Category.findOne({_id:categoryId})
    
    
     CategoryData.is_hide = !CategoryData.is_hide

     const save = await CategoryData.save();
      

  if(save){
    res.send({success :1})

  }else{
    res.send({success:0})
  }

    }catch(error){
        console.log(error)
        res.send({ success: 0 })
    }
}


module.exports = {
    loadCategory,
    addCategory,
    hideCategory,
    loadeditCategory,
    editCategory
}