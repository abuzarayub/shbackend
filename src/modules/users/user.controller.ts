// User Controller
// Handles user management endpoints
import { getRabbitChannel } from "../../utils/rabbitmq";
import { getSupabaseAdminClient } from "../../utils/SupaBase";
import { UserService } from "./user.service";
import { FastifyRequest, FastifyReply } from "fastify";
import {
  AuthenticatedRequest,
  AuthenticatedReply,
  InstructorMap,
  OwnerMap,
  LearningProgress,
  LearningStats,
  ContentInProgress,
} from "../../common/types";

const userService = new UserService();

export class UserController {
  // Get user profile endpoint
  async getProfile(req: FastifyRequest, res: FastifyReply) {
    try {
      debugger; // Debugger for manual inspection
      const userId = (req as any).user?.id || (req.params as any).userId;
      const profile = await userService.getProfile(userId);
      res.send(profile);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("getProfile error:", err); // Log the error for debugging
      res
        .status(500)
        .send({ error: "Failed to get profile", details: message });
    }
  }
  // Update user profile endpoint
  async updateProfile(req: FastifyRequest, res: FastifyReply) {
    try {
      const userId = (req as any).user?.id || (req.params as any).userId;
      const data = req.body;
      await userService.updateProfile(userId, data);
      res.send({ status: "updated" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res
        .status(500)
        .send({ error: "Failed to update profile", details: message });
    }
  }

  // Student dashboard endpoint
  async getStudentDashboard(req: FastifyRequest, res: FastifyReply) {
    try {
      const userId = (req as any).user?.id;
      const supabase = await getSupabaseAdminClient();
      // Fetch enrollments for the user
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from("enrollments")
        .select("status")
        .eq("user_id", userId);
      if (enrollmentsError) {
        console.error("Supabase enrollments error:", enrollmentsError);
        throw new Error(enrollmentsError.message);
      }
      const enrollmentsArr = enrollments || [];
      const inProgressCount = enrollmentsArr.filter(
        (e) => e.status !== "COMPLETED"
      ).length;
      const completedCount = enrollmentsArr.filter(
        (e) => e.status === "COMPLETED"
      ).length;
      // Fetch certificates for the user
      const { data: certificates, error: certError } = await supabase
        .from("certificates")
        .select("id")
        .eq("user_id", userId);
      if (certError) {
        console.error("Supabase certificates error:", certError);
        throw new Error(certError.message);
      }
      const certificatesArr = certificates || [];
      // Fetch badges for the user
      const { data: badges, error: badgeError } = await supabase
        .from("badges")
        .select("id")
        .eq("user_id", userId);
      if (badgeError) {
        console.error("Supabase badges error:", badgeError);
        throw new Error(badgeError.message);
      }
      const badgesArr = badges || [];
      // Fetch minutes watched (from progress table)
      let minutesWatched = 0;
      try {
        const { data: progress, error: progressError } = await supabase
          .from("progress")
          .select("progress")
          .eq("user_id", userId);
        if (progressError) {
          if (
            progressError.message.includes(
              'relation "public.progress" does not exist'
            )
          ) {
            console.warn(
              "Progress table does not exist, setting minutesWatched to 0"
            );
          } else {
            console.error("Supabase progress error:", progressError);
            throw new Error(progressError.message);
          }
        } else {
          const progressArr = progress || [];
          minutesWatched = progressArr.reduce(
            (sum, p) => sum + Number(p.progress || 0),
            0
          );
        }
      } catch (progressCatchErr) {
        console.warn(
          "Progress table missing or error, minutesWatched set to 0"
        );
      }
      res.send({
        inProgressCount,
        inProgressPercent: 0,
        inProgressTotal: inProgressCount,
        completedCount,
        completedPercent: 0,
        completedTotal: completedCount,
        reviewsLeft: 0,
        reviewsPercent: 0,
        reviewsTotal: 0,
        badgesCount: badgesArr.length,
        badgesPercent: 0,
        badgesTotal: badgesArr.length,
        minutesWatched,
        minutesPercent: 0,
        minutesTotal: minutesWatched,
        commentsCount: 0,
        commentsPercent: 0,
        commentsTotal: 0,
        certificatesCount: certificatesArr.length,
        certificatesPercent: 0,
        certificatesTotal: certificatesArr.length,
        spent: 0,
        spentPercent: 0,
        spentTotal: 0,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("getStudentDashboard error:", err);
      res
        .status(500)
        .send({ error: "Failed to get dashboard", details: message });
    }
  }

  // Certificates endpoint
  async getCertificates(req: FastifyRequest, res: FastifyReply) {
    try {
      const userId = (req as any).user?.id;
      const supabase = await getSupabaseAdminClient();
      const { data: certificates, error } = await supabase
        .from("certificates")
        .select("id, title, issueddate, image")
        .eq("user_id", userId);
      if (error) {
        console.error("Supabase certificates error:", error);
        throw new Error(error.message);
      }
      res.send({ certificates: certificates || [] });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("getCertificates error:", err);
      res
        .status(500)
        .send({ error: "Failed to get certificates", details: message });
    }
  }

  // Achievements endpoint
  async getAchievements(req: FastifyRequest, res: FastifyReply) {
    try {
      const userId = (req as any).user?.id;
      const supabase = await getSupabaseAdminClient();
      const { data: achievements, error } = await supabase
        .from("achievements")
        .select("id, title, description, iconcolor")
        .eq("user_id", userId);
      if (error) {
        console.error("Supabase achievements error:", error);
        throw new Error(error.message);
      }
      res.send({ achievements: achievements || [] });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("getAchievements error:", err);
      res
        .status(500)
        .send({ error: "Failed to get achievements", details: message });
    }
  }

  // In-progress content endpoint
  async getInProgressContent(req: FastifyRequest, res: FastifyReply) {
    try {
      const userId = (req as any).user?.id;
      const supabase = await getSupabaseAdminClient();
      // Fetch enrollments for the user
      const { data: enrollments, error } = await supabase
        .from("enrollments")
        .select("*")
        .eq("user_id", userId);
      if (error) {
        console.error("Supabase enrollments error:", error);
        throw new Error(error.message);
      }
      const enrollmentsArr = enrollments || [];
      // If there are no enrollments, return empty arrays
      if (enrollmentsArr.length === 0) {
        return res.send({ inProgress: [], completed: [] });
      }
      // Fetch all course_ids
      const courseIds = enrollmentsArr.map((e) => e.course_id).filter(Boolean);
      let coursesMap: Record<string, any> = {};
      if (courseIds.length > 0) {
        const { data: courses, error: coursesError } = await supabase
          .from("courses")
          .select("id, title, thumbnail_url")
          .in("id", courseIds);
        if (coursesError) {
          console.error("Supabase courses error:", coursesError);
        } else {
          coursesMap = Object.fromEntries(
            (courses || []).map((c) => [c.id, c])
          );
        }
      }
      // Separate in-progress and completed
      const inProgress = [];
      const completed = [];
      for (const enr of enrollmentsArr) {
        const course = coursesMap[enr.course_id];
        if (!course) continue;
        const content = {
          id: course.id,
          category: "Course",
          title: course.title,
          progress: enr.status === "COMPLETED" ? 100 : 50,
          lastActivity: enr.updated_at || "-",
          image: course.thumbnail_url,
          svg: "course",
          textColor: "text-blue-600",
          bgColor: "bg-blue-100",
        };
        if (enr.status === "COMPLETED") completed.push(content);
        else inProgress.push(content);
      }
      res.send({ inProgress, completed });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("getInProgressContent error:", err);
      res
        .status(500)
        .send({ error: "Failed to get in-progress content", details: message });
    }
  }

  // Reminders endpoint
  async getReminders(req: FastifyRequest, res: FastifyReply) {
    try {
      const userId = (req as any).user?.id;
      const supabase = await getSupabaseAdminClient();
      const { data: remindersRow, error } = await supabase
        .from("reminders")
        .select("reminders")
        .eq("user_id", userId)
        .single();
      if (error && error.code !== "PGRST116") {
        if (error && error.code !== "PGRST116") {
          console.error("Supabase reminders error:", error);
        }
        throw new Error(error.message);
      }
      const reminders = remindersRow?.reminders || {
        M: { active: true, time: "7:15 PM" },
        T: { active: false, time: "" },
        W: { active: true, time: "3:30 PM" },
        Th: { active: false, time: "" },
        F: { active: true, time: "2:00 PM" },
        S: { active: false, time: "" },
        Su: { active: true, time: "7:15 PM" },
      };
      res.send({ reminders });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("getReminders error:", err);
      res
        .status(500)
        .send({ error: "Failed to get reminders", details: message });
    }
  }

  async updateReminders(req: FastifyRequest, res: FastifyReply) {
    try {
      const userId = (req as any).user?.id;
      const { reminders } = req.body as any;
      const supabase = await getSupabaseAdminClient();

      // Upsert reminders for the user
      const { error } = await supabase.from("reminders").upsert({
        user_id: userId,
        reminders,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Supabase reminders update error:", error);
        throw new Error(error.message);
      }

      res.send({ status: "updated" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("updateReminders error:", err);
      res
        .status(500)
        .send({ error: "Failed to update reminders", details: message });
    }
  }

  // Explore Courses endpoint
  async getExploreCourses(req: FastifyRequest, res: FastifyReply) {
    try {
      const supabase = await getSupabaseAdminClient();

      // Fetch trending courses
      const { data: courses, error } = await supabase
        .from("courses")
        .select(
          `
          id,
          title,
          description,
          thumbnail_url,
          price,
          original_price,
          rating,
          reviews_count,
          students_count,
          duration,
          level,
          units_count,
          status
        `
        )
        .eq("status", "published")
        .order("students_count", { ascending: false })
        .limit(8);

      if (error) {
        console.error("Supabase courses error:", error);
        throw new Error(error.message);
      }

      // Get instructor information using the course_instructors junction table
      const courseIds = (courses || []).map((c) => c.id);
      let instructorMap: InstructorMap = {};

      if (courseIds.length > 0) {
        // First get course-instructor relationships
        const { data: courseInstructors, error: ciError } = await supabase
          .from("course_instructors")
          .select("course_id, instructor_id")
          .in("course_id", courseIds);

        if (!ciError && courseInstructors) {
          // Get unique instructor IDs
          const instructorIds = [
            ...new Set(courseInstructors.map((ci) => ci.instructor_id)),
          ];

          // Get instructor details
          const { data: instructors, error: instructorError } = await supabase
            .from("platform_users")
            .select("id, full_name, avatar_url")
            .in("id", instructorIds);

          if (!instructorError && instructors) {
            // Create a map of course_id to instructor
            courseInstructors.forEach((ci) => {
              const instructor = instructors.find(
                (i) => i.id === ci.instructor_id
              );
              if (instructor) {
                instructorMap[ci.course_id] = instructor;
              }
            });
          }
        }
      }

      const formattedCourses = (courses || []).map((course) => {
        const instructor = instructorMap[course.id];
        return {
          id: course.id,
          title: course.title,
          author: instructor?.full_name || "Unknown Instructor",
          image: course.thumbnail_url || "https://i.ibb.co/jJ4GHXP/img1.jpg",
          type: "course",
          students: course.students_count
            ? `${(course.students_count / 1000).toFixed(0)}K`
            : "0",
          duration: course.duration || "2h",
          units: course.units_count || 12,
          level: course.level || "Beginner",
          currentPrice: course.price ? `$${course.price}` : "$0",
          originalPrice: course.original_price
            ? `$${course.original_price}`
            : "$0",
          rating: course.rating || 4.5,
          reviews: course.reviews_count || 0,
          points: [
            {
              text:
                course.description?.substring(0, 100) + "..." ||
                "Learn valuable skills",
            },
            { text: "Practical exercises and real-world applications" },
            { text: "Certificate upon completion" },
          ],
        };
      });

      res.send(formattedCourses);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("getExploreCourses error:", err);
      res
        .status(500)
        .send({ error: "Failed to get explore courses", details: message });
    }
  }

  // Explore Sessions endpoint
  async getExploreSessions(req: FastifyRequest, res: FastifyReply) {
    try {
      const supabase = await getSupabaseAdminClient();

      // Fetch trending sessions
      const { data: sessions, error } = await supabase
        .from("sessions")
        .select(
          `
          id,
          title,
          description,
          thumbnail_url,
          price,
          session_type,
          max_participants,
          current_participants,
          rating,
          reviews_count,
          instructor:platform_users!sessions_instructor_id_fkey(
            id,
            full_name,
            avatar_url
          )
        `
        )
        .eq("status", "active")
        .order("current_participants", { ascending: false })
        .limit(8);

      if (error) {
        console.error("Supabase sessions error:", error);
        throw new Error(error.message);
      }

      const formattedSessions = (sessions || []).map((session) => ({
        title: session.title,
        img: session.thumbnail_url || "https://i.ibb.co/jJ4GHXP/img1.jpg",
        instructorimg:
          (session.instructor as any)?.avatar_url ||
          "https://i.ibb.co/jJ4GHXP/img1.jpg",
        instructor:
          (session.instructor as any)?.full_name || "Unknown Instructor",
        content:
          session.description?.substring(0, 150) + "..." ||
          "Join this interactive session",
        rating: session.rating?.toFixed(1) || "4.5",
        reviews: session.reviews_count
          ? `${(session.reviews_count / 1000).toFixed(1)}k`
          : "0",
        students: session.current_participants
          ? `${(session.current_participants / 1000).toFixed(0)}k`
          : "0",
        duration: session.session_type === "1on1" ? "1on1" : "Group",
      }));

      res.send(formattedSessions);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("getExploreSessions error:", err);
      res
        .status(500)
        .send({ error: "Failed to get explore sessions", details: message });
    }
  }

  // Explore Communities endpoint
  async getExploreCommunities(req: FastifyRequest, res: FastifyReply) {
    try {
      const supabase = await getSupabaseAdminClient();

      // Fetch trending communities without foreign key join
      const { data: communities, error } = await supabase
        .from("communities")
        .select(
          `
          id,
          name,
          description,
          thumbnail_url,
          price,
          member_count,
          post_count,
          owner_id
        `
        )
        .eq("status", "active")
        .order("member_count", { ascending: false })
        .limit(8);

      if (error) {
        console.error("Supabase communities error:", error);
        throw new Error(error.message);
      }

      // Get owner information separately
      const ownerIds = [
        ...new Set((communities || []).map((c) => c.owner_id).filter(Boolean)),
      ];
      let ownerMap: OwnerMap = {};

      if (ownerIds.length > 0) {
        const { data: owners, error: ownerError } = await supabase
          .from("platform_users")
          .select("id, full_name, avatar_url")
          .in("id", ownerIds);

        if (!ownerError && owners) {
          ownerMap = owners.reduce((acc: OwnerMap, owner: any) => {
            acc[owner.id] = owner;
            return acc;
          }, {} as OwnerMap);
        }
      }

      const formattedCommunities = (communities || []).map((community) => {
        const owner = ownerMap[community.owner_id];
        return {
          title: community.name,
          img: community.thumbnail_url || "https://i.ibb.co/jJ4GHXP/img1.jpg",
          instructorimg:
            owner?.avatar_url || "https://i.ibb.co/jJ4GHXP/img1.jpg",
          instructor: owner?.full_name || "Community Owner",
          position: "Community Leader",
          content:
            community.description?.substring(0, 150) + "..." ||
            "Join our vibrant community",
          duration: community.price ? `$${community.price}` : "Free",
          members: community.member_count
            ? `${(community.member_count / 1000).toFixed(1)}k`
            : "0",
          likes: community.post_count
            ? `${(community.post_count / 1000).toFixed(1)}k`
            : "0",
        };
      });

      res.send(formattedCommunities);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("getExploreCommunities error:", err);
      res
        .status(500)
        .send({ error: "Failed to get explore communities", details: message });
    }
  }

  // Explore Instructors endpoint
  async getExploreInstructors(req: FastifyRequest, res: FastifyReply) {
    try {
      const supabase = await getSupabaseAdminClient();

      // Fetch popular instructors with their stats
      const { data: instructors, error } = await supabase
        .from("platform_users")
        .select(
          `
          id,
          full_name,
          avatar_url,
          role
        `
        )
        .eq("role", "instructor")
        .limit(8);

      if (error) {
        console.error("Supabase instructors error:", error);
        throw new Error(error.message);
      }

      const formattedInstructors = await Promise.all(
        (instructors || []).map(async (instructor) => {
          // Get instructor stats
          const { data: courses } = await supabase
            .from("courses")
            .select("id, title, thumbnail_url")
            .eq("instructor_id", instructor.id)
            .limit(3);

          const { data: sessions } = await supabase
            .from("sessions")
            .select("id")
            .eq("instructor_id", instructor.id);

          const { data: enrollments } = await supabase
            .from("enrollments")
            .select("id")
            .eq("instructor_id", instructor.id);

          return {
            name: instructor.full_name,
            role: "Instructor",
            image: instructor.avatar_url || "https://i.ibb.co/jJ4GHXP/img1.jpg",
            stats: {
              rating: `${courses?.length || 0} Instructor Rating`,
              reviews: `${courses?.length || 0} Reviews`,
              sessions: `${sessions?.length || 0} Sessions`,
              courses: `${courses?.length || 0} Courses`,
            },
            highlights: (courses || []).map((course) => ({
              title: course.title,
              img: course.thumbnail_url || "https://i.ibb.co/jJ4GHXP/img1.jpg",
            })),
            profile: {
              studentsEnrolled: enrollments?.length
                ? `${(enrollments.length / 1000).toFixed(0)}K`
                : "0",
            },
          };
        })
      );

      res.send(formattedInstructors);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("getExploreInstructors error:", err);
      res
        .status(500)
        .send({ error: "Failed to get explore instructors", details: message });
    }
  }

  // Explore Subscriptions endpoint
  async getExploreSubscriptions(req: FastifyRequest, res: FastifyReply) {
    try {
      const supabase = await getSupabaseAdminClient();

      // Fetch popular subscriptions without foreign key join
      const { data: subscriptions, error } = await supabase
        .from("subscriptions")
        .select(
          `
          id,
          name,
          description,
          thumbnail_url,
          price,
          billing_cycle,
          member_count,
          instructor_id
        `
        )
        .eq("status", "active")
        .order("member_count", { ascending: false })
        .limit(8);

      if (error) {
        console.error("Supabase subscriptions error:", error);
        throw new Error(error.message);
      }

      // Get instructor information separately
      const instructorIds = [
        ...new Set(
          (subscriptions || []).map((s) => s.instructor_id).filter(Boolean)
        ),
      ];
      let instructorMap: InstructorMap = {};

      if (instructorIds.length > 0) {
        const { data: instructors, error: instructorError } = await supabase
          .from("platform_users")
          .select("id, full_name, avatar_url")
          .in("id", instructorIds);

        if (!instructorError && instructors) {
          instructorMap = instructors.reduce(
            (acc: InstructorMap, instructor: any) => {
              acc[instructor.id] = instructor;
              return acc;
            },
            {} as InstructorMap
          );
        }
      }

      const formattedSubscriptions = (subscriptions || []).map(
        (subscription) => {
          const instructor = instructorMap[subscription.instructor_id];
          return {
            title: subscription.name,
            img:
              subscription.thumbnail_url || "https://i.ibb.co/jJ4GHXP/img1.jpg",
            instructorimg:
              instructor?.avatar_url || "https://i.ibb.co/jJ4GHXP/img1.jpg",
            instructor: instructor?.full_name || "Subscription Owner",
            content:
              subscription.description?.substring(0, 150) + "..." ||
              "Join this exclusive subscription",
            duration: subscription.billing_cycle || "Monthly",
            members: subscription.member_count
              ? `${(subscription.member_count / 1000).toFixed(1)}k`
              : "0",
            price: subscription.price ? `$${subscription.price}` : "Free",
          };
        }
      );

      res.send(formattedSubscriptions);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("getExploreSubscriptions error:", err);
      res.status(500).send({
        error: "Failed to get explore subscriptions",
        details: message,
      });
    }
  }

  // Explore Bundles endpoint
  async getExploreBundles(req: FastifyRequest, res: FastifyReply) {
    try {
      const supabase = await getSupabaseAdminClient();

      // Fetch trending bundles without foreign key join
      const { data: bundles, error } = await supabase
        .from("bundles")
        .select(
          `
          id,
          name,
          description,
          thumbnail_url,
          price,
          original_price,
          member_count,
          instructor_id
        `
        )
        .eq("status", "active")
        .order("member_count", { ascending: false })
        .limit(8);

      if (error) {
        console.error("Supabase bundles error:", error);
        throw new Error(error.message);
      }

      // Get instructor information separately
      const instructorIds = [
        ...new Set((bundles || []).map((b) => b.instructor_id).filter(Boolean)),
      ];
      let instructorMap: InstructorMap = {};

      if (instructorIds.length > 0) {
        const { data: instructors, error: instructorError } = await supabase
          .from("platform_users")
          .select("id, full_name, avatar_url")
          .in("id", instructorIds);

        if (!instructorError && instructors) {
          instructorMap = instructors.reduce(
            (acc: InstructorMap, instructor: any) => {
              acc[instructor.id] = instructor;
              return acc;
            },
            {} as InstructorMap
          );
        }
      }

      const formattedBundles = (bundles || []).map((bundle) => {
        const instructor = instructorMap[bundle.instructor_id];
        return {
          title: bundle.name,
          img: bundle.thumbnail_url || "https://i.ibb.co/jJ4GHXP/img1.jpg",
          instructorimg:
            instructor?.avatar_url || "https://i.ibb.co/jJ4GHXP/img1.jpg",
          instructor: instructor?.full_name || "Bundle Creator",
          content:
            bundle.description?.substring(0, 150) + "..." ||
            "Comprehensive learning bundle",
          duration: "Lifetime",
          members: bundle.member_count
            ? `${(bundle.member_count / 1000).toFixed(1)}k`
            : "0",
          price: bundle.price ? `$${bundle.price}` : "Free",
          originalPrice: bundle.original_price
            ? `$${bundle.original_price}`
            : "$0",
        };
      });

      res.send(formattedBundles);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("getExploreBundles error:", err);
      res
        .status(500)
        .send({ error: "Failed to get explore bundles", details: message });
    }
  }

  // My Learning Products endpoint
  async getMyLearningProducts(req: FastifyRequest, res: FastifyReply) {
    try {
      const userId = (req as any).user?.id;
      const supabase = await getSupabaseAdminClient();

      // First, try to fetch enrollments with course details
      let { data: enrollments, error: enrollmentsError } = await supabase
        .from("enrollments")
        .select(
          `
          id,
          status,
          created_at,
          updated_at,
          course:courses(
            id,
            title,
            type,
            status,
            thumbnail_url,
            price,
            instructor:platform_users(full_name)
          )
        `
        )
        .eq("user_id", userId);

      // If the join fails, try a simpler approach
      if (enrollmentsError) {
        console.warn(
          "Enrollments join failed, trying simple query:",
          enrollmentsError
        );

        // Try to get enrollments without the join
        const { data: simpleEnrollments, error: simpleError } = await supabase
          .from("enrollments")
          .select("*")
          .eq("user_id", userId);

        if (simpleError) {
          console.error("Supabase enrollments error:", simpleError);
          throw new Error(simpleError.message);
        }

        // If we have enrollments, try to get course details separately
        if (simpleEnrollments && simpleEnrollments.length > 0) {
          const courseIds = simpleEnrollments
            .map((e: any) => e.course_id)
            .filter(Boolean);

          if (courseIds.length > 0) {
            const { data: courses, error: coursesError } = await supabase
              .from("courses")
              .select("*")
              .in("id", courseIds);

            if (coursesError) {
              console.error("Supabase courses error:", coursesError);
              throw new Error(coursesError.message);
            }

            // Merge enrollments with course data
            enrollments = simpleEnrollments.map((enrollment: any) => {
              const course = courses?.find(
                (c: any) => c.id === enrollment.course_id
              );
              return {
                ...enrollment,
                course: course || null,
              };
            });
          } else {
            enrollments = simpleEnrollments;
          }
        } else {
          enrollments = [];
        }
      }

      // Transform data to match frontend expectations
      const products = (enrollments || []).map((enrollment: any) => ({
        id: enrollment.course?.id || enrollment.id,
        image:
          enrollment.course?.thumbnail_url ||
          "https://i.ibb.co/jJ4GHXP/img1.jpg",
        type: enrollment.course?.type || "course",
        status: enrollment.course?.status || "published",
        title: enrollment.course?.title || "Unknown Course",
        price: enrollment.course?.price || "0",
        students: "0", // This would need to be calculated from enrollments
        lastActivity: enrollment.updated_at
          ? new Date(enrollment.updated_at).toLocaleDateString()
          : "No activity",
        enrolled: 1,
        action:
          enrollment.status === "COMPLETED"
            ? "Review Course"
            : "Continue Learning",
        createdAt: enrollment.created_at,
        updatedAt: enrollment.updated_at,
      }));

      res.send(products);
    } catch (err) {
      console.error("Error fetching my learning products:", err);
      res.status(500).send({ error: "Failed to fetch my learning products" });
    }
  }

  // My Learning Orders endpoint
  async getMyLearningOrders(req: FastifyRequest, res: FastifyReply) {
    try {
      const userId = (req as any).user?.id;
      const supabase = await getSupabaseAdminClient();

      // Fetch user's transactions/orders (transactions table doesn't have course_id)
      const { data: transactions, error: transactionsError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "success"); // Changed from "COMPLETED" to "success" based on your table data

      if (transactionsError) {
        console.error("Supabase transactions error:", transactionsError);
        throw new Error(transactionsError.message);
      }

      // Transform data to match frontend expectations
      const orders = (transactions || []).map(
        (transaction: any, index: number) => ({
          id: transaction.id,
          orderNumber: `ORD-${transaction.id}`,
          date: new Date(transaction.created_at).toLocaleDateString(),
          total: `$${transaction.amount}`,
          billing: {
            name: "User", // This would come from user profile
            address: {
              street: "123 Main St",
              city: "City",
              state: "State",
              zip: "12345",
              country: "Country",
            },
          },
          products: [
            {
              id: transaction.id, // Using transaction ID since no course_id
              type: "course", // Default type
              title: `Transaction ${transaction.id.slice(0, 8)}`, // Generate a title
              image: "https://i.ibb.co/jJ4GHXP/img1.jpg", // Default image
              stats: {
                price: { value: `$${transaction.amount}`, icon: "dollar" },
                status: { value: transaction.status, icon: "check" },
              },
              labels: [
                { text: "Course", color: "blue" },
                {
                  text:
                    transaction.status === "success" ? "Completed" : "Pending",
                  color: "green",
                },
              ],
              actions: {
                primary: {
                  text: "View Details",
                  href: `/transactions/${transaction.id}`,
                },
              },
            },
          ],
          actions: [
            { text: "Download Receipt", icon: "download" },
            { text: "View Details", icon: "eye" },
          ],
          footerLinks: [
            {
              icon: "book",
              linkedTo: "courses",
              title: "Courses",
              count: "1",
              href: "/courses",
            },
            {
              icon: "users",
              linkedTo: "communities",
              title: "Communities",
              href: "/communities",
            },
          ],
        })
      );

      res.send(orders);
    } catch (err) {
      console.error("Error fetching my learning orders:", err);
      res.status(500).send({ error: "Failed to fetch my learning orders" });
    }
  }

  // My Learning Stats endpoint
  async getMyLearningStats(req: FastifyRequest, res: FastifyReply) {
    try {
      const userId = (req as any).user?.id;
      const supabase = await getSupabaseAdminClient();

      // Fetch user's enrollments
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from("enrollments")
        .select("status")
        .eq("user_id", userId);

      if (enrollmentsError) {
        console.error("Supabase enrollments error:", enrollmentsError);
        throw new Error(enrollmentsError.message);
      }

      const enrollmentsArr = enrollments || [];
      const totalProducts = enrollmentsArr.length;
      const completedCourses = enrollmentsArr.filter(
        (e: any) => e.status === "COMPLETED"
      ).length;
      const inProgressCourses = enrollmentsArr.filter(
        (e: any) => e.status !== "COMPLETED"
      ).length;

      // Fetch user's transactions for total orders (using "success" status)
      const { data: transactions, error: transactionsError } = await supabase
        .from("transactions")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "success"); // Changed from "COMPLETED" to "success"

      if (transactionsError) {
        console.error("Supabase transactions error:", transactionsError);
        throw new Error(transactionsError.message);
      }

      const totalOrders = (transactions || []).length;

      res.send({
        totalProducts,
        totalOrders,
        completedCourses,
        inProgressCourses,
      });
    } catch (err) {
      console.error("Error fetching my learning stats:", err);
      res.status(500).send({ error: "Failed to fetch my learning stats" });
    }
  }

  // Learner Report - Learning Dashboard endpoint
  async getLearnerReport(req: FastifyRequest, res: FastifyReply) {
    try {
      const userId = (req as any).user?.id;
      const supabase = await getSupabaseAdminClient();

      const { data: enrollments, error: enrollmentsError } = await supabase
        .from("enrollments")
        .select("*")
        .eq("user_id", userId);

      if (enrollmentsError) {
        console.error("Supabase enrollments error:", enrollmentsError);
        throw new Error(enrollmentsError.message);
      }

      // Calculate real statistics from enrollments
      const enrollmentsArr = enrollments || [];
      const completedCourses = enrollmentsArr.filter(
        (e: any) => e.status === "COMPLETED"
      ).length;
      const inProgressCourses = enrollmentsArr.filter(
        (e: any) => e.status !== "COMPLETED"
      ).length;
      const totalCourses = enrollmentsArr.length;

      // Get user's transactions for order count
      const { data: transactions, error: transactionsError } = await supabase
        .from("transactions")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "success");

      if (transactionsError) {
        console.error("Supabase transactions error:", transactionsError);
      }

      const totalOrders = (transactions || []).length;

      // Calculate learning days and progress based on actual enrollments
      let daysLearned: number[] = [];
      let bestLearningDay = 0;
      let minutesPerDay: { [key: number]: number } = {};

      // Calculate real learning days from enrollment dates
      if (enrollmentsArr.length > 0) {
        // Extract enrollment dates and convert to learning days
        const enrollmentDates = enrollmentsArr
          .map((e: any) => new Date(e.enrolled_at))
          .filter((date: any) => !isNaN(date.getTime()))
          .map((date: any) => date.getDate()); // Get day of month

        if (enrollmentDates.length > 0) {
          daysLearned = [...new Set(enrollmentDates)].sort((a, b) => a - b);
          bestLearningDay = daysLearned[daysLearned.length - 1] || 0;

          // Calculate minutes based on enrollment count and status
          minutesPerDay = {};
          daysLearned.forEach((day, index) => {
            const enrollmentsOnDay = enrollmentsArr.filter((e: any) => {
              const enrollmentDate = new Date(e.enrolled_at);
              return enrollmentDate.getDate() === day;
            });

            // Calculate minutes based on enrollment status and count
            let baseMinutes = 30;
            enrollmentsOnDay.forEach((enrollment: any) => {
              if (enrollment.status === "COMPLETED") {
                baseMinutes += 60; // More time for completed courses
              } else if (enrollment.status === "IN_PROGRESS") {
                baseMinutes += 45; // Moderate time for in-progress
              } else {
                baseMinutes += 20; // Less time for not started
              }
            });

            minutesPerDay[day] = baseMinutes;
          });
        }
      }

      // Calculate weekly average based on actual learning patterns
      // This would ideally come from a progress tracking table
      // For now, calculate based on enrollment distribution across weekdays
      const weeklyAverage = {
        MON: 0,
        TUE: 0,
        WED: 0,
        THU: 0,
        FRI: 0,
        SAT: 0,
        SUN: 0,
      };

      // Distribute learning time across weekdays based on enrollment dates
      if (enrollmentsArr.length > 0) {
        enrollmentsArr.forEach((enrollment: any) => {
          const enrollmentDate = new Date(enrollment.enrolled_at);
          const dayOfWeek = enrollmentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
          const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
          const dayName = dayNames[dayOfWeek];

          if (dayName && weeklyAverage.hasOwnProperty(dayName)) {
            weeklyAverage[dayName as keyof typeof weeklyAverage] += 30; // Add 30 minutes per enrollment
          }
        });
      }

      // Calculate total learning time based on actual enrollments
      const totalMinutes = Object.values(minutesPerDay).reduce(
        (sum: number, minutes: number) => sum + minutes,
        0
      );
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const totalTimeLearning = `${hours} Hrs ${minutes} mins`;

      // Calculate best learning day info
      const bestDayMinutes = minutesPerDay[bestLearningDay] || 0;
      const bestDayHours = Math.floor(bestDayMinutes / 60);
      const bestDayMins = bestDayMinutes % 60;
      const bestLearningDayInfo =
        bestLearningDay > 0
          ? `${bestLearningDay}th Jul | ${bestDayHours} Hrs ${bestDayMins} mins`
          : "No learning activity yet";

      // Calculate badges based on actual learning
      const learningDaysThisMonth = daysLearned.length;
      const daysMoreThanLastMonth = Math.max(0, learningDaysThisMonth - 3); // Assume last month had 3 days

      // Determine best and worst days from weekly average
      const dayAverages = Object.entries(weeklyAverage);
      const bestDayEntry = dayAverages.reduce((max, current) =>
        current[1] > max[1] ? current : max
      );
      const worstDayEntry = dayAverages.reduce((min, current) =>
        current[1] < min[1] ? current : min
      );

      const bestDayOfWeek = bestDayEntry[0];
      const leastStudyDay = worstDayEntry[0];

      // Calculate badges based on actual learning
      const goldBadges = learningDaysThisMonth >= 15 ? 1 : 0;
      const silverBadges = learningDaysThisMonth >= 10 ? 1 : 0;
      const bronzeBadges = learningDaysThisMonth >= 5 ? 1 : 0;

      const response = {
        daysLearned,
        bestLearningDay,
        minutesPerDay,
        weeklyAverage,
        totalTimeLearning,
        bestLearningDayInfo,
        learningDaysThisMonth,
        daysMoreThanLastMonth,
        bestDayOfWeek,
        leastStudyDay,
        badges: {
          gold: goldBadges,
          silver: silverBadges,
          bronze: bronzeBadges,
        },
        achievements: {
          coursesCompleted: completedCourses,
          certificatesClaimed: Math.floor(completedCourses * 0.8), // Assume 80% of completed courses have certificates
          coursesInProgress: inProgressCourses,
          averageAssessmentScore: completedCourses > 0 ? 85 : 0, // Fixed score based on completion
        },
      };

      res.send(response);
    } catch (err) {
      console.error("Error fetching learner report:", err);
      res.status(500).send({ error: "Failed to fetch learner report" });
    }
  }

  // Learner Report - Content In Progress endpoint
  async getContentInProgress(req: FastifyRequest, res: FastifyReply) {
    try {
      const userId = (req as any).user?.id;
      const supabase = await getSupabaseAdminClient();

      const { data: enrollments, error: enrollmentsError } = await supabase
        .from("enrollments")
        .select("*")
        .eq("user_id", userId);

      if (enrollmentsError) {
        console.error("Supabase enrollments error:", enrollmentsError);
        throw new Error(enrollmentsError.message);
      }

      // If we have enrollments, get course details separately
      let inProgressItems: LearningProgress[] = [];
      let completedItems: LearningProgress[] = [];

      if (enrollments && enrollments.length > 0) {
        const courseIds = enrollments
          .map((e: any) => e.course_id)
          .filter(Boolean);

        if (courseIds.length > 0) {
          // Get course details with proper instructor relationship
          const { data: courses, error: coursesError } = await supabase
            .from("courses")
            .select(
              `
              id,
              title,
              thumbnail_url,
              duration,
              instructor:platform_users!fk_instructor(full_name)
            `
            )
            .in("id", courseIds);

          if (coursesError) {
            console.error("Supabase courses error:", coursesError);
            // Continue with basic course data if instructor join fails
            const { data: basicCourses, error: basicError } = await supabase
              .from("courses")
              .select("id, title, thumbnail_url, duration")
              .in("id", courseIds);

            if (basicError) {
              console.error("Supabase basic courses error:", basicError);
              throw new Error(basicError.message);
            }

            // Process enrollments with basic course data
            inProgressItems = enrollments
              .filter((enrollment: any) => enrollment.status !== "COMPLETED")
              .map((enrollment: any) => {
                const course = basicCourses?.find(
                  (c: any) => c.id === enrollment.course_id
                );
                return {
                  id: enrollment.id,
                  type: "course" as const,
                  title: course?.title || "Unknown Course",
                  image:
                    course?.thumbnail_url ||
                    "https://i.ibb.co/jJ4GHXP/img1.jpg",
                  author: {
                    name: "Unknown Instructor",
                    avatar:
                      "https://i.ibb.co/N5kLzSd/AVATAR-couponcodefinder.jpg",
                  },
                  duration: course?.duration || "2.5 hrs",
                  enrollmentDate: enrollment.enrolled_at
                    ? new Date(enrollment.enrolled_at).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )
                    : "Unknown Date",
                  progress: enrollment.status === "IN_PROGRESS" ? 50 : 25, // Realistic progress based on status
                  unitsCompleted: enrollment.status === "IN_PROGRESS" ? 8 : 2,
                  totalUnits: 16,
                  avatars: [
                    {
                      img: "https://i.ibb.co/gLQM1bhc/AVATAR-midtone-ux-instrgram.jpg",
                      progress: enrollment.status === "IN_PROGRESS" ? 50 : 25,
                      tooltip: `Enrolled ${enrollment.enrolled_at ? new Date(enrollment.enrolled_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Unknown Date"}`,
                    },
                  ],
                };
              });

            completedItems = enrollments
              .filter((enrollment: any) => enrollment.status === "COMPLETED")
              .map((enrollment: any) => {
                const course = basicCourses?.find(
                  (c: any) => c.id === enrollment.course_id
                );
                return {
                  id: enrollment.id,
                  type: "course" as const,
                  title: course?.title || "Unknown Course",
                  image:
                    course?.thumbnail_url ||
                    "https://i.ibb.co/jJ4GHXP/img1.jpg",
                  author: {
                    name: "Unknown Instructor",
                    avatar:
                      "https://i.ibb.co/N5kLzSd/AVATAR-couponcodefinder.jpg",
                  },
                  progress: 100,
                  unitsCompleted: 16,
                  totalUnits: 16,
                  avatars: [
                    {
                      img: "https://i.ibb.co/gLQM1bhc/AVATAR-midtone-ux-instrgram.jpg",
                      progress: 100,
                      tooltip: "Completed",
                    },
                  ],
                };
              });
          } else {
            // Process enrollments with full course data including instructor
            inProgressItems = enrollments
              .filter((enrollment: any) => enrollment.status !== "COMPLETED")
              .map((enrollment: any) => {
                const course = courses?.find(
                  (c: any) => c.id === enrollment.course_id
                );
                return {
                  id: enrollment.id,
                  type: "course" as const,
                  title: course?.title || "Unknown Course",
                  image:
                    course?.thumbnail_url ||
                    "https://i.ibb.co/jJ4GHXP/img1.jpg",
                  author: {
                    name:
                      (course?.instructor as any)?.full_name ||
                      "Unknown Instructor",
                    avatar:
                      "https://i.ibb.co/N5kLzSd/AVATAR-couponcodefinder.jpg",
                  },
                  duration: course?.duration || "2.5 hrs",
                  enrollmentDate: enrollment.enrolled_at
                    ? new Date(enrollment.enrolled_at).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )
                    : "Unknown Date",
                  progress: enrollment.status === "IN_PROGRESS" ? 50 : 25, // Realistic progress based on status
                  unitsCompleted: enrollment.status === "IN_PROGRESS" ? 8 : 2,
                  totalUnits: 16,
                  avatars: [
                    {
                      img: "https://i.ibb.co/gLQM1bhc/AVATAR-midtone-ux-instrgram.jpg",
                      progress: enrollment.status === "IN_PROGRESS" ? 50 : 25,
                      tooltip: `Enrolled ${enrollment.enrolled_at ? new Date(enrollment.enrolled_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Unknown Date"}`,
                    },
                  ],
                };
              });

            completedItems = enrollments
              .filter((enrollment: any) => enrollment.status === "COMPLETED")
              .map((enrollment: any) => {
                const course = courses?.find(
                  (c: any) => c.id === enrollment.course_id
                );
                return {
                  id: enrollment.id,
                  type: "course" as const,
                  title: course?.title || "Unknown Course",
                  image:
                    course?.thumbnail_url ||
                    "https://i.ibb.co/jJ4GHXP/img1.jpg",
                  author: {
                    name:
                      (course?.instructor as any)?.full_name ||
                      "Unknown Instructor",
                    avatar:
                      "https://i.ibb.co/N5kLzSd/AVATAR-couponcodefinder.jpg",
                  },
                  progress: 100,
                  unitsCompleted: 16,
                  totalUnits: 16,
                  avatars: [
                    {
                      img: "https://i.ibb.co/gLQM1bhc/AVATAR-midtone-ux-instrgram.jpg",
                      progress: 100,
                      tooltip: "Completed",
                    },
                  ],
                };
              });
          }
        }
      }

      // If no enrollments found, return empty arrays instead of mock data
      if (inProgressItems.length === 0 && completedItems.length === 0) {
        console.log("No enrollments found for user - returning empty data");
      }

      // Return empty certificates array - this would come from a certificates table
      const certificates: any[] = [];

      res.send({
        inProgress: inProgressItems,
        completed: completedItems,
        certificates: certificates,
      });
    } catch (err) {
      console.error("Error fetching content in progress:", err);
      res.status(500).send({ error: "Failed to fetch content in progress" });
    }
  }
}
