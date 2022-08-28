const Client = require("../../index");
const { Guild, WebhookClient } = require("discord.js");
const setup = require("../utils/schemas/setup");
const guilds = require("../utils/schemas/guilds");
const dj = require("../utils/schemas/dj");
const announce = require("../utils/schemas/announce");
const _247  = require("../utils/schemas/247");
const prefix = require("../utils/schemas/prefix");

module.exports = {
    name: "guildDelete",

    /**
     * 
     * @param {Client} client 
     * @param {Guild} guild 
     */

    execute: async (client, guild) => {
        console.log(`Guild removed: ${guild.name}`);

        let data1, data2, data3, data4, data5, data6;

        data1 = await setup.findOne({ _id: guild.id });
        data2 = await guilds.findOne({ _id: guild.id });
        data3 = await dj.findOne({ _id: guild.id });
        data4 = await announce.findOne({ _id: guild.id });
        data5 = await  _247.findOne({ _id: guild.id });
        data6 = await prefix.findOne({ _id: guild.id });

        if(data1) await data1.delete();
        if(data2) await data2.delete();
        if(data3) await data3.delete();
        if(data4) await data4.delete();
        if(data5) await data5.delete();
        if(data6) await data6.delete();

        let hook = new WebhookClient({url: client.config.hooks.guildRemove.url});
        if(!hook) return;

        return await hook.send({ content: `*${client.user.username} has been removed from ${guild.name} (\`id: ${guild.id}\`)* ~ <t:${Math.round(Date.now()/1000)}>` }).catch(() => {});
    }
}
