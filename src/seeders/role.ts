// role seeder

import { Role } from "../models/users/Role"

const seedRoles = async () => {
    [
        { name: "admin", description: "Admin role" },
        {name:"manager",description:"Manager role"},
        { name: "instructor", description: "Instructor role" },
        {name:"user",description:"User role"},
        { name: "student", description: "Student role" },
    ].map(async (role) => {
        const existingRole = await Role.findOne({ name: role.name })
        if (!existingRole) {
            const newRole = new Role(role)
            await newRole.save()
        }
    })
}

export default seedRoles;