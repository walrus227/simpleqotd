const fs = require('fs');
const { SlashCommandBuilder, ActionRowBuilder } = require('@discordjs/builders');
const { ButtonStyle, ComponentType } = require('discord.js');
const { ownerId } = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ask')
        .setDescription('Add question to be asked.')
        .addStringOption(option => 
            option
                .setName('question')
                .setDescription('Question to be asked')
                .setRequired(true)
        ),
    execute: async interaction => {
        if (interaction.guild) {
            interaction.reply({ content: "Please use this command only in DMs.", ephemeral: true});
            return;
        }
        await interaction.deferReply();
        if (!fs.existsSync('./questions.json'))
            fs.writeFileSync('./questions.json', '{"qotd": []}');
        const questions = JSON.parse(fs.readFileSync('./questions.json')).qotd;
        const question = interaction.options.getString('question');
        const id = Date.now();
        questions.push({
            question: question,
            user: interaction.user.id,
            id: id
        });
        fs.writeFileSync('./questions.json', JSON.stringify({"qotd": questions}));
        interaction.editReply(`Question added to list: ${question}`);

        let me = await interaction.client.users.fetch(ownerId);
        const row = new ActionRowBuilder({
            components: [
                {
                    custom_id: id,
                    style: ButtonStyle.Danger,
                    label: 'Reject',
                    type: ComponentType.Button
                }
            ]
        });
        me.send({ content: `Question submitted by ${interaction.user}:\n${question}`, components: [row] });
    }
}