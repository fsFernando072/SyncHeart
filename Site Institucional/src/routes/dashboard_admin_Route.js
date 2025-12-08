const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboard_admin_Controller");
const auth = require("../middleware/authMiddleware");

// Resumo da dashboard admin
router.get('/resumo', auth.verificarAdminClinica, dashboardController.resumo);

module.exports = router;