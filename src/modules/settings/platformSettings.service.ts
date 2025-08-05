import {
  db,
  platform_settings as platformSettingsTable,
} from "../../db/Drizzle.config";
import { eq } from "drizzle-orm"; // ✅ Import Drizzle operator

export class PlatformSettingsService {
  async getSettings() {
    const settings = await db.select().from(platformSettingsTable);
    return settings;
  }

  async updateSettings(data: any) {
    const { key, value } = data;
    const [updated] = await db
      .update(platformSettingsTable)
      .set({ value, updated_at: new Date().toISOString() })
      .where(eq(platformSettingsTable.key, key))
      .returning();
    return updated;
  }
}
