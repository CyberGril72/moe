const { Message } = require("discord.js");
const Client = require("../../../index");

module.exports = {
    name: "eval",
    description: "To evalauate some codes.",
    cooldown: 3,
    dev: true,
    usage: "<code>",
    aliases: ["e"],
    category: "Dev",
    examples: ["eval client.user.id"],
    sub_commands: [],
    args: true,
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
        let evaluatedCode, embed1;

        try {
            evaluatedCode = eval(args.join(" "));
            embed1 = client.embed().setColor(color).addField("Input", `\`\`\`js\n${args.join(" ")}\n\`\`\``, false).addField("Output", `\`\`\`js\n${evaluatedCode}\n\`\`\``, false).addField("Status", `\`\`\`js\nSuccess\n\`\`\``, false).setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true }) }).setTitle("Evaluation");

            return await message.reply({ embeds: [embed1] }).catch(() => { });
        } catch (e) {
            embed1 = client.embed().setColor(color).addField("Input", `\`\`\`js\n${args.join(" ")}\n\`\`\``, false).addField("Output", `\`\`\`js\n${e.stack ? e.stack : e}\n\`\`\``, false).addField("Status", `\`\`\`js\nFailed\n\`\`\``, false).setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true }) }).setTitle("Evaluation");

            return await message.reply({ embeds: [embed1] }).catch(() => { });
        };
    }
}