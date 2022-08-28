const Client = require("../../index");
const { Guild, WebhookClient } = require("discord.js");
const db = require("../utils/schemas/guilds");
const { getPrefix } = require("../handlers/functions");

module.exports = {
    name: "guildCreate",

    /**
     * 
     * @param {Client} client 
     * @param {Guild} guild 
     */

    execute: async (client, guild) => {
        console.log(`Guild Added: ${guild.name}`);

        let data = await db.findOne({ _id: guild.id });
        if(!data) data = new db({
            _id: guild.id,
            guildName: guild.name
        });

        await data.save();


        let hook = new WebhookClient({ url: client.config.hooks.guildAdd.url});
        if(!hook) return;

        let embed = client.embed().setColor("GREEN").setAuthor({name: `${client.user.username} has been added to a guild.`, iconURL: guild.iconURL({ dynamic: true })}).setTitle(`${guild.name}`).setThumbnail(guild.iconURL({ dynamic: true })).addFields([
            {
                name: "Created On",
                value: `<t:${Math.round(guild.createdTimestamp/1000)}>`,
                inline: false
            },
            {
                name: "Added On",
                value: `<t:${Math.round(Date.now()/1000)}>`,
                inline: false
            },
            {
                name: "Guild Id",
                value: `\`${guild.id}\``,
                inline: false
            },
            {
                name: "Owner",
                value: `<@${guild.ownerId}> (\`id: ${guild.ownerId}\`)`,
                inline: false
            },
            {
                name: "Total Members Count",
                value: `\`[ ${guild.memberCount} ]\``,
                inline: false
            }
        ]);

        return await hook.send({ embeds: [embed] }).catch(() => {});
    }
}
