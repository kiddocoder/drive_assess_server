
import { Request,Response,Router } from "express";

import Stripe from "stripe";
import { authenticateToken, requireRole } from "../middleware/auth.middleware";

const stripe = new Stripe(String(process.env.STRIPE_SECRET_KEY));

interface AuthRequest extends Request {
  user?: {
    userId: string
    role: string
  }
}


const router = Router();

router.post("/link-account",authenticateToken, requireRole(["admin"]), async (req:AuthRequest,res:Response)=>{
try {
    const session = await stripe.financialConnections.sessions.create({
      account_holder: {
        type: 'customer',
        customer: req.user?.userId
      },
      permissions: ['payment_method', 'balances'],
      filters: { countries: ['US','CA','GB'] } 
    })
    res.json({ clientSecret: session.client_secret })
  } catch (error) {
    console.error('Error creating linking session:', error)
    res.status(500).json({ error: 'Failed to create linking session' })
  }
})