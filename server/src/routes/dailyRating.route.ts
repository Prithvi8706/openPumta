import express from 'express';
import passport from '../config/passport.js';
import {
  createOrUpdateDailyRating,
  getDailyRatingStats,
} from '../controllers/dailyRating.controller.js';

const router = express.Router();

router.use(passport.authenticate('jwt', { session: false }));

router.post('/', createOrUpdateDailyRating);
router.get('/stats', getDailyRatingStats);

export default router;
