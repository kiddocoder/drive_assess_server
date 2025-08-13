import { Router } from "express"
import { authenticateToken } from "../middleware/auth.middleware";

const router:Router = Router() as Router;

// router to seve assets files. 
router.get("/:file_name",authenticateToken,(req, res) => {
  
const fileName = req.params.file_name
  const filePath = `./assets/${fileName}`
  res.sendFile(filePath, { root: "./" }, (err) => {
    if (err) {
        console.log(err)
      res.status(404).json({
        success: false,
        message: "File not found",
      })
    }
  })

})
export default router