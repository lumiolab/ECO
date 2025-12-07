import { db } from '@/db';
import { users } from '@/schema';
import type { ChatInputCommand, MessageCommand, CommandData } from 'commandkit';
import { EmbedBuilder } from 'discord.js';
import { eq, and } from 'drizzle-orm';

export const command: CommandData = {
    name: 'balance',
    description: "Check your current balance.",
};

async function getOrCreateUser(userid: string, guild: string) {
    const result = await db
        .select()
        .from(users)
        .where(and(eq(users.userid, userid), eq(users.guild, guild)));

    if (result.length === 0) {
        await db.insert(users).values({
            userid,
            guild,
            balance: 0
        });

        return { userid, guild, balance: 0 };
    }

    return {
        userid: result[0]!.userid,
        guild: result[0]!.guild,
        balance: result[0]!.balance ?? 0
    };
}

export const chatInput: ChatInputCommand = async (ctx) => {
    const userId = ctx.interaction.user.id;
    const guildId = ctx.interaction.guildId!;

    const user = await getOrCreateUser(userId, guildId);

    const embed = new EmbedBuilder()
        .setColor("Gold")
        .setTitle("Balance")
        .setDescription(`You have a balance of ${user.balance}.`)
        .addFields([{ name: "Balance", value: user.balance.toString() }]);

    await ctx.interaction.reply({ embeds: [embed] });
};

export const message: MessageCommand = async (ctx) => {
    const userId = ctx.message.author.id;
    const guildId = ctx.message.guildId!;

    const user = await getOrCreateUser(userId, guildId);

    const embed = new EmbedBuilder()
        .setColor("Gold")
        .setTitle("Balance")
        .setDescription(`You have a balance of ${user.balance}.`)
        .addFields([{ name: "Balance", value: user.balance.toString() }]);

    await ctx.message.reply({ embeds: [embed] });
};
