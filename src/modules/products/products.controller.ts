// Products Controller
// Handles unified products table endpoints
import { FastifyRequest, FastifyReply } from "fastify";
import { getSupabaseClient } from "../../utils/SupaBase";
import { logger } from "../../utils/Logger";

export class ProductsController {
  // Get a single product by ID
  async getProduct(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const user = (req as any).user;

      logger.info({ userId: user?.id, productId: id }, "Get product request");

      const supabase = await getSupabaseClient(
        req.headers.authorization?.replace("Bearer ", "") || ""
      );

      const { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          platform_users!products_instructor_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `
        )
        .eq("id", id)
        .single();

      if (error) {
        logger.error({ error, productId: id }, "Failed to fetch product");
        return res.status(404).send({ error: "Product not found" });
      }

      // Transform the data to match frontend expectations
      const transformedProduct = {
        id: data.id,
        name: data.name,
        title: data.name, // For backward compatibility
        description: data.description,
        thumbnail_url: data.thumbnail_url,
        image: data.thumbnail_url, // For backward compatibility
        price: data.price,
        original_price: data.original_price,
        type: data.type,
        instructor_id: data.instructor_id,
        rating: data.rating,
        reviews_count: data.reviews_count,
        students_count: data.students_count,
        member_count: data.member_count,
        post_count: data.post_count,
        duration: data.duration,
        level: data.level,
        units_count: data.units_count,
        session_type: data.session_type,
        max_participants: data.max_participants,
        current_participants: data.current_participants,
        billing_cycle: data.billing_cycle,
        status: data.status,
        created_at: data.created_at,
        updated_at: data.updated_at,
        instructor: data.platform_users
          ? {
              id: data.platform_users.id,
              full_name: data.platform_users.full_name,
              avatar_url: data.platform_users.avatar_url,
            }
          : null,
      };

      logger.info({ productId: id }, "Product fetched successfully");
      res.send(transformedProduct);
    } catch (err) {
      logger.error({ err }, "Failed to get product");
      res.status(500).send({ error: "Internal server error" });
    }
  }

  // Get all products (with optional filtering)
  async getProducts(req: FastifyRequest, res: FastifyReply) {
    try {
      const { type, status, search } = req.query as {
        type?: string;
        status?: string;
        search?: string;
      };
      const user = (req as any).user;

      logger.info(
        { userId: user?.id, type, status, search },
        "Get products request"
      );

      const supabase = await getSupabaseClient(
        req.headers.authorization?.replace("Bearer ", "") || ""
      );

      let query = supabase
        .from("products")
        .select(
          `
          *,
          platform_users!products_instructor_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `
        )
        .order("created_at", { ascending: false });

      // Apply filters
      if (type) {
        query = query.eq("type", type);
      }
      if (status) {
        query = query.eq("status", status);
      }
      if (search) {
        query = query.ilike("name", `%${search}%`);
      }

      const { data, error } = await query;

      if (error) {
        logger.error({ error }, "Failed to fetch products");
        return res.status(500).send({ error: "Failed to fetch products" });
      }

      // Transform the data to match frontend expectations
      const transformedProducts =
        data?.map((product) => ({
          id: product.id,
          name: product.name,
          title: product.name, // For backward compatibility
          description: product.description,
          thumbnail_url: product.thumbnail_url,
          image: product.thumbnail_url, // For backward compatibility
          price: product.price,
          original_price: product.original_price,
          type: product.type,
          instructor_id: product.instructor_id,
          rating: product.rating,
          reviews_count: product.reviews_count,
          students_count: product.students_count,
          member_count: product.member_count,
          post_count: product.post_count,
          duration: product.duration,
          level: product.level,
          units_count: product.units_count,
          session_type: product.session_type,
          max_participants: product.max_participants,
          current_participants: product.current_participants,
          billing_cycle: product.billing_cycle,
          status: product.status,
          created_at: product.created_at,
          updated_at: product.updated_at,
          instructor: product.platform_users
            ? {
                id: product.platform_users.id,
                full_name: product.platform_users.full_name,
                avatar_url: product.platform_users.avatar_url,
              }
            : null,
        })) || [];

      logger.info(
        { count: transformedProducts.length },
        "Products fetched successfully"
      );
      res.send(transformedProducts);
    } catch (err) {
      logger.error({ err }, "Failed to get products");
      res.status(500).send({ error: "Internal server error" });
    }
  }
}
