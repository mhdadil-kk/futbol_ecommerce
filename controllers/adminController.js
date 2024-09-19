const { validationResult } = require('express-validator');

const User = require('../models/user');
const bcrypt = require('bcryptjs');
const getLoginPage = async (req, res) => {
    try{
        res.render('admin/adminlogin', {errors : [] , error:""}); 
    }catch(error){
        console.log(error)
    }
    
};

const verifyAdmin = async(req,res)=>{
    try{
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
          return res.render('admin/adminlogin', { 
              errors:  errors.errors,
              error: ''
          });
      }

       const {email,password} = req.body
       if (!email || !password) {
        return res.render('admin/adminlogin', { errors : [],error: 'Email and password are required' });
      }


      const  adminData = await User.findOne({email:email})

      if(adminData){
        const CheckPassword = await bcrypt.compare(password,adminData.password)
        if(CheckPassword&&adminData.isAdmin){
          req.session.admin_id = adminData._id;
                req.session.admn = {  
                    name: adminData.name,
                    email: adminData.email,
                    mobile: adminData.mobile,
                };
           res.redirect('admin/dashboard')
        }else{
          res.render('admin/adminlogin', { errors:[], error: 'Invalid email or password' });
        }
      }else{
        res.render('admin/adminlogin', { errors:[], error: 'Invalid email or password' });
      }

    }catch(error){
        console.log(error)
    }
}

  const loadDashboard = async(req,res) =>{
    try{
       res.render('admin/index')
    }catch(error){
        console.log(error)
    }
  }


  const loadUserList = async(req,res)=>{
    try{
      const Users = await User.find({isAdmin:false})
      res.render('admin/users-list.ejs' ,{Users})
    }catch(error){
      console.log(error)
    }
  }

  const blockUnblockUser = async (req, res) => {
    try {
        const { id } = req.query;

        // Find the user by ID
        const user = await User.findOne({_id :id});

        if (!user) {
            return res.status(404).json({ success: 0, message: 'User not found' });
        }

        // Toggle the is_blocked status
        user.is_blocked = !user.is_blocked;

        // Save the updated user
        const save =  await user.save();

        if(save){
          res.send({success :1})
      
        }else{
          res.send({success:0})
        }

       
    } catch (error) {
      console.log(error)
      res.send({ success: 0 })
    }
};

  


  const logout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.log(err);
                res.send("Error");
            } else {
             res.redirect('/admin')
            }
        });
    } catch (error) {
        console.log(error.message);
    }
}




module.exports = {
    getLoginPage,
    verifyAdmin,
    loadDashboard,
    loadUserList,
    blockUnblockUser,
    logout
};
