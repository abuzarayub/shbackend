/**
 * School routes: CRUD endpoints for schools.
 * - POST   /api/schools         Create school
 * - GET    /api/schools         List all schools
 * - GET    /api/schools/:id     Get school by ID
 * - PATCH  /api/schools/:id     Update school
 * - DELETE /api/schools/:id     Delete school
 */
import { FastifyInstance } from "fastify";
import { authenticate } from "../../middleware/autheticate";
import {
  createSchoolController,
  getSchoolController,
  updateSchoolController,
  deleteSchoolController,
  listSchoolsController,
} from "./school.controller";

export async function schoolRoutes(fastify: FastifyInstance) {
  fastify.post("/", { preHandler: [authenticate] }, createSchoolController);
  fastify.get("/", { preHandler: [authenticate] }, listSchoolsController);
  fastify.get("/:id", { preHandler: [authenticate] }, getSchoolController);
  fastify.patch("/:id", { preHandler: [authenticate] }, updateSchoolController);
  fastify.delete(
    "/:id",
    { preHandler: [authenticate] },
    deleteSchoolController
  );
}
