const express    = require('express');
const router     = new express.Router();
const product    = require('../models/product');
const orderModel = require('../models/orderhistory');
const multer     = require('multer');
const path       = require("path");




console.log("hi");

// product search route
router.get('/product/search', async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  console.log("inside get product search" + req.query.searchname);

  if (req.query.searchname != null && req.query.searchname !== '' && req.query.searchname!=='All') {
    search = new RegExp(req.query.searchname, 'i')
  } else {
    search = new RegExp('(.*?)','i')
  }
  //console.log(search)
  try {
    let products = null
    if(req.query.category && req.query.searchname!=='All')
        products = await product.find({categoryTag:search}).sort({_id:-1})
    else
        products = await product.find({brand:search}).sort({_id:-1})
    // console.log(products)
    return res.status(200).json(products)
  } catch(error) {
    console.log("i have a search error: " + error);
  }
})

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname,"../uploads/"))
  },
  filename: (req, file, cb) => {
    cb(null, Date.now().toString() +file.originalname)
  }
});

const upload = multer({ storage: storage }).single('file')

router.post('/createProduct',upload, function (req, res, next){
    res.setHeader("Access-Control-Allow-Origin", "*");
    payload = JSON.parse(req.body.payload);
    console.log(payload);
    console.log(req.file.path);
    
    try {
        product.findOne({
            Title: payload.title,
        }).then((doc) => {
            if (!doc) {
    
                let coinvalue = parseInt(payload.price);
                    coinvalue = coinvalue / 10;
                console.log(coinvalue);

                  
                
                try {
                    product.create({
                        Title          : payload.title,
                        description    : payload.description,
                        brand          : payload.brand,
                        Quantity       : payload.Quantity,
                        price          : payload.price,
                        seller         : payload.seller,
                        expiryDate     : payload.expiryDate,
                        DiscountedPrice: payload.discountedPrice,
                        categoryTag    : payload.categoryTag,
                        imgURL         : req.file.filename,
                        CoinValue      : coinvalue,
                        Rating         : "0",
                        NoOfUserRated  : "0",
                        
        
                    }
                    ).then((docs) => {
        
                        console.log("product created successfully\n" + docs);
                        res.status(200).send({
                            message: "product created successfully",
                            product: docs
                        });
                        
                    });
                } catch (error) {
                    console.error("creating a new product failure : " + error)
                    res.status(400).send({
                        message: "Failed Try Again !"
                    })
                }
            } else{
    
                try {
                    product.findOne({
                        Title : payload.title,
                        Seller: payload.seller,
                    }).then((doc) => {
                        if (!doc) {

                                    let coinvalue = parseInt(payload.price);
                                        coinvalue = coinvalue / 10;
    
                
                                    try {
                                            product.create({
                                            Title          : payload.title,
                                            description    : payload.description,
                                            brand          : payload.brand,
                                            Quantity       : payload.Quantity,
                                            price          : payload.price,
                                            seller         : payload.seller,
                                            expiryDate     : payload.expiryDate,
                                            DiscountedPrice: payload.discountedPrice,
                                            categoryTag    : payload.categoryTag,
                                            Rating         : "0",
                                            NoOfUserRated  : "0",
                                            Coinvalue      : coinvalue,
                                            imgURL         : req.file.filename
        
                                        }
                                        ).then((docs) => {
        
                                            console.log("product created successfully\n" + docs);
                                            res.status(200).send({
                                                message: "product created successfully",
                                                product: docs
                                        });
                        
                    });
                } catch (error) {
                    console.error("creating a new product failure : " + error)
                    res.status(400).send({
                        message: "Failed Try Again !"
                    })
                }
                            
                        } else{

                            console.log("product already exist");
                            res.status(201).send({
                                message: "already exist! update its value\n",
                                product: doc
                            });
                            
                        }
                    });
                } catch (error) {

                    res.status(400).send({
                        message: "something went wrong",
                    })
                    
                }
                
                
            }
        });
    } catch (error) {
        console.error("error in product find one : " + error);
        res.status(400).send({
            message: "unable to add try again!"
        })
    }
});



router.post('/order',(req,res) =>{
    console.log("inside order");
    
    
    
    ProdArray = JSON.parse(req.body.inventory);
    holder    = req.body.userordered;
    
    for(const item in ProdArray){

        var NewQuantity = ProdArray[item].quantity;

        
        
 
        try {
            product.findOne({
                _id: item,
            }).then((doc) => {
                if (!doc) {
                    console.log("No such Product exist");
                } else{

                    let order           = doc;
                        reducedQuantity = NewQuantity;
                        NewQuantity     = order.Quantity - NewQuantity;


                        product.updateOne({ 
                            _id: item
                        }, {
                         Quantity: NewQuantity
                        }
                        , (err) => {
                               if(err){
                                   console.log(`Error: ` + err)
                               }
                        });

                        
                        try {
                            orderModel.create({
                                productId: item,
                                user     : req.body.userordered,
                                Quantity : reducedQuantity,
                                price    : ProdArray[item].price
    
    
                            }).then((docs) => {
    
                                console.log("producted added succesfully");
                                
                            });
                        } catch (error) {
                            console.error("creating order try catch" + error);
                            res.status(400).send({
                                message: "Try Again!"
                            });
                        }
                    
                    
                    
                }
            });
        } catch (error) {
            console.error("finding product catch");
            res.status(400).send({
                message: "try again"
            });
        }

        

    }

    res.status(200).send({
        message: "order placed successfully"
    });

});

router.get('/gethistory',async(req,res)=>{
    curruser = req.query.username;

    try {
        docs = await orderModel.find({ 
            user: curruser
        }).sort({_id:-1});


        // console.log(docs);
        var finalOrderInfo = [];
        for(prod in docs){
            
            
            item = await product.findOne({
                _id:docs[prod].productId,
            })

            

            if(item){
                
                current = {
                    product: item,
                    history: docs[prod]
                }

                finalOrderInfo.push(current);

            }
        }
        res.status(200).send({
            History: finalOrderInfo
        });
    } catch (error) {
        console.error(error)
    }

})
module.exports = router;

