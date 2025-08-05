// Community Routes
// Registers community endpoints
import { FastifyInstance } from 'fastify';
import { CommunityController } from './community.controller';

export async function communityRoutes(app: FastifyInstance) {
  const controller = new CommunityController();
  // Get collections
  app.get('/api/public/collections', controller.getCollections);
  // Add collection
  app.post('/api/admin/collections', controller.addCollection);
}
