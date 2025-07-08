import { Category } from "../models/Category"


const seedCategories = async () => {
   [
    {
      name: "Road Signs & Signals",
      description: "Learn about traffic signs, signals, and road markings used across Canada",
      icon: "🚦",
    },
    {
      name: "Traffic Rules & Regulations",
      description: "Understanding Canadian traffic laws and driving regulations",
      icon: "📋",
    },
    {
      name: "Defensive Driving",
      description: "Safe driving techniques and hazard awareness",
      icon: "🛡️",
    },
    {
      name: "Parking & Positioning",
      description: "Proper parking techniques and vehicle positioning",
      icon: "🅿️",
    },
    {
      name: "Winter Driving",
      description: "Special considerations for Canadian winter conditions",
      icon: "❄️",
    },
  ].map(async (category)=>{
    const existingCategory = await Category.findOne({ name: category.name })
    if (!existingCategory) {
        const newCategory = new Category(category)
        await newCategory.save()
    }
  })
}

export default seedCategories