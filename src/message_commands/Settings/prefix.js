const { Message, Permissions } = require("discord.js");
const Client = require("../../../index");
const { oops, msgReply, invalidArgs } = require("../../handlers/functions");
const db = require("../../utils/schemas/prefix");

module.exports = {
    name: "prefix",
    description: "To configure the server prefix.",
    cooldown: 10,
    dev: false,
    usage: "<sub_command>",
    aliases: [],
    category: "Settings",
    examples: ["prefix set pls", "prefix clear", "prefix reset", "prefix info"],
    sub_commands: [],
    args: true,
    player: { active: false, voice: false, dj: false, djPerm: null },
    permissions: {
        client: [],
        author: [Permissions.FLAGS.ADMINISTRATOR]
    },

    /**
     *
     * @param {Client} client
     * @param {Message} message
     * @param {Any[]} args
     * @param {String} prefix
     * @param {String} color
     */

    execute: async (client, message, args, prefix, color) => {
        let data = await db.findOne({ _id: message.guildId });

        if(["set", "s", "change"].includes(args[0])) {
            if(!args[1]) return await oops(message.channel, `Please provide a prefix(symbol) to set.`, color);
            if(args[1].length >= 4) return await oops(message.channel, `Prefix shouldn't be more than 3 characters.`, color);
            if(args[1].length <= 0) return await oops(message.channel, `Prefix shouldn't be less than 0 characters.`, color);

            let newPrefix = args[1];
            if(data) {
                if(data.prefix === newPrefix) return await oops(message.channel, `This prefix is already provided by <@${data.moderator}>`, color);

                data.oldPrefix = prefix;
                data.prefix = newPrefix;
                data.moderator = message.author.id;
                data.lastUpdated = Math.round(Date.now()/1000);

                await data.save();
                return await msgReply(message, `Successfully saved server prefix as \`[ ${newPrefix} ]\``, color);
            } else {
                if(newPrefix === prefix) return await oops(message.channel, `This is already the default prefix of the bot.`, color);
                data = new db({
                    _id: message.guildId,
                    prefix: newPrefix,
                    oldPrefix: prefix,
                    moderator: message.author.id,
                    lastUpdated: Math.round(Date.now()/1000)
                });

                await data.save();
                return await msgReply(message, `Successfully updated server prefix to \`[ ${newPrefix} ]\``, color);
            };
        } else if(["clear", "delete", "d"].includes(args[0])) {
            if(!data) return await oops(message.channel, `No prefix data found for this server.`, color);
            await data.delete();

            return await msgReply(message, `Successfully cleared server prefix and set to default \`[ ${client.config.prefix} ]\``);
        } else if(["reset", "restore", "r"].includes(args[0])) {
            if(!data) return await oops(message.channel, `No prefix data found for this server.`, color);

            data.prefix = data.oldPrefix;
            data.oldPrefix = prefix;
            data.moderator = message.author.id;
            data.lastUpdated = Math.round(Date.now()/1000);

            await data.save();
            return await msgReply(message, `Successfully reset server prefix to \`[ ${data.prefix} ]\``)
        } else if(["info", "stats", "status"].includes(args[0])) {
            const embed1 = client.embed().setColor(color).setAuthor(message.guild.name, message.guild.iconURL({ dynamic: true })).setTitle(`Prefix Info/Stats`).addFields([
                {
                    name: "Current Prefix",
                    value: `\`[ ${prefix} ]\``,
                    inline: true
                },
                {
                    name: "Old Prefix",
                    value: `\`[ ${data && data.oldPrefix ? data.oldPrefix : prefix} ]\``,
                    inline: true
                }
            ]);

            if(data && data.moderator) embed1.addField("Moderator", `<@${data.moderator}> (\`id: ${data.moderator}\`)`, true);
            if(data && data.lastUpdated) embed1.addField("Last Updated", `<t:${data.lastUpdated}>`, true);

            return await message.reply({ embeds: [embed1] }).catch(() => {});
        } else return await invalidArgs("prefix", message, "Please provide a valid sub command.", client);
    }
}