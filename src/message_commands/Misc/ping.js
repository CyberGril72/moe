const { Permissions, Client, Message, MessageEmbed } = require("discord.js");


module.exports = {
    name: "ping",
    description: "Returns the latency of the bot.",
    aliases: ["pong"],
    usage: "",
    dev: false,
    cooldown: 5,
    sub_commands: [],
    permissions: {
        client: [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.EMBED_LINKS],
        author: []
    },
    category: "Misc",

    /**
     * 
     * @param {Client} client 
     * @param {Message} message 
     * @param {String[]} args 
     * @param {String} prefix 
     * @param {String} color
     */

    execute: async (client, message, args, prefix, color) => {
        await message.reply({ content: "**PINGING...**" }).then(async (msg) => {
            let ping =  msg.createdAt - message.createdAt;
            let api_ping = client.ws.ping;
            
            if(!msg.editable) return;
            await msg.edit({
                allowedMentions: { repliedUser: true },
                content: "‎",
                embeds: [new MessageEmbed().setColor(color).setAuthor({name: "Pong",iconURL: client.user.displayAvatarURL()}).setTimestamp().addFields([
                    {
                        name: "Bot Latency",
                        value: `\`\`\`ini\n[ ${ping}ms ]\n\`\`\``,
                        inline: true
                    }, {
                        name: "API Latency",
                        value: `\`\`\`ini\n[ ${api_ping}ms ]\n\`\`\``,
                        inline: true
                    }
                ]).setFooter({text: `Requested by ${message.author.username}`,iconURL: message.author.displayAvatarURL({ dynamic: true })})]
            }).catch(() => {});
        }).catch(() => {});
    }
}