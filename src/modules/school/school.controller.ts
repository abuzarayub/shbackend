/**
 * School controller: handles HTTP endpoints for school CRUD.
 */
import { FastifyRequest, FastifyReply } from "fastify";
import { SchoolService } from "./school.Service";
import { createSchoolSchema, updateSchoolSchema } from "./school.Schema";
import { ZodError } from "zod";
import { logger } from "../../utils/Logger";

/**
 * POST /api/schools
 * Create a new school.
 */
export const createSchoolController = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { name } = createSchoolSchema.parse(request.body);
    const school = await SchoolService.createSchool(name);
    return reply.code(201).send({ message: "School created", school });
  } catch (err: any) {
    logger.error(err, "Create school failed");
    if (err instanceof ZodError) {
      return reply.status(400).send({ error: err.issues[0].message });
    }
    return reply.status(400).send({ error: err.message || "Invalid request" });
  }
};

/**
 * GET /api/schools/:id
 * Get a school by ID.
 */
export const getSchoolController = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params as { id: string };
    const school = await SchoolService.getSchool(id);
    return reply.send(school);
  } catch (err: any) {
    logger.error(err, "Get school failed");
    return reply.status(404).send({ error: err.message || "School not found" });
  }
};

/**
 * PATCH /api/schools/:id
 * Update a school by ID.
 */
export const updateSchoolController = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params as { id: string };
    const updates = updateSchoolSchema.parse(request.body);
    const school = await SchoolService.updateSchool(id, updates);
    return reply.send({ message: "School updated", school });
  } catch (err: any) {
    logger.error(err, "Update school failed");
    if (err instanceof ZodError) {
      return reply.status(400).send({ error: err.issues[0].message });
    }
    return reply.status(400).send({ error: err.message || "Invalid request" });
  }
};

/**
 * DELETE /api/schools/:id
 * Delete a school by ID.
 */
export const deleteSchoolController = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params as { id: string };
    await SchoolService.deleteSchool(id);
    return reply.send({ message: "School deleted" });
  } catch (err: any) {
    logger.error(err, "Delete school failed");
    return reply.status(400).send({ error: err.message || "Invalid request" });
  }
};

/**
 * GET /api/schools
 * List all schools.
 */
export const listSchoolsController = async (
  _request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const schools = await SchoolService.listSchools();
    return reply.send(schools);
  } catch (err: any) {
    logger.error(err, "List schools failed");
    return reply.status(400).send({ error: err.message || "Invalid request" });
  }
};
