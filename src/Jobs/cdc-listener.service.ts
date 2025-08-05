// CDC Listener Service
// Listens to Supabase CDC events and triggers business logic
import { publishToQueue } from "../utils/rabbitmqClient";

export class CDCListenerService {
  // Connect to Supabase Realtime/CDC and listen for changes
  async listen() {
    // TODO: Replace with actual Supabase Realtime connection
    // Example: On change, publish job to appropriate RabbitMQ queue
    // await publishToQueue('notification_queue', { ... });
    // await publishToQueue('search_indexing_queue', { ... });
    throw new Error("CDC connection not implemented");
  }
}
