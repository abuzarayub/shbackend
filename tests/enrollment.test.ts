import { app } from "../src/app";
import supertest from "supertest";

describe("Enrollment API", () => {
  it("should enroll a user in a product", async () => {
    // Replace with valid test user and product IDs
    const testUserId = "test-user-id";
    const testProductId = "test-product-id";
    const response = await supertest(app.server)
      .post("/api/client/enrollments")
      .send({ user_id: testUserId, product_id: testProductId })
      .expect(200);
    expect(response.body).toHaveProperty("user_id", testUserId);
    expect(response.body).toHaveProperty("product_id", testProductId);
    expect(response.body).toHaveProperty("status");
  });
});
