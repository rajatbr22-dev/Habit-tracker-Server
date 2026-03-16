import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const queryClient = postgres(process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/habits");
export const db = drizzle(queryClient, { schema });
