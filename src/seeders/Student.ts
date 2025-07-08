import { Role } from "../models/users/Role"
import { User } from "../models/users/User"

const seedStudents = async () => {

[
    {
      name: "Ahmed Hassan",
      email: "ahmed.hassan@email.com",
      phone: "+1 (416) 555-0123",
      location: "Toronto, ON",
    },
    {
      name: "Maria Rodriguez",
      email: "maria.rodriguez@email.com",
      phone: "+1 (604) 555-0456",
      location: "Vancouver, BC",
    },
    {
      name: "Preet Singh",
      email: "preet.singh@email.com",
      phone: "+1 (613) 555-0789",
      location: "Ottawa, ON",
    },
  ].map(async (user)=>{
   const role = await Role.findOne({ name: "student" })
   if (!role) {
          await new Role({ name: "student", description: "Student role" }).save()
      }
  
      // create Student user if not exists
      const StudentUser = await User.findOne({ email: user.email})
      if (!StudentUser) {
          const CreateUser = new User({
              ...user,
              password: "123456",
              role: role?._id,
          })
          await CreateUser.save()
      }

    })

}

export default seedStudents;