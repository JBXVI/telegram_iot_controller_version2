const express = require("express"); //express
const router = express.Router(); //routes
const path = require("path");//path

module.exports=(passport,isLoggedIn,UserSchema,admins,devices)=>{
    //login screen
    router.get('/', (req, res) => {
        if(req.user){
            res.redirect('/protected')
        }else{
            res.sendFile(path.join(__dirname,"..","Public","login","login.html"))
        }
       // res.send('<a href="/auth/google">Authenticate with Google</a>');
    });

    //documentation
    router.get('/docs',(req,res)=>{
        res.sendFile(path.join(__dirname,"..","Public","docs","docs.html"))
    })


    ///google auth 1st step
    router.get('/auth/google',passport.authenticate('google', { scope: [ 'email', 'profile' ] }));

    ///google auth 2nd step
    router.get( '/auth/google/callback',passport.authenticate( 'google', {successRedirect: '/protected',failureRedirect: '/auth/google/failure'}));
    
    //protected page
    router.get('/protected', isLoggedIn, async(req, res) => {
        if(req.user.email === process.env.ADMIN_URL){
            res.sendFile(path.join(__dirname,"..","Public","home","admin.html"))
        }else{
            res.sendFile(path.join(__dirname,"..","Public","home","home.html"))
        }
    });

    //logout user
    router.get('/logout', (req, res) => {req.logout();req.session.destroy();res.send('Goodbye!');});

    //google signin failure route
    router.get('/auth/google/failure', (req, res) => {res.send('Failed to authenticate..');});

    //get user data
    router.post('/getData',isLoggedIn,async(req,res)=>{
        const email = req.user.email;
        const name = req.user.given_name;
        const data = await UserSchema.findOne({email:email,username:name}).exec()
        res.json({"success":true,"data":data})
    })

    //logout user
    router.post('/logout',isLoggedIn,async(req,res)=>{
        req.session.destroy(err=>{
            if(err){
                res.json({"success":false,"error":err})
            }else{
                res.json({"success":true})
            }
        })
    });

    //admin controls
    router.post('/logs',isLoggedIn,(req,res)=>{
        if(req.user.email === process.env.ADMIN_URL){
            const totalAdmins = Object.keys(admins).length;
            const totalClients = Object.keys(devices).length;
            const allAdmins = Object.keys(admins);
            res.json({"success":true,"data":{totalAdmins:totalAdmins,totalClients:totalClients,allAdmins:allAdmins}})
        }else{
            res.json({"success":false,"error":"invalid path"})
        }
    })

    //for any other
    router.get('*',(req,res)=>{
        if(req.user){
            res.redirect('/protected')
        }else{
            res.redirect('/')
        }
    })

    return router;
}