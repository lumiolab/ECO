import { db } from '@/db';
import { users } from '@/schema';
import type { ChatInputCommand, MessageCommand, CommandData, CommandMetadata } from 'commandkit';
import { ApplicationCommandOptionType, EmbedBuilder, userMention } from 'discord.js';
import { eq, and } from 'drizzle-orm';

export const command: CommandData = {
    name: 'setbalance',
    description: "Set a balance of another user. Requires Administrator.",
    options: [
        {
            name: "user",
            description: "The user whose balance you want to change.",
            required: true,
            type: ApplicationCommandOptionType.User
        },
        {
            name: "amount",
            description: "The new balance.",
            required: true,
            type: ApplicationCommandOptionType.Integer
        },
    ],
};

export const metadata: CommandMetadata = {
    userPermissions: 'Administrator',
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
    const target = ctx.options.getUser("user", true);
    const amount = ctx.options.getInteger("amount", true);
    const guildId = ctx.interaction.guildId!;

    // ensure the user exists
    await getOrCreateUser(target.id, guildId);

    await db.update(users)
        .set({ balance: amount })
        .where(and(eq(users.userid, target.id), eq(users.guild, guildId)));

    const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("Balance Updated")
        .setDescription(`You set ${userMention(target.id)}'s balance to ${amount}.`);

    await ctx.interaction.reply({ embeds: [embed] });
};

export const message: MessageCommand = async (ctx) => {
    const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("Not Supported.")
        .setDescription("This command can only be used as a slash command.");

    await ctx.message.reply({ embeds: [embed] });
};
