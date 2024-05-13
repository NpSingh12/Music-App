const express = require("express");
const router = express.Router();
const { User, validate } = require("../models/user.js");
const bcrypt = require("bcrypt");
const admin = require("../middleware/admin.js");
const auth = require("../middleware/auth.js");
const validateObjectId = require("../middleware/validObjectid.js");

// Create a new user
router.post("/", async (req, res) => {
  try {
    const { error } = validate(req.body);
    if (error)
      return res.status(400).send({ message: error.details[0].message });

    let user = await User.findOne({ email: req.body.email });
    if (user) return res.status(400).send({ message: "User already exists." });

    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    user = new User({
      ...req.body,
      password: hashedPassword,
    });
    await user.save();

    user.password = undefined;
    user.__v = undefined;

    res.status(201).send({ data: user, message: "User created successfully." });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).send({ message: "Internal server error." });
  }
});

// Get all users (requires admin access)
router.get("/", admin, async (req, res) => {
  try {
    const users = await User.find().select("-password -__v");
    res.status(200).send({ data: users });
  } catch (error) {
    console.error("Error getting all users:", error);
    res.status(500).send({ message: "Internal server error." });
  }
});

// Get user by ID (requires authentication)
router.get("/:id", [validateObjectId, auth], async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password -__v");
    if (!user) return res.status(404).send({ message: "User not found." });
    res.status(200).send({ data: user });
  } catch (error) {
    console.error("Error getting user by ID:", error);
    res.status(500).send({ message: "Internal server error." });
  }
});

// Update user by ID (requires authentication)
router.put("/:id", [validateObjectId, auth], async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).select("-password -__v");
    if (!user) return res.status(404).send({ message: "User not found." });
    res
      .status(200)
      .send({ data: user, message: "Profile updated successfully." });
  } catch (error) {
    console.error("Error updating user by ID:", error);
    res.status(500).send({ message: "Internal server error." });
  }
});

// Delete user by ID (requires admin access)
router.delete("/:id", [validateObjectId, admin], async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).send({ message: "User not found." });
    res.status(200).send({ message: "Successfully deleted user." });
  } catch (error) {
    console.error("Error deleting user by ID:", error);
    res.status(500).send({ message: "Internal server error." });
  }
});

module.exports = router;
