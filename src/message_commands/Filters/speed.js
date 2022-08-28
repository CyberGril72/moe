const { Message, Permissions, MessageActionRow } = require("discord.js");
const Client = require("../../../index");
const { oops, msgReply, intReply } = require("../../handlers/functions")

module.exports = {
    name: "speed",
    description: "To set the speed of the current playing song.",
    cooldown: 3,
    dev: false,
    usage: "",
    aliases: [],
    category: "Filters",
    examples: ["speed"],
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
            if(["reset", "r"].includes(args[0])) {
                player.setSpeed(1);
                return await msgReply(message, `Speed set to default \`[ ${player.speedAmount}x ]\``, color);
            } else {
                let value = parseInt(args[0]);
                if(isNaN(value)) return await oops(message.channel, `Please provide a valid number, 1, 2, or 3.`, color);

                if(value <= 0 || value > 3) return await oops(message.channel, `Please provide a valid number, 1, 2 or 3.`, color);

                player.setSpeed(value);
                return await msgReply(message, `Speed set to \`[ ${player.speedAmount}x ]\``, color);
            };
        } else {
            const embed1 = client.embed().setColor(color).setDescription(`Select the speed value that you want.`);

            const one = client.button().setCustomId("speed_button_1").setLabel("1x").setStyle("PRIMARY");
            const two = client.button().setCustomId("speed_button_2").setLabel("2x").setStyle("PRIMARY");
            const three = client.button().setCustomId("speed_button_3").setLabel("3x").setStyle("PRIMARY");
            const reset = client.button().setCustomId("speed_button_reset").setLabel("Reset").setStyle("PRIMARY");

            if(player.speedAmount === 1) one.setDisabled(true);
            else if(player.speedAmount === 2) two.setDisabled(true);
            else if(player.speedAmount === 3) three.setDisabled(true);
            else if(player.speedAmount === 0) reset.setDisabled(true);

            const m = await message.reply({ embeds: [embed1], components: [new MessageActionRow().addComponents(one, two, three, reset)] });

            const collector = m.createMessageComponentCollector({
                filter: (b) => b.user.id === message.author.id ? true : false && b.deferUpdate().catch(() => {}),
                max: 4,
                time: 60000,
                idle: 60000/2
            });

            collector.on("end", async () => {
                if(!m) return;
                await m.edit({ components: [new MessageActionRow().addComponents(one.setDisabled(true), two.setDisabled(true), three.setDisabled(true), reset.setDisabled(true))] }).catch(() => {});
            });

            collector.on("collect", async (button) => {
                if(!button.replied) await button.deferReply({ ephemeral: true }).catch(() => {});
                if(!player) return await intReply(button, `Nothing is playing right now to set bassboost level.`, color);
                if(!player.queue) return await intReply(button, `Nothing is playing right now to set bassboost level.`, color);
                if(!player.queue.current) return await intReply(button, `Nothing is playing right now to set bassboost level.`, color);

                if(button.customId === one.customId) {
                    player.setSpeed(1);

                    one.setDisabled(true);
                    two.setDisabled(false);
                    three.setDisabled(false);
                    reset.setDisabled(true);

                    if(m) await m.edit({ components: [new MessageActionRow().addComponents(one, two, three, reset)] }).catch(() => {});

                    return await intReply(button, `Speed set to \`[ ${player.speedAmount}x ]\``, color);
                } else if(button.customId === two.customId) {
                    player.setSpeed(2);

                    one.setDisabled(false);
                    two.setDisabled(true);
                    three.setDisabled(false);
                    reset.setDisabled(false);

                    if(m) await m.edit({ components: [new MessageActionRow().addComponents(one, two, three, reset)] }).catch(() => {});

                    return await intReply(button, `Speed set to \`[ ${player.speedAmount}x ]\``, color);
                } else if(button.customId === three.customId) {
                    player.setSpeed(3);

                    one.setDisabled(false);
                    two.setDisabled(false);
                    three.setDisabled(true);
                    reset.setDisabled(false);

                    if(m) await m.edit({ components: [new MessageActionRow().addComponents(one, two, three, reset)] }).catch(() => {});

                    return await intReply(button, `Speed set to \`[ ${player.speedAmount}x ]\``, color);
                } else if(button.customId === reset.customId) {
                    player.setSpeed(1);

                    one.setDisabled(true);
                    two.setDisabled(false);
                    three.setDisabled(false);
                    reset.setDisabled(true);

                    if(m) await m.edit({ components: [new MessageActionRow().addComponents(one, two, three, reset)] }).catch(() => {});

                    return await intReply(button, `Speed set to default \`[ ${player.speedAmount}x ]\``, color);
                } else return;
            });
        };
    }
}