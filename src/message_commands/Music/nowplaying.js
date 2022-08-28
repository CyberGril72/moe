const { Message, Permissions } = require("discord.js");
const prettyMilliseconds = require("pretty-ms");
const Client = require("../../../index");
const {  } = require("../../handlers/functions")

module.exports = {
    name: "nowplaying",
    description: "Show the current playing song.",
    cooldown: 3,
    dev: false,
    usage: "",
    aliases: ["np"],
    category: "Music",
    examples: ["nowplaying", "np"],
    sub_commands: [],
    args: false,
    player: { active: true, voice: false, dj: false, djPerm: null },
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
        const { title, uri, duration, requester, thumbnail, author, isStream } = player.queue.current;

        const embed1 = client.embed().setColor(color).setDescription(`${player.paused ? "⏸️ " : ""}[${title}](${uri})`).setTitle(`Now playing`).setAuthor({name: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true })});

        if(duration) embed1.addField("Duration", `\`[ ${prettyMilliseconds(duration)} ]\``, true);
        if(author) embed1.addField("Author", `${author}`, true);
        if(thumbnail) embed1.setThumbnail(thumbnail);
        if(requester) embed1.addField("Requester", `${requester}`, true);

        embed1.addField("Loop", `${player.trackRepeat ? "`Enabled`" : "`Disabled`"}`, true);

        let pbar = new Array(16).fill("▬");
        let percentage = player.position / duration * 16;

        pbar[Math.round(percentage)] = "🔘";

        embed1.addField("Percentage Bar", `**[**${pbar.join("")}**]**\n\`[ ${prettyMilliseconds(player.position)} / ${isStream ? "◉ LIVE" : prettyMilliseconds(duration)} ]\``, false);

        return await message.reply({ embeds: [embed1] }).catch(() => {});
    }
}
