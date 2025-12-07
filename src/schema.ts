
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable('users', {
    userid: text().notNull(),
    balance: int(),
    guild: text().notNull()
})