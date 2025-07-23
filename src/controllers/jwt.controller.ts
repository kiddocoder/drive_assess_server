
import jwt from 'jsonwebtoken';
import {Response,Request} from "express"

export class JwtController {


    public generateAccessToken = async (req:Request,res:Response): Promise<void> => {

        const data = req.body;

        const token = jwt.sign(data,String(process.env.JWT_SECRET),{
            expiresIn:'1h'
        })

        res.json({token})
    }

    public decodeToken = async (req:Request,res:Response) => {
        const token = req.params.token;

        // verify if it was not expired!

        if(!token){
            res.status(401).json({
                success:false,
                message:"Token not found"
            })
            return
        }

        if(!jwt.verify(token,String(process.env.JWT_SECRET))){
            res.status(401).json({
                success:false,
                message:"Invalid token or expired"
            })
            return
        }

        const decoded = jwt.verify(token,String(process.env.JWT_SECRET))

        res.json(decoded)
    }

}



export default new JwtController();