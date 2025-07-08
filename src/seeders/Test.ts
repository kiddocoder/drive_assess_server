import { Test } from "../models/Test"


const seedTests = async () => {
[
    {
      title: "G1 Knowledge Test - Road Signs",
      timeLimit: 30,
      maxAttempts: 2,
      attempts:2,
      passRate: 89.5,
      status: "active",
    },
    {
      title: "G2 Road Test Preparation",
      timeLimit: 45,
      maxAttempts: 5,
      attempts:2,
      passRate: 76.8,
      status: "active",
    },
    {
      title: "Defensive Driving Techniques",
      timeLimit: 35,
      maxAttempts: 5,
      attempts:2,
      passRate: 92.1,
      status: "draft",
    },
  ].map(async (test)=>{
      const existingTest = await Test.findOne({ title: test.title })
      if (!existingTest) {
          const newTest = new Test(test)
          await newTest.save()
      }
    })

}

export default seedTests;