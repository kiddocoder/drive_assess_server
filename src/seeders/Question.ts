import { Category } from "../models/Category"
import { Question } from "../models/Question"


const seedQuestions =  async  () =>{

[
    {
      question: "What does a red octagonal sign mean?",
      category: "Road Signs",
      difficulty: "easy",
      options: ["Yield", "Stop", "Caution", "No Entry"],
      correctAnswer: 0,
      explanation: "A red octagonal sign always means STOP. You must come to a complete stop.",
    },
    {
      question: "When merging onto a highway, you should:",
      category: "Traffic Rules",
      difficulty: "medium",
      options: [
        "Stop and wait for a gap",
        "Match the speed of traffic",
        "Drive slowly until you find a gap",
        "Force your way into traffic",
      ],
      correctAnswer: 0,
      explanation: "When merging, you should match the speed of highway traffic to merge safely.",
    },
  ].map(async (question) => {

    const existingQuestion = await Question.findOne({question:question.question})
    // if(!existingQuestion){
    //    const newQuestion =  new Question(question)
    //    newQuestion.category = await Category.findOne({name:"Road Signs & Signals"}).
    // }
  

  })
}

export default seedQuestions;