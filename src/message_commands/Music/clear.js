const { Message, Permissions, MessageActionRow } = require("discord.js");
const Client = require("../../../index");
const { invalidArgs, intReply, oops, good } = require("../../handlers/functions")

module.exports = {
    name: "clear",
    description: "To clear the queue/filters of the player.",
    cooldown: 3,
    dev: false,
    usage: "<input>",
    aliases: [],
    category: "Music",
    examples: ["clear queue", "clear filters", "clear q", "clear f"],
    sub_commands: [],
    args: false,
    player: { active: true, voice: true, dj: true, djPerm: Permissions.FLAGS.DEAFEN_MEMBERS },
    permissions: {
        client: [],
        author: []
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
        const player = client.player.get(message.guildId);
        if(args.length) {
            if(["queue", "q"].includes(args[0])) {
                if(!player.queue.size) return await oops(message.channel, `Don't have enough tracks left in the queue to clear.`, color);
                player.queue.clear();

                return await good(message.channel, `Cleared the queue.`, color);
            } else if(["filters", "f"].includes(args[0])) {
                if(!player.filters) return await oops(message.channel, `No filters have been applied to the player to clear.`, color);
                player.clearFilters();

                return await good(message.channel, `Cleared all the filters.`, color);
            } else return await invalidArgs("clear", message, "Please provide a valid argument.", client);
        } else {
            const embed1 = client.embed().setColor(color).setDescription(`Which one do you want to clear?`);
            const but1 = client.button().setCustomId("clear_queue_kekekekek").setLabel("Queue").setStyle("PRIMARY");
            const but2 = client.button().setCustomId("clear_filters_kekekekek").setLabel("Filters").setStyle("PRIMARY");

            const m = await message.reply({
                allowedMentions: { repliedUser: false },
                embeds: [embed1],
                components: [new MessageActionRow().addComponents(but1, but2)]
            });

            const collector = m.createMessageComponentCollector({
                filter: (b) => {
                    if(b.user.id === message.author.id) return true;
                    else {
                        b.deferUpdate().catch(() => {});
                        return false;
                    };
                },
                max: 1,
                time: 60000,
                idle: 60000/2
            });

            collector.on("end", async () => {
                if(!m) return;
                await m.edit({ components: [new MessageActionRow().addComponents(but1.setDisabled(true), but2.setDisabled(true))] }).catch(() => {});
            });

            collector.on("collect", async (button) => {
                if(!button.replied) await button.deferReply().catch(() => {});
                if(button.customId === but1.customId) {
                    if(!player) return await intReply(button, `Nothing is playing right now.`, color);
                    if(!player.queue) return await intReply(button, `Nothing is playing right now.`, color);
                    if(!player.queue.current) return await intReply(button, `Nothing is playing right now.`, color);

                    if(!player.queue.size) return await intReply(button, `Don't have enough tracks left in the queue to clear.`, color);

                    player.queue.clear();
                    return await intReply(button, `Cleared the queue.`, color);
                } else if(button.customId === but2.customId) {
                    if(!player) return await intReply(button, `Nothing is playing right now.`, color);
                    if(!player.queue) return await intReply(button, `Nothing is playing right now.`, color);
                    if(!player.queue.current) return await intReply(button, `Nothing is playing right now.`, color);

                    if(!player.filters) return await intReply(button, `No filters have been applied to the player to clear.`, color);
                    player.clearFilters();
                    return await intReply(button, `Cleared all the filters.`, color);
                } else return;
            });
        };
    }
}