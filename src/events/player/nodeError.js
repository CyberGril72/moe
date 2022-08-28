const { Client } = require("discord.js");
const { Node } = require("erela.js");
const { WebhookClient } = require("discord.js");

module.exports = {
    name: "nodeError",

    /**
     * 
     * @param {Client} client 
     * @param {Node} node 
     * @param {Error} error 
     */

    execute: async (client, node, error) => {
        console.log(`[ LAVALINK NODE ${node.options.identifier} ERROR ]`);
        console.error(error);

        let channel = new WebhookClient({url: client.config.hooks.lavalink.url});
        if(channel) return await channel.send({ content: `**${node.options.identifier}** emitted an error!\n\n\`\`\`js\n${error}\n\`\`\`` }).catch(() => {});
    }
}
