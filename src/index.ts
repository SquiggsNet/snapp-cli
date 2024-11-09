#!/usr/bin/env node
import { Command } from 'commander';
import { generateModel } from './commands/generate';

const program = new Command();

program
  .name('snapp')
  .description('CLI for Snapp API and Frontend')
  .version('1.0.0');

program
  .command('generate')
  .description('Generate new components')
  .argument('<type>', 'Type of component to generate (model, route, etc)')
  .argument('<name>', 'Name of the component')
  .option('-f, --fields <fields...>', 'Model fields in format name:type')
  .option('-r, --relationships <rels...>', 'Relationships in format name:type:kind')
  .action(async (type, name, options) => {
    switch(type) {
      case 'model':
        await generateModel(name, options);
        break;
      default:
        console.error('Unknown generator type');
    }
  });

program.parse();