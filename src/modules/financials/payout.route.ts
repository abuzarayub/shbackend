// Payout Routes
// Registers instructor payout endpoints
import { FastifyInstance } from 'fastify';
import { PayoutController } from './payout.controller';

export async function payoutRoutes(app: FastifyInstance) {
  const controller = new PayoutController();
  // Create an instructor payout
  app.post('/api/admin/instructor-payouts', controller.createPayout);
  // Get instructor payouts
  app.get('/api/admin/instructor-payouts', controller.getPayouts);
}
