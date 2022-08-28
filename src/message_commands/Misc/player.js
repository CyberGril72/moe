const { Message, Permissions } = require("discord.js");
const Client = require("../../../index");
const { oops, msgReply } = require("../../handlers/functions")
const _247 = require("../../utils/schemas/247");
const announce = require("../../utils/schemas/announce");
const dj = require("../../utils/schemas/dj");
const prettyMilliseconds = require("pretty-ms");
const setup = require("../../utils/schemas/setup");

module.exports = {
    name: "player",
    description: "To get the player details.",
    cooldown: 3,
    dev: false,
    usage: "[sub_commands]",
    aliases: [],
    category: "Misc",
    examples: ["player"],
    sub_commands: [],
    args: false,
    player: { active: false, voice: false, dj: false, djPerm: null },
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
        if (!player) return await msgReply(message, `Player is currently inactive.`, color);
        let _247data = await _247.findOne({ _id: message.guildId });
        let djdata = await dj.findOne({ _id: message.guildId });
        let announcedata = await announce.findOne({ _id: message.guildId });
        let setupdata = await setup.findOne({ _id: message.guildId });
        const embed1 = client.embed().setColor(color).setDescription(`Player is currently ${player ? "active" : "inactive"}.`).setTitle(`Player Stats`).setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) }).addFields([
            {
                name: "Queue",
                value: `\`\`\`js\nNow playing: ${player && player.queue && player.queue.current ? `Active` : "Inactive"}\nTrack Loop: ${player && player.trackRepeat ? `Enabled` : "Disabled"}\nQueue Loop: ${player && player.queueRepeat ? "Enabled" : "Disabled"}\nFilters: ${player && player.filters ? "Enabled" : "Disabled"}\nTotal Tracks: ${player && player.queue && player.queue.size ? player.queue.size : "0"}\nVolume: ${player.volume}%\nTotal Duration: ${player && player.queue && player.queue.duration ? prettyMilliseconds(player.queue.duration) : "0"}\n\`\`\``,
                inline: true
            },
            {
                name: "Settings",
                value: `\`\`\`js\nAutoplay: ${player && player.get("autoplay") ? "Enabled" : "Disabled"}\n24/7: ${_247data && _247data.mode ? "Enabled" : "Disabled"}\nAnnouncing: ${announcedata && announcedata.mode ? "Enabled" : "Disabled"}\nDJ: ${djdata && djdata.mode ? "Enabled" : "Disabled"}\nSetup: ${setupdata ? "Enabled" : "Disabled"}\n\`\`\``,
                inline: true
            }
        ]);

        return await message.reply({ embeds: [embed1] }).catch(() => { });
    }
}