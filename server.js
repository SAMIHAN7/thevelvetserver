
require('dotenv').config()
const cors = require("cors");
// require('./db/db')
const express = require('express')
const mongoose = require('mongoose')
const path = require('path')
const PORT = process.env.PORT || 5000
const app = express()
const Auth = require('./routes/ADMIN/admin.js')
const offer = require('./routes/Offers/Offers.js')
const hpyhrs = require('./routes/HappyHours/happyhours.js')
const customers = require('./routes/CUTSOMER/customer.js')
const events = require('./routes/EVENT/event.js')
const gallery = require('./routes/Gallery/gallery.js')
const menu = require('./routes/MENU/menu.js')
const webLanding = require('./routes/Web/landing/index.js')
const auth = require('./middleware/auth')
app.use(express.json())
app.use(cors());
const uri = process.env.DATABASE;
mongoose.set('strictQuery', false);
mongoose.connect(uri, {
    useNewUrlParser: true,

    useUnifiedTopology: true,
});

const connection = mongoose.connection;
connection.once("open", () => {
    console.log("MongoDB database connection established successfully.");
})


app.use('/auth', Auth)
app.use('/offfer', auth, offer)
app.use('/hpyhrs', auth, hpyhrs)
app.use('/menu', auth, menu)
app.use('/customers', auth, customers)
app.use('/events', auth, events)
app.use('/gallery', auth, gallery)
app.use('/web/landing', webLanding)
// app.use('/gallery', Gallery)
// app.use('/auth', Login)
// app.use('/rbac',RBAC)
// app.use('/product',Product)
// app.use('/inquiry',Inquiry)
// app.use('/summary',Count)
// app.use('/client',Client)
// app.use('/web',web)

app.get("/", (req, res) => {
  res.send("VELVET SERVER IS LIVE");
});


app.listen(PORT, () => console.log(`Example app listening on 5000`))