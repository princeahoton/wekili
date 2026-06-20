'use strict';
const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/authAdmin');
const c       = require('../controllers/adminController');

router.get('/stats',                 auth, c.getStats);

router.get('/users',                 auth, c.getUsers);
router.get('/users/:id',             auth, c.getUserDetail);
router.patch('/users/:id/role',      auth, c.updateUserRole);
router.delete('/users/:id',          auth, c.deleteUser);

router.get('/bourses',               auth, c.getBourses);
router.post('/bourses',              auth, c.createBourse);
router.patch('/bourses/:id',         auth, c.updateBourse);
router.delete('/bourses/:id',        auth, c.deleteBourse);

router.get('/universities',          auth, c.getUniversities);
router.post('/universities',         auth, c.createUniversity);
router.patch('/universities/:id',    auth, c.updateUniversity);
router.delete('/universities/:id',   auth, c.deleteUniversity);

module.exports = router;
