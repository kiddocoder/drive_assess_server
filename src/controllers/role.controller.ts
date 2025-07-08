import type { Request,Response } from "express"
import { Role } from "../models/users/Role"

export class RoleController {

    public getAllRoles =   async (req: Request, res: Response): Promise<void> =>{

        const roles = await Role.find();

        res.send(roles)

    }
}