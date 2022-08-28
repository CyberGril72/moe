const { WebhookClient } = require("discord.js");
const { Node } = require("erela.js");
const Client = require("../../../index");

module.exports = {
    name: "nodeDisconnect",

    /**
     * 
     * @param {Client} client 
     * @param {Node} node 
     */

    execute: async (client, node) => {
        console.error(`[ LAVALINK NODE ${node.options.identifier} DISCONNECTED ]`);

        let channel = new WebhookClient({url: client.config.hooks.lavalink.url});
        if(channel) return await channel.send({ content: `**${node.options.identifier}** have been disconnected!` }).catch(() => {});
    }
}
