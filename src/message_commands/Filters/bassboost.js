const { Message, Permissions, MessageActionRow } = require("discord.js");
const Client = require("../../../index");
const { msgReply, intReply, invalidArgs } = require("../../handlers/functions")

module.exports = {
    name: "bassboost",
    description: "To set the bassboost level.",
    cooldown: 3,
    dev: false,
    usage: "[level]",
    aliases: ["bb"],
    category: "Filters",
    examples: ["bassboost", "bassboost none", "bassboost low", "bassboost medium", "bassboost high"],
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
            if(["none", "n"].includes(args[0])) {
                if(player.bassboostLevel === "none") return await oops(message.channel, `Bassboost level is already at \`[ ${player.bassboostLevel} ]\``, color);

                player.setBassboost("none");
                return await msgReply(message, `Bassboost level set to \`[ ${player.bassboostLevel} ]\``, color);
            } else if(["low", "l"].includes(args[0])) {
                if(player.bassboostLevel === "low") return await oops(message.channel, `Bassboost level is already at \`[ ${player.bassboostLevel} ]\``, color);

                player.setBassboost("low");
                return await msgReply(message, `Bassboost level set to \`[ ${player.bassboostLevel} ]\``, color);
            } else if(["medium", "m"].includes(args[0])) {
                if(player.bassboostLevel === "medium") return await oops(message.channel, `Bassboost level is already at \`[ ${player.bassboostLevel} ]\``, color);

                player.setBassboost("medium");
                return await msgReply(message, `Bassboost level set to \`[ ${player.bassboostLevel} ]\``, color);
            } else if(["high", "h"].includes(args[0])) {
                if(player.bassboostLevel === "high") return await oops(message.channel, `Bassboost level is already at \`[ ${player.bassboostLevel} ]\``, color);

                player.setBassboost("high");
                return await msgReply(message, `Bassboost level set to \`[ ${player.bassboostLevel} ]\``, color);
            } else return await invalidArgs("bassboost", message, `Please provide a valid bassboost level, \`none, low, medium, high\``, client);
        } else {
            const embed1 = client.embed().setColor(color).setDescription(`Choose the bassboost level that you want.`);

            const none = client.button().setCustomId("bb_button_none").setLabel("None").setStyle("PRIMARY");
            const low = client.button().setCustomId("bb_button_low").setLabel("Low").setStyle("PRIMARY");
            const medium = client.button().setCustomId("bb_button_medium").setLabel("Medium").setStyle("PRIMARY");
            const high = client.button().setCustomId("bb_button_high").setLabel("High").setStyle("PRIMARY");

            if(player.bassboostLevel.includes("none")) none.setDisabled(true);
            else if(player.bassboostLevel.includes("low")) low.setDisabled(true);
            else if(player.bassboostLevel.includes("medium")) medium.setDisabled(true);
            else if(player.bassboostLevel.includes("high")) high.setDisabled(true);

            const m = await message.reply({ embeds: [embed1], components: [new MessageActionRow().addComponents(none, low, medium, high)] });

            const collector = m.createMessageComponentCollector({
                filter: (b) => b.user.id === message.author.id ? true : false && b.deferUpdate().catch(() => {}),
                max: 4,
                time: 60000,
                idle: 60000/2
            });

            collector.on("end", async () => {
                if(!m) return;
                await m.edit({ components: [new MessageActionRow().addComponents(none.setDisabled(true), low.setDisabled(true), medium.setDisabled(true), high.setDisabled(true))] }).catch(() => {});
            });

            collector.on("collect", async (button) => {
                if(!button.replied) await button.deferReply({ ephemeral: true }).catch(() => {});

                if(!player) return await intReply(button, `Nothing is playing right now to set bassboost level.`, color);
                if(!player.queue) return await intReply(button, `Nothing is playing right now to set bassboost level.`, color);
                if(!player.queue.current) return await intReply(button, `Nothing is playing right now to set bassboost level.`, color);

                if(button.customId === none.customId) {
                    player.setBassboost("none");

                    none.setDisabled(true);
                    low.setDisabled(false);
                    medium.setDisabled(false);
                    high.setDisabled(false);

                    if(m) await m.edit({ components: [new MessageActionRow().addComponents(none, low, medium, high)] }).catch(() => {});
                    return await intReply(button, `Bassboost level set to \`[ ${player.bassboostLevel} ]\``, color);
                } else if(button.customId === low.customId) {
                    player.setBassboost("low");

                    none.setDisabled(false);
                    low.setDisabled(true);
                    medium.setDisabled(false);
                    high.setDisabled(false);

                    if(m) await m.edit({ components: [new MessageActionRow().addComponents(none, low, medium, high)] }).catch(() => {});

                    return await intReply(button, `Bassboost level set to \`[ ${player.bassboostLevel} ]\``, color);
                } else if(button.customId === medium.customId) {
                    player.setBassboost("medium");

                    none.setDisabled(false);
                    low.setDisabled(false);
                    medium.setDisabled(true);
                    high.setDisabled(false);

                    if(m) await m.edit({ components: [new MessageActionRow().addComponents(none, low, medium, high)] }).catch(() => {});

                    return await intReply(button, `Bassboost level set to \`[ ${player.bassboostLevel} ]\``, color);
                } else if(button.customId === high.customId) {
                    player.setBassboost("high");

                    none.setDisabled(false);
                    low.setDisabled(false);
                    medium.setDisabled(false);
                    high.setDisabled(true);

                    if(m) await m.edit({ components: [new MessageActionRow().addComponents(none, low, medium, high)] }).catch(() => {});
                    return await intReply(button, `Bassboost level set to \`[ ${player.bassboostLevel} ]\``, color);
                } else return;
            });
        };
    }
}