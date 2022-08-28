const Client = require("../../../index");
const { Player } = require("erela.js");
const { autoplay, oops } = require("../../handlers/functions");
const db = require("../../utils/schemas/247");

module.exports = {
    name: "trackStuck",

    /**
     * 
     * @param {Client} client 
     * @param {Player} player 
     * @param {import("erela.js").Track} track 
     * @param {import("erela.js").Payload} payload 
     */

    execute: async (client, player, track, payload) => {
        let guild = client.guilds.cache.get(player.guild);
        if(!guild) return;
        let channel = guild.channels.cache.get(player.textChannel);
        let data = await db.findOne({ _id: guild.id });
        let color = client.config.color || "BLURPLE";

        if(!player.queue.size) {
            if(player.get("autoplay")) {
                let au = await autoplay(player, client.user);
                if(au === "failed") {
                    if(data && data.mode) {
                        if(player) player.stop();
                        if(channel) await oops(channel, `[${track.title}](${track.uri}) has been skipped due to track stuck error.`, color);
                    } else {
                        player.destroy();
                        if(channel) await oops(channel, `Player has been destroyed due to track stuck error.`, color);
                    };
                } else {
                    player.stop();
                    if(channel) await oops(channel, `[${track.title}](${track.uri}) has been skipped due to track stuck error.`, color);
                };
            } else {
                if(data && data.mode) {
                    if(player) player.stop();
                    if(channel) await oops(channel, `${track.title}](${track.uri}) has been skipped due to track stuck error.`, color);
                } else {
                    player.destroy();
                    if(channel) await oops(channel, `Player has been destroyed due to track stuck error.`, color);
                };
            };
        } else {
            player.stop();
            if(channel) await oops(channel, `Skipped [${track.title}](${track.uri}) due to track stuck error.`, color);
        };
    }
}