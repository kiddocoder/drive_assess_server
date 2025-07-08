// seeder for users

import { User } from "../models/users/User"
import { Role } from "../models/users/Role"

const seedUsers = async () => {

     const role = await Role.findOne({ name: "admin" })
    if (!role) {
        await new Role({ name: "admin", description: "Admin role" }).save()
    }

    // create admin user if not exists
    const adminUser = await User.findOne({ email: "tresorkiddo@gmail.com" })
    if (!adminUser) {
        const adminUser = new User({
            name: "Kiki admin",
            email: "tresorkiddo@gmail.com",
            password: "admin123",
            role: role?._id,
        })
        await adminUser.save()
    }
}

export default seedUsers