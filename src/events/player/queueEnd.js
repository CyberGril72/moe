const { Player } = require("erela.js");
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const { songs } = require("../../utils/autoplay.json");
const db = require("../../utils/schemas/247");
const setupdb = require("../../utils/schemas/setup");
const Client = require("../../../index");

module.exports = {
    name: "queueEnd",

    /**
     * 
     * @param {Client} client
     * @param {Player} player 
     */

    execute: async (client, player) => {
        const color = client.config.color ? client.config.color : "BLURPLE";
        let guild = client.guilds.cache.get(player.guild);
        if (!guild) return;
        let channel = guild.channels.cache.get(player.textChannel);

        if (!channel) return;
        let autoplay = player.get("autoplay");

        if (autoplay) {
            let url = songs[Math.round(Math.random() * songs.length)];
            if (typeof url !== "string") url = songs[0];
            let s = await player.search(url, client.user);

            if (s.loadType === "TRACK_LOADED") {
                if (!player) return;
                if (player.state !== "CONNECTED") player.connect();
                if (player) player.queue.add(s.tracks[0]);
                if (player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) await player.play();

                return;
            } else if (s.loadType === "SEARCH_RESULT") {
                if (!player) return;
                if (player.state !== "CONNECTED") player.connect();
                if (player) player.queue.add(s.tracks[0]);
                if (player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) await player.play();

                return;
            } else if (s.loadType === "PLAYLIST_LOADED") {
                if (!player) return;
                if (player.state !== "CONNECTED") player.connect();
                if (player) player.queue.add(s.tracks);
                if (player && player.state === "CONNECTED" && !player.playing && !player.paused && player.queue.totalSize === s.tracks.length) await player.play();

                return;
            };
        };

        let data = await db.findOne({ _id: player.guild });
        if (data && data.mode) {
            let d2 = await setupdb.findOne({ _id: player.guild });
            if (!d2) return;

            let chn = guild.channels.cache.get(d2.channel);
            if (!chn) return;

            let me;
            try {
                me = await chn.messages.fetch(d2.message, { cache: true });
            } catch (e) { };

            if (!me) return;
        
            let embed1 = new MessageEmbed().setColor(color).setTitle(`Nothing playing right now`).setDescription(`[Invite](${client.config.links.invite}) ~ [Support Server](${client.config.links.server})`).setImage(client.config.links.image)
            await me.edit({
                content: "__**Join a voice channel and queue songs by name/url**__\n\n",
                embeds: [embed1],
                
            });
        } else {
            setTimeout(async () => {
                if (player && !player.queue.current) {
                    const e = await channel.send({
                        embeds: [new MessageEmbed().setColor(color).setDescription(`Queue ended. Leaving the voice channel.`)]
                    });

                    player.destroy();
                    setTimeout(async () => await e.delete().catch(() => { }), 5000);
                };
            }, 60000);
        };
    }
}