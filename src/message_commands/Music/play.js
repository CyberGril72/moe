const { Message, Permissions, MessageActionRow } = require("discord.js");
const Client = require("../../../index");
const prettyMilliseconds = require("pretty-ms");
const { oops, msgReply, intReply } = require("../../handlers/functions");
module.exports = {
    name: "play",
    description: "To play songs from youtube.",
    cooldown: 3,
    dev: false,
    usage: "<query>",
    aliases: ["p"],
    category: "Music",
    examples: ["play Never gonna give you up", "play https://www.youtube.com/watch?v=dQw4w9WgXcQ", "play https://soundcloud.com/andreasedstr-m/rick-astley-never-gonna-give", "play https://open.spotify.com/track/4PTG3Z6ehGkBFwjybzWkR8?si=535f60b826c540b7"],
    sub_commands: [],
    player: { voice: true, active: false, dj: false, djPerm: null },
    args: true,
    permissions: {
        client: [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.EMBED_LINKS],
        author: []
    },

    /**
     *
     * @param {Client} client
     * @param {Message} message
     * @param {String[]} args
     * @param {String} prefix
     * @param {String} color
     */

    execute: async (client, message, args, prefix, color) => {
        const query = args.join(" ");

        let player = client.player.get(message.guildId);
        if(!player) player = client.player.create({ guild: message.guildId, textChannel: message.channelId, voiceChannel: message.member.voice.channelId, selfDeafen: true, volume: 80 });

        try {
            let s = await player.search(query, message.author);
            if(!s) return await oops(message.channel, `Couldn't load any results for ${query}`, color);

            if(s.loadType === "PLAYLIST_LOADED") {
                if(!player) return await oops(message.channel, `Process canceled due to player not found.`, color);
                if(player.state !== "CONNECTED") player.connect();
                player.queue.add(s.tracks);
                if(player && player.state === "CONNECTED" && !player.playing && !player.paused && player.queue.totalSize === s.tracks.length) await player.play();

                return await msgReply(message, `Added \`[ ${s.tracks.length} ]\` track(s) from [${s.playlist.name}](${query}) to the queue.`, color);
            } else if(s.loadType === "SEARCH_RESULT") {
                if(!player) return await oops(message.channel, `Process canceled due to player not found.`, color);
                let tracks = s.tracks.slice(0, 3).map((x, i) => `> \`[ ${++i} ]\` ~ ${x.title && x.uri ? `[${x.title}](${x.uri})` : x.title}${x.duration ? ` ~ \`[ ${prettyMilliseconds(x.duration)} ]\``: ""}`);

                const embed1 = client.embed().setColor(color).setDescription(`${tracks.join("\n")}`).setAuthor({name: message.author.tag,iconURL: message.author.displayAvatarURL({ dynamic: true })}).setTitle("Select the track that you want").setFooter({text: `If none selected, then it will load the first track.`});

                const one = client.button().setCustomId("m/play_cmd_select_one").setLabel("1").setStyle("PRIMARY");
                const two = client.button().setCustomId("m/play_cmd_select_two").setLabel("2").setStyle("PRIMARY");
                const three = client.button().setCustomId("m/play_cmd_select_three").setLabel("3").setStyle("PRIMARY");

                const m = await message.reply({ embeds: [embed1], components: [new MessageActionRow().addComponents(one, two, three)] });

                const collector = m.createMessageComponentCollector({
                    filter: (b) => b.user.id === message.author.id ? true : false && b.deferUpdate().catch(() => {}),
                    max: 1,
                    time: 60000,
                    idle: 60000/2
                });

                collector.on("end", async (collected) => {
                    if(m) await m.edit({ components: [new MessageActionRow().addComponents(one.setDisabled(true), two.setDisabled(true), three.setDisabled(true))] }).catch(() => {});

                    if(player && collected.size <= 0) {
                        if(player.state !== "CONNECTED") player.connect();
                        player.queue.add(s.tracks[0]);
                        if(player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) await player.play();

                        if(m) await m.edit({ embeds: [embed1.setDescription(`Added [${s.tracks[0].title}](${s.tracks[0].uri}) to the queue by default.`)] }).catch(() => {});
                    };
                });

                collector.on("collect", async (button) => {
                    if(!button.deferred) await button.deferUpdate().catch(() => {});
                    if(!player && !collector.ended) return collector.stop();
                    if(player.state !== "CONNECTED") player.connect();

                    if(button.customId === one.customId) {
                        player.queue.add(s.tracks[0]);
                        if(player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) await player.play();

                        if(m) await m.edit({ embeds: [embed1.setDescription(`Added [${s.tracks[0].title}](${s.tracks[0].uri}) to the queue.`)] }).catch(() => {});
                    } else if(button.customId === two.customId) {
                        player.queue.add(s.tracks[1]);
                        if(player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) await player.play();

                        if(m) await m.edit({ embeds: [embed1.setDescription(`Added [${s.tracks[1].title}](${s.tracks[1].uri}) to the queue.`)] }).catch(() => {});
                    } else if(button.customId === three.customId) {
                        player.queue.add(s.tracks[2]);
                        if(player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) await player.play();

                        if(m) await m.edit({ embeds: [embed1.setDescription(`Added [${s.tracks[2].title}](${s.tracks[2].uri}) to the queue.`)] }).catch(() => {});
                    } else return;
                });
            } else if(s.loadType === "TRACK_LOADED") {
                if(!player) return await oops(message.channel, `Process canceled due to player not found.`, color);
                if(player.state !== "CONNECTED") player.connect();
                player.queue.add(s.tracks[0]);
                if(player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) await player.play();

                return await msgReply(message, `Added [${s.tracks[0].title}](${s.tracks[0].uri}) to the queue.`, color);
            } else {
                if(player && !player.queue.current) player.destroy();
                return await oops(message.channel, `No results found for ${query}`, color);
            };
        } catch (e) {
            console.error(e);
            return await oops(message.channel, `The player is currently unavailable. If you find this annoying, please report this in the [support server](${client.config.links.server}).`, color);
        }
    }
}