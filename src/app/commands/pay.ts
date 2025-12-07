import { db } from '@/db';
import { users } from '@/schema';
import type { ChatInputCommand, MessageCommand, CommandData } from 'commandkit';
import { ApplicationCommandOptionType, EmbedBuilder, MessageFlags, userMention } from 'discord.js';
import { eq, and } from 'drizzle-orm';

// A guaranteed-safe user record
type UserRecord = {
    userid: string;
    guild: string;
    balance: number;
};

export const command: CommandData = {
    name: 'pay',
    description: "Pay someone else money!",
    options: [
        {
            name: "user",
            description: "The user to give the money to.",
            required: true,
            type: ApplicationCommandOptionType.User
        },
        {
            name: "amount",
            description: "The amount of money.",
            required: true,
            type: ApplicationCommandOptionType.Integer
        }
    ]
};

async function getOrCreateUser(userid: string, guild: string): Promise<UserRecord> {
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

    const row = result[0];

    return {
        userid: row!.userid,
        guild: row!.guild,
        balance: row!.balance ?? 0
    };
}

export const chatInput: ChatInputCommand = async (ctx) => {
    const amount = ctx.options.getInteger("amount", true);
    const target = ctx.options.getUser("user", true);

    const guildId = ctx.interaction.guildId!;
    const payerId = ctx.interaction.user.id;

    const payer = await getOrCreateUser(payerId, guildId);
    const payerBalance = payer.balance;

    if (payerBalance < amount) {
        const embed = new EmbedBuilder()
            .setColor("Red")
            .setTitle("Not enough money.")
            .setDescription(`You have ${payerBalance}. Not enough to pay ${amount}.`)
            .addFields([{ name: "Balance", value: payerBalance.toString() }]);

        await ctx.interaction.reply({
            embeds: [embed],
            flags: [MessageFlags.Ephemeral]
        });
        return;
    }

    const recipient = await getOrCreateUser(target.id, guildId);
    const recipientBalance = recipient.balance;

    await db.update(users)
        .set({ balance: payerBalance - amount })
        .where(and(eq(users.userid, payerId), eq(users.guild, guildId)));

    await db.update(users)
        .set({ balance: recipientBalance + amount })
        .where(and(eq(users.userid, target.id), eq(users.guild, guildId)));

    const updatedPayer = await getOrCreateUser(payerId, guildId);

    const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("Paid")
        .setDescription(`You paid ${userMention(target.id)} ${amount}. Your new balance is ${updatedPayer.balance}.`)
        .addFields([{ name: "Balance", value: updatedPayer.balance.toString() }]);

    await ctx.interaction.reply({ embeds: [embed] });
};

export const message: MessageCommand = async (ctx) => {
    const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("Not Supported.")
        .setDescription("Please use a slash command for this.");

    await ctx.message.reply({ embeds: [embed] });
};
