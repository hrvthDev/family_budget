const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware.js")
const {createFamily, listFamilies, listMembers, addMember, removeMember} = require("../controllers/familyController.js");



router.post("/create", authMiddleware, createFamily);
router.get("/", authMiddleware, listFamilies );
router.get("/:familyId/members", authMiddleware, listMembers);
router.post("/:familyId/members", authMiddleware, addMember);
router.delete("/:familyId/members/:userId", authMiddleware, removeMember);

module.exports = router;
