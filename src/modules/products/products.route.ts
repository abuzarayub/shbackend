// Products Routes
// Registers unified products table endpoints
import { FastifyInstance } from "fastify";
import { ProductsController } from "./products.controller";
import { authenticate } from "../../middleware/autheticate";

export async function productsRoutes(app: FastifyInstance) {
  const controller = new ProductsController();

  // Apply authentication to all products routes
  app.addHook("preHandler", authenticate);

  // Get a single product by ID
  app.get("/:id", controller.getProduct.bind(controller));

  // Get all products (with optional filtering)
  app.get("/", controller.getProducts.bind(controller));
}
