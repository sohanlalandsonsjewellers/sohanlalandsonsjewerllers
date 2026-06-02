import   {Router} from "express";
import UserController from "../controller/UserController.js";
import authMiddleware from "../middleware/AuthMiddleware.js";
import { verifyAdmin } from "../middleware/AdminMiddleware.js";

const router = Router();

router.get("/getUsers/:id", authMiddleware,verifyAdmin, UserController.getUserById)
router.get("/getUsers", authMiddleware, verifyAdmin, UserController.getAllUsers)
router.put("/updateUser/:id", authMiddleware, UserController.updateUser);
router.delete("/deleteUser/:id", authMiddleware, verifyAdmin, UserController.deleteUser);
router.get("/profile", authMiddleware, UserController.getProfile);
export default router;