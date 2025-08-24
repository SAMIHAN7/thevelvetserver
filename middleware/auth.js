
const jwt = require("jsonwebtoken")
const PRIVATE_KEY = process.env.PRIVATE_KEY

const Admin = require('../Models/Admin');


const auth= async (req, res, next) => {
    let success = false
    try {
       const token = req.header('auth-token');
        console.log("token", token)
        if (!token) {
            return res.status(403).json({ success: false, error: "login again" })
        }
        const data = await jwt.verify(token, PRIVATE_KEY);
        if (data === null || data === false || data === undefined) {
            return res.status(403).json({ success: false, error: "login again" })
        }
        const logineduser = await Admin.findById(data.id);
        if (logineduser === null || logineduser === false || logineduser === undefined) {
            return res.status(403).json({ success: false, error: "login again" })
        }
        success = true
        req.user = data.id


        next()
    } catch (error) {
        // success = false
        console.error("Error in authAdmin middleware:", error);
        return res.status(400).json({ success: success, err: error.message })

    }

}



module.exports = auth