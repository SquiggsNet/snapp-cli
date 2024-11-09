import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import ejs from 'ejs';
import { existsSync } from 'fs';
import { dirname } from 'path';

interface Field {
  name: string;
  type: string;
}

interface Relationship {
  name: string;
  type: string;
  kind: 'hasMany' | 'belongsTo';
}

async function renderTemplate(templateName: string, data: any): Promise<string> {
  const templatePath = join(__dirname, '..', 'templates', `${templateName}.ejs`);
  
  if (!existsSync(templatePath)) {
    throw new Error(`Template ${templateName} not found at ${templatePath}`);
  }

  const template = readFileSync(templatePath, 'utf-8');
  return ejs.render(template, data);
}

async function updateResourceConfig(name: string, relationships: Relationship[]) {
  const configPath = join(process.cwd(), 'snapp-api/src/config/resource-config.ts');
  
  if (!existsSync(configPath)) {
    throw new Error('Resource config file not found');
  }

  let content = readFileSync(configPath, 'utf-8');
  
  const relationshipMap = relationships.reduce((acc, rel) => {
    acc[rel.name] = [rel.type.toLowerCase()];
    return acc;
  }, {} as Record<string, string[]>);

  const newConfig = `
  ${name}: {
    model: ${name},
    type: '${name.toLowerCase()}',
    relationshipMap: ${JSON.stringify(relationshipMap, null, 2)}
  },`;

  // Insert before last export
  content = content.replace(/export const resourceConfigs/, `${newConfig}\n\nexport const resourceConfigs`);
  
  writeFileSync(configPath, content);
}

export async function generateModel(name: string, options: any) {
  const fields = parseFields(options.fields || []);
  const relationships = parseRelationships(options.relationships || []);

  // Generate Mongoose Model
  const mongooseTemplate = await renderTemplate('mongoose-model', {
    name,
    fields,
    relationships
  });
  writeFileSync(
    join(process.cwd(), 'snapp-api/src/models', `${name}.ts`),
    mongooseTemplate
  );

  // Generate Ember Model
  const emberTemplate = await renderTemplate('ember-model', {
    name,
    fields,
    relationships
  });
  writeFileSync(
    join(process.cwd(), 'snapp-web/app/models', `${name}.ts`),
    emberTemplate
  );

  // Update resource config
  updateResourceConfig(name, relationships);
}

function parseFields(fields: string[]): Field[] {
  return fields.map(field => {
    const [name, type] = field.split(':');
    return { name, type };
  });
}

function parseRelationships(rels: string[]): Relationship[] {
  return rels.map(rel => {
    const [name, type, kind] = rel.split(':');
    return { name, type, kind: kind as 'hasMany' | 'belongsTo' };
  });
}