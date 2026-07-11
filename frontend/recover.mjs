import fs from 'fs';
import path from 'path';
import readline from 'readline';

const BRAIN_DIR = 'C:/Users/sebon/.gemini/antigravity/brain';

async function scanTranscriptForFiles(convoId, file) {
  const transcriptPath = path.join(BRAIN_DIR, convoId, '.system_generated', 'logs', file);
  if (!fs.existsSync(transcriptPath)) return;
  
  const fileStream = fs.createReadStream(transcriptPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (!line) continue;
    try {
      const entry = JSON.parse(line);
      if (entry.type === 'PLANNER_RESPONSE' && entry.tool_calls) {
        for (const call of entry.tool_calls) {
          if (call.name === 'default_api:write_to_file' || call.name === 'write_to_file') {
            const args = call.args;
            if (args && args.TargetFile && (args.TargetFile.includes('d:/nevacrm') || args.TargetFile.includes('d:\\nevacrm'))) {
              const cleanPath = args.TargetFile.replace(/\\/g, '/');
              if (cleanPath.includes('src/components/ui') || cleanPath.includes('src/pages/clients') || cleanPath.includes('src/pages/settings') || cleanPath.includes('src/components/layout')) {
                console.log(`Recovering write_to_file: ${cleanPath}`);
                fs.mkdirSync(path.dirname(cleanPath), { recursive: true });
                fs.writeFileSync(cleanPath, args.CodeContent);
              }
            }
          }
          if (call.name === 'default_api:replace_file_content' || call.name === 'replace_file_content') {
            const args = call.args;
            if (args && args.TargetFile && (args.TargetFile.includes('d:/nevacrm') || args.TargetFile.includes('d:\\nevacrm'))) {
              console.log(`Replaying replace_file_content: ${args.TargetFile}`);
              const cleanPath = args.TargetFile.replace(/\\/g, '/');
              if (fs.existsSync(cleanPath)) {
                let content = fs.readFileSync(cleanPath, 'utf8');
                if (content.includes(args.TargetContent)) {
                  content = content.replace(args.TargetContent, args.ReplacementContent);
                  fs.writeFileSync(cleanPath, content);
                }
              }
            }
          }
          if (call.name === 'default_api:multi_replace_file_content' || call.name === 'multi_replace_file_content') {
            const args = call.args;
            if (args && args.TargetFile && (args.TargetFile.includes('d:/nevacrm') || args.TargetFile.includes('d:\\nevacrm'))) {
              console.log(`Replaying multi_replace_file_content: ${args.TargetFile}`);
              const cleanPath = args.TargetFile.replace(/\\/g, '/');
              if (fs.existsSync(cleanPath)) {
                let content = fs.readFileSync(cleanPath, 'utf8');
                let changed = false;
                for (const chunk of args.ReplacementChunks) {
                  if (content.includes(chunk.TargetContent)) {
                    content = content.replace(chunk.TargetContent, chunk.ReplacementContent);
                    changed = true;
                  }
                }
                if (changed) fs.writeFileSync(cleanPath, content);
              }
            }
          }
        }
      }
    } catch (e) {
      // ignore parse errors
    }
  }
}

async function main() {
  const dirs = fs.readdirSync(BRAIN_DIR);
  for (const dir of dirs) {
    const stat = fs.statSync(path.join(BRAIN_DIR, dir));
    if (stat.isDirectory()) {
      await scanTranscriptForFiles(dir, 'transcript_full.jsonl');
    }
  }
  console.log("Recovery complete.");
}

main().catch(console.error);
